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
import type { PartialField } from "@com.mgmtp.a12.print/print-model-api/model";
import { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";
import type { DisplayOptionsDTO } from "@com.mgmtp.a12.print/print-model-api/generated/a12internal";

import { DisplayOptionsDeserializer } from "../deserializer/misc-deserializer.js";
import { ElementDefinitionSerializer } from "../serializer/element-definition-serializer.js";

function getPartialField(suffix?: string): PartialField {
	return {
		id: "FIELD",
		type: ElementType.Field,
		field: {
			id: "FIELD",
			displayOptions: {
				id: "DISPLAY_OPTIONS",
				suffix,
			},
		},
	};
}

describe("Suffix Serialization", () => {
	it("serialization of suffix with suffix set", () => {
		const result = new ElementDefinitionSerializer().serialize(getPartialField("SUFFIX"), []);
		expect(result.result?.field?.displayOptions?.suffix).toBe("#SUFFIX#");
	});

	it("serialization of suffix which is not defined", () => {
		const result = new ElementDefinitionSerializer().serialize(getPartialField(), []);
		expect(result.result?.field?.displayOptions?.suffix).toBe(undefined);
	});

	it("serialization of suffix with empty string", () => {
		const result = new ElementDefinitionSerializer().serialize(getPartialField(""), []);
		expect(result.result?.field?.displayOptions?.suffix).toBe("");
	});

	it("serialization of suffix with whitespace", () => {
		const result = new ElementDefinitionSerializer().serialize(getPartialField(" SUFFIX "), []);
		expect(result.result?.field?.displayOptions?.suffix).toBe("# SUFFIX #");
	});
});

function getDisplayOptionsDTO(suffix?: string): DisplayOptionsDTO {
	return {
		id: "DISPLAY_OPTIONS",
		suffix,
	};
}

describe("Suffix Deserialization", () => {
	it("deserialization of suffix with serialized suffix set", () => {
		const result = new DisplayOptionsDeserializer([]).deserialize(getDisplayOptionsDTO("#SUFFIX#"));
		expect(result.result?.suffix).toBe("SUFFIX");
	});

	it("deserialization of suffix with suffix set", () => {
		const result = new DisplayOptionsDeserializer([]).deserialize(getDisplayOptionsDTO("SUFFIX"));
		expect(result.result?.suffix).toBe("SUFFIX");
	});

	it("deserialization of suffix which is not defined", () => {
		const result = new DisplayOptionsDeserializer([]).deserialize(getDisplayOptionsDTO());
		expect(result.result?.suffix).toBe(undefined);
	});

	it("deserialization of suffix with empty string", () => {
		const result = new DisplayOptionsDeserializer([]).deserialize(getDisplayOptionsDTO(""));
		expect(result.result?.suffix).toBe("");
	});

	it("deserialization of suffix with whitespace", () => {
		const result = new DisplayOptionsDeserializer([]).deserialize(getDisplayOptionsDTO("# SUFFIX #"));
		expect(result.result?.suffix).toBe(" SUFFIX ");
	});
});
