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
import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { nanoid } from "nanoid";

import { GlobalRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { PrintEngineSelectors } from "../../store/selectors.js";
import { FragmentActions, TransactionLogStateActions } from "../../redux/index.js";
import { InteractionLogActions } from "../../redux//interaction-log/index.js";
import { RESOURCE_KEYS } from "../../localization/index.js";
import { SEGMENT_CARD } from "../../constant/drag.js";

import { DragListItemWrapper } from "../drag-and-drop/DragListItemWrapper.js";

import { StyledDragSegment } from "./SegmentContent.styled.js";
import { SegmentCard } from "./SegmentCard.js";

export const SegmentContent = () => {
	const segmentItems = useSelector(PrintEngineSelectors.orderedSegmentItems);
	const segmentFragmentReferences = useSelector(PrintEngineSelectors.segmentFragmentReferences);
	const [currentSettingSegment, setCurrentSettingSegment] = useState<string>();
	const dispatch = useDispatch();

	const handleReorderSegment = useCallback(
		(_item: { id: string }, currentIndex: number, targetIndex: number) => {
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.segment.segmentContent.reorderSegment,
					region: GlobalRegion.SIDEBAR,
					transactionLogActions: [
						TransactionLogStateActions.reorderStructure({ data: { currentIndex, targetIndex } }),
					],
				})
			);
		},
		[dispatch]
	);

	const onRemoveReference = useCallback(
		(referenceId: string) => {
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.segment.segmentReferenceSection.removeSegmentReference,
					region: GlobalRegion.SIDEBAR,
					transactionLogActions: [
						TransactionLogStateActions.removeSegmentFragmentReference({ data: { id: referenceId } }),
					],
				})
			);
		},
		[dispatch]
	);

	const onUnlinkReference = useCallback(
		(referenceId: string) => {
			dispatch(FragmentActions.unlinkReference({ referenceId, entityType: "segment" }));
		},
		[dispatch]
	);

	const onDuplicateReference = useCallback(
		(referenceId: string) => {
			const reference = segmentFragmentReferences.find(r => r.id === referenceId);
			if (!reference) {
				return;
			}
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.segment.segmentReferenceSection.addSegmentReference,
					region: GlobalRegion.SIDEBAR,
					transactionLogActions: [
						TransactionLogStateActions.addSegmentFragmentReference({
							data: { id: nanoid(), refId: reference.refId, model: reference.model },
						}),
					],
				})
			);
		},
		[dispatch, segmentFragmentReferences]
	);

	return (
		<StyledDragSegment>
			{segmentItems.map(({ segment, reference }, index) => (
				// Reordering only needs the indices, so a reference whose segment is missing can still be moved.
				<DragListItemWrapper
					key={segment?.id ?? reference?.id}
					onMoveItem={handleReorderSegment}
					index={index}
					item={segment ?? reference}
					type={SEGMENT_CARD}
				>
					<SegmentCard
						segment={segment}
						setOpenSetting={setCurrentSettingSegment}
						isOpenSetting={!!segment && currentSettingSegment === segment.id}
						reference={reference}
						onRemoveReference={reference ? () => onRemoveReference(reference.id) : undefined}
						onDuplicateReference={reference ? () => onDuplicateReference(reference.id) : undefined}
						onUnlinkReference={reference ? () => onUnlinkReference(reference.id) : undefined}
					/>
				</DragListItemWrapper>
			))}
		</StyledDragSegment>
	);
};
