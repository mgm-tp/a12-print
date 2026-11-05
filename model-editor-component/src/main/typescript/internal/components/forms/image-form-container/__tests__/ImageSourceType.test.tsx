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
import { fireEvent, waitFor } from "@testing-library/react";

import { SidebarItem, TransactionLog } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { PartialImage, PartialValidPlaceableReference, Segment } from "@com.mgmtp.a12.print/print-model-api/model";
import { ElementType, ImageSrcType } from "@com.mgmtp.a12.print/print-model-api/model";

import {
	createNavigationStateWithForm,
	createTransactionLogState,
	defaultPrintEditorState,
	initialStateLogStoreMock,
	mockSegment,
	renderWithProviders,
} from "../../../../../../../test/typescript/test-utils/index.js";
import type { PrintEngineState } from "../../../../../a12internal/api/PrintEngineState.js";
import { initialStateLogStore } from "../../../../redux/index.js";
import { PrintEngineSelectors } from "../../../../store/selectors.js";
import { DEFAULT_ELEMENT_WIDTH, DEFAULT_IMAGE_HEIGHT } from "../../../../utils/elements-utils.js";
import { createMmMeasure } from "../../../../utils/measure-utils.js";

import { ImageSourceType } from "../ImageSourceType.js";

const IMAGE_ID = "imageId1";

function createImage(options: { isFragment: boolean; width?: number; height?: number }): PartialImage {
	return {
		id: IMAGE_ID,
		type: ElementType.Image,
		name: "image_abc12",
		image: {
			id: "imageProps",
			imageSrcType: ImageSrcType.Static,
			resourceSource: { id: "resourceSource", resourceName: "large.png" },
			dimensions: {
				id: "imageDimensions",
				originalWidth: createMmMeasure(150),
				originalHeight: createMmMeasure(80),
				...(options.width !== undefined && { width: createMmMeasure(options.width) }),
				...(options.height !== undefined && { height: createMmMeasure(options.height) }),
			},
		},
		...(options.isFragment && {
			isFragment: true,
			fragmentDimensions: {
				id: "fragmentDimensions",
				width: createMmMeasure(150),
				height: createMmMeasure(80),
			},
		}),
	};
}

const imageReference: PartialValidPlaceableReference = {
	id: "imageReferenceId1",
	refId: IMAGE_ID,
	position: { id: "imageReferencePosition", x: createMmMeasure(0), y: createMmMeasure(0) },
	dimensions: { id: "imageReferenceDimensions", minWidth: createMmMeasure(150), minHeight: createMmMeasure(80) },
};

const segmentWithImage: Segment = { ...mockSegment, elementReferences: [imageReference] } as Segment;

const setupTest = (element: PartialImage) =>
	renderWithProviders(<ImageSourceType element={element} />, {
		PrintEditorState: () => defaultPrintEditorState,
		Navigation: () =>
			createNavigationStateWithForm(SidebarItem.SEGMENT, mockSegment.id, [
				{ type: ElementType.Image, id: IMAGE_ID },
			]),
		TransactionLogState: createTransactionLogState({
			...initialStateLogStoreMock,
			segments: {
				...initialStateLogStoreMock.segments,
				map: {
					...initialStateLogStoreMock.segments.map,
					[mockSegment.id]: TransactionLog.createStoreEntrySegment(
						initialStateLogStore.segments,
						segmentWithImage,
						"test-interaction"
					).storeEntry,
				},
			},
			printModelElements: {
				[element.id]: TransactionLog.createStoreEntryPrintModelElement(
					initialStateLogStore.printModelElements,
					element,
					"test-interaction"
				).storeEntry,
			},
		}),
	});

const getState = (store: ReturnType<typeof setupTest>["store"]) => store.getState() as unknown as PrintEngineState;

const getStoredImage = (store: ReturnType<typeof setupTest>["store"]) =>
	PrintEngineSelectors.multiplePrintModelElements(getState(store), [IMAGE_ID])[0] as PartialImage;

const getStoredImageReference = (store: ReturnType<typeof setupTest>["store"]) =>
	PrintEngineSelectors.elementReferences(getState(store)).find(ref => ref.refId === IMAGE_ID);

describe("ImageSourceType", () => {
	it("resets fragmentDimensions to the defaults when switching the source type of a fragment image without fixed dimensions", async () => {
		const { store, getByTestId } = setupTest(createImage({ isFragment: true }));

		fireEvent.click(getByTestId("image-src-type-dynamic"));

		await waitFor(() => {
			const image = getStoredImage(store);
			expect(image.image?.imageSrcType).toEqual(ImageSrcType.Dynamic);
			expect(image.fragmentDimensions?.width.value).toEqual(DEFAULT_ELEMENT_WIDTH);
			expect(image.fragmentDimensions?.height.value).toEqual(DEFAULT_IMAGE_HEIGHT);
			expect(image.fragmentDimensions?.id).toEqual("fragmentDimensions");
		});
	});

	it("keeps a fixed width when resetting fragmentDimensions of a fragment image", async () => {
		const { store, getByTestId } = setupTest(createImage({ isFragment: true, width: 25 }));

		fireEvent.click(getByTestId("image-src-type-dynamic"));

		await waitFor(() => {
			const image = getStoredImage(store);
			expect(image.image?.imageSrcType).toEqual(ImageSrcType.Dynamic);
			expect(image.fragmentDimensions?.width.value).toEqual(25);
			expect(image.fragmentDimensions?.height.value).toEqual(DEFAULT_IMAGE_HEIGHT);
		});
	});

	it("keeps fragmentDimensions when the fragment image has fixed width and height", async () => {
		const { store, getByTestId } = setupTest(createImage({ isFragment: true, width: 150, height: 80 }));

		fireEvent.click(getByTestId("image-src-type-dynamic"));

		await waitFor(() => {
			const image = getStoredImage(store);
			expect(image.image?.imageSrcType).toEqual(ImageSrcType.Dynamic);
			expect(image.fragmentDimensions?.width.value).toEqual(150);
			expect(image.fragmentDimensions?.height.value).toEqual(80);
		});
	});

	it("does not add fragmentDimensions to non-fragment images", async () => {
		const { store, getByTestId } = setupTest(createImage({ isFragment: false }));

		fireEvent.click(getByTestId("image-src-type-dynamic"));

		await waitFor(() => {
			const image = getStoredImage(store);
			expect(image.image?.imageSrcType).toEqual(ImageSrcType.Dynamic);
			expect(image.fragmentDimensions).toBeUndefined();
		});
	});

	it("resets the placement dimensions to the defaults for images without fixed dimensions", async () => {
		const { store, getByTestId } = setupTest(createImage({ isFragment: false }));
		expect(getStoredImageReference(store)?.dimensions.minWidth.value).toEqual(150);

		fireEvent.click(getByTestId("image-src-type-dynamic"));

		await waitFor(() => {
			const reference = getStoredImageReference(store);
			expect(reference?.dimensions.minWidth.value).toEqual(DEFAULT_ELEMENT_WIDTH);
			expect(reference?.dimensions.minHeight.value).toEqual(DEFAULT_IMAGE_HEIGHT);
			expect(reference?.dimensions.minWidth.id).toEqual(imageReference.dimensions.minWidth.id);
		});
	});

	it("keeps the placement dimensions for images with fixed width and height", async () => {
		const { store, getByTestId } = setupTest(createImage({ isFragment: false, width: 150, height: 80 }));

		fireEvent.click(getByTestId("image-src-type-dynamic"));

		await waitFor(() => expect(getStoredImage(store).image?.imageSrcType).toEqual(ImageSrcType.Dynamic));
		const reference = getStoredImageReference(store);
		expect(reference?.dimensions.minWidth.value).toEqual(150);
		expect(reference?.dimensions.minHeight.value).toEqual(80);
	});

	it.each([{ isFragment: false }, { isFragment: true }])(
		"clears the static resource and original dimensions when switching to dynamic (isFragment: $isFragment)",
		async ({ isFragment }) => {
			const { store, getByTestId } = setupTest(createImage({ isFragment }));

			fireEvent.click(getByTestId("image-src-type-dynamic"));

			await waitFor(() => {
				const image = getStoredImage(store);
				expect(image.image?.imageSrcType).toEqual(ImageSrcType.Dynamic);
				expect(image.image?.resourceSource).toBeUndefined();
				expect(image.image?.dimensions?.originalWidth).toBeUndefined();
				expect(image.image?.dimensions?.originalHeight).toBeUndefined();
			});
		}
	);
});
