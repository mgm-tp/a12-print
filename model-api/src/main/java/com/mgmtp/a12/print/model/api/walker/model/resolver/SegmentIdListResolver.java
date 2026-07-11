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

import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.path.PrintModelPathElement;
import com.mgmtp.a12.print.model.api.model.section.ModelSection;
import com.mgmtp.a12.print.model.api.model.segment.ModelSegment;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelPath;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.mgmtp.a12.model.utils.OnlyForUsage;

/**
 * Resolves {@link ModelSegment} IDs from a given list of {@link ModelSegment}s.
 */
@OnlyForUsage
public class SegmentIdListResolver implements SegmentIdResolver {
		private final List<PrintModelTreeTrace<ModelSegment>> segmentList;

		public SegmentIdListResolver(List<PrintModelTreeTrace<ModelSegment>> segmentList) {
			this.segmentList = segmentList;
		}

		/**
		 * Creates a new {@link SegmentIdListResolver} from the {@link PrintModel}s {@link ModelSegment} list.
		 */
		public static SegmentIdListResolver fromModel(PrintModel printModel) {

			var path = PrintModelPath
				.create(printModel)
				.with(printModel.getContent(), 0)
				.with(new PrintModelPathElement.ObjectProperty("segments"),0);
			var segments = new ArrayList<PrintModelTreeTrace<ModelSegment>>();
			var i = 0;
			for (var e : printModel.getContent().getSegments().getDefinitions()) {
				segments.add(new PrintModelTreeTrace<>(
					path.with(new PrintModelPathElement.ObjectProperty("definitions"), i),
					e
				));
				i++;
			}
			return new SegmentIdListResolver(segments);
		}

		@Override
		public Optional<PrintModelTreeTrace<ModelSegment>> resolveSegmentId(String id) {
			return segmentList.stream().filter(
				segment -> segment.getTracedElement().getId().equals(id)
			).findFirst();
		}

}
