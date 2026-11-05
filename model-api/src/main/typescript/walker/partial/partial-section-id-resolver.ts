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
import { type PartialPrintModel, type PartialSection, type SectionUsage } from "../../model/index.js";

import {
	resolveFragmentDefinitions,
	resolveTopLevelContainerOrigins,
	type TopLevelContainerOrigin,
} from "../fragment-definition-resolver.js";
import type { PrintModelResolver } from "../print-model-resolver.js";

interface PartialSectionWithUsageMap {
	[key: string]: PartialSectionWithUsage;
}

/** A {@link PartialSection} with the usage it has in the using print model - see `SectionWithUsage`. */
export interface PartialSectionWithUsage {
	readonly section: PartialSection;
	readonly sectionUsage?: SectionUsage;
}

export interface PartialSectionIdResolver {
	resolveSectionId(id: string): PartialSection | undefined;

	/** Optional so that existing implementations stay valid - resolve via {@link resolvePartialSectionWithUsage}. */
	resolveSectionIdWithUsage?(id: string): PartialSectionWithUsage | undefined;

	resolveSectionOrigin?(id: string): TopLevelContainerOrigin | undefined;
}

/** Where the section of an id comes from, `undefined` if the resolver does not track it or the id is unknown. */
export function resolvePartialSectionOrigin(
	resolver: PartialSectionIdResolver,
	id: string
): TopLevelContainerOrigin | undefined {
	return resolver.resolveSectionOrigin?.(id);
}

/** Resolves a section id with its usage, falling back to the usage of the definition. */
export function resolvePartialSectionWithUsage(
	resolver: PartialSectionIdResolver,
	id: string
): PartialSectionWithUsage | undefined {
	if (resolver.resolveSectionIdWithUsage) {
		return resolver.resolveSectionIdWithUsage(id);
	}
	const section = resolver.resolveSectionId(id);
	return section ? { section, sectionUsage: section.sectionUsage } : undefined;
}

export class DefaultPartialSectionIdResolver implements PartialSectionIdResolver {
	constructor(
		private readonly sectionList: ReadonlyArray<PartialSection>,
		private readonly fragmentSections: ReadonlyMap<string, PartialSectionWithUsage> = new Map(),
		private readonly origins: ReadonlyMap<string, TopLevelContainerOrigin> = new Map()
	) {}

	/** @param fragmentModelResolver Without it only locally defined sections are resolvable.
	 * @remarks
	 * The signature will change in the next major release to `fromModel(printModel: PartialPrintModel, fragmentModelResolver: PrintModelResolver)`.
	 */
	public static fromModel(printModel: PartialPrintModel, fragmentModelResolver?: PrintModelResolver) {
		const sections = printModel.content?.sections;
		return new this(
			sections?.definitions || [],
			fragmentModelResolver
				? resolveFragmentDefinitions(
						sections?.references || [],
						fragmentModelResolver,
						fragmentModel => fragmentModel.content.sections?.definitions || [],
						(section, reference, referenceId) => ({
							// Each reference is an independent instance, keyed by its own id.
							section: { ...section, id: referenceId },
							sectionUsage: reference.sectionUsage,
						})
					)
				: undefined,
			resolveTopLevelContainerOrigins(sections?.definitions || [], sections?.references || [])
		);
	}

	resolveSectionId(id: string): PartialSection | undefined {
		return this.sectionList.find(el => el.id === id) || this.fragmentSections.get(id)?.section;
	}

	resolveSectionIdWithUsage(id: string): PartialSectionWithUsage | undefined {
		// Via resolveSectionId so that overriding it stays effective.
		const section = this.resolveSectionId(id);
		if (!section) {
			return undefined;
		}
		const fragmentSection = this.fragmentSections.get(id);
		return fragmentSection?.section === section ? fragmentSection : { section, sectionUsage: section.sectionUsage };
	}

	resolveSectionOrigin(id: string): TopLevelContainerOrigin | undefined {
		const origin = this.origins.get(id);
		if (origin) {
			return origin;
		}
		// Without the prepared map only the local definitions are known, fragment references are not.
		const definitionIndex = this.sectionList.findIndex(section => section.id === id);
		return definitionIndex < 0 ? undefined : { definitionIndex };
	}
}

export class CachedPartialSectionIdResolver implements PartialSectionIdResolver {
	private readonly sectionsResolver: PartialSectionIdResolver;
	private readonly sectionMap: PartialSectionWithUsageMap = {};

	constructor(referenceResolver: PartialSectionIdResolver) {
		this.sectionsResolver = referenceResolver;
	}

	resolveSectionId(id: string): PartialSection | undefined {
		return this.resolveSectionIdWithUsage(id)?.section;
	}

	resolveSectionIdWithUsage(id: string): PartialSectionWithUsage | undefined {
		const section = this.sectionMap[id];
		if (section) {
			return section;
		}
		const newSection = resolvePartialSectionWithUsage(this.sectionsResolver, id);
		if (newSection) {
			this.sectionMap[id] = newSection;
		}
		return newSection;
	}

	resolveSectionOrigin(id: string): TopLevelContainerOrigin | undefined {
		return resolvePartialSectionOrigin(this.sectionsResolver, id);
	}
}
