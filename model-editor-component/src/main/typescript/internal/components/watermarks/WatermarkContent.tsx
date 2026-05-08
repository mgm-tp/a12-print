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

import { PageOrientation } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { PrintEngineSelectors } from "../../store/selectors.js";

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
	const watermarks = useSelector(PrintEngineSelectors.watermarks);

	const getWatermark = React.useCallback(
		(pageOrientation: PageOrientation) => {
			return watermarks.find(section => section.pageOrientation === pageOrientation);
		},
		[watermarks]
	);

	return (
		<StyledWatermarkContainer>
			{WATERMARK_ITEMS.map(item => (
				<WatermarkCard
					watermark={getWatermark(item.pageOrientation)}
					pageOrientation={item.pageOrientation}
					key={`${item.pageOrientation}`}
				/>
			))}
		</StyledWatermarkContainer>
	);
};
