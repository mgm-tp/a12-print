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
import * as React from "react";
import { useSelector } from "react-redux";

import { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { PrintEngineState } from "../../../../store/root-reducer.js";
import { DocumentModelDataSelectors } from "../../../../redux/document-model-data/selectors.js";

export const useFieldTypesOptions = (model?: string) => {
	const documentModelData = useSelector((state: PrintEngineState) =>
		DocumentModelDataSelectors.documentModelData(state, model)
	);
	const fieldTypes = documentModelData?.fieldTypes;

	return React.useMemo(() => {
		const options = [{ value: "", label: "" }];

		if (!fieldTypes) {
			return options;
		}
		Object.keys(fieldTypes).forEach(fieldTypeKey => {
			const fieldType = fieldTypes[fieldTypeKey];
			options.push({
				value: JSON.stringify(fieldType ? toCustomFieldType(fieldType) : undefined),
				label: fieldTypeKey,
			});
		});
		return options;
	}, [fieldTypes]);
};

function toCustomFieldType(fieldType: DocumentModel.FieldType): CustomFieldType {
	const { type, ...rest } = fieldType;
	return {
		type: fieldType.type,
		[fieldType.type]: { ...rest },
	};
}

type CustomFieldType = {
	[key in FieldTypeType]?: Omit<DocumentModel.FieldType, "type">;
} & {
	type: FieldTypeType;
};

type FieldTypeType =
	| "BooleanType"
	| "ConfirmType"
	| "DateType"
	| "DateTimeType"
	| "DateRangeType"
	| "DateFragmentType"
	| "EnumerationType"
	| "NumberType"
	| "StringType"
	| "TimeType"
	| "CustomFieldType";
