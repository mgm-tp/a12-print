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
import { Icon, Button, Toggle, addPrefix, Autocomplete } from "@com.mgmtp.a12.widgets/widgets-core";
import { PageOrientation, SegmentType } from "@com.mgmtp.a12.print/print-model-api/model";

import { InteractionLogActions, RequestApiActions, TransactionLogStateActions } from "../../redux/index.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { RequestApiSelectors } from "../../redux//request-api/selectors.js";

import { FlexContainer } from "../sidebar/Sidebar.styled.js";
import { CustomTextField } from "../forms/custom-base-input-components/index.js";

import { StyledFlexGapContainer, StyledSegmentToolbar } from "./SegmentToolbar.styled.js";
import { DinTemplateSegmentItem } from "./din-template-segment-item.js";

export const SegmentToolbar = () => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();

	const [title, setTitle] = React.useState<string>("");
	const [pageOrientation, setPageOrientation] = React.useState<PageOrientation>(PageOrientation.Portrait);
	const [selectedTemplateSegment, setSelectedTemplateSegment] = React.useState<DropDownItem | undefined>(undefined);
	const dinTemplateSegmentItems: DinTemplateSegmentItem[] = useSelector(RequestApiSelectors.dinTemplateSegmentItems);

	React.useEffect(() => {
		dispatch(RequestApiActions.loadReferencedPrintModels());
	}, [dispatch]);

	const templateSegmentSelectItems = React.useMemo(
		() =>
			dinTemplateSegmentItems
				.filter(
					({ pageOrientation: dinSegmentPageOrientation }) => dinSegmentPageOrientation === pageOrientation
				)
				.map(dinTemplateSegmentItem => ({
					label: DinTemplateSegmentItem.stringify(dinTemplateSegmentItem),
					value: JSON.stringify(dinTemplateSegmentItem),
				})),
		[dinTemplateSegmentItems, pageOrientation]
	);

	const onClickAddNewPage = React.useCallback(() => {
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

		if (selectedTemplateSegment?.value) {
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.segment.SegmentToolbar.addReferenceSegment,
					region: "sidebar",
					transactionLogActions: [
						TransactionLogStateActions.addReferenceSegment({
							data: {
								segment,
								dinTemplateSegmentItem: JSON.parse(
									selectedTemplateSegment.value
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
		setSelectedTemplateSegment(undefined);
	}, [dispatch, pageOrientation, selectedTemplateSegment, title]);

	const onDinTemplateSegmentItemChanged = React.useCallback((value: string | DropDownItem) => {
		if (typeof value === "string") {
			return;
		}
		setSelectedTemplateSegment(value);
	}, []);

	const onPageOrientationChanged = React.useCallback(
		(value: string) => {
			const newPageOrientation = value as PageOrientation;
			if (pageOrientation !== newPageOrientation) {
				setPageOrientation(newPageOrientation);
				setSelectedTemplateSegment(undefined);
			}
		},
		[pageOrientation]
	);

	const addButtonLabel = localizer(RESOURCE_KEYS.button.add);
	const pageOrientations = usePageOrientation();

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
					<Toggle value={pageOrientation} onValueChanged={onPageOrientationChanged}>
						{pageOrientations.map(item => (
							<Toggle.Item
								key={item.value}
								style={{ ...item.styles }}
								value={item.value}
								data-testid={`toggle-${item.value}`}
							>
								<Icon title={localizer(item.title)}>{item.icon}</Icon>
							</Toggle.Item>
						))}
					</Toggle>
				</StyledFlexGapContainer>
				{templateSegmentSelectItems.length > 0 && (
					<StyledFlexGapContainer>
						<Autocomplete
							hintTemplate={""}
							items={templateSegmentSelectItems}
							value={selectedTemplateSegment}
							onValueChange={onDinTemplateSegmentItemChanged}
							inputPlaceHolder={localizer(
								RESOURCE_KEYS.sidebar.segment.toolbar.dinTemplate.selectPlaceHolder
							)}
						/>
					</StyledFlexGapContainer>
				)}
			</StyledFlexGapContainer>
			<FlexContainer>
				<Button
					label={addButtonLabel}
					title={addButtonLabel}
					icon={<Icon>add</Icon>}
					disabled={!title?.trim()}
					onClick={onClickAddNewPage}
				/>
			</FlexContainer>
		</StyledSegmentToolbar>
	);
};

const usePageOrientation = (): {
	icon: string;
	title: string;
	value: PageOrientation;
	styles: React.CSSProperties;
}[] => {
	const localizer = PrintLocalizer.useLocalizer();

	return [
		{
			icon: "description",
			title: localizer(RESOURCE_KEYS.editor.pageOrientation.portrait),
			value: PageOrientation.Portrait,
			styles: { borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
		},
		{
			icon: "topic",
			title: localizer(RESOURCE_KEYS.editor.pageOrientation.landscape),
			value: PageOrientation.Landscape,
			styles: { borderTopRightRadius: 4, borderBottomRightRadius: 4 },
		},
	];
};
