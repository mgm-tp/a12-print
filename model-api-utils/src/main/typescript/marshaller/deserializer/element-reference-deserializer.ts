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
import type * as ModelAPI from "@com.mgmtp.a12.print/print-model-api/model";
import type * as GeneratedDTO from "@com.mgmtp.a12.print/print-model-api/generated/a12internal";

import { Deserializer } from "./deserializer.js";
import { MeasureDeserializer } from "./measure-deserializer.js";
import { MarginDeserializer } from "./margin-deserializer.js";
import { InputSourceDeserializer } from "./input-source-deserializer.js";

export class ElementReferenceDeserializer extends Deserializer<
	GeneratedDTO.ElementReferencesDTO,
	ModelAPI.PlaceableReference
> {
	prefix = "elementReferences";
	elementBase = {
		hideConditions: [],
	};

	map(property: keyof GeneratedDTO.ElementReferencesDTO, dto: GeneratedDTO.ElementReferencesDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "refId":
				return dto.refId;
			case "dimensions":
				return this.deserializeRequired(dto.dimensions, property, new DimensionDeserializer(this.path));
			case "position":
				return this.deserializeRequired(dto.position, property, new PositionDeserializer(this.path));
			case "screenReadingOrder":
				return this.deserializeRequired(
					dto.screenReadingOrder,
					property,
					new ScreenReadingOrderDeserializer(this.path)
				);
			case "hideConditions":
				return this.deserializeRepeatable(
					dto.hideConditions,
					index => new HideConditionDeserializer(this.path, index, true),
					property
				);
			case "margins":
				return this.deserializeOptional(dto.margins, new MarginsDeserializer(this.path), property);
			case "pageBreakBehavior":
				return this.deserializeRequired(
					dto.pageBreakBehavior,
					property,
					new InputSourceDeserializer<GeneratedDTO.Enumeration_PageBreakBehavior_ValueDTO>(this.path)
				);
		}
		this.unknownProperty(property);
	}
}

class DimensionDeserializer extends Deserializer<GeneratedDTO.DimensionsDTO, ModelAPI.Dimensions> {
	prefix = "dimension";

	map(property: keyof GeneratedDTO.DimensionsDTO, dto: GeneratedDTO.DimensionsDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "minHeight":
				return this.deserializeRequired(dto.minHeight, property, new MeasureDeserializer(this.path));
			case "minWidth":
				return this.deserializeRequired(dto.minWidth, property, new MeasureDeserializer(this.path));
		}
		this.unknownProperty(property);
	}
}

class PositionDeserializer extends Deserializer<GeneratedDTO.PositionDTO, ModelAPI.Position> {
	prefix = "position";

	map(property: keyof GeneratedDTO.PositionDTO, dto: GeneratedDTO.PositionDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "x":
				return this.deserializeRequired(dto.x, property, new MeasureDeserializer(this.path));
			case "y":
				return this.deserializeRequired(dto.y, property, new MeasureDeserializer(this.path));
		}
		this.unknownProperty(property);
	}
}

class ScreenReadingOrderDeserializer extends Deserializer<
	GeneratedDTO.ScreenReadingOrderDTO,
	ModelAPI.ScreenReadingOrder
> {
	prefix = "screenReadingOrder";

	map(property: keyof GeneratedDTO.ScreenReadingOrderDTO, dto: GeneratedDTO.ScreenReadingOrderDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "screenReadingOrderWeight":
				return dto.screenReadingOrderWeight;
		}
		this.unknownProperty(property);
	}
}

class HideConditionDeserializer extends Deserializer<GeneratedDTO.HideConditionsDTO, ModelAPI.Precondition> {
	prefix = "hideCondition";

	map(property: keyof GeneratedDTO.HideConditionsDTO, dto: GeneratedDTO.HideConditionsDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "precondition":
				return dto.precondition;
		}
		this.unknownProperty(property);
	}
}

class MarginsDeserializer extends Deserializer<GeneratedDTO.MarginsDTO, ModelAPI.Margins> {
	prefix = "margins";

	map(property: keyof GeneratedDTO.MarginsDTO, dto: GeneratedDTO.MarginsDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "top":
				return this.deserializeOptional(dto.top, new MarginDeserializer(this.path), property);
			case "bottom":
				return this.deserializeOptional(dto.bottom, new MarginDeserializer(this.path), property);
		}
		this.unknownProperty(property);
	}
}
