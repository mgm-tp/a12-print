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
package com.mgmtp.a12.print.model.api.model.internal.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.mgmtp.a12.model.header.Annotation;
import com.mgmtp.a12.model.header.Header;
import com.mgmtp.a12.model.header.Label;
import com.mgmtp.a12.model.header.ModelReference;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Data
@SuperBuilder
@NoArgsConstructor(force = true, access = AccessLevel.PROTECTED)
public class PrintModelHeaderDto implements Header, JsonModel {
	@JsonProperty(value = "id", required = true)
	private String id;

	@JsonProperty(value = "modelType", required = true)
	private String modelType;

	@JsonProperty(value = "description", required = true)
	private String description;

	@JsonProperty("modelVersion")
	private String modelVersion;
	@JsonProperty("locales")
	@JsonDeserialize(
		as = ArrayList.class,
		contentAs = Locale.class
	)
	@Builder.Default
	private List<Locale> locales = new ArrayList<>();

	@JsonProperty("labels")
	@JsonDeserialize(
		as = ArrayList.class,
		contentAs = Label.class
	)
	@Builder.Default
	private List<Label> labels = new ArrayList<>();

	@JsonProperty("annotations")
	@JsonDeserialize(
		as = ArrayList.class,
		contentAs = Annotation.class
	)
	@Builder.Default
	private List<Annotation> annotations = new ArrayList<>();

	@JsonProperty("modelReferences")
	@JsonDeserialize(
		as = ArrayList.class,
		contentAs = ModelReference.class
	)
	@Builder.Default
	private List<ModelReference> modelReferences = new ArrayList<>();
}
