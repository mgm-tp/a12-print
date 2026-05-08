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
	AnyContainerElement,
	isSection,
	isSegment,
	isWatermark,
	PrintModelElement,
	PrintModelEntity,
	Reference,
} from "../model/index.js";

export class GenericPrintModelTrace<T extends PrintModelEntity> {
	parents: ReadonlyArray<TraceElement<T>>;

	constructor(parents: ReadonlyArray<TraceElement<T>>) {
		this.parents = parents;
	}

	protected findParentPath(filter: (e: TraceElement<T>) => boolean) {
		for (let i = this.parents.length - 1; i >= 0; i--) {
			const current = this.parents[i];
			if (filter(current)) {
				return current;
			}
		}
		return undefined;
	}

	public getParent() {
		return this.parents.at(-1);
	}
}

export class TraceElement<T extends PrintModelEntity> {
	parent: T;
	index: number;

	constructor(parent: T, index: number) {
		this.parent = parent;
		this.index = index;
	}
}

type PrintModelTraceElement = AnyContainerElement | PrintModelElement | Reference;

export class PrintModelTrace extends GenericPrintModelTrace<PrintModelTraceElement> {
	public static ROOT_PATH: PrintModelTrace = new PrintModelTrace([]);

	public with(parent: PrintModelTraceElement, index: number) {
		return new PrintModelTrace([...this.parents, new TraceElement(parent, index)]);
	}

	public findParentTopLevelReferenceContainer() {
		return this.findParentPath(e => isSegment(e.parent) || isSection(e.parent) || isWatermark(e.parent));
	}
}
