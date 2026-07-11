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
import type { PartialImage, PartialOverride, PartialPrintModel } from "@com.mgmtp.a12.print/print-model-api/model";
import { ElementType, ImageSrcType } from "@com.mgmtp.a12.print/print-model-api/model";

import printModelForSerialization from "../../../../../test/resources/PrintModel-for-serialization.json" with { type: "json" };
import printModelWithAllElements from "../../../../../test/resources/print-models/Print-model-with-all-elements.json" with { type: "json" };
import { PrintModelMarshaller } from "../../../marshaller/index.js";

import { collectStaticImageNames } from "../print-model-image-utils.js";

const marshaller = new PrintModelMarshaller();

const modelWithStaticAndDynamicImage = marshaller.deserialize(printModelForSerialization).result;
const modelWithDynamicImageOnly = marshaller.deserialize(printModelWithAllElements).result;

if (!modelWithStaticAndDynamicImage || !modelWithDynamicImageOnly) {
	throw new Error("Test setup can not load print models");
}

describe("collectStaticImageNames", () => {
	it("returns the resourceName of each static image referenced in the model", () => {
		const names = collectStaticImageNames(modelWithStaticAndDynamicImage);
		expect(names).toEqual(["Detail 3_resized_23cb0aba.png"]);

		const uniqueNames = [...new Set(names)];
		expect(names).toEqual(uniqueNames);
	});

	it("ignores dynamic images and returns an empty array", () => {
		const names = collectStaticImageNames(modelWithDynamicImageOnly);
		expect(names).toEqual([]);
	});

	it("returns image names from DIN template override bounding boxes", () => {
		const model: PartialPrintModel = {
			header: { id: "test-model" },
			content: {
				id: "content-id",
				elementDefinitions: [
					{
						id: "override-1",
						type: ElementType.Override,
						override: {
							id: "override-props-1",
							refId: "bounding-box-1",
							overrideType: "BoundingBox",
							source: {
								id: "override-source-1",
								sourceType: "Reference",
								referenceType: "Segment",
							},
							boundingBox: {
								id: "override-bb-1",
								elementReferences: [{ id: "ref-1", refId: "image-1" }],
							},
						},
					} as PartialOverride,
					{
						id: "image-1",
						type: ElementType.Image,
						image: {
							id: "image-props-1",
							imageSrcType: ImageSrcType.Static,
							alternativeText: "",
							resourceSource: { id: "resource-1", resourceName: "override-image.png" },
						},
					} as PartialImage,
				],
			},
		};

		const names = collectStaticImageNames(model);
		expect(names).toContain("override-image.png");
	});
});
