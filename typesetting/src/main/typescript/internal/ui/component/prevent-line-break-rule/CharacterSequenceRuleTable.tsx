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
import { useMemo } from "react";

import type { BaseColumnType, TableRenderPropsType } from "@com.mgmtp.a12.widgets/widgets-core";
import { Button, Icon, Message, Table, addPrefix } from "@com.mgmtp.a12.widgets/widgets-core";

import { useLocalizer } from "../../localization/localizer.js";
import { RESOURCE_KEYS } from "../../localization/keys.js";
import { CharacterSequenceRuleConversion } from "../../utils/rule-conversion.js";
import { usePreventLineBreakRuleErrorGetter } from "../../hooks/use-prevent-line-break-rule-error-getter.js";

import { CustomTextField } from "../input/CustomTextField.js";

import type { ExtendedPreventLineBreakRule } from "./types.js";
import { RuleType } from "./types.js";

export enum DataKeys {
	data = "data",
	actions = "actions",
}

interface CharacterSequenceRuleTableProps {
	characterSequenceRules: ExtendedPreventLineBreakRule[];
	addRule: (type: RuleType) => void;
	deleteRule: (index: number) => void;
	updateRule: (value: string, index: number) => void;
}

export const CharacterSequenceRuleTable = ({
	characterSequenceRules,
	deleteRule,
	addRule,
	updateRule,
}: CharacterSequenceRuleTableProps) => {
	const columns = useColumns();
	const localizer = useLocalizer();
	const getErrorMessage = usePreventLineBreakRuleErrorGetter();

	const onRowChange = (rowIndex: number, value: string) => {
		updateRule(CharacterSequenceRuleConversion.toRegExp(value), rowIndex);
	};

	const bodyContentRenderer = (props: TableRenderPropsType.BodyContentProps<ExtendedPreventLineBreakRule>) => {
		const { column, row } = props;

		if (column.dataKey === DataKeys.actions) {
			return (
				<Button
					destructive
					icon={<Icon title={localizer(RESOURCE_KEYS.button.delete)}>delete</Icon>}
					title={localizer(RESOURCE_KEYS.button.delete)}
					onClick={() => deleteRule(row.index)}
				/>
			);
		}

		if (column.dataKey === DataKeys.data) {
			return (
				<CustomTextField
					placeholder="T-shirt, E-mail..."
					value={CharacterSequenceRuleConversion.toValue(row.pattern)}
					onValueChange={value => onRowChange(row.index, value)}
					errorMessage={getErrorMessage(row.index)}
				/>
			);
		}

		return null;
	};

	return (
		<>
			<Table<ExtendedPreventLineBreakRule>
				data={characterSequenceRules}
				columns={columns}
				componentRenderers={{ bodyContentRenderer }}
			/>
			{!characterSequenceRules.length && (
				<Message className={addPrefix("-u-text-center")}>
					{localizer(RESOURCE_KEYS.roleSettings.placeholderContent)}
				</Message>
			)}
			<Button className={addPrefix("-u-margin-t-base")} onClick={() => addRule(RuleType.character)}>
				{localizer(RESOURCE_KEYS.button.add)}
			</Button>
		</>
	);
};

const useColumns = (): BaseColumnType[] => {
	const localizer = useLocalizer();

	return useMemo(
		() => [
			{
				label: localizer(RESOURCE_KEYS.preventLineBreakRules.characterSequence.column.characterSequence),
				dataKey: DataKeys.data,
			},
			{
				label: "",
				dataKey: DataKeys.actions,
				actionColumn: true,
				pinning: "right",
			},
		],
		[localizer]
	);
};
