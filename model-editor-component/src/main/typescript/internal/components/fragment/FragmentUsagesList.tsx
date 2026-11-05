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
import { useDispatch } from "react-redux";

import { Button, Icon } from "@com.mgmtp.a12.widgets/widgets-core";

import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { NavigationActions, type FragmentUsagePrintModelInfo } from "../../redux/index.js";

import { StyledFragmentUsagesList } from "./FragmentUsagesList.styled.js";

export interface FragmentUsagesListProps {
	usages: FragmentUsagePrintModelInfo[];
	/** Called after dispatching the navigation, e.g. to close the containing modal/dialog. */
	onNavigated?: () => void;
}

/** Shared usages listing used by both the "Show usages" modal and the fragment-in-use/commit-affects dialogs. */
export const FragmentUsagesList = ({ usages, onNavigated }: FragmentUsagesListProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const navigateButtonLabel = localizer(RESOURCE_KEYS.fragmentUsage.navigateButton);

	const navigateTo = (usage: FragmentUsagePrintModelInfo) => {
		dispatch(
			NavigationActions.navigateToPrintModel({
				printModelId: usage.printModelId,
				referenceEntityType: usage.referenceEntityType,
				referenceIndex: usage.referenceIndex,
				elementPath: usage.elementPath,
			})
		);
		onNavigated?.();
	};

	return (
		<StyledFragmentUsagesList>
			{usages.map((usage, index) => (
				<li key={`${usage.printModelId}-${index}`}>
					<span>{usage.printModelId}</span>
					<Button
						label={navigateButtonLabel}
						title={navigateButtonLabel}
						icon={<Icon>open_in_new</Icon>}
						onClick={() => navigateTo(usage)}
					/>
				</li>
			))}
		</StyledFragmentUsagesList>
	);
};
