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
import { ImageSrcType, type PartialImage } from "@com.mgmtp.a12.print/print-model-api/model";

import { RequestApiActions } from "../../../redux/index.js";
import { createMmMeasure, createMmMeasureFromPx } from "../../../utils/measure-utils.js";

import { handleSelectResource } from "../select-resource-saga.js";

const ELEMENT_ID = "image-1";
const RESOURCE_NAME = "small.png";
const NATURAL_WIDTH = 50;
const NATURAL_HEIGHT = 20;

function createImage(options: { isFragment: boolean; width?: number }): PartialImage {
	return {
		id: ELEMENT_ID,
		type: "Image",
		image: {
			id: "img",
			imageSrcType: ImageSrcType.Static,
			dimensions: {
				id: "dim",
				...(options.width !== undefined && { width: createMmMeasure(options.width) }),
			},
		},
		...(options.isFragment && {
			isFragment: true,
			fragmentDimensions: { id: "fd", width: createMmMeasure(40), height: createMmMeasure(40) },
		}),
	} as unknown as PartialImage;
}

function runSaga(element: PartialImage, elementReferences: unknown[] = []) {
	const gen = handleSelectResource(
		RequestApiActions.selectResource({ elementId: ELEMENT_ID, resourceName: RESOURCE_NAME })
	);

	gen.next(); // select resource
	gen.next({ name: RESOURCE_NAME, content: "data:image/png;base64," }); // cached resource → load dimensions
	gen.next({ naturalWidth: NATURAL_WIDTH, naturalHeight: NATURAL_HEIGHT }); // dimensions → select element
	gen.next([element]); // element → select elementReferences
	const putStep = gen.next(elementReferences); // → put(InteractionLogActions.start)

	expect(putStep.value).toMatchObject({ type: "PUT" });
	const transactionLogActions = (putStep.value as { payload: { action: { payload: unknown } } }).payload.action
		.payload as { transactionLogActions: { payload: { data: PartialImage[] } }[] };
	return transactionLogActions.transactionLogActions[0].payload.data[0];
}

describe("handleSelectResource", () => {
	it("updates fragmentDimensions to the original image size for fragment images without fixed width", () => {
		const updated = runSaga(createImage({ isFragment: true }));

		expect(updated.fragmentDimensions?.width.value).toEqual(createMmMeasureFromPx(NATURAL_WIDTH).value);
		expect(updated.fragmentDimensions?.height.value).toEqual(createMmMeasureFromPx(NATURAL_HEIGHT).value);
		expect(updated.fragmentDimensions?.id).toEqual("fd");
	});

	it("keeps the fixed width and scales the height for fragment images with fixed width", () => {
		const updated = runSaga(createImage({ isFragment: true, width: 100 }));
		const aspectRatio = createMmMeasureFromPx(NATURAL_WIDTH).value / createMmMeasureFromPx(NATURAL_HEIGHT).value;

		expect(updated.fragmentDimensions?.width.value).toEqual(100);
		expect(updated.fragmentDimensions?.height.value).toEqual(Math.round(100 / aspectRatio));
	});

	it("does not add fragmentDimensions to non-fragment images", () => {
		const updated = runSaga(createImage({ isFragment: false }));

		expect(updated.fragmentDimensions).toBeUndefined();
	});
});
