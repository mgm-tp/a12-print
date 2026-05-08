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
import { useDispatch } from "react-redux";
import React from "react";

import { BaseColumnType, Table, TableRenderPropsType } from "@com.mgmtp.a12.widgets/widgets-core/lib/table/new-api";
import { Button } from "@com.mgmtp.a12.widgets/widgets-core";

import { EditorActions } from "../../store/editor";

import { CaseConfig } from "../case-config/CaseConfig";

const columns: BaseColumnType<CaseConfig>[] = [
	{
		label: "Case Id",
		dataKey: "id",
		sortDirections: ["desc", "asc"],
	},
	{
		label: "",
		actionColumn: true,
		horizontalAlignment: "right",
		dataKey: "storeAction",
	},
];

interface PrintModelCaseListProps {
	caseConfigs: CaseConfig[];
}

export const PrintModelCaseList = ({ caseConfigs }: PrintModelCaseListProps) => {
	const dispatch = useDispatch();

	const setEditorState = ({ rowCase, hasExternalStore }: { rowCase: CaseConfig; hasExternalStore: boolean }) => {
		dispatch(EditorActions.clearEditorState());
		dispatch(EditorActions.setCaseConfig(rowCase));
		dispatch(EditorActions.setHasExternalStore(hasExternalStore));
	};

	const onRowClick = ({ row }: { row: CaseConfig; rowIndex: number }) => {
		setEditorState({ rowCase: row, hasExternalStore: false });
	};

	const handleStoreClick = (row: CaseConfig) => {
		setEditorState({ rowCase: row, hasExternalStore: true });
	};

	return (
		<Table
			columns={columns}
			data={caseConfigs}
			componentRenderers={{
				headRowRenderer: () => null,
				bodyContentRenderer: ({
					column,
					row,
				}: TableRenderPropsType.BodyContentProps<CaseConfig>): React.ReactNode => {
					if (column.actionColumn) {
						return (
							<Button
								onClick={event => {
									event.stopPropagation();
									handleStoreClick(row);
								}}
							>
								Store
							</Button>
						);
					}
					return row.id;
				},
			}}
			rowEventHandlers={params => ({ onClick: () => onRowClick(params) })}
		></Table>
	);
};
