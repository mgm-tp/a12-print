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

import { GlobalRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { PartialTextStyle } from "@com.mgmtp.a12.print/print-model-api/model";
import { Button, CollapsiblePanel, Select } from "@com.mgmtp.a12.widgets/widgets-core";
import type { SelectItem } from "@com.mgmtp.a12.widgets/widgets-core";

import { PrintEngineSelectors } from "../../store/selectors.js";
import {
	EditorStateActions,
	FragmentActions,
	InteractionLogActions,
	NavigationActions,
	TransactionLogStateActions,
	type FragmentUsagePrintModelInfo,
} from "../../redux/index.js";
import { FragmentUsageSelectors } from "../../redux/fragment-usage/selectors.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { TEXT_STYLE_CARD } from "../../constant/drag.js";
import { RequestApiSelectors } from "../../redux/request-api/selectors.js";

import { DragListItemWrapper } from "../drag-and-drop/index.js";
import { FragmentUsagesModal } from "../fragment/FragmentUsagesModal.js";

import { TextStyleCard } from "./TextStyleCard.js";
import { TextStyleEditor } from "./TextStyleEditor.js";
import {
	StyledTextStyleContentWrapper,
	StyledTextStyleDragListWrapper,
	StyledTextStyleAddCard,
} from "./TextStylesContent.styled.js";

export const TextStylesContent = () => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const defaultTextStyle = useSelector(PrintEngineSelectors.defaultTextStyle);
	const textStyleEntries = useSelector(PrintEngineSelectors.textStyleEntries);
	const selectedTextStyleId = useSelector(PrintEngineSelectors.selectedTextStyleId);
	const textStyleReferences = useSelector(PrintEngineSelectors.textStyleReferences);
	const resolvedRefs = useSelector(RequestApiSelectors.resolvedTextStyleReferences);
	const selectedTextStyle =
		textStyleEntries.find(({ textStyle, isFragment }) => !isFragment && textStyle.id === selectedTextStyleId)
			?.textStyle ??
		resolvedRefs.find(r => r.reference.id === selectedTextStyleId)?.textStyle ??
		defaultTextStyle;

	const availableFragmentTextStyles = useSelector(RequestApiSelectors.availableFragmentTextStyles);
	const fragmentModelRefs = useSelector(PrintEngineSelectors.fragmentModelReferences);
	const fragmentUsageState = useSelector(FragmentUsageSelectors.fragmentUsageState);
	const [usagesModalUsages, setUsagesModalUsages] = React.useState<FragmentUsagePrintModelInfo[] | undefined>(
		undefined
	);

	const localTextStyles = React.useMemo(
		() => textStyleEntries.flatMap(({ textStyle, isFragment }) => (isFragment ? [] : [textStyle])),
		[textStyleEntries]
	);

	const fragmentModelIds = React.useMemo(() => {
		const ids = new Set([
			...resolvedRefs.map(r => r.reference.model),
			...availableFragmentTextStyles.map(a => a.modelId),
		]);
		return fragmentModelRefs.filter(ref => ids.has(ref.reference)).map(ref => ref.reference);
	}, [resolvedRefs, availableFragmentTextStyles, fragmentModelRefs]);

	const onMoveItem = React.useCallback(
		(_item: PartialTextStyle, currentIndex: number, targetIndex: number) => {
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.textStyle.textStyleContent.reorderTextStyle,
					region: GlobalRegion.SIDEBAR,
					transactionLogActions: [
						TransactionLogStateActions.moveTextStyle({ data: { currentIndex, targetIndex } }),
					],
				})
			);
		},
		[dispatch]
	);

	React.useEffect(() => {
		const isValidSelection =
			selectedTextStyleId === defaultTextStyle.id ||
			textStyleEntries.some(({ textStyle }) => textStyle.id === selectedTextStyleId) ||
			textStyleReferences.some(ref => ref.id === selectedTextStyleId);
		if (!isValidSelection) {
			dispatch(EditorStateActions.updateSelectedTextStyleId(defaultTextStyle.id));
		}
	}, [defaultTextStyle.id, dispatch, selectedTextStyleId, textStyleEntries, textStyleReferences]);

	return (
		<StyledTextStyleContentWrapper>
			<StyledTextStyleDragListWrapper>
				<LocalTextStyleSection
					title={localizer(RESOURCE_KEYS.sidebar.textStyleReference.internalSectionLabel)}
					defaultTextStyle={defaultTextStyle}
					localTextStyles={localTextStyles}
					onMoveItem={onMoveItem}
					usageByEntityId={fragmentUsageState.usageByEntityId}
					usagesLoading={fragmentUsageState.status === "loading"}
					onShowUsages={setUsagesModalUsages}
				/>
				{fragmentModelIds.map(modelId => (
					<FragmentTextStyleSection
						key={modelId}
						modelId={modelId}
						resolvedRefs={resolvedRefs.filter(r => r.reference.model === modelId)}
						availableStyles={availableFragmentTextStyles.filter(a => a.modelId === modelId)}
					/>
				))}
			</StyledTextStyleDragListWrapper>
			<TextStyleEditor textStyle={selectedTextStyle} />
			{usagesModalUsages && (
				<FragmentUsagesModal usages={usagesModalUsages} onClose={() => setUsagesModalUsages(undefined)} />
			)}
		</StyledTextStyleContentWrapper>
	);
};

interface LocalTextStyleSectionProps {
	title: string;
	defaultTextStyle: PartialTextStyle;
	localTextStyles: PartialTextStyle[];
	onMoveItem: (item: PartialTextStyle, currentIndex: number, targetIndex: number) => void;
	usageByEntityId: Record<string, FragmentUsagePrintModelInfo[] | undefined>;
	usagesLoading: boolean;
	onShowUsages: (usages: FragmentUsagePrintModelInfo[]) => void;
}

const LocalTextStyleSection = ({
	title,
	defaultTextStyle,
	localTextStyles,
	onMoveItem,
	usageByEntityId,
	usagesLoading,
	onShowUsages,
}: LocalTextStyleSectionProps) => {
	const [isOpen, toggle] = React.useReducer(v => !v, true);

	return (
		<CollapsiblePanel title={title} onClick={toggle} style={{ minHeight: "auto" }}>
			{isOpen && (
				<>
					<TextStyleCard textStyle={defaultTextStyle} isDefaultTextStyle={true} />
					{localTextStyles.map((item: PartialTextStyle, index: number) => {
						const usages = usageByEntityId?.[item.id] ?? [];
						return (
							<DragListItemWrapper
								key={item.id}
								onMoveItem={onMoveItem}
								index={index}
								item={item}
								type={TEXT_STYLE_CARD}
							>
								<TextStyleCard
									textStyle={item}
									usageCount={usages.length}
									usagesLoading={usagesLoading}
									onShowUsages={() => onShowUsages(usages)}
								/>
							</DragListItemWrapper>
						);
					})}
				</>
			)}
		</CollapsiblePanel>
	);
};

interface FragmentTextStyleSectionProps {
	modelId: string;
	resolvedRefs: ReturnType<typeof RequestApiSelectors.resolvedTextStyleReferences>;
	availableStyles: ReturnType<typeof RequestApiSelectors.availableFragmentTextStyles>;
}

const FragmentTextStyleSection = ({ modelId, resolvedRefs, availableStyles }: FragmentTextStyleSectionProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const [isOpen, toggle] = React.useReducer(v => !v, true);

	const selectItems: SelectItem[] = React.useMemo(
		() =>
			availableStyles.map(({ textStyle }, index) => ({
				value: `${index}`,
				label: textStyle.name ?? textStyle.id,
			})),
		[availableStyles]
	);

	const onSelectTextStyle = React.useCallback(
		(selectedValue: string) => {
			const item = availableStyles[Number.parseInt(selectedValue, 10)];
			if (!item) return;
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.textStyle.textStyleReferenceSection.addTextStyleReference,
					region: GlobalRegion.SIDEBAR,
					transactionLogActions: [
						TransactionLogStateActions.addTextStyleReference({
							data: { id: nanoid(), refId: item.textStyle.id, model: modelId },
						}),
					],
				})
			);
		},
		[dispatch, availableStyles, modelId]
	);

	const onReferenceAll = React.useCallback(() => {
		if (availableStyles.length === 0) return;
		dispatch(
			InteractionLogActions.start({
				description: RESOURCE_KEYS.interaction.textStyle.textStyleReferenceSection.referenceAllTextStyles,
				region: GlobalRegion.SIDEBAR,
				transactionLogActions: availableStyles.map(({ textStyle }) =>
					TransactionLogStateActions.addTextStyleReference({
						data: { id: nanoid(), refId: textStyle.id, model: modelId },
					})
				),
			})
		);
	}, [dispatch, availableStyles, modelId]);

	const onRemoveReference = React.useCallback(
		(referenceId: string) => {
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.textStyle.textStyleReferenceSection.removeTextStyleReference,
					region: GlobalRegion.SIDEBAR,
					transactionLogActions: [
						TransactionLogStateActions.removeTextStyleReference({
							data: { id: referenceId },
						}),
					],
				})
			);
		},
		[dispatch]
	);

	const navigateToSource = React.useCallback(
		(referenceId: string) => {
			dispatch(NavigationActions.navigateToFragmentSource({ referenceId, entityType: "textStyle" }));
		},
		[dispatch]
	);

	const onUnlinkReference = React.useCallback(
		(referenceId: string) => {
			dispatch(FragmentActions.unlinkReference({ referenceId, entityType: "textStyle" }));
		},
		[dispatch]
	);

	return (
		<CollapsiblePanel title={modelId} onClick={toggle} style={{ minHeight: "auto" }}>
			{isOpen && (
				<>
					{resolvedRefs.map(({ reference, textStyle }) => (
						<TextStyleCard
							key={reference.id}
							textStyle={textStyle}
							reference={reference}
							selectionId={reference.id}
							isReadonly
							onRemoveReference={() => onRemoveReference(reference.id)}
							navigateToSource={() => navigateToSource(reference.id)}
							onUnlinkReference={() => onUnlinkReference(reference.id)}
						/>
					))}
					{availableStyles.length > 0 && (
						<TextStyleReferenceAddCard
							placeholder={localizer(RESOURCE_KEYS.sidebar.textStyleReference.selectPlaceholder)}
							items={selectItems}
							onSelect={onSelectTextStyle}
							onReferenceAll={onReferenceAll}
							referenceAllLabel={localizer(RESOURCE_KEYS.sidebar.textStyleReference.referenceAllButton)}
						/>
					)}
				</>
			)}
		</CollapsiblePanel>
	);
};

interface TextStyleReferenceAddCardProps {
	placeholder: string;
	items: SelectItem[];
	onSelect: (selectedValue: string) => void;
	onReferenceAll: () => void;
	referenceAllLabel: string;
}

const TextStyleReferenceAddCard = ({
	placeholder,
	items,
	onSelect,
	onReferenceAll,
	referenceAllLabel,
}: TextStyleReferenceAddCardProps) => (
	<StyledTextStyleAddCard data-testid="text-style-reference-add-card">
		<Select placeholder={placeholder} value="" onValueChanged={onSelect} items={items} fitToParent={false} />
		<Button title={referenceAllLabel} onClick={onReferenceAll}>
			{referenceAllLabel}
		</Button>
	</StyledTextStyleAddCard>
);
