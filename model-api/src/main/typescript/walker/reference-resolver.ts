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
import type { PrintModelElement } from "../model/index.js";
import { type PrintModel, type Reference } from "../model/index.js";

import { collectFragmentModels } from "./fragment-definition-resolver.js";
import type { PrintModelResolver } from "./print-model-resolver.js";

export interface PrintModelElementMap {
	[key: string]: PrintModelElement;
}

export interface ReferenceResolver {
	resolveReference(reference: Reference): PrintModelElement | undefined;
	findReference(filter: (e: PrintModelElement) => boolean): PrintModelElement | undefined;
}

export class ReferenceListResolver implements ReferenceResolver {
	constructor(
		private readonly elementList: ReadonlyArray<PrintModelElement>,
		private readonly fragmentModelResolver?: PrintModelResolver
	) {}

	/** @param fragmentModelResolver Makes the elements of referenced print fragment models resolvable. */
	public static fromModel(printModel: PrintModel, fragmentModelResolver?: PrintModelResolver) {
		const fragmentModels = fragmentModelResolver ? collectFragmentModels(printModel, fragmentModelResolver) : [];
		return new this(
			[
				...printModel.content.elementDefinitions,
				...fragmentModels.flatMap(fragmentModel => fragmentModel.content.elementDefinitions),
			],
			fragmentModelResolver
		);
	}

	resolveReference(reference: Reference): PrintModelElement | undefined {
		// A placement that names a model is resolved in that fragment model; otherwise by id alone.
		if (reference.model) {
			const element = this.fragmentModelResolver
				?.resolvePrintModel(reference.model)
				?.content.elementDefinitions.find(el => el.id === reference.refId);
			if (element) {
				return element;
			}
		}
		return this.elementList.find(el => el.id === reference.refId);
	}

	findReference(filter: (e: PrintModelElement) => boolean): PrintModelElement | undefined {
		return this.elementList.find(el => filter(el));
	}
}

export class CachedReferenceResolver implements ReferenceResolver {
	private readonly referenceResolver: ReferenceListResolver;
	private readonly printModelElementMap: PrintModelElementMap = {};

	constructor(referenceResolver: ReferenceListResolver) {
		this.referenceResolver = referenceResolver;
	}

	resolveReference(reference: Reference): PrintModelElement | undefined {
		const { refId } = reference;
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

	findReference(filter: (e: PrintModelElement) => boolean): PrintModelElement | undefined {
		return this.referenceResolver.findReference(filter);
	}
}
