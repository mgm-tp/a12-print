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
import { useMemo } from "react";

import {
	PageBreakBehavior,
	PartialArea,
	PartialBoundingBox,
	PartialOverride,
	PartialSwitch,
	PartialValidPlaceableReference,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { Typography } from "@com.mgmtp.a12.widgets/widgets-core";
import { InputValueSourceResolver } from "@com.mgmtp.a12.print/print-model-api/lib/input-source/index.js";

import { PrintEngineState } from "../../../store/root-reducer.js";
import { useInheritedPageBreakResolver } from "../../../hooks/use-inherited-page-break-resolver.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";

import { PageBreakBehaviorInput } from "./PageBreakBehaviorInput.js";

export const LayoutConfigForm = () => {
	const localizer = PrintLocalizer.useLocalizer();

	const placeableReferences = useSelector(PrintEngineSelectors.elementReferences);
	const currentDetailData = useSelector(PrintEngineSelectors.currentDetailData);
	const currentDetailDatePlaceableRefId = currentDetailData?.placeableRefId;

	const currentReference: PartialValidPlaceableReference | undefined = React.useMemo(() => {
		if (!currentDetailDatePlaceableRefId) {
			return undefined;
		}

		return placeableReferences?.find(ref => ref.id === currentDetailDatePlaceableRefId);
	}, [currentDetailDatePlaceableRefId, placeableReferences]);

	const currentElement = useSelector((state: PrintEngineState) =>
		currentReference?.refId ? PrintEngineSelectors.printModelElement(state, currentReference?.refId) : undefined
	);
	const resolveInheritedValue = useInheritedPageBreakResolver();

	const value = useMemo(() => {
		if (!currentElement) return undefined;

		return InputValueSourceResolver.getSourceStringValue(
			currentReference?.pageBreakBehavior,
			currentElement,
			"elementReferences.pageBreakBehavior",
			resolveInheritedValue
		);
	}, [currentReference?.pageBreakBehavior, currentElement, resolveInheritedValue]);

	const pageBreakMessage = useMemo(() => {
		if (value !== PageBreakBehavior.AVOID || !currentElement) {
			return "";
		}
		const isContainerElement =
			PartialArea.isInstance(currentElement) ||
			PartialBoundingBox.isInstance(currentElement) ||
			PartialOverride.isInstance(currentElement) ||
			PartialSwitch.isInstance(currentElement);

		return localizer(
			isContainerElement
				? RESOURCE_KEYS.elementForm.layoutConfig.pageBreakBehavior.avoidInfoMessage.containerElement
				: RESOURCE_KEYS.elementForm.layoutConfig.pageBreakBehavior.avoidInfoMessage.standaloneElement
		);
	}, [currentElement, value, localizer]);

	return (
		<>
			<Typography.Headline level={3} ariaLevel={3}>
				{localizer(RESOURCE_KEYS.elementForm.layoutConfig.pageBreakBehavior.headline)}
			</Typography.Headline>
			{currentReference && <PageBreakBehaviorInput reference={currentReference} infoMessage={pageBreakMessage} />}
		</>
	);
};
