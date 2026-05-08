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
import { useSelector } from "react-redux";

import { PrintEngineState } from "../../../store/root-reducer.js";
import { ValidationSelectors } from "../../../redux/validation/selectors.js";
import { BadgeGroup } from "../../badge/BadgeGroup.js";
import { useErrorTitleElement } from "../../../hooks/index.js";

import { DecoratorTypes, DraftDecoratorComponentPropsExtended } from "../type.js";

import { StyledDecorationSpan, StyledEntityErrorBadgeSpan } from "./Decorator.styled.js";

const CUSTOM_ENTITY_BADGE_HEIGHT = { top: -16, right: 0 };

export interface DecorationProps {
	type: DecoratorTypes;
	props: DraftDecoratorComponentPropsExtended;
	onDecoratorClicked: (type: DecoratorTypes, props: DraftDecoratorComponentPropsExtended) => void;
}

export const Decorator = ({ type, props, onDecoratorClicked }: DecorationProps) => {
	const { children, contentState, entityKey } = props;
	const formValidationCounter = useSelector((state: PrintEngineState) =>
		ValidationSelectors.elementValidationCounterById(state, contentState.getEntity(entityKey)?.getData()?.id)
	);

	const errorTitle = useErrorTitleElement("error", formValidationCounter);
	const warningTitle = useErrorTitleElement("warning", formValidationCounter);
	const showBadge = formValidationCounter.error + formValidationCounter.warning > 0;

	return (
		<StyledDecorationSpan type={type} onClick={() => onDecoratorClicked(type, props)}>
			{children}
			{showBadge && (
				<StyledEntityErrorBadgeSpan>
					<BadgeGroup
						validationCounter={formValidationCounter}
						errorTitle={errorTitle}
						warningTitle={warningTitle}
						customHeight={CUSTOM_ENTITY_BADGE_HEIGHT}
						customHeightTiny={CUSTOM_ENTITY_BADGE_HEIGHT}
					/>
				</StyledEntityErrorBadgeSpan>
			)}
		</StyledDecorationSpan>
	);
};
