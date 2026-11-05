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
import type { PartialText } from "@com.mgmtp.a12.print/print-model-api/model";
import { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";
import type * as GeneratedDTO from "@com.mgmtp.a12.print/print-model-api/generated/a12internal";

import { ElementDefinitionSerializer } from "../serializer/element-definition-serializer.js";
import { ElementDefinitionDeserializer } from "../deserializer/element-deserializer.js";

function makeTextElement(isFragment?: boolean): PartialText {
	return {
		id: "test-text-id",
		type: ElementType.Text,
		name: "myTextElement",
		...(isFragment === undefined ? {} : { isFragment }),
		text: { id: "text-content-id", text: "Hello", entities: [] },
	};
}

function makeTextDTO(isFragment?: boolean): GeneratedDTO.ElementDefinitionsDTO {
	return {
		id: "test-text-id",
		type: "Text",
		name: "myTextElement",
		...(isFragment === undefined ? {} : { isFragment }),
		text: { id: "text-content-id", text: "Hello", entities: [] },
	};
}

describe("isFragment serialization", () => {
	const serializer = new ElementDefinitionSerializer();

	it("serializes isFragment: true", () => {
		const result = serializer.serialize(makeTextElement(true), []);
		expect(result.result?.isFragment).toBe(true);
	});

	it("serializes isFragment: false", () => {
		const result = serializer.serialize(makeTextElement(false), []);
		expect(result.result?.isFragment).toBeUndefined();
	});

	it("omits isFragment when absent", () => {
		const result = serializer.serialize(makeTextElement(), []);
		expect(result.result?.isFragment).toBeUndefined();
	});
});

describe("isFragment deserialization", () => {
	const deserializer = new ElementDefinitionDeserializer([], 0, false);

	it("deserializes isFragment: true", () => {
		const result = deserializer.deserialize(makeTextDTO(true));
		expect(result.result?.isFragment).toBe(true);
	});

	it("deserializes isFragment: false", () => {
		const result = deserializer.deserialize(makeTextDTO(false));
		expect(result.result?.isFragment).toBe(false);
	});

	it("deserializes to undefined when isFragment is absent", () => {
		const result = deserializer.deserialize(makeTextDTO());
		expect(result.result?.isFragment).toBeUndefined();
	});
});
