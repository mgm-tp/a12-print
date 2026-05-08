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
import { actionCreatorFactory } from "typescript-fsa";

import {
	AffectedItem,
	InteractionLogEntry,
	InteractionLogStore,
	InteractionRegion,
	PreventUndo,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import { PartialValidPlaceableReference } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { NewElementHeight } from "../../components/hidden-height-context-wrapper/types.js";

import type { AnyTransactionLogAction } from "../transaction-log-state/actions.js";

const factory = actionCreatorFactory("Print/InteractionLog");

export namespace InteractionLogActions {
	export const setLogStore = factory<InteractionLogStore>("SET_LOG_STORE");
	export const addLogEntry = factory<AddLogEntryPayload>("ADD_LOG_ENTRY");
	export interface AddLogEntryPayload {
		logEntry: InteractionLogEntry;
		region: InteractionRegion;
		regionId: string;
	}

	export const start = factory<StartPayload>("START");
	export interface StartPayload {
		transactionLogActions: AnyTransactionLogAction[];
		region: InteractionRegion;
		affectedItems?: AffectedItem[];
		description?: string;
		preventUndo?: PreventUndo;
	}

	export const addAffectedItems = factory<AddAffectedItemsPayload>("ADD_AFFECTED_ITEMS");
	export interface AddAffectedItemsPayload {
		interactionId: string;
		region: InteractionRegion;
		regionId: string;
		affectedItems: AffectedItem[];
	}

	export const undo = factory("UNDO");
	export const redo = factory("REDO");

	export const updateElementHeightDomNode = factory<PartialValidPlaceableReference>("UPDATE_ELEMENT_HEIGHT_FORM");
	export const updateElementHeightTextStyle = factory<UpdateElementHeightTextStylePayload>(
		"UPDATE_ELEMENT_HEIGHT_TEXT_STYLE"
	);
	export interface UpdateElementHeightTextStylePayload {
		segmentsMap: Record<string, NewElementHeight[]>;
		sectionsMap: Record<string, NewElementHeight[]>;
		watermarksMap: Record<string, NewElementHeight[]>;
		wrapperMap: Record<string, NewElementHeight[]>;
	}
}
