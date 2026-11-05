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
import { useCallback, useContext, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { nanoid } from "nanoid";

import {
	ElementType,
	isPartialSection,
	isPartialSegment,
	isPartialWatermark,
	isSection,
	isSegment,
	isWatermark,
	PageOrientation,
	PrintModelElement,
	SectionUsage,
	SegmentType,
	type PartialAnyPrintModelElement,
	type Section,
	type Segment,
	type Watermark,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	generatePrintModelEntityName,
	GlobalRegion,
	SidebarItem,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import {
	Tree,
	TreeAdapter,
	Collapsible,
	Selectable,
	type TreeNodeModel,
	type MapTreeNode,
	Icon,
	Button,
	Insertable,
	type IdType,
	CustomSelect,
	type DropDownItem,
	TextField,
	ActionContentbox,
} from "@com.mgmtp.a12.widgets/widgets-core";

import {
	EditorStateActions,
	InteractionLogActions,
	NavigationSelectors,
	TransactionLogStateActions,
	type FragmentUsagePrintModelInfo,
} from "../../redux/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { byToolboxOrder, ElementTypes, TOOLBOX_ELEMENTS } from "../../constant/elements.js";
import { ElementsUtils } from "../../utils/elements-utils.js";
import { createMmMeasure } from "../../utils/measure-utils.js";
import { FragmentUsageSelectors } from "../../redux/fragment-usage/selectors.js";

import { HiddenHeightComponentContext } from "../hidden-height-context-wrapper/index.js";
import { SideBarItemActionButtons } from "../sidebar/SideBarItemActionButtons.js";
import { PageOrientationToggle } from "../sidebar/PageOrientationToggle.js";
import { DEFAULT_HEIGHT } from "../sections/SectionCard.js";

import { BaseFragmentTree, FragmentNode, FragmentTypeNode, SettingsNode } from "./nodes/index.js";
import { StyledFragmentSearch, StyledFragmentTree } from "./FragmentTree.styled.js";
import { FragmentUsagesModal } from "./FragmentUsagesModal.js";
import { filterFragmentTypeNodeBySearchString } from "./fragment-search/index.js";

const InteractiveTree = Selectable(Insertable(Collapsible(TreeAdapter(Tree))));

const elementTypeLabelRenderer = (item: DropDownItem): React.ReactNode => (
	<span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
		<Icon>{ElementTypes[item.value as ElementType]?.iconName}</Icon>
		{item.label}
	</span>
);

export const FragmentTree = () => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const fragmentUsageState = useSelector(FragmentUsageSelectors.fragmentUsageState);
	const printModelRefs = useSelector(NavigationSelectors.activeEntities);

	const [openSettingId, setOpenSettingId] = useState<string | undefined>();
	const [searchString, setSearchString] = useState<string>("");
	const [usagesModalUsages, setUsagesModalUsages] = useState<FragmentUsagePrintModelInfo[] | undefined>(undefined);
	const collapseFragmentNode = useRef<((id: IdType) => void) | undefined>(undefined);
	const expandFragmentNode = useRef<((id: IdType) => void) | undefined>(undefined);

	const handleSetOpenSetting = useCallback(
		(entityId?: string) => {
			if (entityId === undefined) {
				if (openSettingId !== undefined) {
					expandFragmentNode.current?.(openSettingId);
				}
				setOpenSettingId(undefined);
			} else {
				if (openSettingId !== undefined) {
					expandFragmentNode.current?.(openSettingId);
				}
				collapseFragmentNode.current?.(entityId);
				setOpenSettingId(entityId);
			}
		},
		[openSettingId]
	);

	const { calculateNewFragmentElementHeight } = useContext(HiddenHeightComponentContext);

	const addFragmentElementNode = useCallback(
		(type: ElementType) => {
			const elementId = nanoid();
			const partialElement = ElementsUtils.createPrintModelElement(
				elementId,
				type,
				ElementsUtils.createDefaultPlaceableReference(elementId, type),
				true
			);

			// fragmentDimensions.height is still a placeholder here, so measure the real height off-screen
			// first - otherwise the element starts out wrong and visibly shrinks once corrected.
			calculateNewFragmentElementHeight({ element: partialElement });
			dispatch(
				EditorStateActions.openEditorView({
					...printModelRefs,
					fragmentId: elementId,
					currentRefType: SidebarItem.FRAGMENT,
				})
			);
		},
		[calculateNewFragmentElementHeight, dispatch, printModelRefs]
	);

	const addNewSegment = useCallback(
		(pageOrientation: PageOrientation) => {
			const segment: Segment = {
				id: nanoid(),
				title: generatePrintModelEntityName("Segment"),
				type: SegmentType.Default,
				defaultSegment: {
					id: nanoid(),
					pageOrientation,
				},
				elementReferences: [],
			};

			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.fragment.segment.addSegment,
					region: GlobalRegion.SIDEBAR,
					transactionLogActions: [
						TransactionLogStateActions.addSegment({
							data: segment,
						}),
					],
				})
			);
		},
		[dispatch]
	);

	const addNewSection = useCallback(
		(pageOrientation: PageOrientation) => {
			const newSection: Section = {
				id: nanoid(),
				title: generatePrintModelEntityName("Section"),
				elementReferences: [],
				pageOrientation,
				headerHeight: createMmMeasure(DEFAULT_HEIGHT),
				footerHeight: createMmMeasure(DEFAULT_HEIGHT),
				// A fragment section carries no usage of its own, the referencing print model assigns it. We need to set a value because its a required field.
				sectionUsage: SectionUsage.First,
			};

			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.fragment.section.addSection,
					region: GlobalRegion.SIDEBAR,
					transactionLogActions: [
						TransactionLogStateActions.addSection({
							data: newSection,
						}),
					],
				})
			);
		},
		[dispatch]
	);

	const addNewWatermark = useCallback(
		(pageOrientation: PageOrientation) => {
			const newWatermark: Watermark = {
				id: nanoid(),
				title: generatePrintModelEntityName("Watermark"),
				elementReferences: [],
				pageOrientation,
			};

			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.fragment.watermark.addWatermark,
					region: GlobalRegion.SIDEBAR,
					transactionLogActions: [
						TransactionLogStateActions.addWatermark({
							data: newWatermark,
						}),
					],
				})
			);
		},
		[dispatch]
	);

	const duplicateFragmentNode = useCallback(
		(node: FragmentNode) => {
			switch (node.fragmentType) {
				case "section":
					if (isSection(node.fragment) || isPartialSection(node.fragment)) {
						dispatch(
							InteractionLogActions.start({
								description: RESOURCE_KEYS.interaction.fragment.section.duplicateSection,
								region: GlobalRegion.SIDEBAR,
								transactionLogActions: [
									TransactionLogStateActions.duplicateSection({ data: node.fragment }),
								],
							})
						);
					}
					break;
				case "watermark":
					if (isWatermark(node.fragment) || isPartialWatermark(node.fragment)) {
						dispatch(
							InteractionLogActions.start({
								description: RESOURCE_KEYS.interaction.fragment.watermark.duplicateWatermark,
								region: GlobalRegion.SIDEBAR,
								transactionLogActions: [
									TransactionLogStateActions.duplicateWatermark({ data: node.fragment }),
								],
							})
						);
					}
					break;
				case "segment":
					if (isSegment(node.fragment) || isPartialSegment(node.fragment)) {
						dispatch(
							InteractionLogActions.start({
								description: RESOURCE_KEYS.interaction.fragment.segment.duplicateSegment,
								region: GlobalRegion.SIDEBAR,
								transactionLogActions: [
									TransactionLogStateActions.duplicateSegment({ data: node.fragment }),
								],
							})
						);
					}
					break;
				case "element":
					dispatch(
						InteractionLogActions.start({
							description: RESOURCE_KEYS.interaction.fragment.element.duplicateElement,
							region: GlobalRegion.SIDEBAR,
							transactionLogActions: [
								TransactionLogStateActions.duplicatePrintModelElement({
									data: node.fragment as PartialAnyPrintModelElement,
								}),
							],
						})
					);
					break;
				case "textStyle":
					// Text styles are managed in their own sidebar area, not through the fragment tree.
					break;
				default:
					throw new Error("Fragment node type not implemented: " + node.fragmentType);
			}
		},
		[dispatch]
	);

	const deleteFragmentNode = useCallback(
		(node: FragmentNode) => {
			const isInUse =
				fragmentUsageState.status === "loading" ||
				(fragmentUsageState.usageByEntityId[node.fragment.id]?.length ?? 0) > 0;
			if (isInUse) {
				return;
			}
			switch (node.fragmentType) {
				case "section":
					dispatch(
						InteractionLogActions.start({
							description: RESOURCE_KEYS.interaction.fragment.section.deleteSection,
							region: GlobalRegion.SIDEBAR,
							transactionLogActions: [
								TransactionLogStateActions.removeSection({
									data: { id: node.fragment.id },
								}),
							],
							affectedItems: [
								{
									type: "section",
									id: node.fragment.id,
								},
							],
						})
					);
					break;
				case "watermark":
					dispatch(
						InteractionLogActions.start({
							description: RESOURCE_KEYS.interaction.fragment.watermark.deleteWatermark,
							region: GlobalRegion.SIDEBAR,
							transactionLogActions: [
								TransactionLogStateActions.removeWatermark({
									data: { id: node.fragment.id },
								}),
							],
							affectedItems: [{ type: "watermark", id: node.fragment.id }],
						})
					);
					break;
				case "segment":
					dispatch(
						InteractionLogActions.start({
							description: RESOURCE_KEYS.interaction.fragment.segment.deleteSegment,
							region: GlobalRegion.SIDEBAR,
							transactionLogActions: [
								TransactionLogStateActions.removeSegment({ data: { id: node.fragment.id } }),
							],
							affectedItems: [{ type: "segment", id: node.fragment.id }],
						})
					);
					break;
				case "element":
					dispatch(
						InteractionLogActions.start({
							description: RESOURCE_KEYS.interaction.fragment.element.deleteElement,
							region: GlobalRegion.SIDEBAR,
							affectedItems: [
								{
									type: "printModelElement",
									id: node.fragment.id,
								},
							],
							transactionLogActions: [
								TransactionLogStateActions.removeFragmentModelElement({
									data: node.fragment,
								}),
							],
						})
					);
					break;
				case "textStyle":
					// Text styles are managed in their own sidebar area, not through the fragment tree.
					break;
				default:
					throw new Error("Fragment node type not implemented: " + node.fragmentType);
			}
		},
		[dispatch, fragmentUsageState.status, fragmentUsageState.usageByEntityId]
	);

	// Id of the fragment open on the stage; drives tree selection from Redux so it survives remounts.
	const currentRefId = useSelector(PrintEngineSelectors.currentElementContainerId);

	const segments = useSelector(PrintEngineSelectors.segments);
	const sections = useSelector(PrintEngineSelectors.sections);
	const watermarks = useSelector(PrintEngineSelectors.watermarks);
	const elements = useSelector(PrintEngineSelectors.fragmentElements);

	const withSettingsChild = useCallback((node: FragmentNode): FragmentNode => {
		if (!node.settings) return node;
		return { ...node, children: [SettingsNode.createSettingsNode(node.id as string, node.settings)] };
	}, []);

	const segmentNodes = useMemo(() => {
		return segments.map(segment => withSettingsChild(FragmentNode.createFragmentNode("segment", segment)));
	}, [segments, withSettingsChild]);

	const sectionNodes = useMemo(() => {
		return sections.map(section => withSettingsChild(FragmentNode.createFragmentNode("section", section)));
	}, [sections, withSettingsChild]);

	const watermarkNodes = useMemo(() => {
		return watermarks.map(watermark => withSettingsChild(FragmentNode.createFragmentNode("watermark", watermark)));
	}, [watermarks, withSettingsChild]);

	const elementNodes = useMemo(() => {
		// Listed in the same order as the Element Library toolbox. Sorted here rather than in
		// PrintEngineSelectors.fragmentElements, which also feeds the commit view and the
		// validation counters, where the order carries no meaning.
		return [...elements]
			.sort((a, b) =>
				byToolboxOrder(
					PrintModelElement.isInstance(a) ? a.type : "",
					PrintModelElement.isInstance(b) ? b.type : ""
				)
			)
			.map(element => withSettingsChild(FragmentNode.createFragmentNode("element", element)));
	}, [elements, withSettingsChild]);

	const extendedTree = useMemo(() => {
		return {
			...BaseFragmentTree,
			children:
				BaseFragmentTree.children?.map(child => {
					switch (child.type) {
						case "section":
							return { ...child, children: sectionNodes };
						case "watermark":
							return { ...child, children: watermarkNodes };
						case "segment":
							return { ...child, children: segmentNodes };
						case "element":
							return { ...child, children: elementNodes };
						default:
							return child;
					}
				}) || [],
		};
	}, [segmentNodes, sectionNodes, watermarkNodes, elementNodes]);

	const filteredTree = useMemo(() => {
		if (!searchString) {
			return extendedTree;
		}
		return {
			...extendedTree,
			children: extendedTree.children.map(node => filterFragmentTypeNodeBySearchString(node, searchString)),
		};
	}, [extendedTree, searchString]);

	const openEditor = useCallback(
		(node: TreeNodeModel) => {
			if (FragmentNode.isFragmentNode(node)) {
				switch (node.fragmentType) {
					case "section":
						if (isSection(node.fragment) || isPartialSection(node.fragment)) {
							dispatch(
								EditorStateActions.openEditorView({
									...printModelRefs,
									sectionId: node.fragment.id,
									currentRefType: SidebarItem.SECTION,
								})
							);
						}
						break;
					case "watermark":
						if (isWatermark(node.fragment) || isPartialWatermark(node.fragment)) {
							dispatch(
								EditorStateActions.openEditorView({
									...printModelRefs,
									watermarkId: node.fragment.id,
									currentRefType: SidebarItem.WATERMARK,
								})
							);
						}
						break;
					case "segment":
						if (isSegment(node.fragment) || isPartialSegment(node.fragment)) {
							dispatch(
								EditorStateActions.openEditorView({
									...printModelRefs,
									segmentId: node.fragment.id,
									currentRefType: SidebarItem.SEGMENT,
								})
							);
						}
						break;
					case "element":
						if (PrintModelElement.isInstance(node.fragment)) {
							dispatch(
								EditorStateActions.openEditorView({
									...printModelRefs,
									fragmentId: node.fragment.id,
									currentRefType: SidebarItem.FRAGMENT,
								})
							);
						}
						break;
					case "textStyle":
						// Text styles are managed in their own sidebar area, not through the fragment tree.
						break;
					default:
						throw new Error("Fragment node type not implemented: " + node.fragmentType);
				}
			}
		},
		[dispatch, printModelRefs]
	);

	const [selectedElementType, setSelectedElementType] = useState<ElementType>(ElementType.Text);
	const [segmentPageOrientation, setSegmentPageOrientation] = useState<PageOrientation>(PageOrientation.Portrait);
	const [sectionPageOrientation, setSectionPageOrientation] = useState<PageOrientation>(PageOrientation.Portrait);
	const [watermarkPageOrientation, setWatermarkPageOrientation] = useState<PageOrientation>(PageOrientation.Portrait);

	const actionsForFragmentTreeNodes = useCallback(
		(node: TreeNodeModel): React.ReactNode => {
			if (FragmentTypeNode.isFragmentTypeNode(node)) {
				if (node.type === "element") {
					return (
						<>
							<CustomSelect
								fitToParent={false}
								style={{ minWidth: "10rem" }}
								items={TOOLBOX_ELEMENTS.map(type => ({ label: type, value: type }))}
								value={selectedElementType}
								onValueChanged={(value: ElementType) => setSelectedElementType(value)}
								labelRenderer={elementTypeLabelRenderer}
							/>
							<Button
								icon={<Icon>add</Icon>}
								title="Add Element Fragment"
								onClick={() => addFragmentElementNode(selectedElementType)}
							/>
						</>
					);
				}
				if (node.type === "segment") {
					return (
						<>
							<PageOrientationToggle
								pageOrientation={segmentPageOrientation}
								setPageOrientation={setSegmentPageOrientation}
							/>
							<Button
								icon={<Icon>add</Icon>}
								title="Add Segment Fragment"
								onClick={() => addNewSegment(segmentPageOrientation)}
							/>
						</>
					);
				}
				if (node.type === "section") {
					return (
						<>
							<PageOrientationToggle
								pageOrientation={sectionPageOrientation}
								setPageOrientation={setSectionPageOrientation}
							/>
							<Button
								icon={<Icon>add</Icon>}
								title="Add Section Fragment"
								onClick={() => addNewSection(sectionPageOrientation)}
							/>
						</>
					);
				}
				if (node.type === "watermark") {
					return (
						<>
							<PageOrientationToggle
								pageOrientation={watermarkPageOrientation}
								setPageOrientation={setWatermarkPageOrientation}
							/>
							<Button
								icon={<Icon>add</Icon>}
								title="Add Watermark Fragment"
								onClick={() => addNewWatermark(watermarkPageOrientation)}
							/>
						</>
					);
				}
			}
			if (FragmentNode.isFragmentNode(node)) {
				const usages: FragmentUsagePrintModelInfo[] | undefined =
					fragmentUsageState.usageByEntityId[node.fragment.id];
				const usageCount = usages?.length ?? 0;
				const deleteDisabled = fragmentUsageState.status === "loading" || usageCount > 0;
				return (
					<SideBarItemActionButtons
						entityId={node.fragment.id}
						type="fragment"
						isOpenSetting={openSettingId === node.fragment.id}
						setOpenSetting={handleSetOpenSetting}
						duplicateItem={() => duplicateFragmentNode(node)}
						deleteItem={() => deleteFragmentNode(node)}
						deleteDisabled={deleteDisabled}
						usageCount={usageCount}
						onShowUsages={() => setUsagesModalUsages(usages)}
						usagesLoading={fragmentUsageState.status === "loading"}
					/>
				);
			}
			return undefined;
		},
		[
			addFragmentElementNode,
			selectedElementType,
			openSettingId,
			handleSetOpenSetting,
			duplicateFragmentNode,
			deleteFragmentNode,
			addNewSection,
			addNewWatermark,
			addNewSegment,
			sectionPageOrientation,
			watermarkPageOrientation,
			segmentPageOrientation,
			fragmentUsageState,
		]
	);

	const tplTreeNode: MapTreeNode = (n, chained) => {
		if (SettingsNode.isSettingsNode(n)) {
			return { ...chained, onTitleClick: undefined, selected: false };
		}
		const isFragment = FragmentNode.isFragmentNode(n);
		return {
			...chained,
			selected: isFragment && n.fragment.id === currentRefId,
			...(isFragment ? { onArrowClick: undefined, showArrow: false } : {}), // hide expand chevron
			fileNode: n,
			actionButtons: actionsForFragmentTreeNodes(n),
		};
	};

	const searchLabel = localizer(RESOURCE_KEYS.sidebar.fragment.search.label);

	return (
		<ActionContentbox
			padding={false}
			subActionBar={
				<StyledFragmentSearch>
					<TextField
						placeholder={localizer(RESOURCE_KEYS.sidebar.fragment.search.placeholder)}
						label={searchLabel}
						hideLabel
						inputProps={{ "aria-label": searchLabel }}
						value={searchString}
						onChange={ev => setSearchString(ev.target.value)}
						suffixes={<Icon>search</Icon>}
					/>
				</StyledFragmentSearch>
			}
		>
			<StyledFragmentTree>
				<InteractiveTree
					root={filteredTree}
					hideRoot
					tplTreeNode={tplTreeNode}
					onToggleSelection={node => openEditor(node)}
					collapseNodeHandler={handler => {
						collapseFragmentNode.current = handler;
					}}
					expandNodeHandler={handler => {
						expandFragmentNode.current = handler;
					}}
				/>
				{usagesModalUsages && (
					<FragmentUsagesModal usages={usagesModalUsages} onClose={() => setUsagesModalUsages(undefined)} />
				)}
			</StyledFragmentTree>
		</ActionContentbox>
	);
};
