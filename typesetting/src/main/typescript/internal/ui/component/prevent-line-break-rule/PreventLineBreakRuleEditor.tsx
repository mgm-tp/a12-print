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
import { useCallback, useContext, useState } from "react";

import { TextOutput, Typography, addPrefix } from "@com.mgmtp.a12.widgets/widgets-core";

import type { PreventLineBreakRule } from "../../../../a12internal/api/model/typesetting-model.js";
import {
	CharacterSequenceRuleConversion,
	NumberUnitRuleConversion,
	SpecialPatternRuleConversion,
} from "../../utils/rule-conversion.js";
import { useLocalizer } from "../../localization/localizer.js";
import { RESOURCE_KEYS } from "../../localization/keys.js";
import type { Action, SetPreventLineBreakRulePayload } from "../../store/action.js";
import { SET_PREVENT_LINE_BREAK_RULE } from "../../store/action.js";
import { TypesettingEditorContext } from "../../store/context.js";
import { createEmptyRuleIdentifier } from "../../utils/rule-regex.js";

import { ConfirmDeletionModal } from "../modal/ConfirmDeletionModal.js";

import { CharacterSequenceRuleTable } from "./CharacterSequenceRuleTable.js";
import type { ExtendedPreventLineBreakRule, RuleType } from "./types.js";
import { NumberUnitRuleTable } from "./NumberUnitRuleTable.js";
import { SpecialPatternRuleTable } from "./SpecialPatternRuleTable.js";

interface LineBreakPreventRuleTableProps {
	rules: PreventLineBreakRule[];
}

export const PreventLineBreakRuleEditor = ({ rules }: LineBreakPreventRuleTableProps) => {
	const { characterRules, unitRules, specialRules } = seperateRules(rules);
	const { dispatch } = useContext(TypesettingEditorContext);

	const [deletingRowIndex, setDeletingRowIndex] = useState<number>();
	const localizer = useLocalizer();

	const onPreventLineBreakRuleChange = useCallback(
		(rules: PreventLineBreakRule[]) => {
			const action: Action<SetPreventLineBreakRulePayload> = {
				type: SET_PREVENT_LINE_BREAK_RULE,
				data: rules,
			};
			dispatch(action);
		},
		[dispatch]
	);

	const addRule = useCallback(
		(type: RuleType) => {
			const value = createEmptyRuleIdentifier(type);
			onPreventLineBreakRuleChange([...rules, { pattern: value }]);
		},
		[rules]
	);

	const updateRule = useCallback(
		(value: string, index: number) => {
			const cloned = [...rules];
			cloned[index] = { pattern: value };
			onPreventLineBreakRuleChange(cloned);
		},
		[rules]
	);

	const deleteRule = useCallback(() => {
		if (deletingRowIndex !== undefined) {
			onPreventLineBreakRuleChange([...rules].filter((el, i) => i !== deletingRowIndex));
			setDeletingRowIndex(undefined);
		}
	}, [rules, deletingRowIndex]);

	return (
		<>
			<Typography.Headline level={3}>
				{localizer(RESOURCE_KEYS.preventLineBreakRules.characterSequence.header)}
			</Typography.Headline>
			<TextOutput className={addPrefix("-u-margin-b-base")}>
				{localizer(RESOURCE_KEYS.preventLineBreakRules.characterSequence.description)}
			</TextOutput>
			<CharacterSequenceRuleTable
				characterSequenceRules={characterRules}
				addRule={addRule}
				deleteRule={setDeletingRowIndex}
				updateRule={updateRule}
			/>

			<Typography.Headline level={3}>
				{localizer(RESOURCE_KEYS.preventLineBreakRules.numberUnit.header)}
			</Typography.Headline>
			<TextOutput className={addPrefix("-u-margin-b-base")}>
				{localizer(RESOURCE_KEYS.preventLineBreakRules.numberUnit.description)}
			</TextOutput>
			<NumberUnitRuleTable
				numberUnitRules={unitRules}
				addRule={addRule}
				deleteRule={setDeletingRowIndex}
				updateRule={updateRule}
			/>

			<Typography.Headline level={3}>
				{localizer(RESOURCE_KEYS.preventLineBreakRules.specialPattern.header)}
			</Typography.Headline>

			<TextOutput className={addPrefix("-u-margin-b-base")}>
				{localizer(RESOURCE_KEYS.preventLineBreakRules.specialPattern.description)}
			</TextOutput>
			<SpecialPatternRuleTable
				specialPatternRule={specialRules}
				addRule={addRule}
				deleteRule={setDeletingRowIndex}
				updateRule={updateRule}
			/>

			<ConfirmDeletionModal
				isShow={deletingRowIndex !== undefined}
				onDelete={deleteRule}
				onClose={() => setDeletingRowIndex(undefined)}
			/>
		</>
	);
};

function seperateRules(rules: PreventLineBreakRule[]) {
	const characterRules: ExtendedPreventLineBreakRule[] = [];
	const unitRules: ExtendedPreventLineBreakRule[] = [];
	const specialRules: ExtendedPreventLineBreakRule[] = [];
	rules.forEach((rule, index) => {
		if (SpecialPatternRuleConversion.isRule(rule.pattern)) {
			specialRules.push({ ...rule, index });
		} else if (NumberUnitRuleConversion.isRule(rule.pattern)) {
			unitRules.push({ ...rule, index });
		} else if (CharacterSequenceRuleConversion.isRule(rule.pattern)) {
			characterRules.push({ ...rule, index });
		} else {
			console.error("There is no matching rule type for rule: ", rule);
		}
	});
	return {
		characterRules,
		unitRules,
		specialRules,
	};
}
