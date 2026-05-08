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
import { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { Model } from "@com.mgmtp.a12.base/base-model-api/lib/main/model/index.js";

import ReadonlyObjectMap = DocumentModel.ReadonlyObjectMap;

export interface DocumentModelData {
	readonly model: DocumentModel;
	readonly elementMap: ElementMap;
	readonly enhancements: ReadonlyArray<string>;
	readonly annotations: Set<string>;
	readonly fieldTypes: ReadonlyObjectMap<DocumentModel.FieldType>;
	readonly typeDefinitions: TypeDefinition[];
}

export interface ElementMap {
	[key: string]: ElementMapEntry;
}
export interface ElementMapEntry {
	elementPath: string;
	isGroup: boolean;
	isSubOfRepeatable: boolean;
	repeatability?: number;
	hasNonRepFieldLeafs?: boolean;
	element: DocumentModel.Element;
	treeOptions?: {
		isInstance?: boolean;
		disabled?: boolean;
	};
}

export interface ExtendedDocumentModel extends DocumentModel {
	content: ExtendedDocumentModelContent;
}

export namespace ExtendedDocumentModel {
	export function isInstance(model: Model): model is ExtendedDocumentModel {
		return "typeDefinitions" in model.content && Array.isArray(model.content.typeDefinitions);
	}
}

export interface ExtendedDocumentModelContent extends DocumentModel.DocumentModelContent {
	typeDefinitions: TypeDefinition[];
}

export interface TypeDefinition extends DocumentModel.IdNamed {
	id: string;
	name: string;
	fieldType: DocumentModel.FieldType;
}
