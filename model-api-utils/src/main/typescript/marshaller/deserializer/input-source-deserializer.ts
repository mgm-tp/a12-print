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
import {
	InputSourceDTO,
	MeasureInputSourceDTO,
} from "@com.mgmtp.a12.print/print-model-api/lib/generated/internal/dto/PrintModelDTO.js";
import { InputSource, MeasureInputSource } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { Deserializer } from "./deserializer.js";

export class InputSourceDeserializer<T> extends Deserializer<InputSourceDTO<T>, InputSource<T>> {
	prefix = "inputSource";
	valueGetter = (value: T) => value;

	map(property: keyof InputSourceDTO<T>, dto: InputSourceDTO<T>) {
		switch (property) {
			case "id":
				return this.getRequired(dto.id, property);
			case "source":
				return this.getRequired(dto.source, property);
			case "path":
				return this.getRequired(dto.path, property);
			case "reference":
				return dto.reference;
			case "value":
				return this.getOptional(dto.value, this.valueGetter);
		}
		this.unknownProperty(property);
	}

	setValueGetter(getter: (value: T) => T) {
		this.valueGetter = getter;
	}
}

export class MeasureInputSourceDeserializer extends Deserializer<MeasureInputSourceDTO, MeasureInputSource> {
	prefix = "measureInputSource";

	map(property: keyof MeasureInputSourceDTO, dto: MeasureInputSourceDTO) {
		switch (property) {
			case "id":
				return this.getRequired(dto.id, property);
			case "source":
				return this.getRequired(dto.source, property);
			case "path":
				return this.getRequired(dto.path, property);
			case "value":
				return dto.value;
			case "unit":
				return dto.unit;
		}

		this.unknownProperty(property);
	}
}
