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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.listing;

import static com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants.SLASH;

public class ListingPathUtils {
	private ListingPathUtils() {}

	public static boolean checkIsSubPath(String testPath, String basePath, boolean allowEqual) {
		final var slashTestPath = getSlashPath(testPath);
		final var slashBasePath = getSlashPath(basePath);
		return slashTestPath.startsWith(slashBasePath) && (allowEqual || !slashTestPath.equals(slashBasePath));
	}

	public static boolean checkPathsEqual(String path1, String path2) {
		return getSlashPath(path1).equals(getSlashPath(path2));
	}

	private static String getSlashStartPath(String path) {
		return path.startsWith(SLASH) ? path : SLASH + path;
	}

	private static String getSlashEndPath(String path) {
		return path.endsWith(SLASH) ? path : path + SLASH;
	}

	private static String getSlashPath(String path) {
		return getSlashEndPath(getSlashStartPath(path));
	}
}
