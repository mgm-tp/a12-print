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

import type { Page } from "@playwright/test";

import type { Shot } from "../capture.ts";

export type Figure = {
	/** Also the name it is checked into the documentation module under. */
	readonly name: string;
	/** The assets directory it is copied into, e.g. `chapter02`. */
	readonly chapter: string;
	/**
	 * Runs with the editor as the figure before it in the same group left it, and may leave state
	 * behind for the ones after it.
	 */
	readonly take: (page: Page, shot: Shot) => Promise<void>;
};

/**
 * The unit of isolation: a group opens its use case in a browser context of its own with the
 * interaction logs dropped, so no group can be affected by the ones before it.
 */
export type FigureGroup = {
	readonly name: string;
	readonly useCase: string;
	/** Runs once after the use case is opened: the editor state every figure of the group starts from. */
	readonly prepare?: (page: Page) => Promise<void>;
	readonly figures: readonly Figure[];
};

/** The use case the figures of the editor tour and of chapter 03's Bounding Box are taken from. */
export const USE_CASE = "011-automated-doc-screenshots";

/** One Print Model Element of every type, for the element detail forms of chapter 03. */
export const ELEMENTS_USE_CASE = "012-doc-screenshots-elements";

/** The Fragment Model the figures of chapter 06 show, both as it is modeled and as it is used. */
export const FRAGMENT_MODEL_USE_CASE = "013-doc-screenshots-fragment-model";

export const FRAGMENT_USAGE_USE_CASE = "014-doc-screenshots-fragment-usage";

/** The headline of an element's detail form is the element type it was opened for. */
export const elementDetailHeadline = (elementType: string) => `Page Element - ${elementType}`;

export const TEXT_DETAIL = elementDetailHeadline("Text");
