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
import type { Variable } from "../../../a12internal/elements/index.js";
import { SyntaxTreeElementVisitor, VisitationState } from "../../../a12internal/elements/index.js";

import type { BiConsumer, BiFunction, SyntaxTreeElement, Supplier, Util } from "../index.js";

export class VariableSearch<R> extends SyntaxTreeElementVisitor {
	static readonly findUniqueVariables: Util.Function<SyntaxTreeElement, Set<Variable>> = VariableSearch.create(
		(a: Variable, r: Set<Variable>) => {
			r.add(a);
		},
		() => new Set<Variable>()
	);
	readonly map: BiFunction<Variable, R, R>;
	foldState: R;

	constructor(map: BiFunction<Variable, R, R>, foldState: R) {
		super();
		this.map = map;
		this.foldState = foldState;
	}

	static findDistinctVariables(e: SyntaxTreeElement): Set<Variable> {
		return this.findUniqueVariables(e);
	}

	static create<T, R>(consumer: BiConsumer<Variable, T>, seed: Supplier<T>): Util.Function<SyntaxTreeElement, T> {
		return (s: SyntaxTreeElement) => {
			return new VariableSearch<T>((a: Variable, r: T) => {
				consumer(a, r);
				return r;
			}, seed()).collect(s);
		};
	}

	collect(e: SyntaxTreeElement): R {
		this.visit(e as Variable, VisitationState.stateless());
		return this.foldState;
	}

	visit(node: Variable, state: VisitationState): void {
		this.foldState = this.map(node, this.foldState);
	}
}
