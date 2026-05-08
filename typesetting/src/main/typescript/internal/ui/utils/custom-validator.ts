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
import {
	ErrorSeverity,
	PrintErrorMap,
} from "@com.mgmtp.a12.print/print-model-api/lib/errors/deep-partial-error-map.js";

import { PreventLineBreakRule } from "../../api/model/typesetting-model.js";

import {
	characterRuleError,
	duplicatedRuleError,
	maxLengthRuleError,
	noMatchError,
	numberUnitRuleError,
	requiredRuleError,
	VALIDATOR_VALUE,
} from "../constant/validation.js";

import {
	CharacterSequenceRuleConversion,
	NumberUnitRuleConversion,
	SpecialPatternRuleConversion,
} from "./rule-conversion.js";

interface RuleValidator {
	validate(rule: PreventLineBreakRule): PrintErrorMap;
}

const CharacterSequenceRuleValidator: RuleValidator = {
	validate(rule: PreventLineBreakRule) {
		if (!rule.pattern) {
			return {
				[ErrorSeverity.ERROR]: [requiredRuleError],
				[ErrorSeverity.INFO]: [],
				[ErrorSeverity.WARNING]: [],
			};
		}

		if (!CharacterSequenceRuleConversion.isRule(rule.pattern)) {
			return {
				[ErrorSeverity.ERROR]: [noMatchError],
				[ErrorSeverity.INFO]: [],
				[ErrorSeverity.WARNING]: [],
			};
		}
		const value = CharacterSequenceRuleConversion.toValue(rule.pattern);
		if (!value) {
			return {
				[ErrorSeverity.ERROR]: [requiredRuleError],
				[ErrorSeverity.INFO]: [],
				[ErrorSeverity.WARNING]: [],
			};
		}

		const match = /^[\p{L}-]+$/u.test(value);

		if (!match) {
			return {
				[ErrorSeverity.ERROR]: [characterRuleError],
				[ErrorSeverity.INFO]: [],
				[ErrorSeverity.WARNING]: [],
			};
		}

		if (value.length > VALIDATOR_VALUE.maxLength) {
			return {
				[ErrorSeverity.ERROR]: [maxLengthRuleError],
				[ErrorSeverity.INFO]: [],
				[ErrorSeverity.WARNING]: [],
			};
		}

		return { [ErrorSeverity.ERROR]: [], [ErrorSeverity.INFO]: [], [ErrorSeverity.WARNING]: [] };
	},
};

export const NumberUnitRuleValidator: RuleValidator = {
	validate(rule: PreventLineBreakRule) {
		if (!NumberUnitRuleConversion.isRule(rule.pattern)) {
			return {
				[ErrorSeverity.ERROR]: [noMatchError],
				[ErrorSeverity.INFO]: [],
				[ErrorSeverity.WARNING]: [],
			};
		}
		const value = NumberUnitRuleConversion.toValue(rule.pattern);
		if (!value) {
			return {
				[ErrorSeverity.ERROR]: [requiredRuleError],
				[ErrorSeverity.INFO]: [],
				[ErrorSeverity.WARNING]: [],
			};
		}
		const match = /^[^0-9\s._\-<>,;:'"`=^*+?()[\]{}\\|/:#!@&~]+$/.test(value);

		if (!match) {
			return {
				[ErrorSeverity.ERROR]: [numberUnitRuleError],
				[ErrorSeverity.INFO]: [],
				[ErrorSeverity.WARNING]: [],
			};
		}

		if (value.length > VALIDATOR_VALUE.maxLength) {
			return {
				[ErrorSeverity.ERROR]: [maxLengthRuleError],
				[ErrorSeverity.INFO]: [],
				[ErrorSeverity.WARNING]: [],
			};
		}

		return { [ErrorSeverity.ERROR]: [], [ErrorSeverity.INFO]: [], [ErrorSeverity.WARNING]: [] };
	},
};

export const SpecialPatternRuleValidator: RuleValidator = {
	validate(rule: PreventLineBreakRule) {
		if (!SpecialPatternRuleConversion.isRule(rule.pattern)) {
			return {
				[ErrorSeverity.ERROR]: [noMatchError],
				[ErrorSeverity.INFO]: [],
				[ErrorSeverity.WARNING]: [],
			};
		}

		const value = SpecialPatternRuleConversion.toValue(rule.pattern);
		if (!value) {
			return {
				[ErrorSeverity.ERROR]: [requiredRuleError],
				[ErrorSeverity.INFO]: [],
				[ErrorSeverity.WARNING]: [],
			};
		}
		return { [ErrorSeverity.ERROR]: [], [ErrorSeverity.INFO]: [], [ErrorSeverity.WARNING]: [] };
	},
};

export class PreventLineBreakRuleValidator {
	static validate(rules: PreventLineBreakRule[]): { noErrorOccurred: boolean; errorMap: PrintErrorMap[] } {
		let hasErrors = false;
		const errorMap = rules.map(rule => {
			if (!rule.pattern || SpecialPatternRuleConversion.isRule(rule.pattern)) {
				const error = SpecialPatternRuleValidator.validate(rule);
				if (error[ErrorSeverity.ERROR].length) {
					hasErrors = true;
				}
				return error;
			}
			if (NumberUnitRuleConversion.isRule(rule.pattern)) {
				const error = NumberUnitRuleValidator.validate(rule);
				if (error[ErrorSeverity.ERROR].length) {
					hasErrors = true;
				}
				return error;
			}
			if (CharacterSequenceRuleConversion.isRule(rule.pattern)) {
				const error = CharacterSequenceRuleValidator.validate(rule);
				if (error[ErrorSeverity.ERROR].length) {
					hasErrors = true;
				}
				return error;
			}
			hasErrors = true;
			return { [ErrorSeverity.ERROR]: [noMatchError], [ErrorSeverity.INFO]: [], [ErrorSeverity.WARNING]: [] };
		});
		hasErrors = hasErrors || this.checkDuplication(rules, errorMap);
		return { noErrorOccurred: !hasErrors, errorMap };
	}

	private static checkDuplication(rules: PreventLineBreakRule[], errors: PrintErrorMap[]) {
		const checkMap = new Map<string, number[]>();
		let hasErrors = false;

		rules.forEach((rule, index) => {
			if (!checkMap.has(rule.pattern)) {
				checkMap.set(rule.pattern, [index]);
			} else {
				checkMap.set(rule.pattern, [...(checkMap.get(rule.pattern) || []), index]);
			}
		});

		for (const value of checkMap.values()) {
			if (value.length > 1) {
				value.forEach(index => {
					hasErrors = true;
					errors[index][ErrorSeverity.ERROR] = [...errors[index][ErrorSeverity.ERROR], duplicatedRuleError];
				});
			}
		}
		return hasErrors;
	}
}
