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
import { SUPPORTED_FONTS } from "@com.mgmtp.a12.print/print-fonts/lib/internal/api/constant/default-fonts.js";
import { PrintError, ErrorOrigin } from "@com.mgmtp.a12.print/print-model-api/lib/errors/deep-partial-error-map.js";
import { ExtendedEntityInstancePath } from "@com.mgmtp.a12.print/print-model-api/lib/errors/extended-entity-instance-path.js";
import { Localizable } from "@com.mgmtp.a12.utils/utils-localization/lib/main/index.js";

export function getFontErrorPath(fontIndex: number) {
	const path: ExtendedEntityInstancePath = [
		{
			elementName: "content",
			index: 0,
			isRepeatable: false,
		},
		{
			elementName: "settings",
			index: 0,
			isRepeatable: false,
		},
		{
			elementName: "fonts",
			index: fontIndex + 1,
			isRepeatable: true,
		},
		{
			elementName: "path",
			index: 0,
			isRepeatable: false,
		},
	];
	return path;
}

export function createFontPathError(fontIndex: number): PrintError {
	const fontPathError: Localizable = {
		key: "print.validation.error",
		args: {},
		defaults: {
			en: "The specified font path could not be located within the workspace",
			de: "Der angegebene Schriftartpfad konnte im Arbeitsbereich nicht gefunden werden",
		},
	};
	return {
		severity: "ERROR",
		errorCode: fontPathError.key,
		jsonPath: getFontErrorPath(fontIndex),
		origin: ErrorOrigin.VALIDATOR,
		errorMessage: [fontPathError],
	};
}

export function createFontExtensionError(fontIndex: number): PrintError {
	const allowedExtensions = SUPPORTED_FONTS.join(", ");
	const fontPathError: Localizable = {
		key: "print.validation.error",
		args: {},
		defaults: {
			en: `The font file format must be: ${allowedExtensions}`,
			de: `Das Dateiformat der Schriftart muss sein: ${allowedExtensions}`,
		},
	};
	return {
		severity: "ERROR",
		errorCode: fontPathError.key,
		jsonPath: getFontErrorPath(fontIndex),
		origin: ErrorOrigin.VALIDATOR,
		errorMessage: [fontPathError],
	};
}

export function createFontSupportWarning(fontIndex: number, extension: string): PrintError {
	const fontPathError: Localizable = {
		key: "print.validation.error",
		args: {},
		defaults: {
			en: `The font file format ${extension} is not supported and may to lead to unexpected behavior.`,
			de: `Das Schriftart-Dateiformat ${extension} wird nicht unterstützt und kann zu unverwarteten Verhalten führen.`,
		},
	};
	return {
		severity: "WARNING",
		errorCode: fontPathError.key,
		jsonPath: getFontErrorPath(fontIndex),
		origin: ErrorOrigin.VALIDATOR,
		errorMessage: [fontPathError],
	};
}
