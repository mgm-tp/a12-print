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
import { MeasureDeserializer } from "./measure-deserializer.js";
import { InputSourceDeserializer } from "./input-source-deserializer.js";

export class BarChartDeserializer extends Deserializer<GeneratedDTO.BarChartDTO, ModelAPI.BarChartProperties> {
	prefix = "barChart";

	map(property: keyof GeneratedDTO.BarChartDTO, dto: GeneratedDTO.BarChartDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "model":
				return this.getRequired(dto.model, property);
			case "basePath":
				return this.getRequired(dto.basePath, property);
			case "labelX":
				return this.deserializeRequired(dto.labelX, property, new InputSourceDeserializer<string>(this.path));
			case "labelY":
				return this.deserializeRequired(dto.labelY, property, new InputSourceDeserializer<string>(this.path));
			case "title":
				return this.deserializeRequired(dto.title, property, new InputSourceDeserializer<string>(this.path));
			case "orientation":
				return ModelAPI.ChartOrientation[this.getRequired(dto.orientation, property)];
			case "data":
				return this.deserializeRepeatable(
					dto.data,
					index => new BarChartDataDeserializer(this.path, index, true),
					property
				);
			case "dimensions":
				return this.deserializeRequired(dto.dimensions, property, new ChartDimensionsDeserializer(this.path));
		}
		this.unknownProperty(property);
	}
}

export class LineChartDeserializer extends Deserializer<GeneratedDTO.LineChartDTO, ModelAPI.LineChartProperties> {
	prefix = "lineChart";

	map(property: keyof GeneratedDTO.LineChartDTO, dto: GeneratedDTO.LineChartDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "model":
				return this.getRequired(dto.model, property);
			case "basePath":
				return this.getRequired(dto.basePath, property);
			case "labelX":
				return this.deserializeRequired(dto.labelX, property, new InputSourceDeserializer<string>(this.path));
			case "labelY":
				return this.deserializeRequired(dto.labelY, property, new InputSourceDeserializer<string>(this.path));
			case "title":
				return this.deserializeRequired(dto.title, property, new InputSourceDeserializer<string>(this.path));
			case "orientation":
				return ModelAPI.ChartOrientation[this.getRequired(dto.orientation, property)];
			case "data":
				return this.deserializeRepeatable(
					dto.data,
					index => new LineChartDataDeserializer(this.path, index, true),
					property
				);
			case "dimensions":
				return this.deserializeRequired(dto.dimensions, property, new ChartDimensionsDeserializer(this.path));
		}
		this.unknownProperty(property);
	}
}

export class PieChartDeserializer extends Deserializer<GeneratedDTO.PieChartDTO, ModelAPI.PieChartProperties> {
	prefix = "lineChart";

	map(property: keyof GeneratedDTO.PieChartDTO, dto: GeneratedDTO.PieChartDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "model":
				return this.getRequired(dto.model, property);
			case "basePath":
				return this.getRequired(dto.basePath, property);
			case "title": {
				return this.deserializeRequired(dto.title, property, new InputSourceDeserializer<string>(this.path));
			}
			case "data":
				return this.deserializeOptional(dto.data, new PieChartDataDeserializer(this.path), property);
			case "dimensions":
				return this.deserializeRequired(dto.dimensions, property, new ChartDimensionsDeserializer(this.path));
		}
		this.unknownProperty(property);
	}
}

class LineChartDataDeserializer extends Deserializer<GeneratedDTO.DataDTO_1, ModelAPI.LineChartData> {
	prefix = "data";

	map(property: keyof GeneratedDTO.DataDTO_1, dto: GeneratedDTO.DataDTO_1) {
		switch (property) {
			case "id":
				return dto.id;
			case "valueField":
				return dto.valueField;
			case "color":
				return dto.color;
			case "labelIsNumeration":
				return dto.labelIsNumeration;
			case "seriesName":
				return dto.seriesName;
		}
		this.unknownProperty(property);
	}
}

class PieChartDataDeserializer extends Deserializer<GeneratedDTO.DataDTO_2, ModelAPI.PieChartData> {
	prefix = "data";

	map(property: keyof GeneratedDTO.DataDTO_2, dto: GeneratedDTO.DataDTO_2) {
		switch (property) {
			case "id":
				return dto.id;
			case "valueField":
				return dto.valueField;
			case "keyField":
				return dto.keyField;
			case "labelIsNumeration":
				return dto.labelIsNumeration;
		}
		this.unknownProperty(property);
	}
}

class BarChartDataDeserializer extends Deserializer<GeneratedDTO.DataDTO, ModelAPI.BarChartData> {
	prefix = "data";

	map(property: keyof GeneratedDTO.DataDTO, dto: GeneratedDTO.DataDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "valueField":
				return dto.valueField;
			case "keyField":
				return dto.keyField;
			case "color":
				return dto.color;
			case "labelIsNumeration":
				return dto.labelIsNumeration;
			case "seriesName":
				return dto.seriesName;
		}
		this.unknownProperty(property);
	}
}

class ChartDimensionsDeserializer extends Deserializer<GeneratedDTO.DimensionsDTO_2, ModelAPI.ChartDimensions> {
	prefix = "dimensions";

	map(property: keyof GeneratedDTO.DimensionsDTO_2, dto: GeneratedDTO.DimensionsDTO_2) {
		switch (property) {
			case "id":
				return this.getRequired(dto.id, property);
			case "height":
				return this.deserializeRequired(dto.height, property, new MeasureDeserializer(this.path));
			case "width":
				return this.deserializeRequired(dto.width, property, new MeasureDeserializer(this.path));
		}
		this.unknownProperty(property);
	}
}
