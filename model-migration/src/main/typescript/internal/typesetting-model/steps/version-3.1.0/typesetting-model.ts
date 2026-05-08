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
// Automatically generated from DomainTypesettingMetaModel.json on 10/14/2025, 10:37:14 AM.

export interface LocalesDTO {
	code: string;
}

export interface LabelsDTO {
	locale: string;
	text: string;
}

export interface AnnotationsDTO {
	name: string;
	value?: string;
}

export interface ModelReferencesDTO {
	reference: string;
	modelType: string;
	alias?: string;
	purpose?: string;
}

export interface HeaderDTO {
	id: string;
	modelType: string;
	modelVersion: string;
	locales?: LocalesDTO[];
	labels?: LabelsDTO[];
	annotations?: AnnotationsDTO[];
	modelReferences?: ModelReferencesDTO[];
}

export interface LanguageDTO {
	name: string;
	tag: string;
}

export interface AuthorsDTO {
	name: string;
	contact?: string;
	note?: string;
}

export interface LicenceDTO {
	name?: string;
	text?: string;
	url?: string;
}

export interface TypesettingDTO {
	left?: number;
	right?: number;
}

export interface GenerationDTO {
	left?: number;
	right?: number;
}

export interface HyphenminsDTO {
	typesetting?: TypesettingDTO;
	generation?: GenerationDTO;
}

export interface TexliveDTO {
	encoding?: string;
	babelname?: string;
	legacy_patterns?: string;
	message?: string;
	package?: string;
	use_old_patterns_comment?: string;
}

export interface GeneralDTO {
	title: string;
	language?: LanguageDTO;
	authors?: AuthorsDTO[];
	notice?: string;
	version?: string;
	copyright?: string;
	licence?: LicenceDTO;
	source?: string;
	hyphenmins?: HyphenminsDTO;
	texlive?: TexliveDTO;
	checksum: string;
}

export interface PatternsDTO {
	v: string;
}

export interface IndexDTO {
	v: number;
}

export interface ExclusionsDTO {
	word: string;
	index?: IndexDTO[];
}

export interface HyphenationDTO {
	general?: GeneralDTO;
	patterns?: PatternsDTO[];
	exclusions?: ExclusionsDTO[];
}

export interface InternalDTO {
	hyphenation?: HyphenationDTO;
}

export interface CustomHyphenationExclusionsDTO {
	word: string;
	index?: IndexDTO[];
}

export interface PreventLineBreakRulesDTO {
	pattern: string;
}

export interface ContentDTO {
	internal?: InternalDTO;
	customHyphenationExclusions?: CustomHyphenationExclusionsDTO[];
	preventLineBreakRules?: PreventLineBreakRulesDTO[];
	orphan?: number;
	widow?: number;
}

export interface TypesettingModelDTO {
	header?: HeaderDTO;
	content?: ContentDTO;
}
