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
import { useDeferredValue, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
	type TabPanelTemplateProps,
	TabPanel,
	Icon,
	ActionContentbox,
	ContentBoxElements,
	TextField,
	Button,
} from "@com.mgmtp.a12.widgets/widgets-core";

import { TestAppSelector, TestAppActions } from "../../store/app";
import { SideBarItem } from "../../types";

import { caseConfigs } from "../case-config/CaseConfig";

import { PrintModelCaseList } from "./PrintModelCaseList";

import ActionBarGroupArea = ContentBoxElements.ActionBarGroupArea;
import ActionBarGroup = ContentBoxElements.ActionBarGroup;

const tabs: TabPanelTemplateProps.TabProps[] = [
	{
		icon: <Icon>print</Icon>,
		value: SideBarItem.PRINT_EDITOR,
		id: SideBarItem.PRINT_EDITOR,
		title: "Print Editor",
	},
];

export const AppSubContent = () => {
	const selectSideBarItem = useSelector(TestAppSelector.selectSelectedSideBarItem);
	const [searchText, setSearchText] = useState<string>();
	const deferredSearchText = useDeferredValue(searchText);
	const dispatch = useDispatch();

	const filteredCaseConfigs = useMemo(() => {
		if (!deferredSearchText?.trim()) {
			return caseConfigs;
		}
		return caseConfigs.filter(caseConfig =>
			caseConfig.id.toLowerCase().includes(deferredSearchText?.toLowerCase())
		);
	}, [deferredSearchText]);

	const onClose = () => {
		dispatch(TestAppActions.setIsSideBarContentOpen(false));
		dispatch(TestAppActions.setSelectedSideBarItem(undefined));
	};

	const onSelectSideBar = (tab: TabPanelTemplateProps.TabProps) => {
		dispatch(TestAppActions.setSelectedSideBarItem(tab.value as SideBarItem));
		dispatch(TestAppActions.setIsSideBarContentOpen(true));
	};

	const subActionBar = (
		<ActionBarGroupArea
			leftSlot={[
				<ActionBarGroup key="search-btn">
					<TextField
						key="search"
						placeholder="Search"
						hideLabel
						value={searchText}
						onChange={ev => setSearchText(ev.target.value)}
						suffixes={<Icon>search</Icon>}
					/>
				</ActionBarGroup>,
			]}
			rightSlot={[<Button icon={<Icon>close</Icon>} key="close" secondary onClick={onClose}></Button>]}
		/>
	);

	return (
		<TabPanel tabs={tabs} value={selectSideBarItem} onSelect={onSelectSideBar}>
			<ActionContentbox headingElements={null} subActionBar={subActionBar} padding={0}>
				<PrintModelCaseList caseConfigs={filteredCaseConfigs} />
			</ActionContentbox>
		</TabPanel>
	);
};
