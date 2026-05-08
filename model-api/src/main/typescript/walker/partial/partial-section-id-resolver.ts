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
import { PartialPrintModel, PartialSection } from "../../model/index.js";

interface PartialSectionMap {
	[key: string]: PartialSection;
}

export interface PartialSectionIdResolver {
	resolveSectionId(id: string): PartialSection | undefined;
}

export class DefaultPartialSectionIdResolver implements PartialSectionIdResolver {
	constructor(private sectionList: ReadonlyArray<PartialSection>) {}

	public static fromModel(printModel: PartialPrintModel) {
		return new this(printModel.content?.sections?.definitions || []);
	}

	resolveSectionId(id: string): PartialSection | undefined {
		return this.sectionList.find(el => el.id === id);
	}
}

export class CachedPartialSectionIdResolver implements PartialSectionIdResolver {
	private sectionsResolver: PartialSectionIdResolver;
	private sectionMap: PartialSectionMap = {};

	constructor(referenceResolver: PartialSectionIdResolver) {
		this.sectionsResolver = referenceResolver;
	}

	resolveSectionId(id: string): PartialSection | undefined {
		const section = this.sectionMap[id];
		if (section) {
			return section;
		}
		const newSection = this.sectionsResolver.resolveSectionId(id);
		if (newSection) {
			this.sectionMap[id] = newSection;
		}
		return newSection;
	}
}
