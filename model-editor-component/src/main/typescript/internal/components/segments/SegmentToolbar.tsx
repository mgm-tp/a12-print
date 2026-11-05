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
import { nanoid } from "nanoid";

import type { DropDownItem } from "@com.mgmtp.a12.widgets/widgets-core";
import { Icon, Button, addPrefix, Autocomplete } from "@com.mgmtp.a12.widgets/widgets-core";
import { PageOrientation, SegmentType } from "@com.mgmtp.a12.print/print-model-api/model";

import { InteractionLogActions, RequestApiActions, TransactionLogStateActions } from "../../redux/index.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { RequestApiSelectors } from "../../redux//request-api/selectors.js";

import { FlexContainer } from "../sidebar/Sidebar.styled.js";
import { CustomTextField } from "../forms/custom-base-input-components/index.js";
import { PageOrientationToggle } from "../sidebar/PageOrientationToggle.js";

import { StyledFlexGapContainer, StyledSegmentToolbar } from "./SegmentToolbar.styled.js";
import { DinTemplateSegmentItem } from "./din-template-segment-item.js";

const DIN_VALUE_PREFIX = "din::";
const FRAGMENT_VALUE_PREFIX = "frag::";
const GROUP_VALUE_PREFIX = "group::";

export const SegmentToolbar = () => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();

	const [title, setTitle] = React.useState<string>("");
	const [pageOrientation, setPageOrientation] = React.useState<PageOrientation>(PageOrientation.Portrait);
	const [selectedItem, setSelectedItem] = React.useState<DropDownItem | undefined>(undefined);
	const [filterText, setFilterText] = React.useState<string>("");
	const dinTemplateSegmentItems: DinTemplateSegmentItem[] = useSelector(RequestApiSelectors.dinTemplateSegmentItems);
	const availableFragmentSegments = useSelector(RequestApiSelectors.availableFragmentSegments);

	React.useEffect(() => {
		dispatch(RequestApiActions.loadReferencedPrintModels());
	}, [dispatch]);

	// A single grouped source: one group for DIN template segments (filtered by orientation),
	// and one group per fragment model. The origin of a leaf is encoded in its value.
	const baseItems: DropDownItem[] = React.useMemo(() => {
		const groups: DropDownItem[] = [];

		const dinLeaves = dinTemplateSegmentItems
			.filter(({ pageOrientation: dinOrientation }) => dinOrientation === pageOrientation)
			.map<DropDownItem>(dinTemplateSegmentItem => ({
				label: DinTemplateSegmentItem.stringify(dinTemplateSegmentItem),
				value: `${DIN_VALUE_PREFIX}${JSON.stringify(dinTemplateSegmentItem)}`,
			}));
		if (dinLeaves.length > 0) {
			groups.push({
				label: localizer(RESOURCE_KEYS.sidebar.segment.setting.segmentTemplate),
				value: `${GROUP_VALUE_PREFIX}din`,
				children: dinLeaves,
			});
		}

		const fragmentGroupsByModel = new Map<string, DropDownItem[]>();
		availableFragmentSegments.forEach(({ modelId, segment }, index) => {
			const leaves = fragmentGroupsByModel.get(modelId) ?? [];
			leaves.push({ label: segment.title ?? segment.id, value: `${FRAGMENT_VALUE_PREFIX}${index}` });
			fragmentGroupsByModel.set(modelId, leaves);
		});
		for (const [modelId, children] of fragmentGroupsByModel) {
			groups.push({ label: modelId, value: `${GROUP_VALUE_PREFIX}${modelId}`, children });
		}

		return groups;
	}, [availableFragmentSegments, dinTemplateSegmentItems, localizer, pageOrientation]);

	const displayedItems: DropDownItem[] = React.useMemo(
		() => (filterText ? filterGroupedItems(baseItems, filterText.toLocaleLowerCase()) : baseItems),
		[baseItems, filterText]
	);

	const onValueChange = React.useCallback((value: string | DropDownItem) => {
		if (typeof value === "string" || value.value?.startsWith(GROUP_VALUE_PREFIX)) {
			return;
		}
		setSelectedItem(value);
	}, []);

	const onSearch = React.useCallback((value: string) => {
		setFilterText(value);
	}, []);

	const resetDinSelection = React.useCallback(() => {
		setSelectedItem(prev => (prev?.value?.startsWith(DIN_VALUE_PREFIX) ? undefined : prev));
	}, []);

	const selectedValue = selectedItem?.value;
	const isFragmentSelected = Boolean(selectedValue?.startsWith(FRAGMENT_VALUE_PREFIX));

	const onClickAddNewPage = React.useCallback(() => {
		if (selectedValue?.startsWith(FRAGMENT_VALUE_PREFIX)) {
			const index = Number.parseInt(selectedValue.slice(FRAGMENT_VALUE_PREFIX.length), 10);
			const item = availableFragmentSegments[index];
			if (item) {
				dispatch(
					InteractionLogActions.start({
						description: RESOURCE_KEYS.interaction.segment.segmentReferenceSection.addSegmentReference,
						region: "sidebar",
						transactionLogActions: [
							TransactionLogStateActions.addSegmentFragmentReference({
								data: { id: nanoid(), refId: item.segment.id, model: item.modelId },
							}),
						],
					})
				);
			}
			setSelectedItem(undefined);
			return;
		}

		const segment = {
			id: nanoid(),
			title,
			type: SegmentType.Default,
			defaultSegment: {
				id: nanoid(),
				pageOrientation,
			},
			elementReferences: [],
		};

		if (selectedValue?.startsWith(DIN_VALUE_PREFIX)) {
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.segment.SegmentToolbar.addReferenceSegment,
					region: "sidebar",
					transactionLogActions: [
						TransactionLogStateActions.addReferenceSegment({
							data: {
								segment,
								dinTemplateSegmentItem: JSON.parse(
									selectedValue.slice(DIN_VALUE_PREFIX.length)
								) as DinTemplateSegmentItem,
							},
						}),
					],
				})
			);
		} else {
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.segment.SegmentToolbar.addSegment,
					region: "sidebar",
					transactionLogActions: [
						TransactionLogStateActions.addSegment({
							data: segment,
						}),
					],
				})
			);
		}
		setTitle("");
		setSelectedItem(undefined);
	}, [availableFragmentSegments, dispatch, pageOrientation, selectedValue, title]);

	const addButtonLabel = localizer(RESOURCE_KEYS.button.add);

	return (
		<StyledSegmentToolbar data-testid="segment-toolbar">
			<StyledFlexGapContainer className={addPrefix("-u-flex-col", "-u-flex-1")}>
				<StyledFlexGapContainer>
					<CustomTextField
						className={addPrefix("-u-flex-1")}
						value={title}
						onChange={e => setTitle(e.target.value)}
						placeholder={localizer(RESOURCE_KEYS.sidebar.segment.toolbar.namePlaceholder)}
						fitToParent={false}
					/>
					<PageOrientationToggle
						pageOrientation={pageOrientation}
						setPageOrientation={setPageOrientation}
						setSelectedTemplateSegment={resetDinSelection}
					/>
				</StyledFlexGapContainer>
				{baseItems.length > 0 && (
					<StyledFlexGapContainer>
						<Autocomplete
							hintTemplate={""}
							items={displayedItems}
							value={selectedItem}
							onValueChange={onValueChange}
							onSearch={onSearch}
							inputPlaceHolder={localizer(RESOURCE_KEYS.sidebar.segment.reference.selectPlaceholder)}
						/>
					</StyledFlexGapContainer>
				)}
			</StyledFlexGapContainer>
			<FlexContainer>
				<Button
					label={addButtonLabel}
					title={addButtonLabel}
					icon={<Icon>add</Icon>}
					disabled={!title?.trim() && !isFragmentSelected}
					onClick={onClickAddNewPage}
				/>
			</FlexContainer>
		</StyledSegmentToolbar>
	);
};

/**
 * Recursively filters grouped {@link DropDownItem}s by the given (lower-cased) text.
 * A group is kept when any of its children match; leaves match on a label substring.
 */
function filterGroupedItems(items: DropDownItem[], filterText: string): DropDownItem[] {
	const result: DropDownItem[] = [];
	for (const item of items) {
		if (item.children && item.children.length > 0) {
			const childResult = filterGroupedItems(item.children, filterText);
			if (childResult.length > 0) {
				result.push({ ...item, children: childResult });
			}
		} else if (item.label.toLocaleLowerCase().includes(filterText)) {
			result.push(item);
		}
	}
	return result;
}
