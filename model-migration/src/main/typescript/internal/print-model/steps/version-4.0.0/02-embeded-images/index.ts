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
import { nanoid } from "nanoid";

import type { Logger, MigrationStepContext } from "@com.mgmtp.a12.migrationtool/migrationtool-core/types";

import type * as OldModel from "../01_border-properties-input-source/print-model.js";

import type * as NewModel from "./print-model.js";

export function transformEmbededImages(
	oldModel: OldModel.PrintModelDTO,
	logger: Logger,
	context?: MigrationStepContext
): NewModel.PrintModelDTO {
	const transformedElementDefinitions = oldModel.content.elementDefinitions?.map(element =>
		transformElementDefinition(element, logger, context)
	);
	return {
		...oldModel,
		content: {
			...oldModel.content,
			elementDefinitions: transformedElementDefinitions,
		},
	};
}

function transformElementDefinition(
	element: OldModel.ElementDefinitionsDTO,
	logger: Logger,
	context?: MigrationStepContext
): NewModel.ElementDefinitionsDTO {
	if (element.type !== "Image") {
		return element as NewModel.ElementDefinitionsDTO;
	}

	const imageProperties = element.image;
	if (!imageProperties) {
		throw new Error("Invalid Model: 'image' properties not defined");
	}
	const { id, imageSrcType, attachmentSource, fieldSource, ...restImageProperties } = imageProperties;

	// Dynamic Image
	if (imageSrcType === "Field") {
		return {
			id: element.id,
			type: element.type,
			image: {
				id,
				imageSrcType: "Dynamic",
				...restImageProperties,
				fieldSource,
			},
		};
	}
	// Static Image
	if (imageSrcType === "Attachment") {
		const imageAttachment = attachmentSource?.imageAttachment;

		// no data set
		if (!imageAttachment?.content) {
			return {
				id: element.id,
				type: element.type,
				image: {
					id,
					imageSrcType: "Static",
					...restImageProperties,
					resourceSource: {},
				},
			};
		}

		// no workspace context
		if (!context?.workspace) {
			throw new Error(
				"This migration step extracts embedded images into workspace resources but no workspace was provided.\n" +
					"  CLI: pass --resources <dir> to specify the resource output directory.\n" +
					"  API: provide a Workspace object to PrintMigrationTool.migrate(models, workspace) (see Workspace in migrationtool-core/types)."
			);
		}

		const imageData = decodeBase64DataUri(imageAttachment.content);
		const originalName = ensureFileExtension(
			imageAttachment.original_filename ?? "image",
			imageAttachment.mime_type,
			imageAttachment.content
		);

		const sideResult = context.addResource({ content: imageData, originalName });
		logger.info(`Extracted embedded image "${originalName}" to workspace resource "${sideResult.path}"`);

		return {
			id: element.id,
			type: element.type,
			image: {
				id,
				imageSrcType: "Static",
				...restImageProperties,
				resourceSource: {
					id: attachmentSource?.id || nanoid(),
					resourceName: sideResult.path,
				},
			},
		};
	}

	// no img src type
	throw new Error("Invalid Model: 'imgSrcType' not defined");
}

function decodeBase64DataUri(dataUri: string): Uint8Array {
	const base64 = dataUri.includes(",") ? dataUri.split(",")[1] : dataUri;
	const binaryString = atob(base64);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.codePointAt(i) ?? 0;
	}
	return bytes;
}

const mimeToExtension: Record<string, string> = {
	"image/jpeg": ".jpg",
	"image/png": ".png",
	"image/gif": ".gif",
	"image/bmp": ".bmp",
};

function ensureFileExtension(filename: string, mimeType: string | undefined, dataUri: string): string {
	if (filename.includes(".")) {
		return filename;
	}

	// Try to extract extension from mime_type field
	const ext = mimeToExtension[mimeType ?? ""];
	if (ext) {
		return filename + ext;
	}

	// Try to extract mime type from data URI (e.g. "data:image/jpeg;base64,...")
	const dataUriMatch = new RegExp(/^data:([^;,]+)/).exec(dataUri);
	if (dataUriMatch) {
		const dataUriExt = mimeToExtension[dataUriMatch[1]];
		if (dataUriExt) {
			return filename + dataUriExt;
		}
	}

	return filename;
}
