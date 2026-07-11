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
import type { PrintModel, PartialPrintModel } from "@com.mgmtp.a12.print/print-model-api/model";
import {
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	PRINT_MODEL_CONTENT_LOG_ID,
	PRINT_MODEL_HEADER_LOG_ID,
} from "@com.mgmtp.a12.print/print-model-api/model";

import { PrintModelGarbageCollector } from "../../garbage-collector/index.js";

import type { TransactionLogStore } from "../transaction-log/index.js";
import { TransactionLog } from "../transaction-log/index.js";

/**
 * Transform the transaction log store to the model API print model.
 */
export namespace PrintModelCreator {
	/**
	 * Performs clean up steps to the print model before returning. Namely removing unused objects and placeables of overrides.
	 * @param transactionLogStore Transaction log store used for creating model
	 * @param isClean Set true if the transaction log has been cleaned, this is to prevent override element from being removed since their placeable references do not existed
	 */
	export function createCleanModel(transactionLogStore: TransactionLogStore, isClean: boolean = false): PrintModel {
		return PrintModelGarbageCollector.clean(createStoreModel(transactionLogStore) as PrintModel, isClean);
	}

	/**
	 * Direct transformation of transaction log store to print model.
	 */
	export function createStoreModel(transactionLogStore: TransactionLogStore): PartialPrintModel {
		const header = TransactionLog.selectPrintModelHeader(transactionLogStore[PRINT_MODEL_HEADER_LOG_ID]);
		const general = TransactionLog.selectPrintModelContentGeneral(
			transactionLogStore[PRINT_MODEL_CONTENT_GENERAL_LOG_ID]
		);
		const segments = {
			id: transactionLogStore.segments.id,
			definitions: Object.keys(transactionLogStore.segments.map).map(id =>
				TransactionLog.selectSegment(transactionLogStore.segments.map, id)
			),
			references: Object.keys(transactionLogStore.segments.references).map(id =>
				TransactionLog.selectSegmentReference(transactionLogStore.segments.references, id)
			),
		};
		const sections = transactionLogStore.sections
			? {
					id: transactionLogStore.sections.id,
					definitions: Object.keys(transactionLogStore.sections.map).map(id =>
						TransactionLog.selectSection(transactionLogStore.sections?.map, id)
					),
				}
			: undefined;
		const watermarks = transactionLogStore.watermarks
			? {
					id: transactionLogStore.watermarks.id,
					definitions: Object.keys(transactionLogStore.watermarks.map).map(id =>
						TransactionLog.selectWatermark(transactionLogStore.watermarks?.map, id)
					),
				}
			: undefined;
		const elementDefinitions = Object.keys(transactionLogStore.printModelElements).map(id =>
			TransactionLog.selectPrintModelElement(transactionLogStore.printModelElements, id)
		);
		const textStyles = transactionLogStore.textStyles
			? {
					id: transactionLogStore.textStyles.id,
					definitions: Object.keys(transactionLogStore.textStyles.map).map(id =>
						TransactionLog.selectTextStyle(transactionLogStore.textStyles?.map, id)
					),
				}
			: undefined;

		return {
			header,
			content: {
				id: PRINT_MODEL_CONTENT_LOG_ID,
				general,
				segments,
				sections,
				watermarks,
				elementDefinitions,
				textStyles,
			},
		};
	}
}
