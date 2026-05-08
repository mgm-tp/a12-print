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
import { BorderPropertiesDeserializer, TextPropertiesDeserializer } from "./misc-deserializer.js";
import { TextDeserializer } from "./text-deserializer.js";
import { CalculationDeserializer, FieldDeserializer } from "./nested-element-deserializer.js";
import { ExpressionDeserializer } from "./expression-deserializer.js";
import { ImageDeserializer } from "./image-deserializer.js";
import { TableDeserializer } from "./table-deserializer.js";
import { TableLayoutDeserializer } from "./table-layout-deserializer.js";
import { ListingDeserializer } from "./listing-deserializer.js";
import { BarChartDeserializer, LineChartDeserializer, PieChartDeserializer } from "./chart-deserializer.js";
import { BoundingBoxDeserializer } from "./bounding-box-deserializer.js";
import { OverrideDeserializer } from "./override-deserializer.js";
import { AreaDeserializer } from "./area-deserializer.js";
import { SwitchDeserializer } from "./switch-deserializer.js";

export class ElementDefinitionDeserializer extends Deserializer<
	GeneratedDTO.ElementDefinitionsDTO,
	UnionToType<ModelAPI.AnyPrintModelElement>
> {
	prefix = "elementDefinition";

	map(property: keyof GeneratedDTO.ElementDefinitionsDTO, dto: GeneratedDTO.ElementDefinitionsDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "type":
				return dto.type;
			case "text":
				return this.deserializeRequired(dto.text, property, new TextDeserializer(this.path));
			case "field":
				return this.deserializeRequired(dto.field, property, new FieldDeserializer(this.path));
			case "calculation":
				return this.deserializeRequired(dto.calculation, property, new CalculationDeserializer(this.path));
			case "expression":
				return this.deserializeRequired(dto.expression, property, new ExpressionDeserializer(this.path));
			case "image":
				return this.deserializeRequired(dto.image, property, new ImageDeserializer(this.path));
			case "table":
				return this.deserializeRequired(dto.table, property, new TableDeserializer(this.path));
			case "tableLayout":
				return this.deserializeRequired(dto.tableLayout, property, new TableLayoutDeserializer(this.path));
			case "listing":
				return this.deserializeRequired(dto.listing, property, new ListingDeserializer(this.path));
			case "barChart":
				return this.deserializeRequired(dto.barChart, property, new BarChartDeserializer(this.path));
			case "lineChart":
				return this.deserializeRequired(dto.lineChart, property, new LineChartDeserializer(this.path));
			case "pieChart":
				return this.deserializeRequired(dto.pieChart, property, new PieChartDeserializer(this.path));
			case "boundingBox":
				return this.deserializeRequired(dto.boundingBox, property, new BoundingBoxDeserializer(this.path));
			case "override":
				return this.deserializeRequired(dto.override, property, new OverrideDeserializer(this.path));
			case "area":
				return this.deserializeRequired(dto.area, property, new AreaDeserializer(this.path));
			case "switch":
				return this.deserializeRequired(dto.switch, property, new SwitchDeserializer(this.path));
			case "borderProperties":
				return this.deserializeRequired(
					dto.borderProperties,
					property,
					new BorderPropertiesDeserializer(this.path)
				);
			case "textProperties": {
				return this.deserializeOptional(
					dto.textProperties,
					new TextPropertiesDeserializer(this.path),
					property
				);
			}
		}
		this.unknownProperty(property);
	}
}
