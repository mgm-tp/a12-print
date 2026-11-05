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
import { type PartialPrintModel, type PartialWatermark } from "../../model/index.js";

import {
	resolveFragmentDefinitions,
	resolveTopLevelContainerOrigins,
	type TopLevelContainerOrigin,
} from "../fragment-definition-resolver.js";
import type { PrintModelResolver } from "../print-model-resolver.js";

interface PartialWatermarkMap {
	[key: string]: PartialWatermark;
}

export interface PartialWatermarkIdResolver {
	resolveWatermarkId(id: string): PartialWatermark | undefined;

	resolveWatermarkOrigin?(id: string): TopLevelContainerOrigin | undefined;
}

/** Where the watermark of an id comes from, `undefined` if the resolver does not track it or the id is unknown. */
export function resolvePartialWatermarkOrigin(
	resolver: PartialWatermarkIdResolver,
	id: string
): TopLevelContainerOrigin | undefined {
	return resolver.resolveWatermarkOrigin?.(id);
}

export class DefaultPartialWatermarkIdResolver implements PartialWatermarkIdResolver {
	constructor(
		private readonly watermarkList: ReadonlyArray<PartialWatermark>,
		private readonly fragmentWatermarks: ReadonlyMap<string, PartialWatermark> = new Map(),
		private readonly origins: ReadonlyMap<string, TopLevelContainerOrigin> = new Map()
	) {}

	/** @param fragmentModelResolver Without it only locally defined watermarks are resolvable.
	 * @remarks
	 * The signature will change in the next major release to `fromModel(printModel: PartialPrintModel, fragmentModelResolver: PrintModelResolver)`.
	 */
	public static fromModel(printModel: PartialPrintModel, fragmentModelResolver?: PrintModelResolver) {
		const watermarks = printModel.content?.watermarks;
		return new this(
			watermarks?.definitions || [],
			fragmentModelResolver
				? resolveFragmentDefinitions(
						watermarks?.references || [],
						fragmentModelResolver,
						fragmentModel => fragmentModel.content.watermarks?.definitions || [],
						// Each reference is an independent instance, keyed by its own id.
						(watermark, _reference, referenceId) => ({ ...watermark, id: referenceId })
					)
				: undefined,
			resolveTopLevelContainerOrigins(watermarks?.definitions || [], watermarks?.references || [])
		);
	}

	resolveWatermarkId(id: string): PartialWatermark | undefined {
		return this.watermarkList.find(el => el.id === id) || this.fragmentWatermarks.get(id);
	}

	resolveWatermarkOrigin(id: string): TopLevelContainerOrigin | undefined {
		const origin = this.origins.get(id);
		if (origin) {
			return origin;
		}
		// Without the prepared map only the local definitions are known, fragment references are not.
		const definitionIndex = this.watermarkList.findIndex(watermark => watermark.id === id);
		return definitionIndex < 0 ? undefined : { definitionIndex };
	}
}

export class CachedPartialWatermarkIdResolver implements PartialWatermarkIdResolver {
	private readonly watermarksResolver: PartialWatermarkIdResolver;
	private readonly watermarkMap: PartialWatermarkMap = {};

	constructor(referenceResolver: PartialWatermarkIdResolver) {
		this.watermarksResolver = referenceResolver;
	}

	resolveWatermarkId(id: string): PartialWatermark | undefined {
		const watermark = this.watermarkMap[id];
		if (watermark) {
			return watermark;
		}
		const newWatermark = this.watermarksResolver.resolveWatermarkId(id);
		if (newWatermark) {
			this.watermarkMap[id] = newWatermark;
		}
		return newWatermark;
	}

	resolveWatermarkOrigin(id: string): TopLevelContainerOrigin | undefined {
		return resolvePartialWatermarkOrigin(this.watermarksResolver, id);
	}
}
