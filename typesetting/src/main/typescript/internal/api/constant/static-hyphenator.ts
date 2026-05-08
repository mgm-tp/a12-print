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
import Hyphenator from "../applier/hyphenator/Hyphenator.js";
import PatternHyphenator from "../applier/hyphenator/PatternHyphenator.js";
import { Domain_de_1996 } from "../generated/Domain_de_1996.js";
import { Domain_en_us } from "../generated/Domain_en_us.js";
import { Domain_fr } from "../generated/Domain_fr.js";
import { Domain_cs } from "../generated/Domain_cs.js";
import { Domain_pt } from "../generated/Domain_pt.js";
import { Domain_vi } from "../generated/Domain_vi.js";
import { TypesettingModel } from "../model/index.js";

export enum StaticHyphenatorKey {
	en_US = "en_US",
	de_1996 = "de_1996",
	fr = "fr",
	cs = "cs",
	pt = "pt",
	vi = "vi",
}

const staticHyphenatorCache: Partial<Record<StaticHyphenatorKey, Hyphenator>> = {};

export function getStaticHyphenator(key: StaticHyphenatorKey): Hyphenator {
	if (staticHyphenatorCache[key]) {
		return staticHyphenatorCache[key];
	}

	switch (key) {
		case StaticHyphenatorKey.en_US:
			staticHyphenatorCache[key] = new PatternHyphenator(Domain_en_us as unknown as TypesettingModel);
			break;
		case StaticHyphenatorKey.de_1996:
			staticHyphenatorCache[key] = new PatternHyphenator(Domain_de_1996 as unknown as TypesettingModel);
			break;
		case StaticHyphenatorKey.fr:
			staticHyphenatorCache[key] = new PatternHyphenator(Domain_fr as unknown as TypesettingModel);
			break;
		case StaticHyphenatorKey.cs:
			staticHyphenatorCache[key] = new PatternHyphenator(Domain_cs as unknown as TypesettingModel);
			break;
		case StaticHyphenatorKey.pt:
			staticHyphenatorCache[key] = new PatternHyphenator(Domain_pt as unknown as TypesettingModel);
			break;
		case StaticHyphenatorKey.vi:
			staticHyphenatorCache[key] = new PatternHyphenator(Domain_vi as unknown as TypesettingModel);
			break;
		default:
			throw new Error(`Unsupported static hyphenator key: ${key}`);
	}

	return staticHyphenatorCache[key];
}
