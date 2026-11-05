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
import { type PartialPrintModel, type PartialTextStyle } from "../../model/index.js";

import {
	resolveFragmentDefinitions,
	resolveTopLevelContainerOrigins,
	type TopLevelContainerOrigin,
} from "../fragment-definition-resolver.js";
import type { PrintModelResolver } from "../print-model-resolver.js";

interface PartialTextStyleMap {
	[key: string]: PartialTextStyle;
}

export interface PartialTextStyleIdResolver {
	resolveTextStyleId(id: string): PartialTextStyle | undefined;

	resolveTextStyleOrigin?(id: string): TopLevelContainerOrigin | undefined;
}

/** Where the text style of an id comes from, `undefined` if the resolver does not track it or the id is unknown. */
export function resolvePartialTextStyleOrigin(
	resolver: PartialTextStyleIdResolver,
	id: string
): TopLevelContainerOrigin | undefined {
	return resolver.resolveTextStyleOrigin?.(id);
}

export class DefaultPartialTextStyleIdResolver implements PartialTextStyleIdResolver {
	constructor(
		private readonly textStyleList: ReadonlyArray<PartialTextStyle>,
		private readonly fragmentTextStyles: ReadonlyMap<string, PartialTextStyle> = new Map(),
		private readonly origins: ReadonlyMap<string, TopLevelContainerOrigin> = new Map()
	) {}

	/** @param fragmentModelResolver Without it only locally defined text styles are resolvable.
	 * @remarks
	 * The signature will change in the next major release to `fromModel(printModel: PartialPrintModel, fragmentModelResolver: PrintModelResolver)`.
	 */
	public static fromModel(printModel: PartialPrintModel, fragmentModelResolver?: PrintModelResolver) {
		const textStyles = printModel.content?.textStyles;
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
				: undefined,
			resolveTopLevelContainerOrigins(textStyles?.definitions || [], textStyles?.references || [])
		);
	}

	resolveTextStyleId(id: string): PartialTextStyle | undefined {
		return this.textStyleList.find(el => el.id === id) || this.fragmentTextStyles.get(id);
	}

	resolveTextStyleOrigin(id: string): TopLevelContainerOrigin | undefined {
		const origin = this.origins.get(id);
		if (origin) {
			return origin;
		}
		// Without the prepared map only the local definitions are known, fragment references are not.
		const definitionIndex = this.textStyleList.findIndex(textStyle => textStyle.id === id);
		return definitionIndex < 0 ? undefined : { definitionIndex };
	}
}

export class CachedPartialTextStyleIdResolver implements PartialTextStyleIdResolver {
	private readonly textStylesResolver: PartialTextStyleIdResolver;
	private readonly textStyleMap: PartialTextStyleMap = {};

	constructor(textStyleIdResolver: PartialTextStyleIdResolver) {
		this.textStylesResolver = textStyleIdResolver;
	}

	resolveTextStyleId(id: string): PartialTextStyle | undefined {
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

	resolveTextStyleOrigin(id: string): TopLevelContainerOrigin | undefined {
		return resolvePartialTextStyleOrigin(this.textStylesResolver, id);
	}
}
