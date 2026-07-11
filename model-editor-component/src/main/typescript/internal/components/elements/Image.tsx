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
import * as React from "react";
import { useDispatch, useSelector } from "react-redux";

import { ImageSrcType, PartialImage } from "@com.mgmtp.a12.print/print-model-api/model";
import { Icon } from "@com.mgmtp.a12.widgets/widgets-core";

import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import { RequestApiActions } from "../../redux/index.js";
import { RequestApiSelectors } from "../../redux/request-api/selectors.js";
import { EditorConst } from "../../constant/editor.js";

import { ImageAttachment, ImagePlaceholderAttachment, ImageField, ImageInitialized } from "./Image.styled.js";
import type { BaseElementProps } from "./base.js";

export type ImageProps = BaseElementProps;

const { MM_TO_PX } = EditorConst;

export const Image = ({ element, styles }: ImageProps) => {
	const localizer = PrintLocalizer.useLocalizer();
	const dispatch = useDispatch();

	if (!PartialImage.isInstance(element)) {
		throw new Error(`Expected element of type Image but got ${element.type}`);
	}
	const image = element.image;
	const type = image?.imageSrcType;

	const resourceName = image?.resourceSource?.resourceName ?? "";
	const imageStaticImageData = useSelector((state: PrintEngineState) =>
		RequestApiSelectors.resourceByName(state, resourceName)
	);

	React.useEffect(() => {
		if (resourceName) {
			dispatch(RequestApiActions.loadStaticImage(resourceName));
		}
	}, [dispatch, resourceName]);

	const imageStyle = React.useMemo<React.CSSProperties>(() => {
		const dims = image?.dimensions;
		const widthMm = dims?.width?.value ?? dims?.originalWidth?.value;
		const heightMm =
			dims?.height?.value ??
			(dims?.width?.value && dims?.originalWidth?.value && dims?.originalHeight?.value
				? Math.round(dims.width.value * (dims.originalHeight.value / dims.originalWidth.value))
				: dims?.originalHeight?.value);
		return {
			width: widthMm === undefined ? undefined : MM_TO_PX(widthMm),
			height: heightMm === undefined ? undefined : MM_TO_PX(heightMm),
		};
	}, [image?.dimensions]);

	if (type === ImageSrcType.Static && image?.resourceSource?.resourceName) {
		if (imageStaticImageData?.content === undefined) {
			return (
				<ImagePlaceholderAttachment data-testid="element-image" style={imageStyle}>
					<Icon style={{ fontSize: "48px" }}>image</Icon>
					{image.alternativeText}
				</ImagePlaceholderAttachment>
			);
		}
		return (
			<ImageAttachment
				data-testid="element-image"
				alt={image.alternativeText}
				src={imageStaticImageData.content}
				style={imageStyle}
			/>
		);
	}

	if (type === ImageSrcType.Dynamic && image?.fieldSource) {
		return (
			<ImageField data-testid="element-image" style={styles}>
				{image.fieldSource.path}
			</ImageField>
		);
	}

	return (
		<ImageInitialized data-testid="element-image" style={styles}>
			{localizer(RESOURCE_KEYS.editor.element.Image)}
		</ImageInitialized>
	);
};
