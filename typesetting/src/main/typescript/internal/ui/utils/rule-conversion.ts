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
import { RuleType } from "../component/prevent-line-break-rule/types.js";
import { SpecialPatterns } from "../constant/special-pattern.js";

import { escapeRegex, isEmptyRuleType, unescapeRegex } from "./rule-regex.js";

interface RuleConvesion {
	isRule: (regex: string) => boolean;
	toRegExp: (value: string) => string;
	toValue: (regex: string) => string;
}

export const CharacterSequenceRuleConversion: RuleConvesion = {
	isRule(regex: string) {
		return (
			isEmptyRuleType(regex, RuleType.character) ||
			(!SpecialPatternRuleConversion.isRule(regex) && !NumberUnitRuleConversion.isRule(regex))
		);
	},
	toRegExp(value: string) {
		return escapeRegex(value);
	},
	toValue(regex: string) {
		if (isEmptyRuleType(regex, RuleType.character)) {
			return "";
		}
		return unescapeRegex(regex);
	},
};

const NUMBER_UNIT_RULE_PREFIX = "[+-]?(\\d{1,3}(?:[.,]\\d{3})+|\\d+)(?:[.,]\\d+)? ";
export const NumberUnitRuleConversion: RuleConvesion = {
	isRule(regex: string) {
		return isEmptyRuleType(regex, RuleType.unit) || regex.startsWith(`${NUMBER_UNIT_RULE_PREFIX}`);
	},
	toRegExp(value: string) {
		return `${NUMBER_UNIT_RULE_PREFIX}${escapeRegex(value)}`;
	},
	toValue(regex: string) {
		if (isEmptyRuleType(regex, RuleType.unit)) {
			return "";
		}
		return unescapeRegex(regex.substring(NUMBER_UNIT_RULE_PREFIX.length));
	},
};

export const SpecialPatternRuleConversion: RuleConvesion = {
	isRule(regex: string) {
		return isEmptyRuleType(regex, RuleType.special) || !!SpecialPatterns.find(option => option.value === regex);
	},
	toRegExp(value: string) {
		return SpecialPatterns.find(option => option.label === value)?.value || "";
	},
	toValue(regex: string) {
		if (isEmptyRuleType(regex, RuleType.special)) {
			return "";
		}
		return SpecialPatterns.find(option => option.value === regex)?.label || "";
	},
};
