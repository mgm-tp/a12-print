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
import { Header } from "@com.mgmtp.a12.base/base-model-api/lib/main/header/index.js";
import {
	AnnotationEntity,
	LabelEntity,
	LocaleEntity,
	ModelReferenceEntity,
} from "@com.mgmtp.a12.print/print-model-api";

export interface Language {
	readonly name: string;
	readonly tag: string;
}

export interface TexLive {
	readonly encoding?: string;
	readonly babelName?: string;
	readonly legacy_patterns?: string;
	readonly message?: string;
	readonly texPackage?: string;
	readonly use_old_patterns_comment?: string;
}

export interface TypeSetting {
	readonly left: number;
	readonly right: number;
}

export interface Generation {
	readonly left: number;
	readonly right: number;
}

export interface HyphenMins {
	readonly typesetting: TypeSetting;
	readonly generation: Generation;
}

export interface Author {
	readonly name?: string;
	readonly contact?: string;
	readonly note?: string;
}

export interface HyphenationGeneral {
	readonly title: string;
	readonly language: Language;
	readonly notice?: string;
	readonly copyright?: string;
	readonly version?: string;
	readonly licence?: string;
	readonly source?: string;
	readonly texlive?: TexLive;
	readonly hyphenmins: HyphenMins;
	readonly authors?: Author[];
	readonly checksum: string;
}

export interface HyphenationPattern {
	readonly v: string;
}

export interface Index {
	readonly v: number | string;
}

export interface HyphenationExclusion {
	readonly word: string;
	readonly index: Index[];
}

export interface Internal {
	readonly hyphenation?: Hyphenation;
}

export interface Hyphenation {
	readonly general: HyphenationGeneral;
	readonly patterns: HyphenationPattern[];
	readonly exclusions: HyphenationExclusion[];
}

export interface PreventLineBreakRule {
	readonly pattern: string;
}

export interface TypesettingModelContent {
	readonly customHyphenationExclusions: HyphenationExclusion[];
	readonly preventLineBreakRules: PreventLineBreakRule[];
	readonly internal: Internal;
	readonly orphan?: number;
	readonly widow?: number;
}

export interface TypeSettingModelHeader extends Header {
	readonly modelType: "typesetting";
	readonly locales?: LocaleEntity[];
	readonly labels?: ReadonlyArray<LabelEntity>;
	readonly annotations?: AnnotationEntity[];
	readonly modelReferences?: ModelReferenceEntity[];
}

export interface TypesettingModel {
	readonly header: TypeSettingModelHeader;
	readonly content: TypesettingModelContent;
}
