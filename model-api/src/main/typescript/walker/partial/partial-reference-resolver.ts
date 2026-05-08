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
import type { PartialPrintModel, PartialPrintModelElement, PartialReference } from "../../model/index.js";

interface PartialPrintModelElementMap {
	[key: string]: PartialPrintModelElement;
}
interface IndexMap {
	[key: string]: number;
}

interface ResolvedReference {
	element: PartialPrintModelElement;
	index: number;
}
export interface PartialReferenceResolver {
	resolveReference(reference: PartialReference): PartialPrintModelElement | undefined;
	resolveReferenceWithIndex(reference: PartialReference): ResolvedReference | undefined;
	findReference(filter: (e: PartialPrintModelElement) => boolean): PartialPrintModelElement | undefined;
}

export class PartialReferenceListResolver implements PartialReferenceResolver {
	constructor(private elementList: ReadonlyArray<PartialPrintModelElement>) {}

	public static fromModel(printModel: PartialPrintModel) {
		const elementDefinitions = printModel.content?.elementDefinitions || [];
		return new this(elementDefinitions);
	}

	resolveReference(reference: PartialReference): PartialPrintModelElement | undefined {
		return this.elementList.find(el => el.id === reference.refId);
	}

	resolveReferenceWithIndex(reference: PartialReference): ResolvedReference | undefined {
		const index = this.elementList.findIndex(el => el.id === reference.refId);
		if (index === -1) {
			return undefined;
		}
		return { element: this.elementList[index], index };
	}

	findReference(filter: (e: PartialPrintModelElement) => boolean): PartialPrintModelElement | undefined {
		return this.elementList.find(el => filter(el));
	}
}

export class PartialCachedReferenceResolver implements PartialReferenceResolver {
	private referenceResolver: PartialReferenceResolver;
	private printModelElementMap: PartialPrintModelElementMap = {};
	private indexMap: IndexMap = {};

	constructor(referenceResolver: PartialReferenceResolver) {
		this.referenceResolver = referenceResolver;
	}

	resolveReferenceWithIndex(reference: PartialReference): ResolvedReference | undefined {
		const { refId } = reference;
		if (!refId) {
			return undefined;
		}

		const element = this.printModelElementMap[refId];
		const index = this.indexMap[refId];
		if (element && index !== undefined) {
			return { element, index };
		}
		const newElement = this.referenceResolver.resolveReferenceWithIndex(reference);
		if (newElement) {
			this.printModelElementMap[refId] = newElement.element;
			this.indexMap[refId] = newElement.index;
		}
		return newElement;
	}

	resolveReference(reference: PartialReference): PartialPrintModelElement | undefined {
		const { refId } = reference;
		if (!refId) {
			return undefined;
		}
		const element = this.printModelElementMap[refId];
		if (element) {
			return element;
		}
		const newElement = this.referenceResolver.resolveReference(reference);
		if (newElement) {
			this.printModelElementMap[refId] = newElement;
		}
		return newElement;
	}

	findReference(filter: (e: PartialPrintModelElement) => boolean): PartialPrintModelElement | undefined {
		return this.referenceResolver.findReference(filter);
	}
}
