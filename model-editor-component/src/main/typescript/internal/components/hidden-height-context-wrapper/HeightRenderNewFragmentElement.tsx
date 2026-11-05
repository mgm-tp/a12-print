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
import { useDispatch } from "react-redux";
import { nanoid } from "nanoid";

import type {
	PartialAnyPrintModelElement,
	PartialValidPlaceableReference,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { GlobalRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { InteractionLogActions, TransactionLogStateActions } from "../../redux/index.js";
import { changeMmMeasureValue, createMmMeasure, ElementsUtils } from "../../utils/index.js";
import { RESOURCE_KEYS } from "../../localization/index.js";
import { EditorConst } from "../../constant/editor.js";
import { assertExists } from "../../utils/type-utils.js";

import { HeightElementContainer } from "./HeightElementContainer.js";
import { StyledHeightElement } from "./HeightRender.styled.js";

export interface NewFragmentElementData {
	element: PartialAnyPrintModelElement;
}

interface HeightRenderNewFragmentElementProps {
	newFragmentElementData: NewFragmentElementData;
	setNewFragmentElementData: React.Dispatch<React.SetStateAction<NewFragmentElementData | undefined>>;
}

export const HeightRenderNewFragmentElement = ({
	newFragmentElementData,
	setNewFragmentElementData,
}: HeightRenderNewFragmentElementProps) => {
	const dispatch = useDispatch();
	const { element } = newFragmentElementData;
	assertExists(element.fragmentDimensions, "Fragment element must have fragmentDimensions set");
	const fragmentDimensions = element.fragmentDimensions;

	const placeable = React.useMemo(
		(): PartialValidPlaceableReference => ({
			id: nanoid(),
			refId: element.id,
			position: { id: nanoid(), x: createMmMeasure(0), y: createMmMeasure(0) },
			dimensions: {
				id: nanoid(),
				minWidth: createMmMeasure(fragmentDimensions.width.value),
				minHeight: createMmMeasure(fragmentDimensions.height.value),
			},
		}),
		[element.id, fragmentDimensions]
	);

	const createNewFragmentElement = React.useCallback(
		(newHeight: number) => {
			setNewFragmentElementData(undefined);
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.editor.createNewElement,
					region: GlobalRegion.SIDEBAR,
					affectedItems: [{ type: "printModelElement", id: element.id }],
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({
							data: [
								{
									...element,
									fragmentDimensions: {
										...fragmentDimensions,
										height: changeMmMeasureValue(newHeight, fragmentDimensions.height),
									},
								},
							],
						}),
					],
				})
			);
		},
		[dispatch, element, fragmentDimensions, setNewFragmentElementData]
	);

	const updateNewHeight = React.useCallback(
		(ref: HTMLDivElement | null) => {
			if (!ref) {
				return;
			}
			createNewFragmentElement(EditorConst.PX_TO_MM(ref.getBoundingClientRect().height));
		},
		[createNewFragmentElement]
	);

	const isMeasurable = !ElementsUtils.isWrapperElement(element) && !ElementsUtils.isChartElement(element);

	React.useEffect(() => {
		if (!isMeasurable) {
			createNewFragmentElement(fragmentDimensions.height.value);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isMeasurable]);

	return isMeasurable ? (
		<StyledHeightElement
			key={element.id}
			dimensions={placeable.dimensions}
			height={ElementsUtils.getFixedElementHeight(element, placeable)}
			style={{ wordBreak: "break-word" }}
		>
			<div ref={updateNewHeight}>
				<HeightElementContainer element={element} reference={placeable} />
			</div>
		</StyledHeightElement>
	) : null;
};
