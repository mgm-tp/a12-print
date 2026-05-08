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
import { Model } from "@com.mgmtp.a12.base/base-model-api/lib/main/model/index.js";
import {
	InteractionLogPersistentEntry,
	LogPersistentEntry,
	PartialTransactionLogPersistentEntry,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import { Locale } from "@com.mgmtp.a12.utils/utils-localization/lib/main/index.js";
import { FontResourceMap } from "@com.mgmtp.a12.print/print-fonts/lib/types/font.js";

import { ValidationState } from "../../../redux/index.js";
import { EditorComponentApiActions } from "../../../api/index.js";

export interface PrintEditorSMEBaseProps {
	customFonts: FontResourceMap;
	onClose: () => void;
	onDeploy: () => void;
	onPreview: () => void;
	modelIconPath: string;
	isConnectedToServer?: boolean;
}

export interface PrintEditorSMEProps extends PrintEditorSMEBaseProps {
	printModel: Model;
	printModels: Model[];
	documentModelIds: string[];
	loadReferencedDocumentModels: (ids: string[]) => Model[];
	typesettingModels: Model[];
	logPersistentEntries: LogPersistentEntry[];
	commitPrintModel: (printModel: Model, overwriteLog: boolean, persistentEntries?: LogPersistentEntry[]) => void;
	setPrintModels: (printModels: Model[]) => Promise<void>;
	discardAllLogs: () => void;
	onPrintModelChange?: (
		printModelId: string,
		transactionLogs?: PartialTransactionLogPersistentEntry[],
		interactionLog?: InteractionLogPersistentEntry
	) => void;
	onValidationStateChange: (validationState: ValidationState) => void;
	showNotification: (notification: EditorComponentApiActions.AddNotificationPayload) => void;
	precompilePrintModel: (params: PrecompilePrintModelParams) => Promise<boolean | undefined>;
	locale?: Locale;
	availableRoles?: string[];
}

interface PrecompilePrintModelParams {
	documentModelMap: Record<string, string>;
	printModelMap: Record<string, string>;
	printModel: string;
}
