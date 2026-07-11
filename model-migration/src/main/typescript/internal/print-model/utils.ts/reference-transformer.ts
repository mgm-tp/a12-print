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
import type { Reference } from "@com.mgmtp.a12.print/print-model-api/model";

import type { GenericObject } from "./types.js";
import { TransformTreeTrace } from "./tree-trace.js";
import { PrintModelTransformError } from "./error.js";

export class ReferenceTransformer<I extends GenericObject, O> {
	nestedReferenceGetter: (element: I) => Reference[] | undefined;
	elements: I[];
	elementsToResolved: (O | null)[];
	handler: (input: I, treeTrace: TransformTreeTrace) => O;

	constructor(
		elements: I[],
		handler: (input: I, treeTrace: TransformTreeTrace) => O,
		nestedReferenceGetter: (element: I) => Reference[] | undefined
	) {
		this.elements = elements;
		this.handler = handler;
		this.elementsToResolved = new Array(elements.length).fill(null);
		this.nestedReferenceGetter = nestedReferenceGetter;
	}
	resolve(refId: string): { element: I; index: number } {
		const index = this.elements.findIndex(reference => reference.id === refId);
		return { element: this.elements[index], index };
	}

	handleReferences(references: Reference[], treeTrace: TransformTreeTrace = new TransformTreeTrace([])) {
		if (!references) {
			return;
		}
		this.processTransform(references, treeTrace);
	}

	handleElement(element: I, indexOfElement: number, treeTrace: TransformTreeTrace = new TransformTreeTrace([])) {
		const nestedReferences = this.nestedReferenceGetter(element);

		if (nestedReferences) {
			this.processTransform(nestedReferences, treeTrace.with(element));
		}

		this.elementsToResolved[indexOfElement] = this.handler(element, treeTrace);
	}

	processTransform(references: Reference[], treeTrace: TransformTreeTrace) {
		references.forEach(reference => {
			const { element, index } = this.resolve(reference.refId);

			if (!element) {
				throw new PrintModelTransformError(`Cannot resolve element id: ${reference.refId}`);
			}
			this.handleElement(element, index, treeTrace.with(reference));
		});
	}

	forEachUnhandled(callback: (E: I, index: number) => void) {
		this.elementsToResolved.forEach((element, index) => {
			if (element) {
				return;
			}
			const originalElement = this.elements[index];
			callback(originalElement, index);
		});
	}

	resolveUnhandled(callback: (E: I, index: number) => O) {
		this.elementsToResolved = this.elementsToResolved.map((element, index) => {
			if (element) {
				return element;
			}
			const originalElement = this.elements[index];
			return callback(originalElement, index);
		});
	}

	getHandledElements(): O[] {
		return this.elementsToResolved.filter(Boolean) as O[];
	}
}
