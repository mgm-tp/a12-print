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
import { useMemo } from "react";

import type { FontResource, FontResourceMap } from "@com.mgmtp.a12.print/print-fonts";
import { getFontFormat, DEFAULT_FONTS } from "@com.mgmtp.a12.print/print-fonts/a12internal";

export const useConfiguredFonts = (caseId?: string, fontMap?: Record<string, string>): FontResourceMap => {
	return useMemo(() => {
		if (!caseId) {
			return {};
		}
		if (!fontMap) {
			return DEFAULT_FONTS;
		}
		const newResourceMap = {
			...DEFAULT_FONTS,
		};
		for (const fontMapEntry of Object.entries(fontMap)) {
			newResourceMap[resolveFontName(fontMapEntry[0])] = createFontResource(fontMapEntry[1], caseId);
		}
		return newResourceMap;
	}, [caseId, fontMap]);
};

function createFontResource(fontPath: string, caseId: string): FontResource {
	return {
		src: getCustomFontPathInAssets(caseId, fontPath),
		format: getFontFormat(fontPath),
	};
}

const BASE_PATH = "build/assets/static";

function getCustomFontPathInAssets(caseId: string, subPath?: string) {
	if (!subPath?.includes(BASE_PATH)) {
		throw new Error(
			`${caseId}: PrintSetting font path ${subPath} need to point to the assets folder test-app/${BASE_PATH}. Also make sure the required custom test font is located in print-fonts/src/test/resources. Webpack will copy it to the assets folder.`
		);
	}
	// subpath points to test-app/${BASE_PATH}, so the print-shell can access it,
	// but webpack is already serving from /build, so we need to adjust the path
	return subPath?.replace("/build", "/..");
}

/**
 * If the fontname matches a default font name,
 * the original default font name is returned so it correctly overrides the default.
 */
function resolveFontName(normalizedFileName: string): string {
	for (const defaultFontName of Object.keys(DEFAULT_FONTS)) {
		if (defaultFontName.replace(/\s+/g, "") === normalizedFileName) {
			return defaultFontName;
		}
	}

	return normalizedFileName;
}
