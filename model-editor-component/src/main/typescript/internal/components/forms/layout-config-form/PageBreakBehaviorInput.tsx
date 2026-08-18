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
	InputSource,
	PageBreakBehavior,
	PartialArea,
	PartialBoundingBox,
	PartialOverride,
	PartialValidPlaceableReference,
	PrintModelEntity,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/lib/input-source/index.js";
import { StageRegion } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/interaction-log.js";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/lib/errors/deep-partial-error-map.js";

import { changeInputSource, changeInputValue } from "../../../utils/input-source-utils.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { InteractionLogActions, TransactionLogStateActions } from "../../../redux/index.js";
import { ValidationSelectors } from "../../../redux/validation/selectors.js";
import { PrintEngineState } from "../../../store/root-reducer.js";
import { useInheritedPageBreakResolver } from "../../../hooks/use-inherited-page-break-resolver.js";

import { SourceSelect } from "../custom-base-input-components/index.js";

interface PageBreakBehaviorInputProps {
	reference: PartialValidPlaceableReference;
	infoMessage?: string;
}

export const PageBreakBehaviorInput = ({ reference, infoMessage }: PageBreakBehaviorInputProps) => {
	const localizer = PrintLocalizer.useLocalizer();
	const dispatch = useDispatch();

	const currentWrapper = useSelector(PrintEngineSelectors.currentWrapperContainer);
	const currentContainer = useSelector(PrintEngineSelectors.currentContainerElement);
	const currentWrapperContext = useSelector(PrintEngineSelectors.currentWrapperContext);
	const placeableReferenceErrorMap = useSelector((state: PrintEngineState) =>
		ValidationSelectors.currentPlaceableReference(state, reference?.id || "")
	);
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();

	const resolveInheritedValue = useInheritedPageBreakResolver();

	const container = React.useMemo(() => {
		if (
			currentWrapper &&
			(PartialArea.isInstance(currentWrapper) ||
				PartialBoundingBox.isInstance(currentWrapper) ||
				PartialOverride.isInstance(currentWrapper))
		) {
			return currentWrapper;
		}
		return currentContainer;
	}, [currentContainer, currentWrapper]);

	const updatePageBreakBehavior = React.useCallback(
		(pageBreakBehavior: Partial<InputSource<PageBreakBehavior>> & PrintModelEntity) => {
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.relativeLayout.changePageBreakBehavior,
					region: StageRegion.LAYOUT,
					transactionLogActions: [
						TransactionLogStateActions.updateReferenceElement({
							data: {
								...reference,
								pageBreakBehavior,
							},
						}),
					],
				})
			);
		},
		[reference, dispatch]
	);

	const onSourceChange = React.useCallback(
		(source: PossibleInputSource, path: string) => {
			const inputSource = changeInputSource(source, path, reference.pageBreakBehavior);

			if (source === PossibleInputSource.INHERITED) {
				const referenceId = currentWrapperContext?.placeableReference?.id;
				if (!referenceId) {
					throw new Error("PageBreakBehaviorInput: No placeable reference selected for INHERITED source.");
				}
				inputSource.reference = referenceId;
			} else {
				inputSource.reference = undefined;
			}

			updatePageBreakBehavior(inputSource);
		},
		[reference.pageBreakBehavior, updatePageBreakBehavior, currentWrapperContext]
	);

	const errorMessage = React.useMemo(() => {
		return errorMessageLocalizer(placeableReferenceErrorMap?.pageBreakBehavior?.[ErrorSeverity.ERROR]);
	}, [errorMessageLocalizer, placeableReferenceErrorMap?.pageBreakBehavior]);

	const pageBreakBehaviorItems = usePageBreakBehaviorItems();

	if (!container) {
		throw new Error("PageBreakBehaviorInput: No container available.");
	}

	return (
		<SourceSelect
			id="page-break-behavior-input"
			label={localizer(RESOURCE_KEYS.elementForm.layoutConfig.pageBreakBehavior.input)}
			value={reference.pageBreakBehavior?.value}
			items={pageBreakBehaviorItems}
			sourceProperties={{
				element: container,
				property: "elementReferences.pageBreakBehavior",
				onSourceChange,
				inheritedValueResolver: resolveInheritedValue,
				inputSource: reference.pageBreakBehavior,
			}}
			onValueChanged={(value: PageBreakBehavior) =>
				reference.pageBreakBehavior &&
				updatePageBreakBehavior(changeInputValue(value, reference.pageBreakBehavior))
			}
			errorMessage={errorMessage}
			infoMessage={infoMessage}
		/>
	);
};

const usePageBreakBehaviorItems = () => {
	const localizer = PrintLocalizer.useLocalizer();

	return React.useMemo(
		(): { label: string; value: PageBreakBehavior }[] => [
			{ label: localizer(RESOURCE_KEYS.elementOptions.pageBreakBehavior.allow), value: PageBreakBehavior.ALLOW },
			{ label: localizer(RESOURCE_KEYS.elementOptions.pageBreakBehavior.avoid), value: PageBreakBehavior.AVOID },
		],
		[localizer]
	);
};
