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
import type { PartialAnyPrintModelElement } from "../../partial.js";

import type { Attachment, Measure, PrintModelEntity, Styleable } from "../base.js";
import { isMeasure } from "../base.js";
import type { PrintModelElement } from "../print-model-element.js";
import { ElementType } from "../print-model-element.js";

export interface Image extends PrintModelElement, Styleable {
	readonly type: ElementType.Image;
	readonly image: ImageProperties;
}

export interface ImageProperties extends PrintModelEntity {
	readonly imageSrcType: ImageSrcType;
	readonly alternativeText: string;
	readonly dimensions?: ImageDimensions;
	readonly attachmentSource?: AttachmentSource;
	readonly fieldSource?: FieldSource;
}

export enum ImageSrcType {
	Attachment = "Attachment",
	Field = "Field",
}

export interface ImageDimensions extends PrintModelEntity {
	readonly height?: Measure;
	readonly width?: Measure;
	readonly originalHeight?: Measure;
	readonly originalWidth?: Measure;
}

export interface AttachmentSource extends PrintModelEntity {
	readonly imageAttachment: Attachment;
}

export interface FieldSource extends PrintModelEntity {
	readonly model: string;
	readonly path: string;
}

export namespace Image {
	export function isInstance(element: PartialAnyPrintModelElement): element is Image {
		return (
			element.type === ElementType.Image &&
			typeof element.image?.alternativeText === "string" &&
			Object.values(ImageSrcType).includes(element.image.imageSrcType as ImageSrcType) &&
			(isMeasure(element.image.dimensions?.width) || isMeasure(element.image.dimensions?.originalWidth))
		);
	}
}
