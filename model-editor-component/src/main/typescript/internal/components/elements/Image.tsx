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
import { ImageSrcType, PartialImage } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";

import { ImageAttachment, ImageField, ImageInitialized } from "./Image.styled.js";
import { BaseElementProps } from "./base.js";

export type ImageProps = BaseElementProps;

export const Image = ({ element, styles }: ImageProps) => {
	const localizer = PrintLocalizer.useLocalizer();

	if (!PartialImage.isInstance(element)) {
		throw Error(`Expected element of type Image but got ${element.type}`);
	}
	const image = element.image;
	const type = image?.imageSrcType;
	if (type === ImageSrcType.Attachment && image?.attachmentSource?.imageAttachment?.content) {
		return (
			<ImageAttachment
				alt={image.alternativeText}
				src={image.attachmentSource.imageAttachment.content}
				style={styles}
			/>
		);
	}

	if (type === ImageSrcType.Field && image?.fieldSource) {
		return <ImageField style={styles}>{image.fieldSource.path}</ImageField>;
	}

	return <ImageInitialized style={styles}>{localizer(RESOURCE_KEYS.editor.element.Image)}</ImageInitialized>;
};
