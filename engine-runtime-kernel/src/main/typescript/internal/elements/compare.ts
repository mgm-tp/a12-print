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
import type { SyntaxTreeElementVisitor, VisitationState } from "../../a12internal/elements/index.js";

import type { CompareBranch, LogicBranch, SyntaxTreeElement } from "./index.js";
import { SyntaxTreeElementType } from "./index.js";

export class Compare implements SyntaxTreeElement, LogicBranch, CompareBranch {
	_compareBranch = true;
	_logicBranch = true;
	readonly operator: Compare.Operator;
	readonly branches: CompareBranch[];

	constructor(operator: Compare.Operator, branches: CompareBranch[]) {
		this.operator = operator;
		this.branches = branches;
	}

	elementType(): SyntaxTreeElementType {
		return SyntaxTreeElementType.Compare;
	}

	accept(visitor: SyntaxTreeElementVisitor, state: VisitationState): void {
		for (const branch of this.branches) {
			state.scope(branch, s => visitor.visit(branch, s));
		}
	}
}

export namespace Compare {
	export enum Operator {
		Equality,
		UnEquality,
		GreaterThan,
		GreaterThanOrEqual,
		LessThan,
		LessThanOrEqual,
	}

	export namespace Operator {
		export const entailsEqualitySemantic = (operator: Operator): boolean => {
			return (
				Operator.Equality === operator ||
				Operator.GreaterThanOrEqual === operator ||
				Operator.LessThanOrEqual === operator
			);
		};
		export const isEqualityOrUnEquality = (operator: Operator): boolean => {
			return Operator.Equality === operator || Operator.UnEquality === operator;
		};
	}
}
