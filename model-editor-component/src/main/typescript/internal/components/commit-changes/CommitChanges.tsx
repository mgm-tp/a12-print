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
import { useDispatch, useSelector } from "react-redux";

import { Button } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/index.js";
import {
	getDataByKey,
	RowEventHandlerGetter,
	RowStyleGetter,
	TableRenderPropsType,
} from "@com.mgmtp.a12.widgets/widgets-core/lib/table/new-api/index.js";
import { BaseColumnType } from "@com.mgmtp.a12.widgets/widgets-core/lib/table/new-api/column.api.js";
import { Table } from "@com.mgmtp.a12.widgets/widgets-core/lib/table/new-api/table.view.js";
import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/index.js";
import { TableTemplate } from "@com.mgmtp.a12.widgets/widgets-core/lib/table/main/template/index.js";

import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { CommitViewSelectors } from "../../redux/commit-view/selectors.js";
import { CommitViewActions } from "../../redux/index.js";
import { EditorComponentContext, ILocalizer } from "../../api/index.js";
import { interactionGraph } from "../../constant/interaction-graph.js";
import { CommitInteractionRow, CommitState, CommitTransactionRow } from "../../types/index.js";
import { useTransactionGroups } from "../../hooks/index.js";

import { ValidationErrorView } from "../error-tree/ValidationErrorView.js";

import {
	StyledCommitChangesContainer,
	StyledCommitChangesContent,
	StyledCommitChangeStatus,
	StyledCommitChangesToolbar,
	StyledTransactionTableContainer,
	StyledCommitErrorContainer,
	StyledCommitTableContainer,
	StyledCommitChangesButton,
} from "./CommitChanges.styled.js";

export const CommitChanges = () => {
	const localizer = PrintLocalizer.useLocalizer();
	const dispatch = useDispatch();
	const hasCommitViewValidationErrors = useSelector(CommitViewSelectors.hasCommitViewValidationErrors);
	const isCommitting = useSelector(CommitViewSelectors.isCommitting);
	const [expandedRows, setExpandedRows] = React.useState<number[]>([]);
	const columns = useCommitInteractionColumns();
	const transactionGroups = useTransactionGroups();

	const tableData = useSelector(CommitViewSelectors.commitInteractionRows);

	const discardAllChangesPossible = React.useContext(EditorComponentContext).discardAllChangesPossible;

	React.useEffect(() => {
		dispatch(CommitViewActions.initialCommitView());
	}, [dispatch]);

	const onCommitClick = React.useCallback(() => {
		tableData && dispatch(CommitViewActions.commitChanges(tableData));
	}, [dispatch, tableData]);

	const onDiscardClick = React.useCallback(() => {
		dispatch(CommitViewActions.discardChanges());
	}, [dispatch]);

	const onClickExpandButton = React.useCallback(
		(event: React.MouseEvent<HTMLElement, MouseEvent>, expandedIndex: number, rowIndex: number): void => {
			event.stopPropagation();
			const newExpandedRows = [...expandedRows];
			if (expandedIndex < 0) {
				newExpandedRows.push(rowIndex);
			} else {
				newExpandedRows.splice(expandedIndex, 1);
			}
			setExpandedRows(newExpandedRows);
		},
		[expandedRows]
	);

	const bodyContentRenderer = React.useCallback(
		({ column, row, rowIndex }: TableRenderPropsType.BodyContentProps<CommitInteractionRow>) => {
			if (column.dataKey === "expandAction") {
				const expandedIndex = expandedRows.indexOf(rowIndex);
				const isExpanded = expandedIndex > -1;
				return (
					<Button
						icon={<Icon size="big">{isExpanded ? "keyboard_arrow_up" : "keyboard_arrow_down"}</Icon>}
						onClick={event => onClickExpandButton(event, expandedIndex, rowIndex)}
						buttonAttributes={{ "aria-expanded": isExpanded }}
						title={localizer(isExpanded ? RESOURCE_KEYS.button.close : RESOURCE_KEYS.button.open)}
					/>
				);
			}
			if (column.dataKey === "state") {
				return getStateIcon(row.state, localizer);
			}
			let data = getDataByKey(row, column.dataKey ?? columns.indexOf(column));
			if (column.dataKey === "description") {
				data = localizer((data as string) || RESOURCE_KEYS.sidebar.commitChanges.emptyDescription);
			} else if (column.dataKey === "timestamp") {
				data = new Date(data as number).toLocaleString();
			}
			return <div style={getCellStyle(row, column.dataKey)}>{data}</div>;
		},
		[columns, expandedRows, localizer, onClickExpandButton]
	);

	const rowEventHandlers: RowEventHandlerGetter<CommitInteractionRow> = React.useCallback(
		({ row, rowIndex }) => ({
			onClick: () => {
				dispatch(
					CommitViewActions.setCommitInteractionRows(
						row.state === "pending"
							? setPendingToCommit(tableData, row, rowIndex)
							: setCommitToPending(tableData, row)
					)
				);
			},
		}),
		[dispatch, tableData]
	);

	const additionalContentRenderer = React.useCallback(
		({ row, rowIndex }: TableRenderPropsType.BodyRowProps<CommitInteractionRow>) => {
			if (expandedRows.includes(rowIndex)) {
				return (
					<CommitTransactionLogTable
						commitInteractionRow={row}
						onRowClick={() =>
							dispatch(
								CommitViewActions.setCommitInteractionRows(
									row.state === "pending"
										? setPendingToCommit(tableData, row, rowIndex)
										: setCommitToPending(tableData, row)
								)
							)
						}
					/>
				);
			}
			return null;
		},
		[dispatch, expandedRows, tableData]
	);

	return (
		<StyledCommitChangesContainer>
			<StyledCommitChangesContent>
				<StyledCommitTableContainer>
					<Table<CommitInteractionRow>
						data={tableData || []}
						columns={columns}
						rowStyling={getRowStyling}
						rowEventHandlers={rowEventHandlers}
						componentRenderers={{
							bodyContentRenderer,
							additionalContentRenderer,
						}}
					/>
				</StyledCommitTableContainer>
				<StyledCommitErrorContainer>
					<ValidationErrorView />
				</StyledCommitErrorContainer>
			</StyledCommitChangesContent>
			<StyledCommitChangesToolbar>
				{(discardAllChangesPossible || false) && (
					<StyledCommitChangesButton
						disabled={transactionGroups.length === 0 || isCommitting}
						label={localizer(RESOURCE_KEYS.sidebar.commitChanges.discard)}
						title={localizer(RESOURCE_KEYS.sidebar.commitChanges.discard)}
						destructive
						onClick={onDiscardClick}
					></StyledCommitChangesButton>
				)}
				<StyledCommitChangesButton
					right
					disabled={transactionGroups.length === 0 || hasCommitViewValidationErrors || isCommitting}
					label={localizer(RESOURCE_KEYS.sidebar.commitChanges.commit)}
					title={localizer(RESOURCE_KEYS.sidebar.commitChanges.commit)}
					onClick={onCommitClick}
				></StyledCommitChangesButton>
			</StyledCommitChangesToolbar>
		</StyledCommitChangesContainer>
	);
};

interface CommitTransactionLogTableProps {
	commitInteractionRow: CommitInteractionRow;
	onRowClick: () => void;
}

const CommitTransactionLogTable = ({ commitInteractionRow, onRowClick }: CommitTransactionLogTableProps) => {
	const transactionColumns = useCommitTransactionColumns();
	const localizer = PrintLocalizer.useLocalizer();

	const bodyContentRenderer = React.useCallback(
		({ column, row }: TableRenderPropsType.BodyContentProps<CommitTransactionRow>) => {
			if (column.dataKey === "state") {
				return getStateIcon(row.state, localizer);
			}
			let data = getDataByKey(row, column.dataKey ?? transactionColumns.indexOf(column));
			if (column.dataKey === "objectId" || column.dataKey === "value") {
				data = JSON.stringify(data);
			}
			return <div style={getCellStyle(row, column.dataKey)}>{data}</div>;
		},
		[localizer, transactionColumns]
	);

	const rowEventHandlers: RowEventHandlerGetter<CommitTransactionRow> = React.useCallback(
		() => ({
			onClick: onRowClick,
		}),
		[onRowClick]
	);

	return (
		<TableTemplate.BodyRow>
			<TableTemplate.ExpandableRow>
				<TableTemplate.ExpandableRowBody>
					<StyledTransactionTableContainer>
						<Table<CommitTransactionRow>
							data={commitInteractionRow?.transactions}
							columns={transactionColumns}
							rowEventHandlers={rowEventHandlers}
							rowStyling={getRowStyling}
							componentRenderers={{ bodyContentRenderer }}
							key={`${commitInteractionRow.interactionId}-${commitInteractionRow.state}`}
						/>
					</StyledTransactionTableContainer>
				</TableTemplate.ExpandableRowBody>
			</TableTemplate.ExpandableRow>
		</TableTemplate.BodyRow>
	);
};

function setCommitToPending(
	tableData: CommitInteractionRow[] | undefined,
	row: CommitInteractionRow
): CommitInteractionRow[] {
	if (!tableData) {
		return [];
	}

	const dependentInteractions = interactionGraph.getCommitToPendingDependencies(row.interactionId);

	const latestEntryMap: Record<string, Record<string, true>> = {};
	const arrayLatestMoveMap: Record<string, Record<string, Record<string, boolean>>> = {};
	const arrayLatestRemoveMap: Record<string, Record<string, Record<string, boolean>>> = {};
	return tableData.map(interactionRow => {
		if (interactionRow.state === "pending") {
			return interactionRow;
		}
		const newInteractionState =
			interactionRow.interactionId === row.interactionId ||
			dependentInteractions.has(interactionRow.interactionId)
				? "pending"
				: interactionRow.state;
		return {
			...interactionRow,
			state: newInteractionState,
			transactions: interactionRow.transactions.map(el => {
				if (newInteractionState === "pending") {
					return { ...el, state: "pending" };
				}
				const { propertyKey, parentId, objectId, value, command } = el;
				let status: CommitState = "commit";
				const arrayEntryId = objectId || value;
				if (typeof arrayEntryId === "string") {
					if (command === "MOVE") {
						if (arrayLatestMoveMap[parentId]?.[propertyKey]?.[arrayEntryId]) {
							status = "overwritten";
						} else {
							arrayLatestMoveMap[parentId] = {
								...arrayLatestMoveMap[parentId],
								[propertyKey]: { ...arrayLatestMoveMap[parentId]?.[propertyKey], [arrayEntryId]: true },
							};
						}
					} else if (command === "POP") {
						arrayLatestRemoveMap[parentId] = {
							...arrayLatestRemoveMap[parentId],
							[propertyKey]: { ...arrayLatestRemoveMap[parentId]?.[propertyKey], [arrayEntryId]: true },
						};
					} else if (command === "PUSH" && arrayLatestMoveMap[parentId]?.[propertyKey]?.[arrayEntryId]) {
						status = "overwritten";
					}
				}
				if (command === "SET" || command === "REMOVE") {
					if (latestEntryMap[parentId]?.[propertyKey]) {
						status = "overwritten";
					} else {
						latestEntryMap[parentId] = { ...latestEntryMap[parentId], [propertyKey]: true };
					}
				}
				return { ...el, state: status };
			}),
		};
	});
}

function setPendingToCommit(
	tableData: CommitInteractionRow[] | undefined,
	row: CommitInteractionRow,
	rowIndex: number
): CommitInteractionRow[] {
	if (!tableData) {
		return [];
	}

	const dependentInteractions = interactionGraph.getPendingToCommitDependencies(row.interactionId);

	const latestEntryMap: Record<string, Record<string, boolean>> = {};
	const arrayRemoveCommits: string[] = [];
	const arrayLatestMoveMap: string[] = [];
	return tableData.map((interactionRow, i) => {
		if (i < rowIndex) {
			if (interactionRow.state === "commit") {
				interactionRow.transactions.forEach(({ parentId, propertyKey, state }) => {
					if (state === "commit") {
						latestEntryMap[parentId] = { ...latestEntryMap[parentId], [propertyKey]: true };
					}
				});
			}
			return interactionRow;
		}
		if (i === rowIndex) {
			return {
				...interactionRow,
				state: "commit",
				transactions: interactionRow.transactions.map(el => {
					const { parentId, propertyKey, objectId, value, command } = el;
					const arrayId = objectId || value;
					if (typeof arrayId === "string") {
						if (command === "MOVE") {
							arrayLatestMoveMap.push(arrayId);
						} else if (command === "POP") {
							arrayRemoveCommits.push(arrayId);
						}
					}
					if (command === "SET" || command === "REMOVE") {
						latestEntryMap[parentId] = { ...latestEntryMap[parentId], [propertyKey]: true };
					}
					return { ...el, state: "commit" };
				}),
			};
		}
		const interactionState = dependentInteractions.has(interactionRow.interactionId)
			? "commit"
			: interactionRow.state;
		return {
			...interactionRow,
			state: interactionState,
			transactions: interactionRow.transactions.map(el => {
				if (interactionState === "pending") {
					return el;
				}
				const { parentId, propertyKey, objectId, value, command } = el;
				let status: CommitState = "commit";
				const arrayId = objectId || value;
				if (typeof arrayId === "string") {
					if (command === "MOVE") {
						if (arrayLatestMoveMap.includes(arrayId)) {
							status = "overwritten";
						} else {
							arrayLatestMoveMap.push(arrayId);
						}
					} else if (command === "PUSH" && arrayRemoveCommits.includes(arrayId)) {
						status = "overwritten";
					}
				}
				if (command === "SET" || command === "REMOVE") {
					if (latestEntryMap[parentId]?.[propertyKey]) {
						status = "overwritten";
					} else {
						latestEntryMap[parentId] = { ...latestEntryMap[parentId], [propertyKey]: true };
					}
				}
				return { ...el, state: status };
			}),
		};
	});
}

const useCommitInteractionColumns = (): BaseColumnType<CommitInteractionRow>[] => {
	const localizer = PrintLocalizer.useLocalizer();
	return React.useMemo(
		() => [
			{
				label: "",
				dataKey: "expandAction",
				actionColumn: true,
			},
			{
				label: localizer(RESOURCE_KEYS.sidebar.commitChanges.columns.status),
				dataKey: "state",
				verticalAlignment: "middle",
				width: 1.5,
				fixedWidth: true,
			},
			{
				label: localizer(RESOURCE_KEYS.sidebar.commitChanges.columns.timestamp),
				dataKey: "timestamp",
				verticalAlignment: "middle",
				width: 1.5,
				fixedWidth: true,
			},
			{
				label: localizer(RESOURCE_KEYS.sidebar.commitChanges.columns.descriptions),
				dataKey: "description",
				verticalAlignment: "middle",
			},
		],
		[localizer]
	);
};

const useCommitTransactionColumns = (): BaseColumnType<CommitTransactionRow>[] => {
	const localizer = PrintLocalizer.useLocalizer();
	return React.useMemo(
		() => [
			{
				label: localizer(RESOURCE_KEYS.sidebar.commitChanges.columns.status),
				dataKey: "state",
				verticalAlignment: "middle",
			},
			{
				label: "ParentId",
				dataKey: "parentId",
				horizontalAlignment: "center",
				verticalAlignment: "middle",
			},
			{
				label: localizer(RESOURCE_KEYS.sidebar.commitChanges.columns.propertyName),
				dataKey: "propertyKey",
				horizontalAlignment: "center",
				verticalAlignment: "middle",
			},
			{
				label: "ObjectId",
				dataKey: "objectId",
				horizontalAlignment: "center",
				verticalAlignment: "middle",
			},
			{
				label: localizer(RESOURCE_KEYS.sidebar.commitChanges.columns.propertyValue),
				dataKey: "value",
				horizontalAlignment: "center",
				verticalAlignment: "middle",
			},
			{
				label: "Command",
				dataKey: "command",
				horizontalAlignment: "center",
				verticalAlignment: "middle",
			},
		],
		[localizer]
	);
};

const getCellStyle = (row: CommitInteractionRow | CommitTransactionRow, dataKey?: string | number | undefined) => {
	return row.state === "overwritten" && dataKey !== "state" ? { textDecoration: "line-through" } : undefined;
};

const getRowStyling: RowStyleGetter<CommitInteractionRow | CommitTransactionRow> = ({ row }) => {
	return {
		selected: row.state === "commit",
		highlighted: row.state === "overwritten",
	};
};

const getStateIcon = (state: CommitState, localizer: ILocalizer) => {
	switch (state) {
		case "commit":
			return (
				<StyledCommitChangeStatus>
					<Icon title={localizer(RESOURCE_KEYS.sidebar.commitChanges.status.commit)} variant="success">
						check_circle
					</Icon>
					{localizer(RESOURCE_KEYS.sidebar.commitChanges.status.commit)}
				</StyledCommitChangeStatus>
			);
		case "pending":
			return (
				<StyledCommitChangeStatus>
					<Icon title={localizer(RESOURCE_KEYS.sidebar.commitChanges.status.pending)} variant="info">
						pending
					</Icon>
					{localizer(RESOURCE_KEYS.sidebar.commitChanges.status.pending)}
				</StyledCommitChangeStatus>
			);
		case "overwritten":
			return (
				<StyledCommitChangeStatus>
					<Icon title={localizer(RESOURCE_KEYS.sidebar.commitChanges.status.overwritten)}>cancel</Icon>
					{localizer(RESOURCE_KEYS.sidebar.commitChanges.status.overwritten)}
				</StyledCommitChangeStatus>
			);
		default:
			return "";
	}
};
