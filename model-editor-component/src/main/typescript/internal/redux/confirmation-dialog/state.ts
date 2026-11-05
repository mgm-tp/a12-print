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
import type { EntityInstancePath } from "@com.mgmtp.a12.kernel/kernel-md-facade";

export enum ConfirmationDialogType {
	DELETE = "delete",
	CANNOT_BE_UNDONE = "cannotBeUndone",
	DISCARD_CHANGES = "discardChanges",
	FRAGMENT_IN_USE = "fragmentInUse",
	COMMIT_AFFECTS_PRINT_MODELS = "commitAffectsPrintModels",
	FRAGMENT_UNLINK = "fragmentUnlink",
	FRAGMENT_UNLINK_ADDS_DEPENDENCIES = "fragmentUnlinkAddsDependencies",
}

export enum LastActionType {
	confirm,
	cancel,
}

/** Entity types that can hold a reference to a fragment definition in another print model. */
export type FragmentReferenceEntityType = "segment" | "section" | "watermark" | "textStyle" | "element";

export interface FragmentUsagePrintModelInfo {
	printModelId: string;
	/** Type of the fragment reference in the referencing print model. */
	referenceEntityType?: FragmentReferenceEntityType;
	/** Position of the reference within its container's reference array in the referencing print model. */
	referenceIndex?: number;
	/** Full navigation path for an "element" usage - placements can be nested, so a flat index won't locate them. */
	elementPath?: EntityInstancePath;
}

export interface RequiredModelDependency {
	modelType: "document" | "typesetting";
	reference: string;
}

export interface ConfirmationDialogPayload {
	usages?: FragmentUsagePrintModelInfo[];
	dependencies?: RequiredModelDependency[];
}

export type ConfirmationDialogState = {
	type: ConfirmationDialogType | null;
	payload?: ConfirmationDialogPayload;
	lastAction?: LastActionType;
} | null;
