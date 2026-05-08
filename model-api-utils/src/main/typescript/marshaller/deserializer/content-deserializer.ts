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
import * as ModelAPI from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import * as GeneratedDTO from "@com.mgmtp.a12.print/print-model-api/lib/generated/internal/dto/PrintModelDTO.js";
import { UnionToType } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";

import { Deserializer } from "./deserializer.js";
import * as ElementDeserializer from "./element-deserializer.js";
import { MeasureDeserializer } from "./measure-deserializer.js";
import { ElementReferenceDeserializer } from "./element-reference-deserializer.js";
import { DataContextDeserializer } from "./data-context-deserializer.js";
import { ComputationAlternativeDeserializer } from "./misc-deserializer.js";

export class PrintModelContentDeserializer extends Deserializer<GeneratedDTO.ContentDTO, ModelAPI.PrintModelContent> {
	prefix = "content";
	elementBase = {
		segments: {},
		elementDefinitions: [],
	};

	map(property: keyof GeneratedDTO.ContentDTO, dto: GeneratedDTO.ContentDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "general":
				return this.deserializeRequired(dto.general, property, new GeneralDeserializer(this.path));
			case "sections":
				return this.deserializeOptional(dto.sections, new SectionsContainerDeserializer(this.path), property);
			case "watermarks":
				return this.deserializeOptional(
					dto.watermarks,
					new WatermarksContainerDeserializer(this.path),
					property
				);
			case "segments":
				return this.deserializeRequired(dto.segments, "segments", new SegmentsContainerDeserializer(this.path));
			case "textStyles":
				return this.deserializeOptional(
					dto.textStyles,
					new TextStylesContainerDeserializer(this.path),
					property
				);
			case "elementDefinitions":
				return this.deserializeRepeatable(
					dto.elementDefinitions,
					index => new ElementDeserializer.ElementDefinitionDeserializer(this.path, index, true),
					property
				);
		}
		this.unknownProperty(property);
	}
}

export class GeneralDeserializer extends Deserializer<GeneratedDTO.GeneralDTO, ModelAPI.PrintModelContentGeneral> {
	prefix = "general";
	elementBase = {
		runtimeVariables: [],
	};

	map(property: keyof GeneratedDTO.GeneralDTO, dto: GeneratedDTO.GeneralDTO) {
		this.addAdditionalProperty("title", dto.metadata?.titleComputation?.[0]?.operation ?? "");
		this.addAdditionalProperty("details", {
			id: this.getRequired(dto.metadata?.id, "id"),
			author: dto.metadata?.authorComputation?.[0]?.operation ?? "",
			language: (dto.metadata?.languageComputation?.[0]?.operation ?? "") as ModelAPI.Language,
		});

		switch (property) {
			case "id":
				return dto.id;
			case "metadata":
				return this.deserializeRequired(dto.metadata, property, new MetaDataDeserializer(this.path));
			case "runtimeVariables":
				return this.deserializeRepeatable(
					dto.runtimeVariables,
					index => new RuntimeVariableDeserializer(this.path, index, true),
					property
				);
			case "segmentDefaults":
				return this.deserializeRequired(
					dto.segmentDefaults,
					property,
					new SegmentDefaultsDeserializer(this.path)
				);
			case "textStyles":
				return dto.textStyles ? dto.textStyles.map(style => style.id) : [];
			case "structure":
				return this.getRequired(dto.structure, "structure").map(style => style.id);
			case "sections":
				return dto.sections ? dto.sections.map(section => section.id) : [];
			case "watermarks":
				return dto.watermarks ? dto.watermarks.map(watermark => watermark.id) : [];
		}
		this.unknownProperty(property);
	}
}

export class SegmentDefaultsDeserializer extends Deserializer<
	GeneratedDTO.SegmentDefaultsDTO,
	ModelAPI.SegmentDefaults
> {
	prefix = "segmentDefaults";

	map(property: keyof GeneratedDTO.SegmentDefaultsDTO, dto: GeneratedDTO.SegmentDefaultsDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "fontSize":
				return dto.fontSize;
			case "model":
				return dto.model;
		}
		this.unknownProperty(property);
	}
}

export class RuntimeVariableDeserializer extends Deserializer<
	GeneratedDTO.RuntimeVariablesDTO,
	ModelAPI.RuntimeVariable
> {
	prefix = "runtimeVariables";

	map(property: keyof GeneratedDTO.RuntimeVariablesDTO, dto: GeneratedDTO.RuntimeVariablesDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "name":
				return dto.name;
			case "type":
				return ModelAPI.RuntimeVariableType[dto.type];
		}
		this.unknownProperty(property);
	}
}

export class MetaDataDeserializer extends Deserializer<GeneratedDTO.MetadataDTO, ModelAPI.Metadata> {
	prefix = "metadata";

	map(property: keyof GeneratedDTO.MetadataDTO, dto: GeneratedDTO.MetadataDTO) {
		switch (property) {
			case "id":
				return this.getRequired(dto.id, property);
			case "model":
				return dto.model;
			case "titleComputation": {
				return this.deserializeRepeatable(
					dto.titleComputation,
					index => new ComputationAlternativeDeserializer(this.path, index, true),
					property
				);
			}
			case "descriptionComputation":
				return this.deserializeRepeatable(
					dto.descriptionComputation,
					index => new ComputationAlternativeDeserializer(this.path, index, true),
					property
				);
			case "authorComputation":
				return this.deserializeRepeatable(
					dto.authorComputation,
					index => new ComputationAlternativeDeserializer(this.path, index, true),
					property
				);
			case "languageComputation":
				return this.deserializeRepeatable(
					dto.languageComputation,
					index => new ComputationAlternativeDeserializer(this.path, index, true),
					property
				);
		}
		this.unknownProperty(property);
	}
}

class SectionsContainerDeserializer extends Deserializer<GeneratedDTO.SectionsDTO_1, ModelAPI.SectionsContainer> {
	prefix = "sections";
	elementBase = {
		definitions: [],
	};

	map(property: keyof GeneratedDTO.SectionsDTO_1, dto: GeneratedDTO.SectionsDTO_1) {
		switch (property) {
			case "id":
				return this.getRequired(dto.id, property);
			case "definitions":
				return this.deserializeRepeatable(
					dto.definitions,
					index => new SectionDeserializer(this.path, index, true),
					property
				);
		}
		this.unknownProperty(property);
	}
}

class WatermarksContainerDeserializer extends Deserializer<GeneratedDTO.WatermarksDTO_1, ModelAPI.WatermarksContainer> {
	prefix = "watermarks";
	elementBase = {
		definitions: [],
	};

	map(property: keyof GeneratedDTO.WatermarksDTO_1, dto: GeneratedDTO.WatermarksDTO_1) {
		switch (property) {
			case "id":
				return this.getRequired(dto.id, property);
			case "definitions":
				return this.deserializeRepeatable(
					dto.definitions,
					index => new WatermarkDeserializer(this.path, index, true),
					property
				);
		}
		this.unknownProperty(property);
	}
}

class TextStylesContainerDeserializer extends Deserializer<GeneratedDTO.TextStylesDTO_1, ModelAPI.TextStylesContainer> {
	prefix = "textStyles";

	map(property: keyof GeneratedDTO.TextStylesDTO_1, dto: GeneratedDTO.TextStylesDTO_1) {
		switch (property) {
			case "id":
				return this.getRequired(dto.id, property);
			case "definitions":
				return this.deserializeRepeatable(
					dto.definitions,
					index => new TextStyleDeserializer(this.path, index, true),
					property
				);
		}
		this.unknownProperty(property);
	}
}

class TextStyleDeserializer extends Deserializer<GeneratedDTO.DefinitionsDTO_2, ModelAPI.TextStyle> {
	prefix = "definitions";

	map(property: keyof GeneratedDTO.DefinitionsDTO_2, dto: GeneratedDTO.DefinitionsDTO_2) {
		switch (property) {
			case "id":
				return dto.id;
			case "name":
				return dto.name;
			case "font":
				return dto.font;
			case "fontSize":
				return dto.fontSize;
			case "lineHeight":
				return dto.lineHeight;
			case "semantic":
				return dto.semantic;
			case "typesettingModelName":
				return dto.typesettingModelName;
			case "staticHyphenator":
				return dto.staticHyphenator;
		}
		this.unknownProperty(property);
	}
}

class SegmentsContainerDeserializer extends Deserializer<GeneratedDTO.SegmentsDTO, ModelAPI.SegmentsContainer> {
	prefix = "segments";
	elementBase = {
		definitions: [],
		references: [],
	};

	map(property: keyof GeneratedDTO.SegmentsDTO, dto: GeneratedDTO.SegmentsDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "definitions":
				return this.deserializeRepeatable(
					dto.definitions,
					index => new SegmentDefinitionsDeserializer(this.path, index, true),
					property
				);
			case "references":
				return this.deserializeRepeatable(
					dto.references,
					index => new SegmentReferencesDeserializer(this.path, index, true),
					property
				);
		}
		this.unknownProperty(property);
	}
}

class SegmentDefinitionsDeserializer extends Deserializer<GeneratedDTO.DefinitionsDTO, UnionToType<ModelAPI.Segment>> {
	prefix = "definitions";
	elementBase = {
		elementReferences: [],
	};

	map(property: keyof GeneratedDTO.DefinitionsDTO, dto: GeneratedDTO.DefinitionsDTO) {
		switch (property) {
			case "id":
				return this.getRequired(dto.id, property);
			case "title":
				return this.getRequired(dto.title, property);
			case "type":
				return ModelAPI.SegmentType[this.getRequired(dto.type, property)];
			case "elementReferences":
				return this.deserializeRepeatable(
					dto.elementReferences,
					index => new ElementReferenceDeserializer(this.path, index, true),
					property
				);
			case "defaultSegment":
				return this.deserializeOptional(
					dto.defaultSegment,
					new DefaultSegmentPropertyDeserializer(this.path),
					property
				);
			case "dinTemplate":
				return this.deserializeOptional(
					dto.dinTemplate,
					new DinTemplatePropertyDeserializer(this.path),
					property
				);
			case "dataContexts":
				return this.deserializeRepeatable(
					dto.dataContexts,
					index => new DataContextDeserializer(this.path, index, true),
					property
				);
		}
		this.unknownProperty(property);
	}
}

class SegmentReferencesDeserializer extends Deserializer<GeneratedDTO.ReferencesDTO, ModelAPI.SegmentReference> {
	prefix = "references";
	elementBase = {
		refIds: [],
	};

	map(property: keyof GeneratedDTO.ReferencesDTO, dto: GeneratedDTO.ReferencesDTO) {
		switch (property) {
			case "id":
				return this.getRequired(dto.id, property);
			case "purpose":
				return ModelAPI.SegmentReferencePurpose[dto.purpose];
			case "referenceModel":
				return this.getRequired(dto.referenceModel, property);
			case "direction":
				return ModelAPI.SegmentReferenceDirection[this.getRequired(dto.direction, property)];
			case "refIds":
				return this.deserializeRepeatable(
					dto.refIds,
					index => new ElementReferenceRefIdsDeserializer(this.path, index, true),
					property
				);
		}
		this.unknownProperty(property);
	}
}

class DefaultSegmentPropertyDeserializer extends Deserializer<
	GeneratedDTO.DefaultSegmentDTO,
	ModelAPI.DefaultSegmentProperties
> {
	prefix = "defaultSegment";

	map(property: keyof GeneratedDTO.DefaultSegmentDTO, dto: GeneratedDTO.DefaultSegmentDTO) {
		switch (property) {
			case "id":
				return this.getRequired(dto.id, property);
			case "pageOrientation":
				return ModelAPI.PageOrientation[this.getRequired(dto.pageOrientation, property)];
		}
		this.unknownProperty(property);
	}
}

class DinTemplatePropertyDeserializer extends Deserializer<
	GeneratedDTO.DinTemplateDTO,
	ModelAPI.DINTemplateProperties
> {
	prefix = "dinTemplate";

	map(property: keyof GeneratedDTO.DinTemplateDTO, dto: GeneratedDTO.DinTemplateDTO) {
		switch (property) {
			case "id":
				return this.getRequired(dto.id, property);
			case "referenceId":
				return dto.referenceId;
			case "refId":
				return dto.refId;
		}
		this.unknownProperty(property);
	}
}

class ElementReferenceRefIdsDeserializer extends Deserializer<
	GeneratedDTO.RefIdsDTO,
	ModelAPI.SegmentReferenceRefIdContainer
> {
	prefix = "refIds";

	map(property: keyof GeneratedDTO.RefIdsDTO, dto: GeneratedDTO.RefIdsDTO) {
		switch (property) {
			case "id":
				return this.getRequired(dto.id, property);
			case "refId":
				return this.getRequired(dto.refId, property);
		}
		this.unknownProperty(property);
	}
}

class SectionDeserializer extends Deserializer<GeneratedDTO.DefinitionsDTO_1, ModelAPI.Section> {
	prefix = "definitions";
	elementBase = {
		elementReferences: [],
	};

	map(property: keyof GeneratedDTO.DefinitionsDTO_1, dto: GeneratedDTO.DefinitionsDTO_1) {
		switch (property) {
			case "id":
				return dto.id;
			case "title":
				return dto.title;
			case "sectionUsage":
				return ModelAPI.SectionUsage[dto.sectionUsage];
			case "pageOrientation":
				return ModelAPI.PageOrientation[dto.pageOrientation];
			case "footerHeight":
				return this.deserializeRequired(dto.footerHeight, property, new MeasureDeserializer(this.path));
			case "headerHeight":
				return this.deserializeRequired(dto.headerHeight, property, new MeasureDeserializer(this.path));
			case "elementReferences":
				return this.deserializeRepeatable(
					dto.elementReferences,
					index => new ElementReferenceDeserializer(this.path, index, true),
					property
				);
		}
		this.unknownProperty(property);
	}
}

class WatermarkDeserializer extends Deserializer<GeneratedDTO.DefinitionsDTO_3, ModelAPI.Watermark> {
	prefix = "definitions";
	elementBase = {
		elementReferences: [],
	};

	map(property: keyof GeneratedDTO.DefinitionsDTO_3, dto: GeneratedDTO.DefinitionsDTO_3) {
		switch (property) {
			case "id":
				return dto.id;
			case "title":
				return dto.title;
			case "pageOrientation":
				return ModelAPI.PageOrientation[dto.pageOrientation];
			case "opacity":
				return dto.opacity;
			case "conditions":
				return this.deserializeRepeatable(
					dto.conditions,
					index => new WatermarkConditionDeserializer(this.path, index, true),
					property
				);
			case "elementReferences":
				return this.deserializeRepeatable(
					dto.elementReferences,
					index => new ElementReferenceDeserializer(this.path, index, true),
					property
				);
		}
		this.unknownProperty(property);
	}
}

class WatermarkConditionDeserializer extends Deserializer<GeneratedDTO.ConditionsDTO, ModelAPI.Precondition> {
	prefix = "condition";

	map(property: keyof GeneratedDTO.ConditionsDTO, dto: GeneratedDTO.ConditionsDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "precondition":
				return dto.precondition;
		}
		this.unknownProperty(property);
	}
}
