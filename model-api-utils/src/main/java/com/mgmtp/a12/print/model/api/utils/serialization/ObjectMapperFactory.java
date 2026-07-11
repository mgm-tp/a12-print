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
package com.mgmtp.a12.print.model.api.utils.serialization;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.mgmtp.a12.model.header.*;
import com.mgmtp.a12.model.serialization.A12DefaultJsonPrettyPrinter;
import com.mgmtp.a12.model.utils.OnlyForUsage;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.SerializationFeature;
import tools.jackson.databind.annotation.JsonDeserialize;
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.cfg.EnumFeature;
import tools.jackson.databind.json.JsonMapper;

import java.util.Locale;


@OnlyForUsage
public class ObjectMapperFactory {
	public static ObjectMapper createPrintModelMapper() {
		return JsonMapper.builder()
			.enable(SerializationFeature.INDENT_OUTPUT)
			.changeDefaultPropertyInclusion(include -> include.withOverrides(JsonInclude.Value.ALL_NON_ABSENT))
			.enable(EnumFeature.READ_UNKNOWN_ENUM_VALUES_USING_DEFAULT_VALUE)
			.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
			.defaultPrettyPrinter(new A12DefaultJsonPrettyPrinter())
			.addMixIn(Annotation.class, AnnotationMixin.class)
			.addMixIn(Label.class, LabelMixin.class)
			.addMixIn(ModelReference.class, ModelReferenceMixin.class)
			.addMixIn(Locale.class, LocaleMixin.class)
			.build();
	}

	@JsonDeserialize(
		as = ModelReferenceImpl.class
	)
	@OnlyForUsage
	interface ModelReferenceMixin {
	}

	@JsonDeserialize(
		as = LabelImpl.class
	)
	@OnlyForUsage
	interface LabelMixin {
		@JsonSerialize(
			converter = LocaleToStringConverter.class
		)
		Locale getLocale();
	}

	@JsonDeserialize(
		converter = JsonToLocaleConverter.class
	)
	@JsonSerialize(
		converter = LocaleToJsonConverter.class
	)
	@OnlyForUsage
	interface LocaleMixin {
	}

	@JsonDeserialize(
		as = AnnotationImpl.class
	)
	@OnlyForUsage
	interface AnnotationMixin {
		@JsonInclude(Include.NON_NULL)
		String getValue();
	}
}
