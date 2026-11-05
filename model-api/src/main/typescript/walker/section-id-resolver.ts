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
import { type PrintModel, type Section, type SectionUsage } from "../model/index.js";

import { resolveFragmentDefinitions } from "./fragment-definition-resolver.js";
import type { PrintModelResolver } from "./print-model-resolver.js";

export interface SectionMap {
	[key: string]: Section;
}

export interface SectionWithUsageMap {
	[key: string]: SectionWithUsage;
}

/**
 * A {@link Section} with the usage it has in the using print model: for a local definition its own `sectionUsage`,
 * for a referenced fragment section the one of the reference.
 */
export interface SectionWithUsage {
	readonly section: Section;
	readonly sectionUsage: SectionUsage;
}

export interface SectionIdResolver {
	resolveSectionId(id: string): Section | undefined;

	/** Optional so that existing implementations stay valid - resolve via {@link resolveSectionWithUsage}. */
	resolveSectionIdWithUsage?(id: string): SectionWithUsage | undefined;
}

/** Resolves a section id with its usage, falling back to the usage of the definition. */
export function resolveSectionWithUsage(resolver: SectionIdResolver, id: string): SectionWithUsage | undefined {
	if (resolver.resolveSectionIdWithUsage) {
		return resolver.resolveSectionIdWithUsage(id);
	}
	const section = resolver.resolveSectionId(id);
	return section ? { section, sectionUsage: section.sectionUsage } : undefined;
}

export class DefaultSectionIdResolver implements SectionIdResolver {
	constructor(
		private readonly sectionList: ReadonlyArray<Section>,
		private readonly fragmentSections: ReadonlyMap<string, SectionWithUsage> = new Map()
	) {}

	/** @param fragmentModelResolver Without it only locally defined sections are resolvable.
	 * @remarks
	 * The signature will change in the next major release to `fromModel(printModel: PrintModel, fragmentModelResolver: PrintModelResolver)`.
	 */
	public static fromModel(printModel: PrintModel, fragmentModelResolver?: PrintModelResolver) {
		const sections = printModel.content.sections;
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
				: undefined
		);
	}

	resolveSectionId(id: string): Section | undefined {
		return this.sectionList.find(el => el.id === id) || this.fragmentSections.get(id)?.section;
	}

	resolveSectionIdWithUsage(id: string): SectionWithUsage | undefined {
		// Via resolveSectionId so that overriding it stays effective.
		const section = this.resolveSectionId(id);
		if (!section) {
			return undefined;
		}
		const fragmentSection = this.fragmentSections.get(id);
		return fragmentSection?.section === section ? fragmentSection : { section, sectionUsage: section.sectionUsage };
	}
}

export class CachedSectionIdResolver implements SectionIdResolver {
	private readonly sectionsResolver: SectionIdResolver;
	private readonly sectionMap: SectionWithUsageMap = {};

	constructor(referenceResolver: SectionIdResolver) {
		this.sectionsResolver = referenceResolver;
	}

	resolveSectionId(id: string): Section | undefined {
		return this.resolveSectionIdWithUsage(id)?.section;
	}

	resolveSectionIdWithUsage(id: string): SectionWithUsage | undefined {
		const section = this.sectionMap[id];
		if (section) {
			return section;
		}
		const newSection = resolveSectionWithUsage(this.sectionsResolver, id);
		if (newSection) {
			this.sectionMap[id] = newSection;
		}
		return newSection;
	}
}
