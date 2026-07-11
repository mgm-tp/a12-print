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
import * as ModelAPI from "@com.mgmtp.a12.print/print-model-api/model";
import type * as GeneratedDTO from "@com.mgmtp.a12.print/print-model-api/generated/a12internal";

import { Deserializer } from "./deserializer.js";
import { InputSourceDeserializer } from "./input-source-deserializer.js";

export class TextPropertiesDeserializer extends Deserializer<
	GeneratedDTO.HeaderTextPropertiesDTO,
	ModelAPI.TextProperties
> {
	prefix = "headerTextPropertyInputSource";

	map(property: keyof GeneratedDTO.HeaderTextPropertiesDTO, dto: GeneratedDTO.HeaderTextPropertiesDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "textStyleId":
				return this.deserializeOptional(
					dto.textStyleId,
					new InputSourceDeserializer<string>(this.path),
					property
				);

			case "bold":
				return this.deserializeOptional(dto.bold, new InputSourceDeserializer<boolean>(this.path), property);
			case "italic":
				return this.deserializeOptional(dto.italic, new InputSourceDeserializer<boolean>(this.path), property);
			case "underlined":
				return this.deserializeOptional(
					dto.underlined,
					new InputSourceDeserializer<boolean>(this.path),
					property
				);
			case "color":
				return this.deserializeOptional(dto.color, new InputSourceDeserializer<string>(this.path), property);
			case "backgroundColor":
				return this.deserializeOptional(
					dto.backgroundColor,
					new InputSourceDeserializer<string>(this.path),
					property
				);
			case "alignment": {
				const inputSourceDeserializer = new InputSourceDeserializer<ModelAPI.Alignment>(this.path);
				inputSourceDeserializer.setValueGetter(value => ModelAPI.Alignment[value]);

				return this.deserializeOptional(dto.alignment, inputSourceDeserializer, property);
			}
		}

		this.unknownProperty(property);
	}
}

export class BorderPropertiesDeserializer extends Deserializer<
	GeneratedDTO.BorderPropertiesDTO,
	ModelAPI.BorderProperties
> {
	prefix = "borderProperties";

	map(property: keyof GeneratedDTO.BorderPropertiesDTO, dto: GeneratedDTO.BorderPropertiesDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "borderStyle":
				return this.deserializeOptional(
					dto.borderStyle,
					new InputSourceDeserializer<string>(this.path),
					property
				);
			case "borderWidth":
				return this.deserializeOptional(
					dto.borderWidth,
					new InputSourceDeserializer<number>(this.path),
					property
				);
			case "borderColor":
				return this.deserializeOptional(
					dto.borderColor,
					new InputSourceDeserializer<string>(this.path),
					property
				);
		}
		this.unknownProperty(property);
	}
}

export class ComputationAlternativeDeserializer extends Deserializer<
	GeneratedDTO.ComputationAlternativesDTO,
	ModelAPI.ComputationAlternative
> {
	prefix = "computationAlternative";

	map(property: keyof GeneratedDTO.ComputationAlternativesDTO, dto: GeneratedDTO.ComputationAlternativesDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "operation":
				return dto.operation;
			case "precondition":
				return dto.precondition;
		}
		this.unknownProperty(property);
	}
}

export class RequiredComputationAlternativeDeserializer extends Deserializer<
	GeneratedDTO.ComputationAlternativesDTO_1,
	Required<ModelAPI.ComputationAlternative>
> {
	prefix = "computationAlternative";

	map(property: keyof GeneratedDTO.ComputationAlternativesDTO_1, dto: GeneratedDTO.ComputationAlternativesDTO_1) {
		switch (property) {
			case "id":
				return dto.id;
			case "operation":
				return dto.operation;
			case "precondition":
				return dto.precondition;
		}
		this.unknownProperty(property);
	}
}

export class DisplayOptionsDeserializer extends Deserializer<GeneratedDTO.DisplayOptionsDTO, ModelAPI.DisplayOptions> {
	prefix = "displayOptions";

	map(property: keyof GeneratedDTO.DisplayOptionsDTO, dto: GeneratedDTO.DisplayOptionsDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "checkboxChecked":
				return dto.checkboxChecked;
			case "checkboxUnchecked":
				return dto.checkboxUnchecked;
			case "dateFormat":
				return dto.dateFormat;
			case "dateRangeFormatStart":
				return dto.dateRangeFormatStart;
			case "dateRangeFormatEnd":
				return dto.dateRangeFormatEnd;
			case "dateRangeDelimiter":
				return dto.dateRangeDelimiter;
			case "displayType":
				return ModelAPI.DisplayType[this.getRequired(dto.displayType, property)];
			case "suffix":
				return dto.suffix !== undefined && dto.suffix.startsWith("#") && dto.suffix.endsWith("#")
					? dto.suffix?.slice(1, -1)
					: dto.suffix;
		}
		this.unknownProperty(property);
	}
}

export class FieldTypeDeserializer extends Deserializer<GeneratedDTO.FieldTypeDTO, ModelAPI.FieldType> {
	prefix = "fieldType";

	map(property: keyof GeneratedDTO.FieldTypeDTO, dto: GeneratedDTO.FieldTypeDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "fieldType":
				return ModelAPI.FieldTypeDefinition[this.getRequired(dto.fieldType, property)];
			case "typeDefinition":
				return this.deserializeOptional(
					dto.typeDefinition,
					new TypeDefinitionDeserializer(this.path),
					property
				);
		}
		this.unknownProperty(property);
	}
}

class TypeDefinitionDeserializer extends Deserializer<GeneratedDTO.TypeDefinitionDTO, ModelAPI.PrintModelEntity> {
	prefix = "typeDefinition";

	map(property: keyof GeneratedDTO.TypeDefinitionDTO, dto: GeneratedDTO.TypeDefinitionDTO) {
		switch (property) {
			case "id": {
				return this.getRequired(dto.id, property);
			}
		}
		this.unknownProperty(property);
	}
}
