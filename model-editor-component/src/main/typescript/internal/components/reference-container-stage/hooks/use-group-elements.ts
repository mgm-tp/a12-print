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
import { useCallback, useContext } from "react";
import { nanoid } from "nanoid";
import { DeepPartial } from "redux";
import { useDispatch, useSelector } from "react-redux";

import {
	AffectedItem,
	AffectedItemType,
	StageRegion,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/interaction-log.js";
import {
	ElementType,
	InputSource,
	isPartialSection,
	isPartialWatermark,
	Measure,
	PageBreakBehavior,
	PartialArea,
	PartialValidPlaceableReference,
	PrintModelEntity,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/lib/input-source/input-source.js";
import { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";

import { EditorContext } from "../../editor-stage/editor-context.js";
import { InteractionLogActions, TransactionLogStateActions } from "../../../redux/index.js";
import { RESOURCE_KEYS } from "../../../localization/keys.js";
import { changeMmMeasureValue, createPlainMmMeasure } from "../../../utils/measure-utils.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { ElementsUtils } from "../../../utils/index.js";
import { useGetSectionOffset } from "../../../hooks/use-get-section-offset.js";

export const useGroupElements = () => {
	const { elementReferences } = useContext(EditorContext);
	const dispatch = useDispatch();
	const currentContainer = useSelector(PrintEngineSelectors.currentContainerElement);
	const currentWrapperContainer = useSelector(PrintEngineSelectors.currentWrapperContainer);
	const wrappers = useSelector(PrintEngineSelectors.wrappers);

	const getSectionOffset = useGetSectionOffset();

	const editorDimensions = useSelector(PrintEngineSelectors.editorDimensions);

	const createAffectedItem = useCallback((): AffectedItem => {
		if (currentWrapperContainer) {
			return {
				id: currentWrapperContainer.id,
				type: "printModelElement",
			};
		}

		if (!currentContainer) {
			throw new Error("No current container found for grouping elements");
		}

		let type: AffectedItemType = "segment";
		if (isPartialSection(currentContainer)) {
			type = "section";
		} else if (isPartialWatermark(currentContainer)) {
			type = "watermark";
		}

		return {
			id: currentContainer?.id,
			type,
		};
	}, [currentContainer, currentWrapperContainer]);

	return useCallback(
		(selected: string[]) => {
			if (!selected.length || !currentContainer) {
				return;
			}
			const newAreaId = nanoid();
			const newAreaPlaceableId = nanoid();

			const selectedPlaceables = elementReferences.filter(ref => selected.includes(ref.refId));
			const { containerBox, adjustedPlaceables } = createContainerBox(
				selectedPlaceables,
				getSectionOffset,
				editorDimensions.minHeight.value,
				newAreaPlaceableId
			);

			const newPlaceable: PartialValidPlaceableReference = {
				id: newAreaPlaceableId,
				refId: newAreaId,
				position: containerBox.position,
				dimensions: containerBox.dimensions,
				screenReadingOrder: {
					id: nanoid(),
					screenReadingOrderWeight: 0,
				},
				hideConditions: [],
				pageBreakBehavior: ElementsUtils.createPageBreakBehavior(currentContainer, wrappers.at(-1)),
			};

			const newArea: PartialArea = {
				id: newAreaId,
				type: ElementType.Area,
				area: {
					id: nanoid(),
					elementReferences: adjustedPlaceables,
					dataContexts: [],
					dimensions: {
						id: nanoid(),
						width: {
							...containerBox.dimensions.minWidth,
							id: nanoid(),
						},
						height: {
							...containerBox.dimensions.minHeight,
							id: nanoid(),
						},
						overflowHeight: {
							id: nanoid(),
							...createPlainMmMeasure(0),
						},
					},
				},
			};

			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.editor.groupElementsOnStage,
					region: StageRegion.DEFAULT,
					affectedItems: [
						{
							id: newArea!.id,
							type: "printModelElement",
						},
						createAffectedItem(),
					],
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [newArea] }),
						TransactionLogStateActions.updateReferenceElements({
							data: elementReferences.filter(el => !selected.includes(el.refId)).concat([newPlaceable]),
						}),
					],
				})
			);
		},
		[
			createAffectedItem,
			currentContainer,
			dispatch,
			editorDimensions.minHeight.value,
			elementReferences,
			getSectionOffset,
			wrappers,
		]
	);
};

function getStartPageNumber(reference: PartialValidPlaceableReference, pageHeight: number) {
	return Math.ceil((reference.position.y.value - (reference.margins?.top?.margin?.value || 0)) / pageHeight);
}

function createContainerBox(
	placeables: PartialValidPlaceableReference[],
	getPlaceableBreakOffset: (
		startPositionInMM: number,
		endPositionInMM: number,
		reference: PartialValidPlaceableReference
	) => number,
	pageHeight: number,
	areaPlaceableId: string
): {
	containerBox: Pick<PartialValidPlaceableReference, "position" | "dimensions">;
	adjustedPlaceables: PartialValidPlaceableReference[];
} {
	if (placeables.length === 0) {
		throw new Error("Cannot create container box from empty array");
	}

	const getValue = (measure: DeepPartial<Measure>): number => measure?.value || 0;

	let minX = Infinity;
	let minY = Infinity;
	function setMin(placeable: PartialValidPlaceableReference) {
		const x = getValue(placeable.position.x);
		const y = getValue(placeable.position.y);

		const topMargin = placeable.margins?.top?.margin ? getValue(placeable.margins.top.margin) : 0;

		minX = Math.min(minX, x);
		minY = Math.min(minY, y - topMargin);
	}

	let maxX = -Infinity;
	let maxY = -Infinity;

	function setMax(placeable: PartialValidPlaceableReference, offsetY: number) {
		const x = getValue(placeable.position.x);
		const y = getValue(placeable.position.y);

		const width = getValue(placeable.dimensions.minWidth);
		const height = getValue(placeable.dimensions.minHeight);
		const bottomMargin = placeable.margins?.bottom?.margin ? getValue(placeable.margins.bottom.margin) : 0;

		maxX = Math.max(maxX, x + width);
		maxY = Math.max(maxY, y + height + bottomMargin + offsetY);
	}

	placeables.forEach(placeable => {
		const offsetY = getPlaceableBreakOffset(
			placeable.position.y.value,
			ElementsUtils.getActualBottomPosition(placeable),
			placeable
		);
		setMin(placeable);
		setMax(placeable, offsetY);
	});

	const boundingWidth = maxX - minX;
	const boundingHeight = maxY - minY;

	let containerBox = {
		position: {
			id: nanoid(),
			x: { id: nanoid(), ...createPlainMmMeasure(minX) },
			y: { id: nanoid(), ...createPlainMmMeasure(minY) },
		},
		dimensions: {
			id: nanoid(),
			minWidth: { id: nanoid(), ...createPlainMmMeasure(boundingWidth) },
			minHeight: { id: nanoid(), ...createPlainMmMeasure(boundingHeight) },
		},
	};

	const boxPlaceable = { id: "tempId", refId: "tempId", ...containerBox };

	const boxOffset = getPlaceableBreakOffset(
		boxPlaceable.position.y.value,
		ElementsUtils.getActualBottomPosition(boxPlaceable),
		boxPlaceable
	);

	if (boxOffset) {
		containerBox = {
			...containerBox,
			dimensions: {
				...containerBox.dimensions,
				minHeight: changeMmMeasureValue(containerBox.dimensions.minHeight.value - boxOffset),
			},
		};
	}

	const startPageOfBox = getStartPageNumber(boxPlaceable, pageHeight);
	const adjustedPlaceables: PartialValidPlaceableReference[] = [];

	placeables.forEach(placeable => {
		const startPageOfPlaceable = getStartPageNumber(placeable, pageHeight);
		const isAffected = startPageOfPlaceable > startPageOfBox;

		const placeableOffset = isAffected ? boxOffset : 0;

		adjustedPlaceables.push({
			...placeable,
			position: {
				...placeable.position,
				x: {
					id: nanoid(),
					...createPlainMmMeasure(placeable.position.x.value - containerBox.position.x.value),
				},
				y: {
					id: nanoid(),
					...createPlainMmMeasure(
						placeable.position.y.value - containerBox.position.y.value - placeableOffset
					),
				},
			},
			pageBreakBehavior: adaptPageBreakBehavior(placeable.pageBreakBehavior, areaPlaceableId),
		});
	});

	return { containerBox, adjustedPlaceables };
}

function adaptPageBreakBehavior(
	pageBreak: (DeepPartialRecursive<InputSource<PageBreakBehavior>> & PrintModelEntity) | undefined,
	areaPlaceableId: string
) {
	if (pageBreak?.source === PossibleInputSource.INHERITED) {
		return { ...pageBreak, reference: areaPlaceableId };
	}

	if (pageBreak?.source === PossibleInputSource.DEFAULT) {
		return { ...pageBreak, source: PossibleInputSource.INHERITED, reference: areaPlaceableId };
	}

	return pageBreak;
}
