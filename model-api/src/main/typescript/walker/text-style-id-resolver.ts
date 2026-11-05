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
import { type PrintModel, type TextStyle } from "../model/index.js";

import { resolveFragmentDefinitions } from "./fragment-definition-resolver.js";
import type { PrintModelResolver } from "./print-model-resolver.js";

export interface TextStyleMap {
	[key: string]: TextStyle;
}

export interface TextStyleIdResolver {
	resolveTextStyleId(id: string): TextStyle | undefined;
}

export class DefaultTextStyleIdResolver implements TextStyleIdResolver {
	constructor(
		private readonly textStyleList: ReadonlyArray<TextStyle>,
		private readonly fragmentTextStyles: ReadonlyMap<string, TextStyle> = new Map()
	) {}

	/** @param fragmentModelResolver Without it only locally defined text styles are resolvable.
	 * @remarks
	 * The signature will change in the next major release to `fromModel(printModel: PrintModel, fragmentModelResolver: PrintModelResolver)`.
	 */
	public static fromModel(printModel: PrintModel, fragmentModelResolver?: PrintModelResolver) {
		const textStyles = printModel.content.textStyles;
		return new this(
			textStyles?.definitions || [],
			fragmentModelResolver
				? resolveFragmentDefinitions(
						textStyles?.references || [],
						fragmentModelResolver,
						fragmentModel => fragmentModel.content.textStyles?.definitions || [],
						// Each reference is an independent instance, keyed by its own id.
						(textStyle, _reference, referenceId) => ({ ...textStyle, id: referenceId })
					)
				: undefined
		);
	}

	resolveTextStyleId(id: string): TextStyle | undefined {
		return this.textStyleList.find(el => el.id === id) || this.fragmentTextStyles.get(id);
	}
}

export class CachedTextStyleIdResolver implements TextStyleIdResolver {
	private readonly textStylesResolver: TextStyleIdResolver;
	private readonly textStyleMap: TextStyleMap = {};

	constructor(textStyleIdResolver: TextStyleIdResolver) {
		this.textStylesResolver = textStyleIdResolver;
	}

	resolveTextStyleId(id: string): TextStyle | undefined {
		const textStyle = this.textStyleMap[id];
		if (textStyle) {
			return textStyle;
		}
		const newTextStyle = this.textStylesResolver.resolveTextStyleId(id);
		if (newTextStyle) {
			this.textStyleMap[id] = newTextStyle;
		}
		return newTextStyle;
	}
}
