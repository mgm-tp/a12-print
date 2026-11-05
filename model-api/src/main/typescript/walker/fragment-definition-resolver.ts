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
import { type PartialPrintModel, type PartialReference, type PrintModel } from "../model/index.js";
import { FRAGMENT_MODEL_REFERENCE_PURPOSE } from "../model/constant.js";

import type { PrintModelResolver } from "./print-model-resolver.js";

interface FragmentReferenceLike {
	readonly id?: string;
	readonly refId?: string;
	readonly model?: string;
}

interface DefinitionLike {
	readonly id?: string;
}

/**
 * Where a top level container of a print model comes from: its own definition list, or a print fragment model, pulled
 * in by a reference. A container from a fragment model has no definition in the using print model, so the reference is
 * the only thing that addresses it there.
 */
export interface TopLevelContainerOrigin {
	/** Index in the definition list of the print model the container belongs to. */
	readonly definitionIndex?: number;
	readonly fragmentReference?: { readonly reference: PartialReference; readonly index: number };
}

/**
 * Looks up per id where a top level container comes from - see {@link TopLevelContainerOrigin}. Built once per resolver
 * so that walking does not have to search the definition and reference lists again for every container.
 */
export function resolveTopLevelContainerOrigins<Reference extends PartialReference, Definition extends DefinitionLike>(
	definitions: ReadonlyArray<Definition>,
	references: ReadonlyArray<Reference>
): Map<string, TopLevelContainerOrigin> {
	const origins = new Map<string, TopLevelContainerOrigin>();
	definitions.forEach((definition, definitionIndex) => {
		if (definition.id) {
			origins.set(definition.id, { definitionIndex });
		}
	});
	references.forEach((reference, index) => {
		if (reference.id) {
			origins.set(reference.id, { fragmentReference: { reference, index } });
		}
	});
	return origins;
}

/**
 * Resolves the definitions a print model pulls in from print fragment models, keyed by reference id - that is what
 * the id lists point at. Unresolvable references are skipped and end up in the walker's `visitUnresolved*` hooks.
 */
export function resolveFragmentDefinitions<
	Reference extends FragmentReferenceLike,
	Definition extends DefinitionLike,
	Value,
>(
	references: ReadonlyArray<Reference>,
	fragmentModelResolver: PrintModelResolver,
	getDefinitions: (fragmentModel: PrintModel) => ReadonlyArray<Definition>,
	toValue: (definition: Definition, reference: Reference, referenceId: string) => Value
): Map<string, Value> {
	const result = new Map<string, Value>();
	const definitionsPerFragmentModel = new Map<string, ReadonlyArray<Definition>>();

	for (const reference of references) {
		const { id, refId, model } = reference;
		if (!id || !refId || !model) {
			continue;
		}

		let definitions = definitionsPerFragmentModel.get(model);
		if (!definitions) {
			const fragmentModel = fragmentModelResolver.resolvePrintModel(model);
			if (!fragmentModel) {
				continue;
			}
			definitions = getDefinitions(fragmentModel);
			definitionsPerFragmentModel.set(model, definitions);
		}

		const definition = definitions.find(candidate => candidate.id === refId);
		if (definition) {
			result.set(id, toValue(definition, reference, id));
		}
	}

	return result;
}

/** Collects the print fragment models a print model references in its header, skipping unknown ones. */
export function collectFragmentModels(
	printModel: PrintModel | PartialPrintModel,
	fragmentModelResolver: PrintModelResolver
): PrintModel[] {
	return (printModel.header?.modelReferences || [])
		.filter(
			reference => reference?.modelType === "print" && reference?.purpose === FRAGMENT_MODEL_REFERENCE_PURPOSE
		)
		.map(reference =>
			reference?.reference ? fragmentModelResolver.resolvePrintModel(reference.reference) : undefined
		)
		.filter((fragmentModel): fragmentModel is PrintModel => fragmentModel !== undefined);
}
