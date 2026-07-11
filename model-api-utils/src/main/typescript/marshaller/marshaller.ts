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
import type { PrintError, ExtendedEntityInstancePath } from "@com.mgmtp.a12.print/print-model-api/errors";
import { DeepPartialErrorMap, ErrorSeverity, ErrorOrigin } from "@com.mgmtp.a12.print/print-model-api/errors";
import type { Subtype } from "@com.mgmtp.a12.print/print-model-api/utils";
import type { EntityInstancePath } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import type { PrintValidator } from "../a12internal/validation/print-validator.js";
import { InternalLocalizableError } from "../internal/validation/internal-localizable-error.js";

import type { Deserializer, DeserializerResult } from "./deserializer/deserializer.js";
import type { Serializer, SerializerResult } from "./serializer/serializer.js";

export abstract class Marshaller<
	DTOType extends object,
	APIType,
	TOptions extends PrintValidator.Options = PrintValidator.Options,
> {
	/**
	 * Transforms the API representation into its JSON-representation and validates it afterwards.
	 * @param apiObject API-representation
	 * @param options Validation options (html, partial, references)
	 * @returns JSON-representation and any generated Messages
	 */
	public serialize<T extends Subtype<APIType> = APIType>(
		apiObject: T,
		options?: TOptions
	): MarshallerResult<T, DTOType> {
		const serializer = this.initializeSerializer();
		const serializerResult = this.executeSerializer(serializer, apiObject as unknown as APIType);
		const relevantPaths = options?.partial?.relevantPaths ?? [];

		const errorMap = serializerResult.errorMap || DeepPartialErrorMap.getEmptyMap<T>();
		if (serializerResult.result) {
			const report = this.validate(serializerResult.result, options);
			DeepPartialErrorMap.mergeErrorMaps(errorMap, report.errorMap);

			const postApiErrorMap = this.executePostApiValidation(apiObject as unknown as APIType, options);
			DeepPartialErrorMap.mergeErrorMaps(errorMap, postApiErrorMap);

			DeepPartialErrorMap.extendErrorMapWithId(errorMap as DeepPartialErrorMap<T>, apiObject);
			const noErrorOccurred = report.noErrorOccurred && errorMap[ErrorSeverity.ERROR].length === 0;
			return {
				result: noErrorOccurred ? serializerResult.result : undefined,
				report: {
					noErrorOccurred,
					errorMap: errorMap as DeepPartialErrorMap<T>,
					relevantPaths,
				},
			};
		} else {
			return {
				report: {
					noErrorOccurred: false,
					errorMap: errorMap as DeepPartialErrorMap<T>,
					relevantPaths,
				},
			};
		}
	}

	/**
	 * Validates the serialized JSON-representation and transforms it into its API-representation.
	 * @param validatorInput string or object representation of the Model
	 * @param options Validation options (html, partial, references)
	 * @returns API-representation and any generated Messages
	 */
	public deserialize<T extends Subtype<APIType> = APIType>(
		validatorInput: PrintValidator.Input<DTOType>,
		options?: TOptions
	): MarshallerResult<T, T> {
		const deserializer = this.initializeDeserializer();
		const relevantPaths = options?.partial?.relevantPaths ?? [];
		const report = this.validate(validatorInput, options);
		if (report.noErrorOccurred) {
			const deserializerResult = this.executeDeserializer(deserializer, report.document as DTOType);

			const deserializerNoErrorOccurred = deserializerResult.errorMap[ErrorSeverity.ERROR].length === 0;
			const errorMap = deserializerResult.errorMap || DeepPartialErrorMap.getEmptyMap();
			DeepPartialErrorMap.mergeErrorMaps(errorMap, report.errorMap);

			if (deserializerResult.result && deserializerNoErrorOccurred) {
				const postApiErrorMap = this.executePostApiValidation(deserializerResult.result, options);
				DeepPartialErrorMap.mergeErrorMaps(errorMap, postApiErrorMap);

				DeepPartialErrorMap.extendErrorMapWithId(errorMap, deserializerResult.result);
				const noErrorOccurred = errorMap[ErrorSeverity.ERROR].length === 0;
				return {
					// Always return the deserialized model when core validation and deserialization succeeded
					result: deserializerResult.result as unknown as T,
					report: {
						noErrorOccurred,
						errorMap: errorMap as DeepPartialErrorMap<T>,
						relevantPaths,
					},
				};
			}
			return {
				report: {
					noErrorOccurred: false,
					errorMap: errorMap as DeepPartialErrorMap<T>,
					relevantPaths,
				},
			};
		}
		return {
			report: {
				noErrorOccurred: false,
				errorMap: report.errorMap as DeepPartialErrorMap<T>,
				relevantPaths,
			},
		};
	}

	private validate(
		validatorInput: PrintValidator.Input<DTOType>,
		options?: TOptions
	): PrintValidator.IntegrityReport<APIType> {
		try {
			return this.executeValidation(validatorInput, options);
		} catch (e) {
			return {
				noErrorOccurred: false,
				document: {},
				errorMap: {
					[ErrorSeverity.ERROR]: [
						{
							severity: "ERROR",
							errorCode: String(e),
							jsonPath: [] as ExtendedEntityInstancePath,
							origin: ErrorOrigin.VALIDATOR,
							errorMessage: [InternalLocalizableError.validationError],
						},
					] as PrintError[],
					[ErrorSeverity.WARNING]: [] as PrintError[],
					[ErrorSeverity.INFO]: [] as PrintError[],
				} as DeepPartialErrorMap<APIType>,
			};
		}
	}

	protected executeDeserializer(
		deserializer: Deserializer<DTOType, APIType>,
		dtoObject: DTOType
	): DeserializerResult<APIType> {
		return deserializer.deserialize(dtoObject);
	}

	protected executeSerializer(
		serializer: Serializer<APIType, DTOType>,
		apiObject: APIType
	): SerializerResult<APIType, DTOType> {
		return serializer.serialize(apiObject);
	}

	protected abstract initializeDeserializer(): Deserializer<DTOType, APIType>;
	protected abstract initializeSerializer(): Serializer<APIType, DTOType>;

	protected abstract executeValidation(
		validatorInput: PrintValidator.Input<DTOType>,
		options?: TOptions
	): PrintValidator.IntegrityReport<APIType>;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected executePostApiValidation(apiObject: APIType, options?: TOptions): DeepPartialErrorMap<APIType> {
		return DeepPartialErrorMap.getEmptyMap();
	}
}

export interface MarshallerResult<APIType, TargetType> {
	result?: TargetType;
	report: PrintModelMarshallerReport<APIType>;
}

export interface MarshallerMessage {
	message: string;
	severity: keyof typeof ErrorSeverity;
}

export interface PrintModelMarshallerReport<T> {
	/** whether validation or marshaller errors were found.*/
	readonly noErrorOccurred: boolean;

	/** all messages */
	readonly errorMap: DeepPartialErrorMap<T>;

	/** paths used for partial validation */
	readonly relevantPaths: EntityInstancePath[];
}
