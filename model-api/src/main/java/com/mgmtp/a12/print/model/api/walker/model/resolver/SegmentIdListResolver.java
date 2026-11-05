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
package com.mgmtp.a12.print.model.api.walker.model.resolver;

import com.mgmtp.a12.model.utils.OnlyForUsage;
import com.mgmtp.a12.print.model.api.model.PrintFragmentModel;
import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.segment.ModelSegment;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Resolves {@link ModelSegment} IDs from a given list of {@link ModelSegment}s.
 */
@OnlyForUsage
public class SegmentIdListResolver implements SegmentIdResolver {
		private final Map<String, PrintModelTreeTrace<ModelSegment>> segmentMap;

		/**
		 * @deprecated Use {@link #SegmentIdListResolver(Map)} instead. This constructor will be removed in the next major release.
		 */
		@Deprecated(since = "4.1.0", forRemoval = true)
		public SegmentIdListResolver(List<PrintModelTreeTrace<ModelSegment>> segmentList) {
			this.segmentMap = segmentList.stream()
				.collect(Collectors.toMap(seg -> seg.getTracedElement().getId(), Function.identity()));
		}

		public SegmentIdListResolver(Map<String, PrintModelTreeTrace<ModelSegment>> segmentMap) {
			this.segmentMap = segmentMap;
		}

		/**
		 * Creates a new {@link SegmentIdListResolver} from the {@link PrintModel}s {@link ModelSegment} list.
		 * @deprecated Use {@link #fromModel(PrintModel, PrintFragmentModelResolver)} instead. This overload will be removed in the next major release.
		 */
		@Deprecated(since = "4.1.0", forRemoval = true)
		public static SegmentIdListResolver fromModel(PrintModel printModel) {
			return new SegmentIdListResolver(getSegmentsOfPrintModel(printModel));
		}

		/**
		 * Creates a new {@link SegmentIdListResolver} from the {@link PrintModel}s + {@link PrintFragmentModel}s {@link ModelSegment} list.
		 */
		public static SegmentIdListResolver fromModel(
			PrintModel printModel,
			PrintFragmentModelResolver printFragmentModelResolver
		) {
			return new SegmentIdListResolver(FragmentModelDefinitionResolver.resolveWithFragmentModels(
				getSegmentsOfPrintModel(printModel),
				printModel.getContent().getSegments().getFragmentReferences(),
				SegmentIdListResolver::getSegmentsOfPrintModel,
				printFragmentModelResolver,
				"Segment"
			));
		}

		private static Map<String, PrintModelTreeTrace<ModelSegment>> getSegmentsOfPrintModel(PrintModel printModel) {
			return FragmentModelDefinitionResolver.loadDefinitions(
				printModel,
				"segments",
				printModel.getContent().getSegments()
			);
		}

		@Override
		public Optional<PrintModelTreeTrace<ModelSegment>> resolveSegmentId(String id) {
			return Optional.ofNullable(segmentMap.get(id));
		}

}
