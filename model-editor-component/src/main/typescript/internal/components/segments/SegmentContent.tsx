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
import { useDispatch, useSelector } from "react-redux";
import { useState, useCallback } from "react";

import { PartialSegment } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { PrintEngineSelectors } from "../../store/selectors.js";
import { TransactionLogStateActions } from "../../redux/index.js";
import { InteractionLogActions } from "../../redux/interaction-log/index.js";
import { RESOURCE_KEYS } from "../../localization/index.js";
import { SEGMENT_CARD } from "../../constant/drag.js";

import { DragListItemWrapper } from "../drag-and-drop/DragListItemWrapper.js";

import { StyledDragSegment } from "./SegmentContent.styled.js";
import { SegmentCard } from "./SegmentCard.js";

export const SegmentContent = () => {
	const segments = useSelector(PrintEngineSelectors.segments);
	const [currentSettingSegment, setCurrentSettingSegment] = useState<string>();
	const dispatch = useDispatch();

	const handleReorderSegment = useCallback(
		(item: PartialSegment, currentIndex: number, targetIndex: number) => {
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.segment.segmentContent.reorderSegment,
					region: "sidebar",
					transactionLogActions: [
						TransactionLogStateActions.reorderStructure({ data: { currentIndex, targetIndex } }),
					],
				})
			);
		},
		[dispatch]
	);

	return (
		<StyledDragSegment>
			{segments.map((segment, index) => {
				return (
					<DragListItemWrapper
						key={segment.id}
						onMoveItem={handleReorderSegment}
						index={index}
						item={segment}
						type={SEGMENT_CARD}
					>
						<SegmentCard
							segment={segment}
							setOpenSetting={setCurrentSettingSegment}
							isOpenSetting={currentSettingSegment === segment.id}
						/>
					</DragListItemWrapper>
				);
			})}
		</StyledDragSegment>
	);
};
