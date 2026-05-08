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
import { createSelector } from "reselect";

import { DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";
import {
	PrintModelEntity,
	Reference,
	isReference,
	PlaceableReference,
	ElementType,
	PrintModel,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import {
	LogPersistentEntry,
	SidebarItem,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";

import { createSliceSelector, idInputSelector, PrintEngineSelectors } from "../../store/selectors.js";
import { PrintEngineState } from "../../store/root-reducer.js";
import { createErrorNodes, pushErrorTreeNode } from "../../utils/error-tree-utils.js";
import {
	NavigationTarget,
	ErrorTreeNode,
	PrintModelErrorMap,
	ElementNavigationTarget,
	CommitInteractionRow,
} from "../../types/index.js";
import { ElementTypes } from "../../constant/elements.js";
import { SidebarItemTypes } from "../../constant/sidebar.js";
import { ElementsUtils } from "../../utils/index.js";
import { RESOURCE_KEYS } from "../../localization/index.js";

function getContainerErrors<T>(container: DeepPartialErrorMap<T>[] | undefined, id: string) {
	if (!container || !container.length) {
		return;
	}
	return container.find(containerElement => containerElement["@id"] === id);
}

export namespace CommitViewSelectors {
	export const commitViewErrorMapState = createSliceSelector<PrintModelErrorMap | undefined>(
		state => state.CommitViewState.commitViewErrorMap
	);

	export const commitViewPrintModel = createSliceSelector<PrintModel | undefined>(
		state => state.CommitViewState.printModel
	);

	export const commitViewLogPersistentEntries = createSliceSelector<LogPersistentEntry[] | undefined>(
		state => state.CommitViewState.logPersistentEntries
	);

	export const commitInteractionRows = createSliceSelector<CommitInteractionRow[] | undefined>(
		state => state.CommitViewState.commitInteractionRows
	);

	export const hasCommitViewValidationErrors = createSelector(
		[commitViewErrorMapState],
		errorMap => !!errorMap?.["@error"].length
	);

	export const hasCommitViewValidationWarnings = createSelector(
		[commitViewErrorMapState],
		errorMap => !!errorMap?.["@warning"].length
	);

	export const generalCommitErrors = createSelector([commitViewErrorMapState], errorMap => {
		const newMap = DeepPartialErrorMap.getEmptyMap();
		if (errorMap?.content?.general) {
			DeepPartialErrorMap.mergeErrorMaps(newMap, errorMap?.content?.general);
		}
		if (errorMap?.header) {
			DeepPartialErrorMap.mergeErrorMaps(newMap, errorMap?.header);
		}
		return newMap;
	});

	export const textStylesCommitErrors = createSelector(
		[commitViewErrorMapState],
		errorMap => errorMap?.content?.textStyles
	);

	export const sectionCommitErrors = createSelector([commitViewErrorMapState, idInputSelector], (errorMap, id) => {
		return getContainerErrors(errorMap?.content?.sections?.definitions, id);
	});

	export const watermarkCommitErrors = createSelector([commitViewErrorMapState, idInputSelector], (errorMap, id) => {
		return getContainerErrors(errorMap?.content?.watermarks?.definitions, id);
	});

	export const segmentCommitErrors = createSelector([commitViewErrorMapState, idInputSelector], (errorMap, id) => {
		return getContainerErrors(errorMap?.content?.segments?.definitions, id);
	});

	export const elementCommitErrors = createSelector([commitViewErrorMapState, idInputSelector], (errorMap, id) => {
		return getContainerErrors(errorMap?.content?.elementDefinitions, id);
	});

	export const errorTreeStateDebug = createSelector(
		[commitViewErrorMapState, PrintEngineSelectors.state],
		(errorMapState, pestate) => {
			if (!errorMapState) {
				return null;
			}

			const parentId = PrintEngineSelectors.printModelId(pestate);
			if (!parentId) {
				return null;
			}

			const root: ErrorTreeNode = {
				label: "root",
				id: parentId,
				children: createErrorNodes(errorMapState, parentId, undefined, false),
				initiallyExpanded: true,
			};

			return root;
		}
	);

	export const errorTreeState = createSelector(
		[commitViewErrorMapState, PrintEngineSelectors.state],
		(errorMapState, pestate) => {
			if (!errorMapState) {
				return null;
			}

			const parentId = PrintEngineSelectors.printModelId(pestate);
			if (!parentId) {
				return null;
			}

			const root: ErrorTreeNode = {
				label: "root",
				id: parentId,
				children: [],
				initiallyExpanded: true,
			};

			Object.values(SidebarItem).forEach(item => {
				pushErrorTreeNode(root.children, createSidebarErrorTreeNodes(pestate, parentId, item));
			});

			return root;
		}
	);
}

function createSidebarErrorTreeRoot<T>(
	sidebarItemType: SidebarItem,
	parentId: string,
	errorMap?: DeepPartialErrorMap<T> | undefined
): ErrorTreeNode {
	const navigation: NavigationTarget = { sidebarTarget: sidebarItemType };

	const rootId = `${parentId}.${sidebarItemType}`;
	const containerRoot: ErrorTreeNode = {
		icon: SidebarItemTypes[sidebarItemType]?.iconName,
		id: rootId,
		path: SidebarItemTypes[sidebarItemType]?.name,
		label: SidebarItemTypes[sidebarItemType]?.name,
		children: createErrorNodes(errorMap, rootId, navigation),
		initiallyExpanded: true,
	};
	return containerRoot;
}

function createSidebarErrorTreeNodes(
	pestate: PrintEngineState,
	parentId: string,
	containerType: SidebarItem
): ErrorTreeNode | undefined {
	const containerSelectorConfig = {
		[SidebarItem.GENERAL]: {
			errorMapSelector: CommitViewSelectors.generalCommitErrors,
			containerSelector: undefined,
		},
		[SidebarItem.TEXT_STYLES]: {
			errorMapSelector: CommitViewSelectors.textStylesCommitErrors,
			containerSelector: undefined,
		},
		[SidebarItem.SECTION]: {
			errorMapSelector: CommitViewSelectors.sectionCommitErrors,
			containerSelector: PrintEngineSelectors.sections,
		},
		[SidebarItem.SEGMENT]: {
			errorMapSelector: CommitViewSelectors.segmentCommitErrors,
			containerSelector: PrintEngineSelectors.segments,
		},
		[SidebarItem.WATERMARK]: {
			errorMapSelector: CommitViewSelectors.watermarkCommitErrors,
			containerSelector: PrintEngineSelectors.watermarks,
		},
		[SidebarItem.SCHEMA]: undefined,
		[SidebarItem.COMMIT_CHANGES]: undefined,
	}[containerType];

	if (!containerSelectorConfig) {
		return undefined;
	}
	const { errorMapSelector, containerSelector } = containerSelectorConfig;

	if (!containerSelector) {
		return createSidebarErrorTreeRoot(containerType, parentId, errorMapSelector(pestate));
	}

	const containerRoot = createSidebarErrorTreeRoot(containerType, parentId);
	const container = containerSelector(pestate);
	container?.forEach((containerElement, i) => {
		const navigation: NavigationTarget = { sidebarTarget: containerType, containerTarget: containerElement.id };

		// containers general
		const containerErrorMap = errorMapSelector(pestate, containerElement.id);
		const rootId = `${parentId}.${containerType}[${i}]`;
		const containerElementRoot = {
			icon: "description",
			id: rootId,
			path: containerType + ".element",
			label: containerElement.title || `${containerType} #${i + 1}`,
			children: createErrorNodes(containerErrorMap, rootId, navigation),
			initiallyExpanded: true,
		};

		// containers element definitions
		const nestedRefs = containerElement.elementReferences || [];
		const nodeId = `${rootId}.elements`;
		const elementsRoot: ErrorTreeNode = {
			icon: "category",
			id: nodeId,
			path: RESOURCE_KEYS.validation.errorTree.elements,
			label: "Elements",
			children: createNestedElementErrorTreeNodes(pestate, navigation, nestedRefs, nodeId, 0),
			initiallyExpanded: true,
		};

		pushErrorTreeNode(containerElementRoot.children, elementsRoot);
		pushErrorTreeNode(containerRoot.children, containerElementRoot);
	});
	return containerRoot;
}

function createNestedElementErrorTreeNodes(
	pestate: PrintEngineState,
	navigationTarget: NavigationTarget,
	elementReferences:
		| readonly (DeepPartialRecursive<Reference> & PrintModelEntity)[]
		| readonly (DeepPartialRecursive<PlaceableReference> & PrintModelEntity)[],
	parentId: string,
	depth = 0
) {
	const nestableElements: ErrorTreeNode[] = [];

	elementReferences?.forEach((ref, index: number) => {
		if (!isReference(ref)) {
			return;
		}
		const element = PrintEngineSelectors.printModelElement(pestate, ref.refId);
		const nodeId = `${parentId}[${index}].${element.type}`;
		const navigation = createNestedNavigationTarget(navigationTarget, element.type, element.id);

		// recursive call when the element has nested references
		const nestedRefs = ElementsUtils.getElementReferences(element);
		let nestedElementNodes: ErrorTreeNode[] = [];

		if (nestedRefs.length) {
			nestedElementNodes = createNestedElementErrorTreeNodes(pestate, navigation, nestedRefs, nodeId, depth + 1);
		}

		// create tree node for the current element
		const elementRoot = {
			icon: ElementTypes[element.type]?.iconName,
			id: nodeId,
			path: ElementTypes[element.type]?.name,
			label: ElementTypes[element.type]?.name || `${element.type} Element #${depth + 1}`,
			children: [
				...createErrorNodes(CommitViewSelectors.elementCommitErrors(pestate, element.id), nodeId, navigation),
				...nestedElementNodes,
			],
			initiallyExpanded: true,
		};
		if (elementRoot.children.length) {
			nestableElements.push(elementRoot);
		}
	});

	return nestableElements;
}

function createNestedNavigationTarget(navigation: NavigationTarget, elementType: ElementType, elementRef: string) {
	const elementTargets = navigation.elementTargets || [];
	const newNavigationElement: ElementNavigationTarget = { elementType, elementRef };
	elementTargets.push(newNavigationElement);
	return { ...navigation, elementTargets } as NavigationTarget;
}
