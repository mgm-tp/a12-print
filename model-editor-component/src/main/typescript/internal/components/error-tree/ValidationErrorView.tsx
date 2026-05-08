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

import { Button, MessageBox, Typography } from "@com.mgmtp.a12.widgets/widgets-core";
import { ProgressIndicator } from "@com.mgmtp.a12.widgets/widgets-core/lib/progress-indicator/index.js";

import { CommitViewSelectors } from "../../redux/commit-view/selectors.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { countErrorDataNodes } from "../../utils/error-tree-utils.js";

import { ValidationErrorTree } from "./ValidationErrorTree.js";

export function ValidationErrorView() {
	const [isDebugMode, setIsDebugMode] = React.useState(false);
	const localizer = PrintLocalizer.useLocalizer();
	const hasCommitViewValidationErrors = useSelector(CommitViewSelectors.hasCommitViewValidationErrors);
	const hasCommitViewValidationWarnings = useSelector(CommitViewSelectors.hasCommitViewValidationWarnings);
	const errorMap = useSelector(CommitViewSelectors.commitViewErrorMapState);
	const errorTreeDataDebug = useSelector(CommitViewSelectors.errorTreeStateDebug);
	const errorTreeData = useSelector(CommitViewSelectors.errorTreeState);
	const treeData = isDebugMode ? errorTreeDataDebug : errorTreeData;

	const errorCount = (errorMap?.["@error"].length || 0) + (errorMap?.["@warning"]?.length || 0);
	const treeErrorCount = countErrorDataNodes(errorTreeData ? [errorTreeData] : []);
	const hasMissingErrors = errorCount !== treeErrorCount;

	return (
		<>
			<Typography.Section>
				<Typography.Headline
					level={2}
					className="-u-margin-l-sm"
					addons={
						<Button
							label={localizer(RESOURCE_KEYS.validation.errorTree.buttons.debugMode)}
							onClick={() => setIsDebugMode(prev => !prev)}
							className="-u-hidden"
						/>
					}
				>
					{localizer(RESOURCE_KEYS.validation.errorTree.heading)}
				</Typography.Headline>
			</Typography.Section>
			{isDebugMode && (
				<MessageBox
					label={localizer(RESOURCE_KEYS.validation.errorTree.messageBox.debugMode)}
					variant="info"
					className="-u-margin-sm"
				/>
			)}
			{!isDebugMode && hasMissingErrors && (
				<MessageBox
					label={localizer(RESOURCE_KEYS.validation.errorTree.messageBox.missingErrors)}
					variant="error"
					className="-u-margin-sm"
				/>
			)}
			{treeData === null ? (
				<ProgressIndicator />
			) : treeData.children?.length && (hasCommitViewValidationErrors || hasCommitViewValidationWarnings) ? (
				<ValidationErrorTree isDebugMode={isDebugMode} treeData={treeData} />
			) : (
				<MessageBox
					label={localizer(RESOURCE_KEYS.validation.errorTree.messageBox.noValidationErrors)}
					variant="info"
					className="-u-margin-sm"
				/>
			)}
		</>
	);
}
