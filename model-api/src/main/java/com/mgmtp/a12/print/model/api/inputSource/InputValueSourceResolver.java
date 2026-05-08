/*
 * SPDX-License-Identifier: EUPL-1.2 OR LicenseRef-commercial
 *
 * Copyright (c) 2012-2026 mgm technology partners GmbH
 *
 * Dual License
 * ------------
 * This source file is part of the mgm A12 Platform and available under
 * a choice of two different licenses:
 *
 * 1. Open-Source License - EUPL v1.2
 *    You may redistribute and/or modify this file under the terms of the
 *    European Union Public License, version 1.2 - see https://eupl.eu/.
 *
 * 2. Commercial License
 *    Alternatively, you may obtain a commercial license from
 *    mgm technology partners GmbH, that permits use of this software
 *    under different terms (including support and maintenance services).
 *
 *    Please contact a12-license@mgm-tp.com for more information.
 *
 * You must select and comply with exactly one of the above license options.
 *
 * Warranty Disclaimer (applies to either option)
 * ----------------------------------------------
 * THIS SOFTWARE IS PROVIDED "AS IS" AND WITHOUT WARRANTY OF ANY KIND,
 * WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NON-INFRINGEMENT, EXCEPT WHERE SUCH DISCLAIMERS ARE HELD TO BE
 * LEGALLY INVALID. SEE THE RESPECTIVE LICENSE TEXT FOR DETAILS.
 */
package com.mgmtp.a12.print.model.api.inputSource;


import com.mgmtp.a12.print.engine.model.api.model.generated.InheritableSourceFieldGetterRegistry;
import com.mgmtp.a12.print.model.api.exceptions.InputSourceException;
import com.mgmtp.a12.print.model.api.model.PrintModelEntity;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.element.base.Measure;
import com.mgmtp.a12.print.model.api.model.element.base.inputSource.*;
import com.mgmtp.a12.print.model.api.model.reference.PlaceableReference;
import com.mgmtp.a12.print.model.map.PrintMetaModelMap;

import java.util.Optional;

public class InputValueSourceResolver {
	static final String ELEMENT_DEFINITION_ROOT_PATH = "/content/elementDefinitions/";
	static final String REFERENCE_PATH = "elementReferences/";
	static final String INPUT_SOURCE_VALUE = "/value/";

	public static PrintMetaModelMap.InputSourceMetadata getMetadata(String path) {
		return PrintMetaModelMap.PRINT_MODEL_METADATA_MAP.get(path);
	}

	 public static <T> Optional<T> getInputValue(InputSource<T> inputSource, ConvertValue<T> convertValue, ReferenceResolver referenceResolver) {
		final var metadata = PrintMetaModelMap.PRINT_MODEL_METADATA_MAP.get(inputSource.getPath());

		if (metadata == null) {
			throw new InputSourceException(
				String.format("Metadata not found for path '%s'", inputSource.getPath())
			);
		}

		Optional<T> value;

		switch (inputSource.getSource()) {
			case DEFAULT: {
				if (metadata.defaultValue() != null) {
					value = Optional.of(convertValue.convert(metadata.defaultValue()));
					break;
				}
				value = Optional.empty();
				break;
			}
			case INPUT: {
				value = inputSource.getValue();
				break;
			}
			case UNSET: {
				value = Optional.empty();
				break;
			}
			case INHERITED: {
				value = resolveInheritedSource(inputSource, convertValue, referenceResolver);
				break;
			}
			default: {
				throw new InputSourceException(
					String.format("Unsupported source type '%s'", inputSource.getSource())
				);
			}
		}

		if (metadata.isRequired() && value.isEmpty()) {
			throw new InputSourceException(
				String.format("There needs to be a value set for '%s'", inputSource.getPath())
			);
		}

		return value;
	}

	public static Optional<Integer> getInputValue(IntegerInputSource inputSource, ReferenceResolver referenceResolver) {
		return getInputValue(inputSource, Integer::valueOf, referenceResolver);
	}

	public static Optional<String> getInputValue(StringInputSource inputSource, ReferenceResolver referenceResolver) {
		return getInputValue(inputSource, defaultString -> defaultString, referenceResolver);
	}

	public static Optional<Boolean> getInputValue(BooleanInputSource inputSource, ReferenceResolver referenceResolver) {
		return getInputValue(inputSource, Boolean::valueOf, referenceResolver);
	}


	public static Optional<Measure> getInputValue(MeasureInputSource inputSource) {
		final var metadata = PrintMetaModelMap.PRINT_MODEL_METADATA_MAP.get(inputSource.getPath());

		if (metadata == null) {
			throw new InputSourceException(
				String.format("Metadata not found for path '%s'", inputSource.getPath())
			);
		}

		Optional<Measure> value;

		switch (inputSource.getSource()) {
			case DEFAULT: {
				if (metadata.defaultValue() != null) {
					int defaultValue = Integer.parseInt(metadata.defaultValue());
					Measure.MeasureUnit unit = inputSource.getUnit();
					value = Optional.of(new Measure() {
						@Override
						public String getId() {
							return inputSource.getId();
						}

						@Override
						public int getValue() {
							return defaultValue;
						}

						@Override
						public MeasureUnit getUnit() {
							return unit;
						}
					});
					break;
				}
				value = Optional.empty();
				break;
			}
			case INPUT: {
				value = inputSource.getValue().map(inputVal -> new Measure() {
					@Override
					public String getId() {
						return inputSource.getId();
					}

					@Override
					public int getValue() {
						return inputVal;
					}

					@Override
					public MeasureUnit getUnit() {
						return inputSource.getUnit();
					}
				});
				break;
			}
			case UNSET: {
				value = Optional.empty();
				break;
			}
			default: {
				throw new InputSourceException(
					String.format("Unsupported source type '%s'", inputSource.getSource())
				);
			}
		}

		if (metadata.isRequired() && value.isEmpty()) {
			throw new InputSourceException(
				String.format("There needs to be a value set for '%s'", inputSource.getPath())
			);
		}

		return value;
	}

	private static <T> Optional<T> resolveInheritedSource(InputSource<T> inputSource, ConvertValue<T> convertValue, ReferenceResolver referenceResolver) {
		if(!inputSource.getSource().equals(PossibleInputSource.INHERITED)) {
			throw new InputSourceException("The input source have to be inherited");
		}

		final var referencedEntity = referenceResolver.resolve(inputSource.getReference().orElseThrow()).orElseThrow().getTracedElement();
		final String inputSourcePath = cleanPath(inputSource.getPath(), referencedEntity);
		final InputSource<T> referencedInput = getInputSourceByPath(referencedEntity, inputSourcePath);

		return getInputValue(referencedInput, convertValue, referenceResolver);
	}

	public static <T> InputSource<T> getInputSourceByPath(Object obj, String path) {
		try {
			Object result = InheritableSourceFieldGetterRegistry.getterByFieldPath(obj, path);
			if (result instanceof InputSource<?>
				|| (result instanceof  Optional && ((Optional<?>) result).isPresent() && ((Optional<?>) result).get() instanceof InputSource<?>)) {
				return (InputSource<T>) result;
			}
		} catch (Exception error) {
			throw new InputSourceException(String.format("Cannot find referenced value for path %s", path));
		}
		throw new InputSourceException(String.format("Cannot find referenced value for path %s", path));
	}

	private static String cleanPath(String path, PrintModelEntity referencedEntity) {
		if (referencedEntity instanceof PlaceableReference) {
			final var index = path.indexOf(REFERENCE_PATH);
			if (index != -1 && path.endsWith(INPUT_SOURCE_VALUE)) {
				return path.substring(index + REFERENCE_PATH.length()).replace(INPUT_SOURCE_VALUE, "");
			}
		} else if (referencedEntity instanceof PrintModelElement &&
			path.startsWith(ELEMENT_DEFINITION_ROOT_PATH) &&
			path.endsWith(INPUT_SOURCE_VALUE)
		) {
			return path.replace(ELEMENT_DEFINITION_ROOT_PATH, "").replace(INPUT_SOURCE_VALUE, "");
		}
		throw new InputSourceException(
				String.format("The path is not valid value path for input source group: '%s'", path)
		);
	}


	@FunctionalInterface
	public interface ConvertValue<T> {
		T convert(String defaultString);
	}
	@FunctionalInterface
	public interface ReferenceResolver {
		Optional<PrintModelTreeTrace<PrintModelEntity>> resolve(String referenceId);
	}

}
