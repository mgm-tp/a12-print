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

import type {
	PartialAnyPrintModelElement,
	PartialTextProperties,
	PartialBorderProperties,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { PartialTableLayout, isPartialValidPlaceableReference } from "@com.mgmtp.a12.print/print-model-api/model";
import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/input-source";

import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { useTextStyleSelector } from "../../hooks/use-text-style-selector.js";
import { ElementsUtils } from "../../utils/index.js";
import { TEXT_PROPERTIES_PATH } from "../../constant/element-property-path.js";

import { TableLayout } from "../elements/table-layout/TableLayout.js";

import { OpenWrapperStageButton } from "./OpenWrapperStageButton.js";
import type { ElementContainerProps } from "./base.js";
import {
	StyledFloatingButtonContainer,
	StyledHoverContainer,
	StyledHoverDisplay,
} from "./FloatingButtonContainer.styled.js";
import { ElementComponent } from "./ElementComponent.js";
import { RepeatableAreaIconButton } from "./RepeatableAreaIconButton.js";
import { PageBreakAvoidIcon } from "./PageBreakAvoidIcon.js";

export const LayoutElementContainer = ({
	reference,
	isLayoutElement = false,
	isNestedElement = false,
}: ElementContainerProps) => {
	const element: PartialAnyPrintModelElement & {
		textProperties?: PartialTextProperties;
		borderProperties?: PartialBorderProperties;
	} = useSelector((state: PrintEngineState) => PrintEngineSelectors.printModelElement(state, reference.refId || ""));

	const textStyle = useTextStyleSelector(element);
	const fonts = useSelector(PrintEngineSelectors.fonts);

	const styles = React.useMemo(
		() =>
			ElementsUtils.getElementStyles(element, TEXT_PROPERTIES_PATH, reference, isLayoutElement, textStyle, fonts),
		[element, reference, isLayoutElement, textStyle, fonts]
	);

	const offset = React.useMemo(() => {
		const borderProperties = element?.borderProperties;
		return (
			(borderProperties?.borderStyle?.source !== PossibleInputSource.UNSET &&
				borderProperties?.borderWidth?.value) ||
			0
		);
	}, [element]);

	if (PartialTableLayout.isInstance(element)) {
		return (
			<TableLayout
				reference={reference}
				element={element}
				styles={styles}
				isNestedElement={isNestedElement}
				disabled
			/>
		);
	}
	return (
		<>
			<ElementComponent
				reference={reference}
				element={element}
				styles={styles}
				isNestedElement={isNestedElement}
				ElementContainer={LayoutElementContainer}
			/>
			<StyledHoverContainer>
				<StyledFloatingButtonContainer offset={offset} element={element}>
					{!isNestedElement && (
						<>
							<StyledHoverDisplay>
								{ElementsUtils.isWrapperElement(element) &&
									isPartialValidPlaceableReference(reference) && (
										<OpenWrapperStageButton element={element} reference={reference} />
									)}
							</StyledHoverDisplay>
							<RepeatableAreaIconButton element={element} disabled />
						</>
					)}
					{!isNestedElement && isPartialValidPlaceableReference(reference) && (
						<PageBreakAvoidIcon element={element} reference={reference} />
					)}
				</StyledFloatingButtonContainer>
			</StyledHoverContainer>
		</>
	);
};
