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

import { Deserializer } from "./deserializer.js";
import {
	BorderPropertiesDeserializer,
	ComputationAlternativeDeserializer,
	RequiredComputationAlternativeDeserializer,
	DisplayOptionsDeserializer,
	TextPropertiesDeserializer,
} from "./misc-deserializer.js";
import { InputSourceDeserializer, MeasureInputSourceDeserializer } from "./input-source-deserializer.js";

export class ListingDeserializer extends Deserializer<GeneratedDTO.ListingDTO, ModelAPI.ListingProperties> {
	prefix = "listing";

	map(property: keyof GeneratedDTO.ListingDTO, dto: GeneratedDTO.ListingDTO) {
		switch (property) {
			case "id":
				return this.getRequired(dto.id, property);
			case "model":
				return this.getRequired(dto.model, property);
			case "basePath":
				return this.getRequired(dto.basePath, property);
			case "hideHeader":
				return dto.hideHeader;
			case "showRepeatedGroupEntries":
				return dto.showRepeatedGroupEntries;
			case "headerTextProperties": {
				return this.deserializeOptional(
					dto.headerTextProperties,
					new TextPropertiesDeserializer(this.path),
					property
				);
			}
			case "rowPropertyComputations":
				return this.deserializeRepeatable(
					dto.rowPropertyComputations,
					index => new RowPropertyComputationDeserializer(this.path, index, true),
					property
				);
			case "groupPropertyComputations":
				return this.deserializeRepeatable(
					dto.groupPropertyComputations,
					index => new GroupPropertyComputationDeserializer(this.path, index, true),
					property
				);
			case "columns":
				return this.deserializeRepeatable(
					dto.columns,
					index => new ListingColumnDeserializer(this.path, index, true),
					property
				);
		}
		this.unknownProperty(property);
	}
}

class RowPropertyComputationDeserializer extends Deserializer<
	GeneratedDTO.RowPropertyComputationsDTO,
	ModelAPI.RowPropertyComputations
> {
	prefix = "rowPropertyComputations";

	map(property: keyof GeneratedDTO.RowPropertyComputationsDTO, dto: GeneratedDTO.RowPropertyComputationsDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "property":
				return ModelAPI.RowPropertyKeyType[dto.property];
			case "computationAlternatives":
				return this.deserializeRepeatable(
					dto.computationAlternatives,
					index => new ComputationAlternativeDeserializer(this.path, index, true),
					property
				);
		}
		this.unknownProperty(property);
	}
}

class GroupPropertyComputationDeserializer extends Deserializer<
	GeneratedDTO.GroupPropertyComputationsDTO,
	ModelAPI.GroupPropertyComputations
> {
	prefix = "groupPropertyComputations";

	map(property: keyof GeneratedDTO.GroupPropertyComputationsDTO, dto: GeneratedDTO.GroupPropertyComputationsDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "property":
				return ModelAPI.GroupPropertyKeyType[dto.property];
			case "groupPath":
				return dto.groupPath;
			case "computationAlternatives":
				return this.deserializeRepeatable(
					dto.computationAlternatives,
					index => new RequiredComputationAlternativeDeserializer(this.path, index, true),
					property
				);
		}
		this.unknownProperty(property);
	}
}

class ListingColumnDeserializer extends Deserializer<GeneratedDTO.ColumnsDTO_1, ModelAPI.ListingColumn> {
	prefix = "column";

	map(property: keyof GeneratedDTO.ColumnsDTO_1, dto: GeneratedDTO.ColumnsDTO_1) {
		switch (property) {
			case "id":
				return dto.id;
			case "label":
				return this.deserializeRequired(dto.label, property, new InputSourceDeserializer<string>(this.path));
			case "width":
				return this.deserializeRequired(dto.width, property, new MeasureInputSourceDeserializer(this.path));
			case "hasCustomBorderProperties":
				return dto.hasCustomBorderProperties;
			case "hasCustomTextProperties":
				return dto.hasCustomTextProperties;
			case "isSortingIndex":
				return dto.isSortingIndex;
			case "borderProperties":
				return this.deserializeOptional(
					dto.borderProperties,
					new BorderPropertiesDeserializer(this.path),
					property
				);
			case "textProperties": {
				return this.deserializeOptional(
					dto.textProperties,
					new TextPropertiesDeserializer(this.path),
					property
				);
			}

			case "default":
				return this.deserializeOptional(dto.default, new ListingColumnDefaultDeserializer(this.path), property);
			case "group":
				return this.deserializeOptional(dto.group, new ListingColumnGroupDeserializer(this.path), property);
			case "field":
				return this.deserializeRepeatable(
					dto.field,
					index => new ListingColumnFieldDeserializer(this.path, index, true),
					property
				);
		}
		this.unknownProperty(property);
	}
}

class ListingColumnDefaultDeserializer extends Deserializer<GeneratedDTO.DefaultDTO, ModelAPI.ListingColumnDefault> {
	prefix = "default";

	map(property: keyof GeneratedDTO.DefaultDTO, dto: GeneratedDTO.DefaultDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "propertyComputations":
				return this.deserializeRepeatable(
					dto.propertyComputations,
					index => new ListingPropertyComputationDeserializer(this.path, index, true),
					property
				);
			case "valueComputationAlternatives":
				return this.deserializeRepeatable(
					dto.valueComputationAlternatives,
					index => new ComputationAlternativeDeserializer(this.path, index, true),
					property
				);
		}
		this.unknownProperty(property);
	}
}

class ListingColumnGroupDeserializer extends Deserializer<GeneratedDTO.GroupDTO, ModelAPI.ListingColumnGroup> {
	prefix = "group";

	map(property: keyof GeneratedDTO.GroupDTO, dto: GeneratedDTO.GroupDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "propertyComputations":
				return this.deserializeRepeatable(
					dto.propertyComputations,
					index => new ListingPropertyComputationDeserializer(this.path, index, true),
					property
				);
			case "valueComputationAlternatives":
				return this.deserializeRepeatable(
					dto.valueComputationAlternatives,
					index => new ComputationAlternativeDeserializer(this.path, index, true),
					property
				);
		}
		this.unknownProperty(property);
	}
}

class ListingColumnFieldDeserializer extends Deserializer<GeneratedDTO.FieldDTO_1, ModelAPI.ListingColumnField> {
	prefix = "group";

	map(property: keyof GeneratedDTO.FieldDTO_1, dto: GeneratedDTO.FieldDTO_1) {
		switch (property) {
			case "id":
				return dto.id;
			case "inputFieldTypeSerialized":
				return dto.inputFieldTypeSerialized;
			case "outputFieldTypeSerialized":
				return dto.outputFieldTypeSerialized;
			case "displayOptions":
				return this.deserializeOptional(
					dto.displayOptions,
					new DisplayOptionsDeserializer(this.path),
					property
				);
			case "propertyComputations":
				return this.deserializeRepeatable(
					dto.propertyComputations,
					index => new ListingPropertyComputationDeserializer(this.path, index, true),
					property
				);
			case "valueComputationAlternatives":
				return this.deserializeRepeatable(
					dto.valueComputationAlternatives,
					index => new ComputationAlternativeDeserializer(this.path, index, true),
					property
				);
		}
		this.unknownProperty(property);
	}
}

class ListingPropertyComputationDeserializer extends Deserializer<
	GeneratedDTO.PropertyComputationsDTO,
	ModelAPI.ColumnPropertyComputations
> {
	prefix = "propertyComputations";

	map(property: keyof GeneratedDTO.PropertyComputationsDTO, dto: GeneratedDTO.PropertyComputationsDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "property":
				return ModelAPI.ColumnPropertyKeyType[dto.property];
			case "computationAlternatives":
				return this.deserializeRepeatable(
					dto.computationAlternatives,
					index => new ComputationAlternativeDeserializer(this.path, index, true),
					property
				);
		}
		this.unknownProperty(property);
	}
}
