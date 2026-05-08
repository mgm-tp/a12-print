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

import { PartialArea } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { PrintEngineState } from "../../store/root-reducer.js";
import { ValidationSelectors } from "../../redux/validation/selectors.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { EditorConst } from "../../constant/editor.js";

import { Area } from "../elements/area/index.js";
import { BadgeGroup } from "../badge/BadgeGroup.js";
import { OpenWrapperStageButton } from "../element-container/OpenWrapperStageButton.js";
import { LayoutElementContainer } from "../element-container/LayoutElementContainer.js";

import {
	ErrorBadgeContainer,
	StyledFloatingButtonContainer,
	SwitchAreaInnerContainer,
	SwitchAreaOuterContainer,
} from "./SwitchAreaContainer.styled.js";

interface SwitchAreaContainerProps {
	areaElement: PartialArea;
	scale?: number;
}

export const SwitchAreaContainer = ({ areaElement, scale = 1 }: SwitchAreaContainerProps) => {
	const areaValidationCounter = useSelector((state: PrintEngineState) =>
		ValidationSelectors.elementValidationCounterById(state, areaElement.id)
	);
	const currentWrapperContext = useSelector(PrintEngineSelectors.currentWrapperContext);

	const styles = React.useMemo(
		() => ({
			height: areaElement.area?.dimensions?.height
				? EditorConst.MM_TO_PX(areaElement.area?.dimensions?.height?.value || 0)
				: undefined,
			width: areaElement.area?.dimensions?.width
				? EditorConst.MM_TO_PX(areaElement.area?.dimensions?.width?.value || 0)
				: undefined,
		}),
		[areaElement]
	);

	const reference = currentWrapperContext?.placeableReference;

	return (
		<SwitchAreaOuterContainer>
			<SwitchAreaInnerContainer scale={scale} dimensions={areaElement.area?.dimensions}>
				<Area element={areaElement} styles={styles} ElementContainer={LayoutElementContainer} />
			</SwitchAreaInnerContainer>
			<StyledFloatingButtonContainer>
				<OpenWrapperStageButton element={areaElement} reference={reference} />
			</StyledFloatingButtonContainer>
			<ErrorBadgeContainer>
				<BadgeGroup validationCounter={areaValidationCounter} standalone />
			</ErrorBadgeContainer>
		</SwitchAreaOuterContainer>
	);
};
