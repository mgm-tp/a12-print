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

import { PartialSwitch, SwitchCase } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { DeepPartialErrorMap, ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";
import { Message } from "@com.mgmtp.a12.widgets/widgets-core";
import { addPrefix } from "@com.mgmtp.a12.widgets/widgets-core/lib/common/index.js";
import { StageRegion } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";

import { EditorConst } from "../../constant/editor.js";
import { PrintEngineState } from "../../store/root-reducer.js";
import { ValidationSelectors } from "../../redux/validation/selectors.js";
import { SWITCH_CASE_ELEMENT_WIDTH_PERCENTAGE, SWITCH_CASE_MAX_ELEMENT_HEIGHT } from "../../constant/switch.js";
import { SWITCH_CASE_CARD } from "../../constant/drag.js";
import { useResizeObserver } from "../../hooks/use-resize-observer.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { InteractionLogActions, TransactionLogStateActions } from "../../redux/index.js";

import { DragListItemWrapper } from "../drag-and-drop/index.js";

import { PartialSwitchCase } from "./switch-stage.js";
import { SwitchCaseCard } from "./SwitchCaseCard.js";

interface SwitchCaseProps {
	switchElement: PartialSwitch;
}

const { MM_TO_PX } = EditorConst;

export const SwitchCaseList = ({ switchElement }: SwitchCaseProps) => {
	const localizer = PrintLocalizer.useLocalizer();
	const dispatch = useDispatch();

	const switchErrors = useSelector((state: PrintEngineState) =>
		ValidationSelectors.switchElement(state, switchElement.id)
	)?.switch;

	const getPreconditionError = switchCasePreconditionErrorMapGetter(switchErrors?.cases);

	const { observe, entry } = useResizeObserver();
	const containerWidth = entry?.target.clientWidth;
	const switchElementCases = switchElement.switch?.cases;

	const scale = React.useMemo(() => {
		const areaWidth = MM_TO_PX(switchElement.switch?.dimensions?.width?.value || 0);
		const areaHeight = MM_TO_PX(switchElement.switch?.dimensions?.height?.value || 0);

		let scaleRatio =
			containerWidth && containerWidth * (SWITCH_CASE_ELEMENT_WIDTH_PERCENTAGE / 100) < areaWidth
				? (containerWidth * (SWITCH_CASE_ELEMENT_WIDTH_PERCENTAGE / 100)) / areaWidth
				: 1;

		if (
			MM_TO_PX(switchElement.switch?.dimensions?.height?.value || 0) * scaleRatio >
			SWITCH_CASE_MAX_ELEMENT_HEIGHT
		) {
			scaleRatio = SWITCH_CASE_MAX_ELEMENT_HEIGHT / areaHeight;
		}
		return scaleRatio;
	}, [
		containerWidth,
		switchElement.switch?.dimensions?.height?.value,
		switchElement.switch?.dimensions?.width?.value,
	]);

	const setTableData = React.useCallback(
		(newTableData: PartialSwitchCase[], description: string) => {
			dispatch(
				InteractionLogActions.start({
					region: StageRegion.SWITCH,
					description,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({
							data: [
								{
									...switchElement,
									switch: {
										id: nanoid(),
										...switchElement.switch,
										cases: newTableData,
									},
								},
							],
						}),
					],
				})
			);
		},
		[dispatch, switchElement]
	);

	const deleteBodyRow = React.useCallback(
		(rowIndex: number) => {
			if (!switchElementCases) {
				return;
			}

			setTableData(
				switchElementCases.filter((_elData, elIndex) => elIndex !== rowIndex),
				RESOURCE_KEYS.interaction.form.switchFormContainer.removeCase
			);
		},
		[setTableData, switchElementCases]
	);

	const setRowData = React.useCallback(
		(rowData: PartialSwitchCase) => {
			if (!switchElementCases) {
				return;
			}

			setTableData(
				switchElementCases.map(_elData => (_elData.id === rowData.id ? rowData : _elData)),
				RESOURCE_KEYS.interaction.form.switchFormContainer.editCasePrecondition
			);
		},
		[setTableData, switchElementCases]
	);

	const handleReorderSwitchCase = React.useCallback(
		(_: PartialSwitchCase, currentIndex: number, targetIndex: number) => {
			if (!switchElementCases) {
				return;
			}
			const clonedCases = [...switchElementCases];
			const currentRow = clonedCases[currentIndex];
			clonedCases[currentIndex] = clonedCases[targetIndex];
			clonedCases[targetIndex] = currentRow;

			setTableData(clonedCases, RESOURCE_KEYS.interaction.form.switchFormContainer.reorderCase);
		},
		[setTableData, switchElementCases]
	);

	if (!switchElementCases?.length) {
		return (
			<Message className={addPrefix("-u-text-center")}>
				{localizer(RESOURCE_KEYS.elementForm.switch.emptyMessage)}
			</Message>
		);
	}

	return (
		<div ref={observe}>
			{switchElementCases.map((row, index) => {
				return (
					<DragListItemWrapper
						key={row.id}
						onMoveItem={handleReorderSwitchCase}
						index={index}
						item={{
							...row,
							scale,
						}}
						type={SWITCH_CASE_CARD}
						triggerPoint={0.2}
					>
						<SwitchCaseCard
							row={row}
							deleteBodyRow={() => deleteBodyRow(index)}
							setRowData={setRowData}
							scale={scale}
							documentModel={switchElement.switch?.model}
							validationErrors={getPreconditionError(index)}
						/>
					</DragListItemWrapper>
				);
			})}
		</div>
	);
};

function switchCasePreconditionErrorMapGetter(switchCaseErrorMap?: DeepPartialErrorMap<SwitchCase>[]) {
	return (rowIndex: number) => switchCaseErrorMap?.[rowIndex]?.precondition?.[ErrorSeverity.ERROR];
}
