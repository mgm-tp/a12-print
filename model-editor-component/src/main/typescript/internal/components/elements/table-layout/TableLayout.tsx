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
import { nanoid } from "nanoid";

import { Button, Icon, Callout, List } from "@com.mgmtp.a12.widgets/widgets-core";
import type {
	ColumnProperties,
	PartialBorderProperties,
	TableLayoutCellReference,
	TableLayoutProperties,
	Text,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { ElementType, PartialTableLayout, PartialText } from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";
import { StageRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import {
	InputSourceGenerator,
	InputValueSourceResolver,
	PossibleInputSource,
} from "@com.mgmtp.a12.print/print-model-api/input-source";

import { PrintEngineSelectors } from "../../../store/selectors.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import type { ValidationCounter } from "../../../redux/index.js";
import {
	TransactionLogStateActions,
	DetailViewActions,
	NavigationActions,
	InteractionLogActions,
} from "../../../redux/index.js";
import { NavigationSelectors } from "../../../redux/navigation/selectors.js";
import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";
import type { ILocalizer } from "../../../api/index.js";
import { EditorConst } from "../../../constant/editor.js";
import { ContextMenuContext } from "../../context-menu/ContextMenuWrapper.js";
import { CustomSelect } from "../../forms/custom-base-input-components/index.js";
import { BadgeGroup } from "../../badge/BadgeGroup.js";
import { useErrorTitleElement } from "../../../hooks/index.js";
import { ValidationSelectors } from "../../../redux/validation/selectors.js";
import { LayoutElementContainer } from "../../element-container/LayoutElementContainer.js";
import { BORDER_PROPERTIES_PATH, TABLE_LAYOUT_PROPERTY_PATH } from "../../../constant/element-property-path.js";

import type { BaseElementProps } from "../base.js";

import { StyledActionsWrapper, StyledTable, StyledTdEmpty, StyledTdFilled, StyledTr } from "./TableLayout.styled.js";

const MM_TO_PX = EditorConst.MM_TO_PX;

interface BaseCellProps {
	row: number;
	col: number;
	columnProps: DeepPartial<ColumnProperties> | undefined;
	element: PartialTableLayout;
	borderProperties: PartialBorderProperties | undefined;
	isNestedElement?: boolean;
	floatingButton?: React.ReactNode;
	disabled?: boolean;
}

interface CellCoordinate {
	row: number;
	col: number;
}

export type TableLayoutProps = BaseElementProps & { floatingButton?: React.ReactNode; disabled?: boolean };

export const TableLayout = ({
	reference,
	element,
	styles,
	isNestedElement,
	floatingButton,
	disabled,
}: TableLayoutProps) => {
	if (!PartialTableLayout.isInstance(element)) {
		throw Error(`Expected element of type TableLayout but got ${element.type}`);
	}
	const { tableLayout, borderProperties } = element;

	const renderCell = React.useCallback(
		(row: number, col: number) => {
			const columnProps = tableLayout?.columnProperties?.find(c => c && c.index === col + 1);
			const cellRef = tableLayout?.cells?.find(el => el && el.row === row && el.column === col);
			const baseCellProps: BaseCellProps = {
				row,
				col,
				columnProps,
				element,
				borderProperties,
				isNestedElement,
			};
			const isTopRightCell = tableLayout?.columnCount && col === tableLayout.columnCount - 1 && row === 0;
			const floatingButtonInCell = isTopRightCell ? floatingButton : undefined;
			if (cellRef) {
				return (
					<FilledCell
						key={`cell(${row}|${col}|${element.id})`}
						{...baseCellProps}
						cellRef={cellRef}
						floatingButton={floatingButtonInCell}
						disabled={disabled}
					/>
				);
			}
			return (
				<EmptyCell
					key={`cell(${row}|${col}|${element.id})`}
					{...baseCellProps}
					tableLayout={tableLayout}
					floatingButton={floatingButtonInCell}
					disabled={disabled}
				/>
			);
		},
		[tableLayout, element, borderProperties, isNestedElement, floatingButton, disabled]
	);

	const tableRows = React.useMemo(() => {
		if (tableLayout === undefined) {
			return;
		}
		const rowValues = [];
		const { rowProperties, rowCount = 0, columnCount = 0 } = tableLayout;
		for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
			const rowProps = rowProperties?.find(row => row && row.index === rowIndex + 1);
			const columnValues = [];
			for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
				columnValues.push(renderCell(rowIndex, columnIndex));
			}
			const minHeight = InputValueSourceResolver.getSourceNumberValue(
				rowProps?.minHeight,
				element,
				TABLE_LAYOUT_PROPERTY_PATH.rowMinHeight
			);

			rowValues.push(
				<StyledTr key={rowIndex} height={minHeight ? MM_TO_PX(minHeight) : undefined}>
					{columnValues}
				</StyledTr>
			);
		}
		return rowValues;
	}, [element, renderCell, tableLayout]);

	if (!reference.dimensions?.minWidth) {
		throw Error("placeableReference without dimensions");
	}

	const showTable = tableLayout?.rowCount && tableLayout.columnCount;
	return (
		<div style={styles}>
			{showTable ? (
				<StyledTable width={MM_TO_PX(reference.dimensions.minWidth.value || 0)}>
					<tbody>{tableRows}</tbody>
				</StyledTable>
			) : (
				element.type
			)}
		</div>
	);
};

interface EmptyCellProps extends BaseCellProps {
	tableLayout: DeepPartial<TableLayoutProperties> | undefined;
}

const EmptyCell = (props: EmptyCellProps) => {
	const { row, col, columnProps, element, borderProperties, tableLayout, floatingButton, disabled } = props;

	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const textElementItems = useTextElementItems(localizer);

	const [addButtonCoordinate, setAddButtonCoordinate] = React.useState<CellCoordinate | undefined>();
	const [calloutCoordinate, setCalloutCoordinate] = React.useState<CellCoordinate | undefined>();
	const [buttonElement, setButtonElement] = React.useState<HTMLElement | null>(null);

	const buttonRefCallback = React.useCallback((ref: HTMLButtonElement | null) => {
		if (ref) {
			setButtonElement(ref);
		}
	}, []);

	const onSelectChange = React.useCallback(
		(type: "" | ElementType.Text) => {
			if (tableLayout && type !== "") {
				const newId = nanoid();
				const updatedElement: PartialTableLayout = {
					...element,
					tableLayout: {
						...tableLayout,
						cells: [
							...(tableLayout.cells || []),
							{
								id: nanoid(),
								row,
								column: col,
								refId: newId,
							},
						],
					},
				};
				const defaultTextProperties =
					InputSourceGenerator.generateInputSource<Required<Text>>("textProperties").textProperties;
				let newTextElement: PartialText = {
					id: newId,
					type,
					textProperties: {
						id: defaultTextProperties.id,
						textStyleId: defaultTextProperties.textStyleId,
						alignment: defaultTextProperties.alignment,
					},
				};
				function createInheritedGroup(path: string) {
					return {
						id: nanoid(),
						source: PossibleInputSource.INHERITED,
						path: InputValueSourceResolver.getInputSourceMetadata(newTextElement, path).path,
						reference: updatedElement.id,
					};
				}

				newTextElement = {
					...newTextElement,
					borderProperties: {
						id: nanoid(),
						borderStyle: createInheritedGroup(BORDER_PROPERTIES_PATH.borderStyle),
						borderWidth: createInheritedGroup(BORDER_PROPERTIES_PATH.borderWidth),
						borderColor: createInheritedGroup(BORDER_PROPERTIES_PATH.borderColor),
					},
				};

				dispatch(
					InteractionLogActions.start({
						description: RESOURCE_KEYS.interaction.tableLayout.selectCellElement,
						region: StageRegion.DEFAULT,
						transactionLogActions: [
							TransactionLogStateActions.updatePrintModelElements({
								data: [newTextElement, updatedElement],
							}),
						],
						affectedItems: [
							{
								type: "printModelElement",
								id: updatedElement.id,
							},
						],
					})
				);
			}
			setCalloutCoordinate(undefined);
		},
		[col, dispatch, element, row, tableLayout]
	);

	const showButton = addButtonCoordinate?.row === row && addButtonCoordinate?.col === col;
	const showCallout = buttonElement !== null && calloutCoordinate?.row === row && calloutCoordinate?.col === col;

	return (
		<StyledTdEmpty
			onMouseEnter={() => setAddButtonCoordinate({ row, col })}
			onMouseLeave={() => setAddButtonCoordinate(undefined)}
			width={InputValueSourceResolver.getSourceNumberValue(
				columnProps?.width,
				element,
				TABLE_LAYOUT_PROPERTY_PATH.columnWidth
			)}
			borderProp={borderProperties}
		>
			{showButton && !disabled && (
				<Button
					buttonRef={buttonRefCallback}
					onClick={() => setCalloutCoordinate({ row, col })}
					icon={<Icon size="big">add_box</Icon>}
				/>
			)}
			{showCallout && (
				<div onDoubleClick={e => e.stopPropagation()}>
					<Callout
						referenceElement={buttonElement}
						closeOnClickReferenceElement={false}
						onClose={() => setCalloutCoordinate(undefined)}
						header={{
							title: <p>{localizer(RESOURCE_KEYS.elements.tableLayout.selectContentType)}</p>,
						}}
					>
						<CustomSelect items={textElementItems} onValueChanged={onSelectChange} />
					</Callout>
				</div>
			)}
			<StyledActionsWrapper>{floatingButton}</StyledActionsWrapper>
		</StyledTdEmpty>
	);
};

interface FilledCellActionsWrapperProps {
	onEditClick: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
	onDeleteClick: (event: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}

export const FilledCellActionsWrapper = (props: FilledCellActionsWrapperProps) => {
	const localizer = PrintLocalizer.useLocalizer();
	const { onEditClick, onDeleteClick } = props;

	return (
		<>
			<Button
				id="edit-button"
				onClick={onEditClick}
				icon={<Icon>edit</Icon>}
				title={localizer(RESOURCE_KEYS.button.edit)}
			/>
			<Button
				id="delete-button"
				onClick={onDeleteClick}
				icon={<Icon variant="error">disabled_by_default</Icon>}
				title={localizer(RESOURCE_KEYS.button.delete)}
			/>
		</>
	);
};

const BadgeErrorCell = ({ validationCounter }: { validationCounter: ValidationCounter }) => {
	return (
		<BadgeGroup
			standalone
			validationCounter={validationCounter}
			errorTitle={useErrorTitleElement("error", validationCounter)}
			warningTitle={useErrorTitleElement("error", validationCounter)}
		/>
	);
};

export interface FilledCellProps extends BaseCellProps {
	cellRef: DeepPartial<TableLayoutCellReference>;
	isNestedElement?: boolean;
}

export const FilledCell = (props: FilledCellProps) => {
	const { row, col, columnProps, element, cellRef, borderProperties, isNestedElement, disabled, floatingButton } =
		props;

	const { setOuterContextMenu, setShowContextMenu } = React.useContext(ContextMenuContext);
	const localizer = PrintLocalizer.useLocalizer();

	const dispatch = useDispatch();
	const { tab, entityId, mode } = useSelector(NavigationSelectors.canvasNavigationContext);
	const detailDataRefId = useSelector(NavigationSelectors.currentElementForm)?.id;

	const cellElement = useSelector((state: PrintEngineState) =>
		PrintEngineSelectors.printModelElement(state, cellRef.refId || "")
	);
	const validationCounter = useSelector((state: PrintEngineState) =>
		ValidationSelectors.elementValidationCounterById(state, cellRef.refId)
	);

	const [actionsWrapperCoordinate, setActionsWrapperCoordinate] = React.useState<CellCoordinate | undefined>();

	const onCellEditClick = React.useCallback(() => {
		dispatch(DetailViewActions.openElementForm(cellElement.id));
	}, [cellElement, dispatch]);

	const removeCell = React.useCallback(() => {
		const tableLayout = element.tableLayout;
		if (tableLayout) {
			const updatedElement = {
				...element,
				tableLayout: {
					...tableLayout,
					cells: tableLayout.cells?.filter(el => el.row !== row || el.column !== col),
				},
			};
			setOuterContextMenu([]);
			setShowContextMenu(false);

			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.tableLayout.removeCell,
					region: "stage",
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
					affectedItems: [
						{
							type: "printModelElement",
							id: cellRef.refId ?? "",
						},
					],
				})
			);

			if (entityId && detailDataRefId && detailDataRefId === cellRef.refId) {
				dispatch(NavigationActions.setDetailForm({ tab, entityId, mode, form: undefined }));
				dispatch(NavigationActions.setSelectedElement({ tab, entityId, mode, elementId: undefined }));
			}
		}
	}, [
		cellRef.refId,
		col,
		detailDataRefId,
		dispatch,
		element,
		entityId,
		mode,
		row,
		setOuterContextMenu,
		setShowContextMenu,
		tab,
	]);

	const tableLayoutContextMenu = React.useMemo(
		() => [
			<List.Item
				key="edit-cell"
				text={localizer(RESOURCE_KEYS.elements.tableLayout.editCell)}
				onClick={onCellEditClick}
				graphic={<Icon>edit</Icon>}
			/>,
			<List.Item
				key="delete-cell"
				text={localizer(RESOURCE_KEYS.elements.tableLayout.deleteCell)}
				onClick={removeCell}
				graphic={<Icon variant="error">delete_sweep</Icon>}
			/>,
		],
		[localizer, onCellEditClick, removeCell]
	);

	const handleMouseEnter = React.useCallback(() => {
		setOuterContextMenu(tableLayoutContextMenu);
		setActionsWrapperCoordinate({ row, col });
	}, [col, row, setOuterContextMenu, tableLayoutContextMenu]);

	const handleMouseLeave = React.useCallback(() => {
		setOuterContextMenu([]);
		setActionsWrapperCoordinate(undefined);
	}, [setOuterContextMenu]);

	const showActionsWrapper = actionsWrapperCoordinate?.row === row && actionsWrapperCoordinate?.col === col;
	const cellElementBorderProps = PartialText.isInstance(cellElement) ? cellElement.borderProperties : undefined;

	React.useEffect(() => {
		if (showActionsWrapper) {
			setOuterContextMenu(tableLayoutContextMenu);
		}
	}, [detailDataRefId, setOuterContextMenu, showActionsWrapper, tableLayoutContextMenu]);

	return (
		<StyledTdFilled
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			width={InputValueSourceResolver.getSourceNumberValue(
				columnProps?.width,
				element,
				TABLE_LAYOUT_PROPERTY_PATH.columnWidth
			)}
			verticalAlignment={columnProps?.verticalAlignment}
			borderProps={cellElementBorderProps}
			tableBorderProps={borderProperties}
		>
			<LayoutElementContainer reference={cellRef} isLayoutElement={true} />
			{!isNestedElement && !disabled && (
				<StyledActionsWrapper>
					{showActionsWrapper ? (
						<FilledCellActionsWrapper onEditClick={onCellEditClick} onDeleteClick={removeCell} />
					) : (
						<BadgeErrorCell validationCounter={validationCounter} />
					)}
					{floatingButton}
				</StyledActionsWrapper>
			)}
		</StyledTdFilled>
	);
};

const useTextElementItems = (localizer: ILocalizer) => {
	return [
		{ label: "", value: "" },
		{ label: localizer(RESOURCE_KEYS.editor.element.Text), value: ElementType.Text },
	];
};
