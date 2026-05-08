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
import { PrintModel, Segment } from "../model/index.js";

export interface SegmentMap {
	[key: string]: Segment;
}

export interface SegmentIdResolver {
	resolveSegmentId(id: string): Segment | undefined;
}

export class DefaultSegmentIdResolver implements SegmentIdResolver {
	constructor(private segmentList: ReadonlyArray<Segment>) {}

	public static fromModel(printModel: PrintModel) {
		return new this(printModel.content.segments.definitions);
	}

	resolveSegmentId(id: string): Segment | undefined {
		return this.segmentList.find(el => el.id === id);
	}
}

export class CachedSegmentIdResolver implements SegmentIdResolver {
	private structureResolver: SegmentIdResolver;
	private segmentMap: SegmentMap = {};

	constructor(referenceResolver: SegmentIdResolver) {
		this.structureResolver = referenceResolver;
	}

	resolveSegmentId(id: string): Segment | undefined {
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
}
