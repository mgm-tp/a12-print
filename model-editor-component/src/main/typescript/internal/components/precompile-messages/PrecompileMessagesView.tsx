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
import { useSelector } from "react-redux";
import type { ReactNode } from "react";
import { useCallback, useMemo } from "react";

import type { BaseColumnType, TableRenderPropsType } from "@com.mgmtp.a12.widgets/widgets-core";
import { Button, getDataByKey, Icon, Typography } from "@com.mgmtp.a12.widgets/widgets-core";

import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { CommitViewSelectors } from "../../redux/commit-view/selectors.js";
import type { PrintMessage } from "../../../a12internal/api/PrintMessageReport.js";
import { PrintMessageSeverity } from "../../../a12internal/api/PrintMessageReport.js";

import { ErrorBadge, WarningBadge } from "../badge/ValidationBadge.js";
import { StyledValidationErrorsHeadline } from "../error-tree/ValidationErrorView.styled.js";

import { StyledPrecompilingMessagesTable } from "./PrecompileMessagesView.styled.js";

export function PrecompileMessagesView() {
	const localizer = PrintLocalizer.useLocalizer();

	const columns: BaseColumnType<PrintMessage>[] = useMemo(
		() => [
			{
				label: "",
				dataKey: "severity",
				subInfo: true,
				verticalAlignment: "middle",
				horizontalAlignment: "center",
				pinning: "left",
				width: 0.5,
			},
			{
				label: localizer(RESOURCE_KEYS.sidebar.commitChanges.columns.descriptions),
				dataKey: "description",
			},
			{
				label: "",
				actionColumn: true,
				horizontalAlignment: "right",
				dataKey: "stackTrace",
				pinning: "right",
				width: 0.5,
			},
		],
		[localizer]
	);

	const commitPrecompileMessages = useSelector(CommitViewSelectors.commitPrecompileMessages);

	const filterBySeverity = useCallback(
		(severity: PrintMessageSeverity) => commitPrecompileMessages.filter(message => message.severity === severity),
		[commitPrecompileMessages]
	);

	const errorMessages = useMemo(() => filterBySeverity(PrintMessageSeverity.ERROR), [filterBySeverity]);
	const warningMessages = useMemo(() => filterBySeverity(PrintMessageSeverity.WARNING), [filterBySeverity]);

	const bodyContentRenderer = useCallback(
		({ column, row }: TableRenderPropsType.BodyContentProps<PrintMessage>): ReactNode => {
			if (column.dataKey === "severity") {
				switch (row.severity) {
					case PrintMessageSeverity.ERROR:
						return <Icon variant={"error"}>error</Icon>;
					case PrintMessageSeverity.WARNING:
						return <Icon variant={"warning"}>warning</Icon>;
					default:
						return <Icon variant={"error"}>error</Icon>;
				}
			}

			const value = getDataByKey(row, column.dataKey ?? columns.indexOf(column)) as string;
			if (column.actionColumn && value) {
				return (
					<Button
						icon={<Icon>content_copy</Icon>}
						title={localizer(RESOURCE_KEYS.precompile.messages.copy)}
						onClick={() => {
							navigator.clipboard.writeText(value);
						}}
					/>
				);
			}

			return value;
		},
		[columns, localizer]
	);

	return (
		commitPrecompileMessages.length > 0 && (
			<>
				<Typography.Section>
					<Typography.Headline level={2} className="-u-margin-l-sm">
						<StyledValidationErrorsHeadline>
							{localizer(RESOURCE_KEYS.precompile.messages.heading)}
							<ErrorBadge
								count={errorMessages.length}
								type="descriptive"
								title={localizer(
									RESOURCE_KEYS.validation.title.toolbar.error,
									PrintLocalizer.getLocalizableArgs({ count: errorMessages.length })
								)}
								standalone
							/>
							<WarningBadge
								count={warningMessages.length}
								type="descriptive"
								title={localizer(
									RESOURCE_KEYS.validation.title.toolbar.warning,
									PrintLocalizer.getLocalizableArgs({ count: warningMessages.length })
								)}
								standalone
							/>
						</StyledValidationErrorsHeadline>
					</Typography.Headline>
				</Typography.Section>
				<StyledPrecompilingMessagesTable
					data={errorMessages.concat(warningMessages)}
					columns={columns}
					componentRenderers={{ bodyContentRenderer, headRenderer: () => <></> }}
					hasFootContent={false}
				/>
			</>
		)
	);
}
