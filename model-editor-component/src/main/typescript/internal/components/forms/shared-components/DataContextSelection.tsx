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

import type {
	CollapsibleTreeNodeModel,
	MapTreeNode,
	SelectableTreeNodeModel,
} from "@com.mgmtp.a12.widgets/widgets-core";
import {
	Collapsible,
	Selectable,
	Tree,
	TreeAdapter,
	find,
	findById,
	Icon,
	Tooltip,
} from "@com.mgmtp.a12.widgets/widgets-core";
import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import type { ElementMapEntry } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { DocumentModelUtils } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import type { ILocalizer } from "../../../api/index.js";

import { StyledLabel, StyledMessageBox } from "./DataContextSelection.styled.js";

const logger = LoggerFactory.getLogger("DataContextSelection");

const BasicTree = Selectable(Collapsible(TreeAdapter(Tree)));
const tplTreeNode: MapTreeNode = (n, chained) => {
	return {
		...chained,
		fileNode: n,
	};
};

export enum AllowedElementType {
	field = "field",
	repeatableGroup = "repeatableGroup",
	nonRepeatableGroup = "nonRepeatableGroup",
	anyGroup = "anyGroup",
}

interface TreeNode extends SelectableTreeNodeModel, CollapsibleTreeNodeModel {
	children?: TreeNode[];
	fieldPath?: string;
	type?: AllowedElementType;
	tooltipMessage?: string;
}

export const MAX_REPEAT_LEVEL = Number.MAX_SAFE_INTEGER;
const STOP_PATH = "__STOP_PATH";

interface DataContextSelectionProps {
	type: AllowedElementType;
	selectedPath: string | undefined;
	setSelectedPath: (path: string) => void;
	maxRepeatLevel: number;
	elementMapEntries: ElementMapEntry[];
	isRepeatableInstanceFlag?: boolean;
	isInstanceContext?: boolean;
}

export const DataContextSelection = (props: DataContextSelectionProps) => {
	const {
		type,
		elementMapEntries,
		maxRepeatLevel,
		selectedPath,
		setSelectedPath,
		isRepeatableInstanceFlag,
		isInstanceContext,
	} = props;
	const localizer = PrintLocalizer.useLocalizer();

	const treeData = React.useMemo(() => {
		return getRootNode(
			type,
			maxRepeatLevel,
			localizer,
			elementMapEntries,
			isRepeatableInstanceFlag,
			isInstanceContext
		);
	}, [type, maxRepeatLevel, localizer, elementMapEntries, isRepeatableInstanceFlag, isInstanceContext]);

	const toggledNode = find(treeData, n => n.fieldPath === selectedPath);
	if (toggledNode) {
		const previouslySelectedNode = find(treeData, n => n.selected === true);
		if (previouslySelectedNode && previouslySelectedNode.id !== toggledNode.id) {
			previouslySelectedNode.selected = false;
		} else if (!previouslySelectedNode) {
			toggledNode.selected = true;
		}
	}

	const onToggleSelection = React.useCallback(
		(node: TreeNode) => {
			if (node.disabled) {
				return;
			}
			const toggledNode = findById(treeData, node.id);
			const selectedNode = find(treeData, n => n.selected === true);
			if (selectedNode && selectedNode.id !== toggledNode.id) {
				selectedNode.selected = false;
			}
			if (
				(toggledNode.type === AllowedElementType.field && type !== AllowedElementType.field) ||
				(toggledNode.type !== type && type !== AllowedElementType.anyGroup)
			) {
				return;
			}
			const path = toggledNode.fieldPath;
			if (path) {
				toggledNode.selected = true;
				setSelectedPath(path);
			}
		},
		[setSelectedPath, treeData, type]
	);

	if (!elementMapEntries.length && !treeData.children?.length) {
		return null;
	}

	if (!treeData.children?.length) {
		return (
			<StyledMessageBox
				label={localizer(RESOURCE_KEYS.elementForm.dataContextSelection.noTreeData)}
				variant="warning"
				focusOnMessage={false}
			/>
		);
	}
	return <BasicTree root={treeData} tplTreeNode={tplTreeNode} onToggleSelection={onToggleSelection} hideRoot />;
};

function getRootNode(
	type: AllowedElementType,
	maxRepeatLevel: number,
	localizer: ILocalizer,
	elementMapEntries: ElementMapEntry[],
	isRepeatableInstanceFlag?: boolean,
	isInstanceContext?: boolean
): TreeNode {
	let children: TreeNode[] = [];
	if (elementMapEntries.length !== 0) {
		const commonRoots = getCommonRoots(elementMapEntries);
		if (commonRoots.length === 0) {
			logger.error(
				`No root groups could be found for the following element map entries: ${JSON.stringify(elementMapEntries)}`
			);
		} else {
			children = buildRootTreeNodes(
				type,
				commonRoots,
				elementMapEntries,
				maxRepeatLevel,
				localizer,
				isRepeatableInstanceFlag,
				isInstanceContext
			);
		}
	}
	return {
		id: "root",
		label: "root",
		initiallyExpanded: true,
		children,
	};
}

function getCommonRoots(elementMapEntries: ElementMapEntry[]) {
	const possibleRoots: Record<string, string[]> = {};

	function handleRootPath(possibleRoots: Record<string, string[]>, subPath: string) {
		if (!(subPath in possibleRoots)) {
			possibleRoots[subPath] = [subPath];
		}
	}

	function handleSubPath(
		possibleRoots: Record<string, string[]>,
		subPaths: string[],
		subPath: string,
		currentIndex: number,
		entry: ElementMapEntry
	) {
		const currentCommonPath = possibleRoots[subPaths[1]];
		const currentCommonSubPathIndex = currentIndex - 1;
		const currentCommonSubPath = currentCommonPath[currentCommonSubPathIndex];
		if (currentCommonSubPath === STOP_PATH) {
			return true;
		}
		if (!entry.isGroup && currentIndex === subPaths.length - 1) {
			currentCommonPath[currentCommonSubPathIndex] = STOP_PATH;
			return true;
		}
		if (currentCommonSubPath === undefined) {
			currentCommonPath.push(subPath);
			return false;
		}
		if (currentCommonSubPath !== subPath) {
			currentCommonPath[currentCommonSubPathIndex] = STOP_PATH;
			return true;
		}

		return false;
	}

	function handleLastPath(subPaths: string[], currentIndex: number) {
		const currentCommonPath = possibleRoots[subPaths[1]];
		if (currentCommonPath.length === subPaths.length - 1) {
			currentCommonPath.push(STOP_PATH);
		} else {
			currentCommonPath[currentIndex] = STOP_PATH;
		}
	}

	elementMapEntries.forEach(entry => {
		if (entry.treeOptions?.disabled) {
			return;
		}
		const subPaths = entry.elementPath.split("/");

		for (let i = 1; i < subPaths.length; i++) {
			const subPath = subPaths[i];
			if (i === 1) {
				handleRootPath(possibleRoots, subPath);
			} else {
				const shouldStop = handleSubPath(possibleRoots, subPaths, subPath, i, entry);
				if (shouldStop) {
					break;
				}
			}
			if (i === subPaths.length - 1) {
				handleLastPath(subPaths, i);
			}
		}
	});

	return Object.values(possibleRoots);
}

function buildRootTreeNodes(
	type: AllowedElementType,
	commonRoots: string[][],
	elementMapEntries: ElementMapEntry[],
	maxRepeatLevel: number,
	localizer: ILocalizer,
	isRepeatableInstanceFlag?: boolean,
	isInstanceContext?: boolean
): TreeNode[] {
	const hasRootInstance = commonRoots.some(
		root =>
			elementMapEntries.find(
				entry => entry.elementPath === `/${root.filter(path => path !== STOP_PATH).join("/")}`
			)?.treeOptions?.isInstance
	);
	const treeNodes: TreeNode[] = [];

	function getPathAndRepeatLevel(subPaths: string[]) {
		let fullPath = "";
		let currentLevel = 0;
		for (const element of subPaths) {
			const subPath = element;
			if (currentLevel > maxRepeatLevel || subPath === STOP_PATH) {
				break;
			}
			fullPath = `${fullPath}/${subPath}`;
			const currentEntry = elementMapEntries.find(entry => entry.elementPath === fullPath);
			currentLevel =
				currentEntry?.repeatability && currentEntry.repeatability > 1 ? currentLevel + 1 : currentLevel;
		}

		return { fullPath, currentLevel };
	}

	function buildGroupIcon({ treeOptions }: ElementMapEntry) {
		const icons = [getIcon("group", localizer)];

		if (treeOptions?.isInstance) {
			icons.push(getIcon("repeatableInstance", localizer));
		}

		return icons;
	}

	commonRoots.forEach(subPaths => {
		const { fullPath, currentLevel } = getPathAndRepeatLevel(subPaths);
		const entry = elementMapEntries.find(entry => entry.elementPath === fullPath);
		if (!entry) {
			logger.warn(`Could not find entry with path: ${fullPath}`);
			return;
		}

		const { element, elementPath, repeatability, treeOptions } = entry;
		if (DocumentModelUtils.isField(element)) {
			logger.warn(`Expected a group but got a field instead: ${JSON.stringify(element)}`);
			return;
		}

		const isOutOfInstanceNode = hasRootInstance && !treeOptions?.isInstance && isInstanceContext;

		const isRepeatable = Boolean(repeatability && repeatability > 1);
		const skipChildren = currentLevel > maxRepeatLevel || isOutOfInstanceNode;

		const children = skipChildren
			? undefined
			: buildChildrenTreeNodes({
					type,
					maxRepeatLevel,
					parentPath: elementPath,
					currentLevel,
					children: element.elements,
					localizer,
					elementMapEntries,
					isRepeatableInstanceFlag,
					isInstanceContext,
				});

		const typeBasedDisabled =
			!children?.length &&
			(type === AllowedElementType.field ||
				(type === AllowedElementType.nonRepeatableGroup && isRepeatable) ||
				(type === AllowedElementType.repeatableGroup && !isRepeatable));
		const disabledNode = Boolean(typeBasedDisabled || treeOptions?.disabled || isOutOfInstanceNode);

		const icons = buildGroupIcon(entry);

		treeNodes.push({
			id: element.id,
			label: getLabel(elementPath.slice(1), disabledNode, localizer, type, isOutOfInstanceNode),
			initiallyExpanded: true,
			selected: false,
			fieldPath: elementPath,
			children,
			icon: icons,
			type: isRepeatable ? AllowedElementType.repeatableGroup : AllowedElementType.nonRepeatableGroup,
			disabled: disabledNode,
			highlightVariant: treeOptions?.isInstance ? "success" : undefined,
		});
	});

	return treeNodes;
}

function buildFieldNode({
	element,
	fieldPath,
	type,
	isMustInInstance,
	isInstanceContext,
	localizer,
}: {
	element: DocumentModel.Field;
	fieldPath: string;
	type: AllowedElementType;
	isMustInInstance: boolean;
	localizer: ILocalizer;
	isInstanceContext: boolean;
}) {
	if (type !== AllowedElementType.field) {
		return null;
	}

	return {
		id: element.id,
		label: getLabel(
			`${element.name}${element.requirednessConfig ? "*" : ""}`,
			isMustInInstance,
			localizer,
			type,
			isInstanceContext
		),
		selected: false,
		fieldPath,
		disabled: isMustInInstance,
		type: AllowedElementType.field,
	};
}

function buildGroupIcon({
	currentEntry,
	isRepeatable,
	isRepeatableInstanceFlag,
	localizer,
}: {
	currentEntry: ElementMapEntry | undefined;
	isRepeatable: boolean;
	isRepeatableInstanceFlag?: boolean;
	localizer: ILocalizer;
}) {
	const icons = [getIcon("group", localizer)];
	if (currentEntry?.treeOptions?.isInstance) {
		icons.push(getIcon("repeatableInstance", localizer));
	}
	if (isRepeatable) {
		icons.push(
			isRepeatableInstanceFlag ? getIcon("repeatableInstance", localizer) : getIcon("repeatableGroup", localizer)
		);
	}

	return icons;
}

function buildGroupNode({
	elementMapEntries,
	fieldPath,
	isRepeatableInstanceFlag,
	localizer,
	isMustInInstance,
	currentLevel,
	maxRepeatLevel,
	type,
	element,
	isInstanceContext,
}: {
	element: DocumentModel.Group;
	fieldPath: string;
	type: AllowedElementType;
	maxRepeatLevel: number;
	currentLevel: number;
	localizer: ILocalizer;
	elementMapEntries: ElementMapEntry[];
	isRepeatableInstanceFlag?: boolean;
	isInstanceContext?: boolean;
	isMustInInstance?: boolean;
}): TreeNode {
	const currentEntry = elementMapEntries.find(entry => entry.elementPath === fieldPath);
	const isRepeatable = Boolean(currentEntry?.repeatability && currentEntry.repeatability > 1);
	const icons = buildGroupIcon({ currentEntry, isRepeatable, isRepeatableInstanceFlag, localizer });

	const isOutOfInstanceNode = !currentEntry?.treeOptions?.isInstance && isMustInInstance;

	const newCurrentLevel = isRepeatable ? currentLevel + 1 : currentLevel;

	const skipChildren = (isRepeatable && newCurrentLevel > maxRepeatLevel) || isOutOfInstanceNode;
	const children = skipChildren
		? undefined
		: buildChildrenTreeNodes({
				type,
				maxRepeatLevel,
				parentPath: fieldPath,
				currentLevel: newCurrentLevel,
				children: element.elements,
				localizer,
				elementMapEntries,
				isRepeatableInstanceFlag,
				isInstanceContext,
			});

	const typeBasedDisabled =
		(type === AllowedElementType.field && !children?.length) ||
		(type === AllowedElementType.nonRepeatableGroup && isRepeatable && !children?.length) ||
		(type === AllowedElementType.repeatableGroup && !isRepeatable && !children?.length);
	const disabledNode = Boolean(typeBasedDisabled || currentEntry?.treeOptions?.disabled || isOutOfInstanceNode);

	return {
		id: element.id,
		label: getLabel(element.name, disabledNode, localizer, type, isOutOfInstanceNode),
		initiallyExpanded: currentEntry?.treeOptions?.isInstance,
		selected: false,
		fieldPath,
		children,
		icon: icons,
		type: isRepeatable ? AllowedElementType.repeatableGroup : AllowedElementType.nonRepeatableGroup,
		disabled: disabledNode,
		highlightVariant: currentEntry?.treeOptions?.isInstance ? "success" : undefined,
	};
}

function buildChildrenTreeNodes({
	children,
	currentLevel,
	elementMapEntries,
	localizer,
	maxRepeatLevel,
	parentPath,
	type,
	isInstanceContext = false,
	isRepeatableInstanceFlag,
}: {
	type: AllowedElementType;
	maxRepeatLevel: number;
	parentPath: string;
	currentLevel: number;
	children: ReadonlyArray<DocumentModel.Element>;
	localizer: ILocalizer;
	elementMapEntries: ElementMapEntry[];
	isRepeatableInstanceFlag?: boolean;
	isInstanceContext?: boolean;
}): TreeNode[] {
	const treeNodes: TreeNode[] = [];

	const hasInstanceContext = children.some(
		element =>
			elementMapEntries.find(entry => entry.elementPath === `${parentPath}/${element.name}`)?.treeOptions
				?.isInstance
	);

	const isMustInInstance = isInstanceContext && hasInstanceContext;

	children.forEach(element => {
		const fieldPath = `${parentPath}/${element.name}`;

		if (DocumentModelUtils.isField(element)) {
			const fieldNode = buildFieldNode({
				element,
				fieldPath,
				type,
				isInstanceContext,
				isMustInInstance,
				localizer,
			});
			if (fieldNode) {
				treeNodes.push(fieldNode);
			}
			return;
		}

		const groupNode = buildGroupNode({
			currentLevel,
			element,
			type,
			maxRepeatLevel,
			elementMapEntries,
			fieldPath,
			localizer,
			isInstanceContext,
			isMustInInstance,
			isRepeatableInstanceFlag,
		});

		if (groupNode) {
			treeNodes.push(groupNode);
		}
	});

	return treeNodes;
}

function getIcon(type: "group" | "repeatableGroup" | "repeatableInstance", localizer: ILocalizer) {
	if (type === "group") {
		return (
			<Icon
				iconTheme="outlined"
				key="group"
				title={localizer(RESOURCE_KEYS.elementForm.dataContextSelection.group)}
			>
				folder
			</Icon>
		);
	}
	if (type === "repeatableGroup") {
		return (
			<Icon
				key="repeatableGroup"
				title={localizer(RESOURCE_KEYS.elementForm.dataContextSelection.repeatableGroup)}
			>
				repeat
			</Icon>
		);
	}
	return (
		<Icon
			key="repeatableInstance"
			title={localizer(RESOURCE_KEYS.elementForm.dataContextSelection.repeatableInstance)}
		>
			repeat_one
		</Icon>
	);
}

const hintMessageMap = {
	[AllowedElementType.field]: RESOURCE_KEYS.elementForm.dataContextSelection.hintMessage.fieldType,
	[AllowedElementType.nonRepeatableGroup]:
		RESOURCE_KEYS.elementForm.dataContextSelection.hintMessage.nonRepeatableGroup,
	[AllowedElementType.repeatableGroup]: RESOURCE_KEYS.elementForm.dataContextSelection.hintMessage.repeatableGroup,
	[AllowedElementType.anyGroup]: RESOURCE_KEYS.elementForm.dataContextSelection.hintMessage.anyGroup,
};

const hintInstanceMessageMap = {
	[AllowedElementType.field]: RESOURCE_KEYS.elementForm.dataContextSelection.hintMessage.instanceFieldType,
	[AllowedElementType.nonRepeatableGroup]:
		RESOURCE_KEYS.elementForm.dataContextSelection.hintMessage.instanceNonRepeatableGroup,
	[AllowedElementType.repeatableGroup]:
		RESOURCE_KEYS.elementForm.dataContextSelection.hintMessage.instanceRepeatableGroup,
	[AllowedElementType.anyGroup]: RESOURCE_KEYS.elementForm.dataContextSelection.hintMessage.instanceAnyGroup,
};
function getLabel(
	label: string,
	readonly: boolean,
	localizer: ILocalizer,
	type: AllowedElementType,
	isInstanceContext?: boolean
) {
	if (!readonly) {
		return label;
	}

	const hintMessage = isInstanceContext ? hintInstanceMessageMap[type] : hintMessageMap[type];

	return (
		<StyledLabel>
			{label}
			{hintMessage && (
				<Tooltip text={localizer(hintMessage)} variant="hint">
					<Icon variant="info" iconTheme="outlined">
						info
					</Icon>
				</Tooltip>
			)}
		</StyledLabel>
	);
}
