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
import { type PartialPrintModel, type PartialSegment, type PartialSegmentReference } from "../../model/index.js";

import {
	resolveFragmentDefinitions,
	resolveTopLevelContainerOrigins,
	type TopLevelContainerOrigin,
} from "../fragment-definition-resolver.js";
import type { PrintModelResolver } from "../print-model-resolver.js";

interface PartialSegmentMap {
	[key: string]: PartialSegmentReference;
}

export interface PartialSegmentIdResolver {
	resolveSegmentId(id: string): PartialSegment | undefined;

	resolveSegmentOrigin?(id: string): TopLevelContainerOrigin | undefined;
}

/** Where the segment of an id comes from, `undefined` if the resolver does not track it or the id is unknown. */
export function resolvePartialSegmentOrigin(
	resolver: PartialSegmentIdResolver,
	id: string
): TopLevelContainerOrigin | undefined {
	return resolver.resolveSegmentOrigin?.(id);
}

export class DefaultPartialSegmentIdResolver implements PartialSegmentIdResolver {
	constructor(
		private readonly segmentList: ReadonlyArray<PartialSegment>,
		private readonly fragmentSegments: ReadonlyMap<string, PartialSegment> = new Map(),
		private readonly origins: ReadonlyMap<string, TopLevelContainerOrigin> = new Map()
	) {}

	/** @param fragmentModelResolver Without it only locally defined segments are resolvable.
	 * @remarks
	 * The signature will change in the next major release to `fromModel(printModel: PartialPrintModel, fragmentModelResolver: PrintModelResolver)`.
	 */
	public static fromModel(printModel: PartialPrintModel, fragmentModelResolver?: PrintModelResolver) {
		const segments = printModel.content?.segments;
		return new this(
			segments?.definitions || [],
			fragmentModelResolver
				? resolveFragmentDefinitions(
						segments?.fragmentReferences || [],
						fragmentModelResolver,
						fragmentModel => fragmentModel.content?.segments?.definitions || [],
						// Each reference is an independent instance, keyed by its own id.
						(segment, _reference, referenceId) => ({ ...segment, id: referenceId })
					)
				: undefined,
			resolveTopLevelContainerOrigins(segments?.definitions || [], segments?.fragmentReferences || [])
		);
	}

	resolveSegmentId(id: string): PartialSegment | undefined {
		return this.segmentList.find(el => el.id === id) || this.fragmentSegments.get(id);
	}

	resolveSegmentOrigin(id: string): TopLevelContainerOrigin | undefined {
		const origin = this.origins.get(id);
		if (origin) {
			return origin;
		}
		// Without the prepared map only the local definitions are known, fragment references are not.
		const definitionIndex = this.segmentList.findIndex(segment => segment.id === id);
		return definitionIndex < 0 ? undefined : { definitionIndex };
	}
}

export class CachedPartialSegmentIdResolver implements PartialSegmentIdResolver {
	private readonly structureResolver: PartialSegmentIdResolver;
	private readonly segmentMap: PartialSegmentMap = {};

	constructor(referenceResolver: PartialSegmentIdResolver) {
		this.structureResolver = referenceResolver;
	}

	resolveSegmentId(id: string): PartialSegment | undefined {
		const segment = this.segmentMap[id];
		if (segment) {
			return segment;
		}
		const newSegment = this.structureResolver.resolveSegmentId(id);
		if (newSegment) {
			this.segmentMap[id] = newSegment;
		}
		return newSegment;
	}

	resolveSegmentOrigin(id: string): TopLevelContainerOrigin | undefined {
		return resolvePartialSegmentOrigin(this.structureResolver, id);
	}
}
