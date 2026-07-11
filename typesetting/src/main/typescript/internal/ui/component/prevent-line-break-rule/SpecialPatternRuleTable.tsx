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

import type { DropDownItem, BaseColumnType, TableRenderPropsType } from "@com.mgmtp.a12.widgets/widgets-core";
import { Autocomplete, Button, Icon, Message, Table, addPrefix } from "@com.mgmtp.a12.widgets/widgets-core";

import { useLocalizer } from "../../localization/localizer.js";
import { RESOURCE_KEYS } from "../../localization/keys.js";
import { usePreventLineBreakRuleErrorGetter } from "../../hooks/use-prevent-line-break-rule-error-getter.js";
import { SpecialPatterns } from "../../constant/special-pattern.js";

import type { ExtendedPreventLineBreakRule } from "./types.js";
import { RuleType } from "./types.js";

export enum DataKeys {
	data = "data",
	actions = "actions",
}

const options: DropDownItem[] = SpecialPatterns.map(i => ({
	label: `${i.label}`,
	value: i.value,
	secondaryText: i.example,
}));

interface SpecialPatternRuleTableProps {
	specialPatternRule: ExtendedPreventLineBreakRule[];
	addRule: (type: RuleType) => void;
	deleteRule: (index: number) => void;
	updateRule: (value: string, index: number) => void;
}

export const SpecialPatternRuleTable = ({
	specialPatternRule,
	addRule,
	deleteRule,
	updateRule,
}: SpecialPatternRuleTableProps) => {
	const columns = useColumns();
	const localizer = useLocalizer();
	const getErrorMessage = usePreventLineBreakRuleErrorGetter();

	const onRowChange = (rowIndex: number, value: DropDownItem) => {
		updateRule(value.value || "", rowIndex);
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
				<Autocomplete
					hintTemplate="{count} matches"
					value={options.find(opt => opt.value === row.pattern)}
					items={options}
					onValueChange={value => onRowChange(row.index, value as DropDownItem)}
					errorMessage={getErrorMessage(row.index)}
				/>
			);
		}

		return null;
	};

	return (
		<>
			<Table<ExtendedPreventLineBreakRule>
				data={specialPatternRule}
				columns={columns}
				componentRenderers={{ bodyContentRenderer }}
			/>
			{!specialPatternRule.length && (
				<Message className={addPrefix("-u-text-center")}>
					{localizer(RESOURCE_KEYS.roleSettings.placeholderContent)}
				</Message>
			)}
			<Button className={addPrefix("-u-margin-t-base")} onClick={() => addRule(RuleType.special)}>
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
				label: localizer(RESOURCE_KEYS.preventLineBreakRules.specialPattern.column.pattern),
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
