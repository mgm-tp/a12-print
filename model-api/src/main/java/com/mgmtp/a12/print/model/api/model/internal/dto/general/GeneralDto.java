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
package com.mgmtp.a12.print.model.api.model.internal.dto.general;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.mgmtp.a12.print.model.api.model.element.base.ComputationAlternative;
import com.mgmtp.a12.print.model.api.model.element.properties.RuntimeVariable;
import com.mgmtp.a12.print.model.api.model.general.Details;
import com.mgmtp.a12.print.model.api.model.general.General;
import com.mgmtp.a12.print.model.api.model.general.Metadata;
import com.mgmtp.a12.print.model.api.model.general.SegmentDefaults;
import com.mgmtp.a12.print.model.api.model.internal.dto.JsonModel;
import com.mgmtp.a12.print.model.api.model.internal.dto.PrintModelEntityDto;
import com.mgmtp.a12.print.model.api.model.internal.dto.element.base.RuntimeVariableDto;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Value
@SuperBuilder
@NoArgsConstructor(force = true, access = AccessLevel.PROTECTED)
@EqualsAndHashCode(callSuper = true)
public class GeneralDto extends PrintModelEntityDto implements General, JsonModel {
	@JsonProperty(value = "metadata", required = true)
	@JsonDeserialize(as = MetadataDto.class)
	MetadataDto metadata;

	@JsonProperty(value = "segmentDefaults", required = true)
	@JsonDeserialize(as = SegmentDefaultsDto.class)
	SegmentDefaults segmentDefaults;

	@JsonProperty("runtimeVariables")
	@JsonDeserialize(contentAs = RuntimeVariableDto.class)
	@Builder.Default
	List<RuntimeVariable> runtimeVariables = new ArrayList<>();

	@JsonProperty("textStyles")
	@JsonDeserialize(contentAs = PrintModelEntityDto.class)
	@Builder.Default
	List<PrintModelEntityDto> textStyles = new ArrayList<>();

	@JsonProperty("structure")
	@JsonDeserialize(contentAs = PrintModelEntityDto.class)
	@Builder.Default
	List<PrintModelEntityDto> structure = new ArrayList<>();

	@Override
	@JsonIgnore
	public List<String> getStructure() {
		return structure.stream().map(PrintModelEntityDto::getId).collect(Collectors.toList());
	}

	@JsonProperty("sections")
	@JsonDeserialize(contentAs = PrintModelEntityDto.class)
	@Builder.Default
	List<PrintModelEntityDto> sections = new ArrayList<>();

	@Override
	@JsonIgnore
	public List<String> getSections() {
		return sections.stream().map(PrintModelEntityDto::getId).collect(Collectors.toList());
	}

	@JsonProperty("watermarks")
	@JsonDeserialize(contentAs = PrintModelEntityDto.class)
	@Builder.Default
	List<PrintModelEntityDto> watermarks = new ArrayList<>();

	@Override
	@JsonIgnore
	public List<String> getWatermarks() {
		return watermarks.stream().map(PrintModelEntityDto::getId).collect(Collectors.toList());
	}

	@Override
	@JsonIgnore
	public List<String> getTextStyles() {
		return textStyles.stream().map(PrintModelEntityDto::getId).collect(Collectors.toList());
	}

	private static void assertOneComputation(List<ComputationAlternative> computations, String property) {
		if (computations == null || computations.size() != 1) {
			throw new IllegalStateException(
				String.format("Only one computation in general.metadata.%sComputation is allowed when accessing this deprecated '%s' field.", property, property)
			);
		}
	}

	private static String extractStringLiteral(String operation, String property) {
		if (operation == null || operation.length() < 2 || !operation.startsWith("\"") || !operation.endsWith("\"")) {
			throw new IllegalStateException(
				String.format("The operation in general.metadata.%sComputation must be a string literal (wrapped in quotes) when accessing this deprecated '%s' field. Got: %s", property, property, operation)
			);
		}
		return operation.substring(1, operation.length() - 1);
	}

	@Override
	@JsonIgnore
	public String getTitle() {
		assertOneComputation(metadata.getTitleComputation(), "title");
		return extractStringLiteral(metadata.getTitleComputation().get(0).getOperation(), "title");
	}

	@Override
	@JsonIgnore
	public Details getDetails() {
		return new Details() {
			@Override
			public String getId() {
				return metadata.getId();
			}

			@Override
			public String getAuthor() {
				assertOneComputation(metadata.getAuthorComputation(), "author");
				return extractStringLiteral(metadata.getAuthorComputation().get(0).getOperation(), "author");
			}

			@Override
			public String getLanguage() {
				assertOneComputation(metadata.getLanguageComputation(), "language");
				return extractStringLiteral(metadata.getLanguageComputation().get(0).getOperation(), "language");
			}
		};
	}
}
