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

import {
	PartialAnyPrintModelElement,
	PartialTextProperties,
	PartialBorderProperties,
	PartialTableLayout,
	PartialArea,
	isPartialValidPlaceableReference,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/index.js";
import { Button } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/index.js";

import { PrintEngineSelectors } from "../../store/selectors.js";
import { ElementsUtils } from "../../utils/index.js";
import { PrintEngineState } from "../../store/root-reducer.js";
import { DetailViewActions } from "../../redux/index.js";
import { TEXT_PROPERTIES_PATH } from "../../constant/element-property-path.js";
import { useTextStyleSelector } from "../../hooks/use-text-style-selector.js";

import { TableLayout } from "../elements/index.js";

import { OpenWrapperStageButton } from "./OpenWrapperStageButton.js";
import { StyledFloatingButtonContainer } from "./FloatingButtonContainer.styled.js";
import { ElementContainerProps } from "./base.js";
import { RepeatableAreaIconButton } from "./RepeatableAreaIconButton.js";
import { ElementComponent } from "./ElementComponent.js";

export const DefaultElementContainer = React.memo(
	function DefaultElementContainer({
		reference,
		isHovered,
		isLayoutElement = false,
		isNestedElement = false,
	}: ElementContainerProps) {
		const dispatch = useDispatch();

		const element: PartialAnyPrintModelElement & {
			textProperties?: PartialTextProperties;
			borderProperties?: PartialBorderProperties;
		} = useSelector((state: PrintEngineState) =>
			PrintEngineSelectors.printModelElement(state, reference.refId || "")
		);

		const textStyle = useTextStyleSelector(element);

		const fonts = useSelector(PrintEngineSelectors.fonts);

		const styles = React.useMemo(
			() =>
				ElementsUtils.getElementStyles(
					element,
					TEXT_PROPERTIES_PATH,
					reference,
					isLayoutElement,
					textStyle,
					fonts
				),
			[element, reference, isLayoutElement, textStyle, fonts]
		);
		const hasHideCondition = React.useMemo(
			() => reference.hideConditions && reference.hideConditions.length > 0,
			[reference.hideConditions]
		);
		const offset = React.useMemo(() => {
			const borderProperties = element?.borderProperties;
			return (borderProperties?.borderStyle && borderProperties?.borderWidth) || 0;
		}, [element]);

		const onHideConditionClick = React.useCallback(
			() => dispatch(DetailViewActions.openVisibilityConfig(reference.id)),
			[dispatch, reference.id]
		);

		const wrapperHovered = React.useMemo(
			() => isHovered && ElementsUtils.isWrapperElement(element),
			[element, isHovered]
		);

		const isAreaWithZeroHeight = React.useMemo(
			() => PartialArea.isInstance(element) && !element.area?.dimensions?.height?.value,
			[element]
		);

		const HideConditionButton = React.useCallback(
			() =>
				hasHideCondition ? <Button icon={<Icon>visibility_off</Icon>} onClick={onHideConditionClick} /> : null,
			[hasHideCondition, onHideConditionClick]
		);

		if (PartialTableLayout.isInstance(element)) {
			return (
				<TableLayout
					reference={reference}
					element={element}
					styles={styles}
					hovered={wrapperHovered}
					isNestedElement={isNestedElement}
					floatingButton={<HideConditionButton />}
				/>
			);
		}
		return (
			<>
				<ElementComponent
					reference={reference}
					element={element}
					styles={styles}
					hovered={wrapperHovered}
					isNestedElement={isNestedElement}
					ElementContainer={DefaultElementContainer}
				/>
				{!isNestedElement && (
					<StyledFloatingButtonContainer offset={offset} element={element}>
						{(isAreaWithZeroHeight || wrapperHovered) && isPartialValidPlaceableReference(reference) && (
							<OpenWrapperStageButton element={element} reference={reference} />
						)}
						<HideConditionButton />
						<RepeatableAreaIconButton
							element={element}
							disabled={!isAreaWithZeroHeight}
							buttonAttributes={{
								onDoubleClick: () =>
									reference?.refId && dispatch(DetailViewActions.openElementForm(reference?.refId)),
							}}
						/>
					</StyledFloatingButtonContainer>
				)}
			</>
		);
	},
	(preProps, nextProps) => {
		return (
			preProps.isHovered === nextProps.isHovered &&
			preProps.isLayoutElement === nextProps.isLayoutElement &&
			preProps.isNestedElement === nextProps.isNestedElement &&
			preProps.reference.id === nextProps.reference.id &&
			preProps.reference.refId === nextProps.reference.refId &&
			preProps.reference.hideConditions === nextProps.reference.hideConditions &&
			preProps.reference.dimensions?.minHeight === nextProps.reference.dimensions?.minHeight &&
			preProps.reference.dimensions?.minWidth === nextProps.reference.dimensions?.minWidth
		);
	}
);
