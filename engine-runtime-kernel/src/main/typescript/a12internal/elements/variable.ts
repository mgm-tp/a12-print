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
import isEqual from "lodash/isEqual.js";

import type { Predicate, ReferenceSegment } from "../../internal/elements/index.js";
import {
	type ArithmeticBranch,
	compareBoolean,
	type CompareBranch,
	compareNumber,
	compareString,
	type LogicBranch,
	type SyntaxTreeElement,
	SyntaxTreeElementType,
} from "../../internal/elements/index.js";

import type { SyntaxTreeElementVisitor, VisitationState } from "./index.js";

export class Variable implements SyntaxTreeElement, Predicate.Parameter, ArithmeticBranch, LogicBranch, CompareBranch {
	_arithmeticBranch = true;
	_compareBranch = true;
	_logicBranch = true;

	readonly segments: ReferenceSegment[];
	readonly isAbsolute: boolean;

	constructor(segments: ReferenceSegment[], isAbsolute: boolean) {
		this.segments = segments;
		this.isAbsolute = isAbsolute;
	}

	static compareSegments(a: ReferenceSegment[], b: ReferenceSegment[]): number {
		const min = Math.min(a.length, b.length);

		for (let i = 0; i < min; i++) {
			const segmentA = a[i];
			const segmentB = b[i];

			const labelCmp = compareString(segmentA.label, segmentB.label);
			if (labelCmp !== 0) {
				return labelCmp;
			}
			const isListCmp = compareBoolean(segmentA.isList, segmentB.isList);
			if (isListCmp !== 0) {
				return isListCmp;
			}
			const isTurningGroupCmp = compareBoolean(segmentA.isTurningGroup, segmentB.isTurningGroup);
			if (isTurningGroupCmp != 0) {
				return isTurningGroupCmp;
			}
		}
		return compareNumber(a.length, b.length);
	}

	static compareFull(a: Variable, b: Variable): number {
		const isAbsCmp = compareBoolean(a.isAbsolute, b.isAbsolute);
		if (isAbsCmp != 0) {
			return isAbsCmp;
		}
		return Variable.compareSegments(a.segments, b.segments);
	}

	static join(prefix: Variable, postfix: Variable): Variable {
		const segments = prefix.segments.concat(postfix.segments);
		return new Variable(segments, prefix.isAbsolute);
	}

	isPrefixOf(b: Variable): boolean {
		if (!this.isAbsolute || !b.isAbsolute) {
			throw new Error("requires absolute paths");
		}

		if (this.segments.length > b.segments.length) {
			return false;
		}

		for (let i = 0; i < this.segments.length; i++) {
			if (!isEqual(this.segments[i], b.segments[i])) {
				return false;
			}
		}

		return true;
	}

	getParent(): Variable {
		const segments = this.segments.slice(0, Math.max(0, this.segments.length - 1));
		return new Variable(segments, this.isAbsolute);
	}

	elementType(): SyntaxTreeElementType {
		return SyntaxTreeElementType.Variable;
	}

	accept(visitor: SyntaxTreeElementVisitor, state: VisitationState): void {
		// accept is disabled for variables
	}

	compareTo(o: Variable): number {
		return Variable.compareFull(this, o);
	}
}
