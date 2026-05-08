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
import { MeasureInputSourceDeserializer } from "./input-source-deserializer.js";

export class TableLayoutDeserializer extends Deserializer<GeneratedDTO.TableLayoutDTO, ModelAPI.TableLayoutProperties> {
	prefix = "tableLayout";
	elementBase = {
		cells: [],
	};

	map(property: keyof GeneratedDTO.TableLayoutDTO, dto: GeneratedDTO.TableLayoutDTO) {
		switch (property) {
			case "id":
				return this.getRequired(dto.id, property);
			case "columnCount":
				return this.getRequired(dto.columnCount, property);
			case "rowCount":
				return this.getRequired(dto.rowCount, property);
			case "columnProperties":
				return this.deserializeRepeatable(
					dto.columnProperties,
					index => new ColumnPropertyDeserializer(this.path, index, true),
					property
				);
			case "rowProperties":
				return this.deserializeRepeatable(
					dto.rowProperties,
					index => new RowPropertyDeserializer(this.path, index, true),
					property
				);
			case "cells":
				return this.deserializeRepeatable(
					dto.cells,
					index => new CellDeserializer(this.path, index, true),
					property
				);
		}
		this.unknownProperty(property);
	}
}

class ColumnPropertyDeserializer extends Deserializer<GeneratedDTO.ColumnPropertiesDTO, ModelAPI.ColumnProperties> {
	prefix = "columnProperties";

	map(property: keyof GeneratedDTO.ColumnPropertiesDTO, dto: GeneratedDTO.ColumnPropertiesDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "index":
				return dto.index;
			case "verticalAlignment":
				return this.getOptional(dto.verticalAlignment, value => ModelAPI.VerticalAlignment[value]);
			case "width": {
				return this.deserializeRequired(dto.width, property, new MeasureInputSourceDeserializer(this.path));
			}
		}
		this.unknownProperty(property);
	}
}

class RowPropertyDeserializer extends Deserializer<GeneratedDTO.RowPropertiesDTO, ModelAPI.RowProperties> {
	prefix = "rowProperties";

	map(property: keyof GeneratedDTO.RowPropertiesDTO, dto: GeneratedDTO.RowPropertiesDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "index":
				return dto.index;
			case "minHeight": {
				return this.deserializeRequired(dto.minHeight, property, new MeasureInputSourceDeserializer(this.path));
			}
		}
		this.unknownProperty(property);
	}
}

class CellDeserializer extends Deserializer<GeneratedDTO.CellsDTO, ModelAPI.TableLayoutCellReference> {
	prefix = "cells";

	map(property: keyof GeneratedDTO.CellsDTO, dto: GeneratedDTO.CellsDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "column":
				return dto.column;
			case "row":
				return dto.row;
			case "refId":
				return dto.refId;
		}
		this.unknownProperty(property);
	}
}
