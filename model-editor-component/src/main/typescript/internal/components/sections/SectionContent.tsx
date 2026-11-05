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

import { PageOrientation, SectionUsage } from "@com.mgmtp.a12.print/print-model-api/model";

import { PrintEngineSelectors } from "../../store/selectors.js";
import { RequestApiSelectors } from "../../redux/request-api/selectors.js";

import { SectionCard } from "./SectionCard.js";
import { StyledSectionContainer } from "./SectionContent.styled.js";

export const SECTION_ITEMS = [
	{
		pageOrientation: PageOrientation.Portrait,
		sectionUsage: SectionUsage.First,
	},
	{
		pageOrientation: PageOrientation.Portrait,
		sectionUsage: SectionUsage.Remaining,
	},
	{
		pageOrientation: PageOrientation.Landscape,
		sectionUsage: SectionUsage.First,
	},
	{
		pageOrientation: PageOrientation.Landscape,
		sectionUsage: SectionUsage.Remaining,
	},
];

export const SectionContent = () => {
	const sectionItems = useSelector(PrintEngineSelectors.orderedSectionItems);
	const resolvedReferences = useSelector(RequestApiSelectors.resolvedSectionReferences);

	/**
	 * References whose section is gone from its fragment model. They cannot go into one of the slots - orientation
	 * and usage come from the missing definition - so they get their own cards below to be removable here.
	 */
	const missingReferences = React.useMemo(
		() => resolvedReferences.filter(({ section }) => !section),
		[resolvedReferences]
	);

	const getSectionItem = React.useCallback(
		(pageOrientation: PageOrientation, sectionUsage: SectionUsage) => {
			return sectionItems.find(
				item => item.section.pageOrientation === pageOrientation && item.section.sectionUsage === sectionUsage
			);
		},
		[sectionItems]
	);

	return (
		<StyledSectionContainer>
			{SECTION_ITEMS.map(item => {
				const sectionItem = getSectionItem(item.pageOrientation, item.sectionUsage);
				return (
					<SectionCard
						section={sectionItem?.section}
						reference={sectionItem?.referenceId ? { id: sectionItem.referenceId } : undefined}
						sectionUsage={item.sectionUsage}
						pageOrientation={item.pageOrientation}
						key={`${item.pageOrientation}-${item.sectionUsage}`}
					/>
				);
			})}
			{missingReferences.map(({ reference }) => (
				<SectionCard key={reference.id} reference={reference} />
			))}
		</StyledSectionContainer>
	);
};
