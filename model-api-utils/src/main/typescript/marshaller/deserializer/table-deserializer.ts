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
import { TextPropertiesDeserializer } from "./misc-deserializer.js";
import { InputSourceDeserializer } from "./input-source-deserializer.js";
import { MeasureInputSourceDeserializer } from "./input-source-deserializer.js";

export class TableDeserializer extends Deserializer<GeneratedDTO.TableDTO, ModelAPI.TableProperties> {
	prefix = "table";
	elementBase = {
		columns: [],
	};

	map(property: keyof GeneratedDTO.TableDTO, dto: GeneratedDTO.TableDTO) {
		switch (property) {
			case "id":
				return this.getRequired(dto.id, property);
			case "model":
				return this.getRequired(dto.model, property);
			case "basePath":
				return this.getRequired(dto.basePath, property);
			case "filterExpression":
				return dto.filterExpression;
			case "hideHeader":
				return dto.hideHeader;
			case "maxRowCount": {
				return this.deserializeRequired(
					dto.maxRowCount,
					property,
					new InputSourceDeserializer<number>(this.path)
				);
			}
			case "sumLabel": {
				return this.deserializeRequired(dto.sumLabel, property, new InputSourceDeserializer<string>(this.path));
			}
			case "headerTextProperties": {
				return this.deserializeOptional(
					dto.headerTextProperties,
					new TextPropertiesDeserializer(this.path),
					property
				);
			}
			case "columns":
				return this.deserializeRepeatable(
					dto.columns,
					index => new TableColumnDeserializer(this.path, index, true),
					property
				);
		}
		this.unknownProperty(property);
	}
}

class TableColumnDeserializer extends Deserializer<GeneratedDTO.ColumnsDTO, ModelAPI.TableColumnReference> {
	prefix = "column";

	map(property: keyof GeneratedDTO.ColumnsDTO, dto: GeneratedDTO.ColumnsDTO) {
		switch (property) {
			case "id":
				return dto.id;
			case "refId":
				return dto.refId;
			case "label": {
				return this.deserializeRequired(dto.label, property, new InputSourceDeserializer<string>(this.path));
			}
			case "width": {
				return this.deserializeRequired(dto.width, property, new MeasureInputSourceDeserializer(this.path));
			}
			case "headerLabelHidden":
				return dto.headerLabelHidden;
			case "sumColumn":
				return dto.sumColumn;
			case "hasCustomTextProperties":
				return dto.hasCustomTextProperties;
		}
		this.unknownProperty(property);
	}
}
