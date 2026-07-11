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
import type { Segment } from "@com.mgmtp.a12.print/print-model-api/model";
import {
	DisplayType,
	ElementType,
	PageOrientation,
	SegmentType,
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { PRINT_MODEL_VERSION } from "@com.mgmtp.a12.print/print-model-api/constant";

import type { TransactionLogStore } from "../../../../main/typescript/a12internal/transaction-log/transaction-log.js";
import { TransactionLog } from "../../../../main/typescript/a12internal/transaction-log/transaction-log.js";

export const printHeaderId = "printHeaderId123";
export const emptyTextElementId = "emptyTextElementId123";
export const calculationElementId = "someCalculation2020";
export const calculationPropertiesId = "ogm4o3hm53";

export const calculationElement = {
	id: "someCalculation2020",
	type: ElementType.Calculation,
	calculation: {
		id: calculationPropertiesId,
		displayOptions: { id: "0jk10g4kh421", displayType: DisplayType.Html, suffix: "hello suffix" },
		computationAlternatives: [
			{ id: "qetjko3t", operation: "some op 0", precondition: "some alt 0" },
			{ id: "ok2go42gh", operation: "some op 1", precondition: "some alt 1" },
			{ id: "qogk4o2h4", operation: "some op 2", precondition: "some alt 2" },
		],
	},
};

export const segmentMockId = "31gf3g53h5hhh";

export const segmentMock: Segment = {
	id: segmentMockId,
	elementReferences: [],
	title: "mySegment",
	type: SegmentType.Default,
	defaultSegment: { id: "f342tg42z", pageOrientation: PageOrientation.Portrait },
};

export const calcStoreEntry = TransactionLog.createStoreEntryPrintModelElement(
	{},
	calculationElement,
	"p0o2t04kg4"
).storeEntry;

export const emptyTextStoreEntry = TransactionLog.createStoreEntryPrintModelElement(
	{},
	{ id: emptyTextElementId, type: ElementType.Text },
	"iwqfw124"
).storeEntry;

export const headerStoreEntry = TransactionLog.createStoreEntryPrintModelHeader(
	{ id: printHeaderId, log: [], memoizedObject: { id: printHeaderId } },
	{
		id: printHeaderId,
		modelType: "print" as const,
		modelVersion: PRINT_MODEL_VERSION,
		description: "some description",
	},
	"jomgh43oh43"
).storeEntry;

export const generalStoreEntry = TransactionLog.createStoreEntryPrintModelContentGeneral(
	{
		id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
		log: [],
		memoizedObject: { id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID },
	},
	{
		id: PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
		metadata: {
			id: "omg5ohm35",
			authorComputation: [{ id: "authComp123", operation: '"tony"' }],
			languageComputation: [{ id: "langComp123", operation: '"DE"' }],
			titleComputation: [{ id: "titleComp123", operation: '"myTestPrintModel123"' }],
			descriptionComputation: [{ id: "titleComp123", operation: '"general printmodel description"' }],
		},
		segmentDefaults: { id: ",p,pij57ik57", fontSize: 12, model: "DomainPerson" },
		structure: [],
	},
	"m,go53mh35op"
).storeEntry;

export const transactionLogStore: TransactionLogStore = {
	PRINT_MODEL_HEADER: headerStoreEntry,
	PRINT_MODEL_CONTENT_GENERAL: generalStoreEntry,
	printModelElements: {
		[emptyTextElementId]: emptyTextStoreEntry,
		[calculationElementId]: calcStoreEntry,
	},
	segments: { id: "mogrmgo42g4", map: {}, references: {} },
};
