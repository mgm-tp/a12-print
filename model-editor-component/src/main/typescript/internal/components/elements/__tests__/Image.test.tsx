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
	ElementType,
	PartialAnyPrintModelElement,
	PartialPlaceableReference,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { ImageSrcType } from "@com.mgmtp.a12.print/print-model-api/lib/model/elements/type/index.js";

import { renderWithProviders, expectToThrow } from "../../../../../../test/typescript/test-utils/index.js";

import { Image, ImageProps } from "../Image.js";

describe("Image", () => {
	const defaultImageProps = {
		element: { id: "image-id", type: ElementType.Image } as PartialAnyPrintModelElement,
		styles: {} as React.CSSProperties,
		reference: { refId: "image-id" } as PartialPlaceableReference,
	};

	const setupTest = (imageProps?: Partial<ImageProps>) =>
		renderWithProviders(<Image {...defaultImageProps} {...imageProps} />);

	it("should throw error when element prop is not image", () => {
		const nonImageElement = {
			...defaultImageProps,
			element: { id: "non-image-id", type: ElementType.Text } as PartialAnyPrintModelElement,
		};

		expectToThrow(
			() => renderWithProviders(<Image {...nonImageElement} />),
			new Error(`Expected element of type Image but got ${ElementType.Text}`)
		);
	});

	it("should render ImageAttachment if its source type is attachment", () => {
		const { queryByAltText, getByAltText } = setupTest({
			element: {
				...defaultImageProps.element,
				image: {
					imageSrcType: ImageSrcType.Attachment,
					attachmentSource: { imageAttachment: { content: "image-content" } },
					alternativeText: "image-alt-text",
				},
			} as PartialAnyPrintModelElement,
		});

		expect(queryByAltText("image-alt-text")).toBeInTheDocument();
		expect(getByAltText("image-alt-text")).toHaveAttribute("src", "image-content");
	});

	it("should render ImageField if its source type is field", () => {
		const { queryByText } = setupTest({
			element: {
				...defaultImageProps.element,
				image: {
					imageSrcType: ImageSrcType.Field,
					fieldSource: {
						path: "/field/source",
					},
				},
			} as PartialAnyPrintModelElement,
		});

		expect(queryByText("/field/source")).toBeInTheDocument();
	});

	it("should render ImageInitialized when its source type is not set", () => {
		const { queryByText } = setupTest();

		expect(queryByText("Image")).toBeInTheDocument();
	});
});
