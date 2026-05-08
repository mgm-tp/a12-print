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
import com.mgmtp.a12.print.model.api.model.watermark.Watermark;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelPath;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Resolves {@link com.mgmtp.a12.print.model.api.model.watermark.Watermark} IDs from a given list of {@link com.mgmtp.a12.print.model.api.model.watermark.Watermark}s.
 */
public class WatermarkIdListResolver implements WatermarkIdResolver {
	private final List<PrintModelTreeTrace<Watermark>> watermarkList;

	public WatermarkIdListResolver(List<PrintModelTreeTrace<Watermark>> watermarkList) {
		this.watermarkList = watermarkList;
	}

	/**
	 * Creates a new {@link WatermarkIdListResolver} from the {@link PrintModel}s {@link Watermark} list.
	 */
	public static WatermarkIdListResolver fromModel(PrintModel printModel) {
		if (printModel.getContent().getWatermarks().isPresent()) {

			var path = PrintModelPath
				.create(printModel)
				.with(printModel.getContent(), 0)
				.with(new PrintModelPathElement.ObjectProperty("watermarks"),0);
			var watermarks = new ArrayList<PrintModelTreeTrace<Watermark>>();
			var i = 0;
			for (var e : printModel.getContent().getWatermarks().get().getDefinitions()) {
				watermarks.add(new PrintModelTreeTrace<>(
					path.with(new PrintModelPathElement.ObjectProperty("definitions"), i),
					e
				));
				i++;
			}
			return new WatermarkIdListResolver(watermarks);
		}
		return new WatermarkIdListResolver(new ArrayList<>());
	}

	@Override
	public Optional<PrintModelTreeTrace<Watermark>> resolveWatermarkId(String id) {
		return watermarkList.stream().filter(
			watermark -> watermark.getTracedElement().getId().equals(id)
		).findFirst();
	}
}
