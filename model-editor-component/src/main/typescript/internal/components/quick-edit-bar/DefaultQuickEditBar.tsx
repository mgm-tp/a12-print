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
import { useCallback, useMemo, FocusEvent, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Button } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/index.js";
import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/index.js";
import { StageRegion } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import {
	PartialImage,
	PartialOverride,
	PartialValidPlaceableReference,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { EditorConst } from "../../constant/editor.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { DetailViewActions } from "../../redux/detail-view/actions.js";
import { UpdateElementsTransactionLogAction, TransactionLogStateActions } from "../../redux/index.js";
import { InteractionLogActions } from "../../redux/interaction-log/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { PrintEngineState } from "../../store/root-reducer.js";
import { ElementsUtils } from "../../utils/elements-utils.js";
import { changeMmMeasureValue } from "../../utils/measure-utils.js";
import { EditorUtils } from "../../utils/editor-utils.js";
import { useIsElementInsideStage, useUpdateDimensionsHandler } from "../../hooks/index.js";

import { EditorContext } from "../editor-stage/editor-context.js";
import { getRefImageDimensions } from "../forms/image-form-container/ImageGeneralProperties.js";

import { StyledFlexGroupContainer, StyledOuterContainer } from "./shares/QuickEditBar.styled.js";
import { QuickNumberInput } from "./shares/QuickNumberInput.js";

const { MM_TO_CM, CM_TO_MM } = EditorConst;

interface DimensionInput {
	icon: string;
	placeholder: string;
	label: string;
	dimensionKey: string;
}

interface QuickEditBarProps {
	selected: string[];

	deleteSelectedEls(): void;
	groupSelectedEls(): void;
}

export const DefaultQuickEditBar = ({ selected, deleteSelectedEls, groupSelectedEls }: QuickEditBarProps) => {
	const { elementReferences, setCopyElements } = useContext(EditorContext);

	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const isAnyOverrideSelected = useSelector((state: PrintEngineState) =>
		PrintEngineSelectors.isAnyOverrideSelected(state, selected)
	);
	const hasOnlyContainerElement = useSelector((state: PrintEngineState) =>
		PrintEngineSelectors.hasOnlyContainerElement(state, selected)
	);
	const editorDimensions = useSelector(PrintEngineSelectors.editorDimensions);

	const mainTarget = useMemo<PartialValidPlaceableReference | null>(() => {
		if (selected.length === 0) return null;
		const selectedEls = elementReferences.filter(el => selected.includes(el.refId));
		if (selectedEls.length === 0) return null;
		return selectedEls.reduce((res, next) =>
			EditorUtils.isCloserToTopLeft(res.position, next.position) ? res : next
		);
	}, [elementReferences, selected]);

	const refElement = useSelector((state: PrintEngineState) =>
		mainTarget?.refId ? PrintEngineSelectors.printModelElement(state, mainTarget.refId) : undefined
	);

	const isElementInsideStage = useIsElementInsideStage();
	const updateElementDimensions = useUpdateDimensionsHandler();

	const isFixedHeightElement = useMemo(
		() => (refElement ? ElementsUtils.isFixedHeightElement(refElement) : false),
		[refElement]
	);

	const onValueBlur = useCallback(
		(newVal: number, type: string, newMainTarget: PartialValidPlaceableReference | null) => {
			if (!newMainTarget || !refElement) {
				return;
			}

			if (["x", "y"].includes(type) && !isElementInsideStage(newMainTarget)) {
				return;
			}

			const newElementReferences = elementReferences
				.filter(el => el.refId !== newMainTarget.refId)
				.concat([newMainTarget]);

			if (isFixedHeightElement && (type === "height" || type === "width")) {
				updateElementDimensions({
					description: RESOURCE_KEYS.interaction.quickEditBar.changeDimension,
					elementReferences: newElementReferences,
					targetElement: refElement,
					dimensions: { [type]: newVal },
				});
				return;
			}

			const actions: UpdateElementsTransactionLogAction[] = [
				TransactionLogStateActions.updateReferenceElements({
					data: elementReferences.filter(el => el.refId !== newMainTarget.refId).concat([newMainTarget]),
				}),
			];

			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.quickEditBar.changePosition,
					region: StageRegion.DEFAULT,
					transactionLogActions: actions,
				})
			);
		},
		[dispatch, elementReferences, isElementInsideStage, isFixedHeightElement, refElement, updateElementDimensions]
	);

	const onValueChange = useCallback(
		(inputNumber: number | undefined, type: string) => {
			if (!mainTarget || !refElement) {
				return;
			}

			const newVal = inputNumber ? Math.floor(CM_TO_MM(inputNumber)) : 0;
			return {
				...mainTarget,
				position: {
					...mainTarget.position,
					x: type === "x" ? changeMmMeasureValue(newVal, mainTarget.position.x) : mainTarget.position.x,
					y: type === "y" ? changeMmMeasureValue(newVal, mainTarget.position.y) : mainTarget.position.y,
				},
				dimensions: PartialImage.isInstance(refElement)
					? {
							...mainTarget.dimensions,
							...getRefImageDimensions(type, newVal, mainTarget, refElement),
						}
					: {
							...mainTarget.dimensions,
							minWidth:
								type === "width"
									? changeMmMeasureValue(newVal, mainTarget.dimensions.minWidth)
									: mainTarget.dimensions.minWidth,
							minHeight:
								type === "height"
									? changeMmMeasureValue(newVal, mainTarget.dimensions.minHeight)
									: mainTarget.dimensions.minHeight,
						},
			};
		},
		[mainTarget, refElement]
	);

	const openDetailEdit = useCallback(() => {
		if (mainTarget) {
			dispatch(DetailViewActions.openElementForm(mainTarget.refId));
		}
	}, [dispatch, mainTarget]);

	const isDisabled = mainTarget === null || (refElement && PartialOverride.isInstance(refElement));
	const DimensionInputs = useDimensionInputs().map(({ icon, label, dimensionKey, placeholder }) => {
		const editorHeight = editorDimensions.minHeight.value;
		const editorWidth = editorDimensions.minWidth.value;
		const verticalPageOffset = !mainTarget
			? 0
			: editorHeight * EditorUtils.getRealPage(mainTarget.position.y.value, editorHeight);

		const value = isDisabled
			? undefined
			: String(
					MM_TO_CM(
						dimensionKey === "width"
							? mainTarget.dimensions.minWidth.value
							: dimensionKey === "height"
								? mainTarget.dimensions.minHeight.value
								: dimensionKey === "x"
									? mainTarget.position.x.value
									: mainTarget.position.y.value - verticalPageOffset
					)
				);

		function onBlur(e: FocusEvent<HTMLInputElement>) {
			let newValue = Number(e.target.value);

			if (dimensionKey === "y") {
				const maxValue = MM_TO_CM(editorDimensions.minHeight.value);
				newValue = newValue > maxValue ? maxValue - 0.1 : newValue;
				newValue += MM_TO_CM(verticalPageOffset);
			}
			const newMainTarget = onValueChange(newValue, dimensionKey);

			if (!newMainTarget?.dimensions || !newMainTarget.position) {
				return;
			}

			const newVal =
				dimensionKey === "x"
					? newMainTarget?.position.x.value
					: dimensionKey === "y"
						? newMainTarget?.position.y.value
						: dimensionKey === "width"
							? newMainTarget?.dimensions.minWidth.value
							: newMainTarget?.dimensions.minHeight.value;
			onValueBlur(newVal, dimensionKey, newMainTarget);
		}

		return (
			<QuickNumberInput
				key={label}
				label={label}
				disable={isDisabled}
				icon={icon}
				value={value}
				onBlur={onBlur}
				inputProps={{
					max: dimensionKey === "x" ? editorWidth : undefined,
				}}
				placeholder={placeholder}
				readonly={dimensionKey === "height" ? !isFixedHeightElement : false}
			/>
		);
	});

	const isDisabledWithSelectionCheck = isAnyOverrideSelected || isDisabled;
	return (
		<StyledOuterContainer>
			{DimensionInputs}
			<StyledFlexGroupContainer>
				<Button
					secondary
					destructive
					title={localizer(RESOURCE_KEYS.editor.topMenu.deleteElement)}
					icon={<Icon>delete</Icon>}
					onClick={deleteSelectedEls}
					disabled={isDisabledWithSelectionCheck}
				/>
				<Button
					secondary
					title={localizer(RESOURCE_KEYS.editor.topMenu.copyElement)}
					icon={<Icon>content_copy</Icon>}
					disabled={isDisabledWithSelectionCheck}
					onClick={() => setCopyElements(elementReferences.filter(dragEl => selected.includes(dragEl.refId)))}
				/>
				<Button
					secondary
					title={localizer(RESOURCE_KEYS.editor.topMenu.groupElement)}
					icon={<Icon>padding</Icon>}
					disabled={isDisabledWithSelectionCheck || hasOnlyContainerElement}
					onClick={groupSelectedEls}
				/>
			</StyledFlexGroupContainer>
			<Button
				title={localizer(RESOURCE_KEYS.editor.topMenu.openElement)}
				secondary
				icon={<Icon>edit_note</Icon>}
				onClick={openDetailEdit}
				disabled={isDisabled}
			/>
		</StyledOuterContainer>
	);
};

function useDimensionInputs(): DimensionInput[] {
	const localizer = PrintLocalizer.useLocalizer();

	return useMemo(
		() => [
			{
				icon: "north",
				placeholder: localizer(RESOURCE_KEYS.editor.topMenu.quickEditBar.y.placeholder),
				label: localizer(RESOURCE_KEYS.editor.topMenu.quickEditBar.y.label),
				dimensionKey: "y",
			},
			{
				icon: "west",
				placeholder: localizer(RESOURCE_KEYS.editor.topMenu.quickEditBar.x.placeholder),
				label: localizer(RESOURCE_KEYS.editor.topMenu.quickEditBar.x.label),
				dimensionKey: "x",
			},
			{
				icon: "settings_ethernet",
				placeholder: localizer(RESOURCE_KEYS.editor.topMenu.quickEditBar.width.placeholder),
				label: localizer(RESOURCE_KEYS.editor.topMenu.quickEditBar.width.label),
				dimensionKey: "width",
			},
			{
				icon: "height",
				placeholder: localizer(RESOURCE_KEYS.editor.topMenu.quickEditBar.height.placeholder),
				label: localizer(RESOURCE_KEYS.editor.topMenu.quickEditBar.height.label),
				dimensionKey: "height",
			},
		],
		[localizer]
	);
}
