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
import { useDispatch } from "react-redux";
import uniqueId from "lodash/uniqueId.js";

import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react";
import type { MapTreeNode } from "@com.mgmtp.a12.widgets/widgets-core";
import { Button, Icon, Collapsible, Tree, TreeAdapter } from "@com.mgmtp.a12.widgets/widgets-core";

import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { NavigationActions } from "../../redux/index.js";
import type { ErrorTreeNode } from "../../types/error-tree.js";

const InteractiveTree = Collapsible(TreeAdapter(Tree));

function generateTreeId(isDebugMode: boolean) {
	return `error-tree${isDebugMode ? "-debug" : ""}-${uniqueId()}`;
}

interface ValidationErrorTreeProps {
	treeData: ErrorTreeNode;
	isDebugMode: boolean;
}

export function ValidationErrorTree({ treeData, isDebugMode }: ValidationErrorTreeProps): React.ReactElement {
	const dispatch = useDispatch();
	const { localizer } = React.useContext(LocalizerContext);
	const stdLocalizer = PrintLocalizer.useLocalizer();

	const tplTreeNode: MapTreeNode = (node: ErrorTreeNode, chained) => {
		const localizedErrorMessage = node?.errorData && localizer(...node.errorData.errorMessage);
		const localizedLabel = !node.path
			? node.label
			: stdLocalizer(node.path) === node.path
				? node.label
				: stdLocalizer(node.path);
		const severity = (node.errorData?.severity.toLowerCase() as "error" | "warning" | "info") || "info";

		return {
			...chained,
			fileNode: node,
			label: node?.errorData ? (
				<span
					className={
						node?.errorData.severity === "ERROR" ? "-u-text-red -u-block" : "-u-text-orange -u-block"
					}
				>
					{localizedErrorMessage}
				</span>
			) : (
				localizedLabel
			),
			icon: (node.icon && <Icon>{node.icon}</Icon>) || (node.errorData && <Icon variant={severity}>error</Icon>),
			actionButtons: node.errorData && node.errorData.navigation && (
				<Button
					icon={<Icon>location_searching</Icon>}
					title={stdLocalizer(RESOURCE_KEYS.validation.errorTree.buttons.viewErrorLocation)}
					onClick={e => {
						e.stopPropagation();
						if (node.errorData?.navigation) {
							dispatch(
								NavigationActions.navigateFromPath({
									path: node.errorData.jsonPath,
									target: node.errorData.navigation.containerTarget
										? {
												type: node.errorData.navigation.sidebarTarget,
												id: node.errorData.navigation.containerTarget,
											}
										: undefined,
								})
							);
						}
					}}
				/>
			),
		};
	};

	return (
		<InteractiveTree key={generateTreeId(isDebugMode)} root={treeData} hideRoot={true} tplTreeNode={tplTreeNode} />
	);
}
