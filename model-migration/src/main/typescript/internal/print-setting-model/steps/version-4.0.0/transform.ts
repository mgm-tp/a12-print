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
import type { Logger, MigrationStepContext } from "@com.mgmtp.a12.migrationtool/migrationtool-core/types";

import type * as OldModel from "../version-3.0.0/print-setting-model.js";

import type * as NewModel from "./print-setting-model.js";

export default function transform(
	oldModel: OldModel.PrintSettingModelDTO,
	logger: Logger,
	context?: MigrationStepContext
): NewModel.PrintSettingModelDTO {
	if (!context?.workspace) {
		throw new Error(
			"This migration step extracts embedded fonts into workspace resources but no workspace was provided.\n" +
				"  CLI: pass --resources <dir> to specify the resource output directory.\n" +
				"  API: provide a Workspace object to PrintMigrationTool.migrate(models, workspace) (see Workspace in migrationtool-core/types)."
		);
	}

	oldModel.content?.settings?.fonts?.forEach(font => {
		if (font.type === "path") {
			migratePathFont(font, logger, context);
		}
		if (font.type === "attachment") {
			migrateAttachmentFont(font, logger, context);
		}
	});

	context.deleteCurrentModel(
		"Print Setting Models are obsolete now, since fonts are always loaded from the workspace resources now"
	);
	return oldModel;
}

function migratePathFont(font: OldModel.FontsDTO, logger: Logger, context: MigrationStepContext): void {
	if (!font.path) return;

	const resource = findResourceBySuffix(font.path, context);
	if (!resource) {
		logger.info(
			`Font "${font.path}" could not be found in workspace resources. Please add it to the resource folder manually.`
		);
		return;
	}

	const fontFileName = getNameFromPath(resource.path);
	const expectedName = sanitizeFontName(font.name) + getExtension(fontFileName);
	if (fontFileName === expectedName) return;

	const data = context.resolveResource(resource);
	if (!data) throw new Error(`Could not load font resource "${resource.path}"`);

	const sideResult = context.addResource({ content: data, originalName: fontFileName, path: expectedName });
	logger.info(`Added font resource "${font.name}" at "${sideResult.path}"`);
}

function migrateAttachmentFont(font: OldModel.FontsDTO, logger: Logger, context: MigrationStepContext): void {
	const fontAttachment = font.fontAttachment;
	if (!fontAttachment?.content) return;

	const fontData = decodeBase64DataUri(fontAttachment.content);
	const originalName = ensureFileExtension(
		fontAttachment.original_filename ?? "font",
		fontAttachment.mime_type,
		fontAttachment.content
	);
	const savePath = sanitizeFontName(font.name) + getExtension(originalName);
	const sideResult = context.addResource({ content: fontData, originalName, path: savePath });
	logger.info(`Extracted embedded font "${font.name}" to workspace resource "${sideResult.path}"`);
}

function findResourceBySuffix(path: string, context: MigrationStepContext) {
	const parts = stripPathPrefix(path).split("/");
	for (let i = 0; i < parts.length; i++) {
		const candidate = parts.slice(i).join("/");
		const resource = context.findResource(candidate);
		if (resource) return resource;
	}
	return undefined;
}

function stripPathPrefix(path: string): string {
	// Normalizes "./foo/bar" and "/foo/bar" to "foo/bar" so path suffix matching works uniformly
	return path.replace(/^(\.\/|\/)/, "");
}

function sanitizeFontName(name: string): string {
	// Strips characters not allowed in SME workspace resource names (letters, digits, hyphens, underscores, periods)
	return name.replace(/[^a-zA-Z0-9\-_.]/g, "");
}

function getNameFromPath(path: string): string {
	return path.split("/").pop() ?? path;
}

function getExtension(filename: string): string {
	const dot = filename.lastIndexOf(".");
	return dot >= 0 ? filename.slice(dot) : "";
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
	"font/ttf": ".ttf",
	"font/otf": ".otf",
	"font/woff": ".woff",
	"font/woff2": ".woff2",
	"application/x-font-ttf": ".ttf",
	"application/x-font-otf": ".otf",
	"application/font-woff": ".woff",
	"application/font-woff2": ".woff2",
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
