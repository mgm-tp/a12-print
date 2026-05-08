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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.utils;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonGenerator;
import com.mgmtp.a12.kernel.md.document.api.services.DocumentSerializationException;
import com.mgmtp.a12.kernel.md.model.api.IElement;
import com.mgmtp.a12.kernel.md.model.api.IField;
import com.mgmtp.a12.kernel.md.model.api.fieldtypes.IDateFragmentType;
import com.mgmtp.a12.kernel.md.model.api.fieldtypes.IDateRangeType;
import com.mgmtp.a12.kernel.md.model.api.fieldtypes.IDateType;
import com.mgmtp.a12.kernel.md.model.api.fieldtypes.IFieldType;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.KernelElementUtils;
import org.apache.commons.lang3.Validate;

import java.io.IOException;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.Objects;
import java.util.Optional;
import java.util.TimeZone;


public class FieldValueSerializer {

	public static final String DEFAULT_DATE_FORMAT = "yyyy-MM-dd";
	public static final String DEFAULT_DATE_TIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";
	public static final String DEFAULT_TIME_FORMAT = "HH:mm:ss";
	public static final String A12_DATE_RANGE_SEPARATOR = "/";

	private static final JsonFactory JSON_FACTORY = new JsonFactory();

	/**
	 * Gets literal value of the fieldInstance or null if the fieldInstance has not value.
	 * The literal is not quoted.
	 *
	 */
	public static String getLiteralValue(IElement field, String path,  Optional<Object> valueOptional, TimeZone timeZone) {
		final var stringWriter = new StringWriter();
		try (final JsonGenerator jsonGenerator = JSON_FACTORY.createGenerator(stringWriter);) {
			jsonGenerator.enable(JsonGenerator.Feature.WRITE_BIGDECIMAL_AS_PLAIN);

			try {
				if (valueOptional.isEmpty()) {
					return null;
				}
				Object value = valueOptional.get();
				if (value instanceof String) {
					jsonGenerator.writeRaw((String) value);
				} else if (value instanceof Boolean) {
					jsonGenerator.writeBoolean((Boolean) value);
				} else if (value instanceof BigDecimal) {
					jsonGenerator.writeNumber((BigDecimal) value);
				} else if (value instanceof Date) {
					String dateStr = serializeDate(
						(Date) value,
						getDateFormatOrThrow(field),
						timeZone
					);
					jsonGenerator.writeRaw(dateStr);
				} else if (value instanceof Date[]) {
					String drStr =
						serializeDateRange(
							(Date[]) value,
							A12_DATE_RANGE_SEPARATOR,
							getDateFormatOrThrow(field), timeZone
						);
					jsonGenerator.writeRaw(drStr);
				} else {
					String errorMsg = String.format("Value of '%s' from type '%s' cannot be serialized.", path,
						value.getClass().getName());
					throw new DocumentSerializationException(errorMsg);
				}
				jsonGenerator.flush();
				stringWriter.flush();
				return stringWriter.toString();
			} catch (final IOException ioe) {
				throw new DocumentSerializationException(String.format("Error while writing '%s'.", path), ioe);
			}

		} catch (final IOException ioe) {
			throw new DocumentSerializationException("Error while creating/writing JsonGenerator.", ioe);
		}

	}

	public static String getDateFormatOrThrow(IElement element) {
		Optional<IFieldType> fieldType = ((IField) element).getEffectiveType();
		if (fieldType.isPresent()) {
			return switch (fieldType.get()) {
				case IDateFragmentType dateFragmentType -> dateFragmentType.getFormatOfFragment();
				case IDateRangeType dateRangeType -> dateRangeType.getFormat();
				case IDateType dateType -> dateType.getFormat();
				default -> throw new IllegalArgumentException(
					String.format("Field '%s' (of type %s) does not have a date format", KernelElementUtils.getPath(element),
						fieldType.get()));
			};
		} else {
			throw new IllegalArgumentException("The document model does not seem to be expanded yet.");
		}
	}

	public static String serializeDate(final Date date, final String dateFormatStr, TimeZone timeZone) {
		Objects.requireNonNull(date);
		Validate.notBlank(dateFormatStr);
		final DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern(dateFormatStr).withZone(timeZone.toZoneId());
		return dateFormat.format(date.toInstant());
	}

	public static String serializeDateRange(final Date[] dates, final String separator, final String dateFormatStr,
											TimeZone timeZone) {
		return serializeDate(dates[0], dateFormatStr, timeZone) + separator + serializeDate(dates[1], dateFormatStr, timeZone);
	}

}
