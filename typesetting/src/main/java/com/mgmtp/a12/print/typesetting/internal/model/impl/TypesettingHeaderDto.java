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
package com.mgmtp.a12.print.typesetting.internal.model.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import tools.jackson.databind.annotation.JsonDeserialize;
import com.mgmtp.a12.model.header.Annotation;
import com.mgmtp.a12.model.header.Header;
import com.mgmtp.a12.model.header.Label;
import com.mgmtp.a12.model.header.ModelReference;
import lombok.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Value
@JsonInclude(JsonInclude.Include.NON_ABSENT)
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
@NoArgsConstructor(force = true)
@AllArgsConstructor
@SuppressWarnings("java:S1948")
public class TypesettingHeaderDto implements Header {

	@NonNull
	@JsonProperty(value = "id", required = true)
	String id;

	@NonNull
	@JsonProperty(value = "modelType", required = true)
	String modelType;

	@NonNull
	@JsonProperty("modelVersion")
	String modelVersion;

	@JsonProperty("description")
	String description;

	@Builder.Default
	@JsonProperty("locales")
	@JsonDeserialize(
		as = ArrayList.class,
		contentAs = Locale.class
	)
	List<Locale> locales = new ArrayList<>();

	@Builder.Default
	@JsonProperty("labels")
	@JsonDeserialize(
		as = ArrayList.class,
		contentAs = Label.class
	)
	List<Label> labels = new ArrayList<>();

	@Builder.Default
	@JsonProperty("annotations")
	@JsonDeserialize(
		as = ArrayList.class,
		contentAs = Annotation.class
	)
	List<Annotation> annotations = new ArrayList<>();

	@Builder.Default
	@JsonProperty("modelReferences")
	@JsonDeserialize(
		as = ArrayList.class,
		contentAs = ModelReference.class
	)
	List<ModelReference> modelReferences = new ArrayList<>();
}
