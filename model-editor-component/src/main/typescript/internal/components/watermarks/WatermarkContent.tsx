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

import { PageOrientation } from "@com.mgmtp.a12.print/print-model-api/model";

import { PrintEngineSelectors } from "../../store/selectors.js";
import { RequestApiSelectors } from "../../redux/request-api/selectors.js";

import { StyledWatermarkContainer } from "./WatermarkContent.styled.js";
import { WatermarkCard } from "./WatermarkCard.js";

export const WATERMARK_ITEMS = [
	{
		pageOrientation: PageOrientation.Portrait,
	},
	{
		pageOrientation: PageOrientation.Landscape,
	},
];

export const WatermarkContent = () => {
	const watermarkItems = useSelector(PrintEngineSelectors.orderedWatermarkItems);
	const resolvedReferences = useSelector(RequestApiSelectors.resolvedWatermarkReferences);

	const getWatermarkItem = React.useCallback(
		(pageOrientation: PageOrientation) => {
			return watermarkItems.find(item => item.watermark.pageOrientation === pageOrientation);
		},
		[watermarkItems]
	);

	/**
	 * References whose watermark is gone from its fragment model. They cannot go into one of the orientation slots -
	 * the orientation is part of the missing definition - so they get their own cards below to be removable here.
	 */
	const missingReferences = React.useMemo(
		() => resolvedReferences.filter(({ watermark }) => !watermark),
		[resolvedReferences]
	);

	return (
		<StyledWatermarkContainer>
			{WATERMARK_ITEMS.map(item => {
				const watermarkItem = getWatermarkItem(item.pageOrientation);
				return (
					<WatermarkCard
						watermark={watermarkItem?.watermark}
						reference={watermarkItem?.referenceId ? { id: watermarkItem?.referenceId } : undefined}
						pageOrientation={item.pageOrientation}
						key={`${item.pageOrientation}`}
					/>
				);
			})}
			{missingReferences.map(({ reference }) => (
				<WatermarkCard key={reference.id} reference={reference} />
			))}
		</StyledWatermarkContainer>
	);
};
