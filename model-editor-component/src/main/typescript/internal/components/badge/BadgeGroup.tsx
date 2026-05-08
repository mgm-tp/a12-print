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

import { ValidationCounter } from "../../redux/index.js";
import { ValidationSelectors } from "../../redux/validation/selectors.js";

import { ErrorBadge, WarningBadge } from "./ValidationBadge.js";
import { BadgePosition, StyledBadgeGroup } from "./BadgeGroup.styled.js";

interface BadgeGroupProps {
	validationCounter: ValidationCounter;
	errorTitle?: string;
	warningTitle?: string;
	standalone?: boolean;
	customHeight?: { top: number; right: number };
	customHeightTiny?: { top: number; right: number };
	alwaysDescriptive?: boolean;
}

const BADGE_HEIGHT = -14;
const BADGE_HEIGHT_TINY = -6;

export const BadgeGroup = (props: BadgeGroupProps) => {
	const {
		validationCounter,
		errorTitle,
		warningTitle,
		standalone,
		customHeight,
		customHeightTiny,
		alwaysDescriptive,
	} = props;

	const [badgePosition, setBadgePosition] = React.useState<BadgePosition | undefined>(undefined);

	const badgeWrapperRef = React.useRef<HTMLDivElement | null>(null);
	const parentRef = React.useRef<HTMLElement | null>(null);
	const validationInteraction = useSelector(ValidationSelectors.validationInteraction);
	const { error, warning } = validationCounter;
	const { warning: warningType, error: errorType } = validationInteraction;
	const actualErrorType = alwaysDescriptive ? "descriptive" : errorType;

	const positionBadges = React.useCallback(() => {
		if (badgeWrapperRef.current && !standalone) {
			parentRef.current = badgeWrapperRef.current.parentElement;
			if (!parentRef.current) {
				return;
			}

			parentRef.current.style.position = "relative";

			const hasDescriptive =
				(actualErrorType === "descriptive" && error > 0) || (warningType === "descriptive" && warning > 0);

			setBadgePosition({
				top: hasDescriptive
					? (customHeight?.top ?? BADGE_HEIGHT)
					: (customHeightTiny?.top ?? BADGE_HEIGHT_TINY),
				right: hasDescriptive
					? (customHeight?.right ?? BADGE_HEIGHT)
					: (customHeightTiny?.right ?? BADGE_HEIGHT_TINY),
			});
		}
	}, [
		actualErrorType,
		customHeight?.right,
		customHeight?.top,
		customHeightTiny?.right,
		customHeightTiny?.top,
		error,
		standalone,
		warning,
		warningType,
	]);

	React.useEffect(() => {
		if (error > 0 || warning > 0) {
			positionBadges();
		}
	}, [error, positionBadges, warning]);

	return (
		<StyledBadgeGroup badgePosition={badgePosition} ref={badgeWrapperRef} contentEditable={false}>
			<ErrorBadge count={error} type={actualErrorType} standalone title={errorTitle} />
			<WarningBadge
				count={warning}
				type={warningType}
				standalone
				title={warningTitle}
				hidden={warningType === "compact"}
			/>
		</StyledBadgeGroup>
	);
};
