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
import Big from "big.js";

import type { SyntaxTreeElementVisitor, VisitationState } from "../../a12internal/elements/index.js";

import type { ArithmeticBranch, CompareBranch, LogicBranch, Predicate, SyntaxTreeElement } from "./index.js";
import { SyntaxTreeElementType } from "./index.js";

export class Constant implements SyntaxTreeElement, Predicate.Parameter, ArithmeticBranch, LogicBranch, CompareBranch {
	_arithmeticBranch = true;
	_compareBranch = true;
	_logicBranch = true;

	readonly value: string;
	readonly constantType: Constant.ConstantType;

	constructor(value: string, constantType: Constant.ConstantType) {
		this.value = value;
		this.constantType = constantType;
	}

	elementType(): SyntaxTreeElementType {
		return SyntaxTreeElementType.Constant;
	}

	accept(visitor: SyntaxTreeElementVisitor, state: VisitationState): void {
		// accept is disabled for constants
	}

	valueEquals(other: Constant): boolean {
		switch (this.constantType) {
			case Constant.ConstantType.String:
			case Constant.ConstantType.Boolean:
				return this.getObjectValue() === other.getObjectValue();
			case Constant.ConstantType.Integer:
			case Constant.ConstantType.Float: {
				if (!Constant.ConstantType.isNumeric(other.constantType)) {
					return false;
				}
				const thisVal = new Big(this.value);
				const otherVal = new Big(other.value);
				return thisVal.eq(otherVal);
			}
		}
		throw new Error("invalid Constant");
	}

	getObjectValue() {
		switch (this.constantType) {
			case Constant.ConstantType.String:
				return this.value;
			case Constant.ConstantType.Integer:
			case Constant.ConstantType.Float:
				return new Big(this.value);
			case Constant.ConstantType.Boolean: {
				return Constant.TRUE.value.toLowerCase() === this.value.toLowerCase();
			}
		}
		throw new Error("invalid Constant");
	}
}

export namespace Constant {
	export enum ConstantType {
		String,
		Integer,
		Boolean,
		Float,
	}

	export const TRUE = new Constant("true", Constant.ConstantType.Boolean);
	export const FALSE = new Constant("false", Constant.ConstantType.Boolean);

	export namespace ConstantType {
		export const isNumeric = (constantType: ConstantType): boolean => {
			return constantType === ConstantType.Integer || constantType == ConstantType.Float;
		};
	}
}
