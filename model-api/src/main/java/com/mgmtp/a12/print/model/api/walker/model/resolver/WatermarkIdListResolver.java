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
import com.mgmtp.a12.print.model.api.model.watermark.Watermark;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Resolves {@link com.mgmtp.a12.print.model.api.model.watermark.Watermark} IDs from a given list of {@link com.mgmtp.a12.print.model.api.model.watermark.Watermark}s.
 */
@OnlyForUsage
public class WatermarkIdListResolver implements WatermarkIdResolver {
	private final Map<String, PrintModelTreeTrace<Watermark>> watermarkMap;

	/**
	 * @deprecated Use {@link #WatermarkIdListResolver(Map)} instead. This constructor will be removed in the next major release.
	 */
	@Deprecated(since = "4.1.0", forRemoval = true)
	public WatermarkIdListResolver(List<PrintModelTreeTrace<Watermark>> watermarkList) {
		this.watermarkMap = watermarkList.stream()
			.collect(Collectors.toMap(w -> w.getTracedElement().getId(), Function.identity()));
	}

	public WatermarkIdListResolver(Map<String, PrintModelTreeTrace<Watermark>> watermarkMap) {
		this.watermarkMap = watermarkMap;
	}

	/**
	 * Creates a new {@link WatermarkIdListResolver} from the {@link PrintModel}s {@link Watermark} list.
	 * @deprecated Use {@link #fromModel(PrintModel, PrintFragmentModelResolver)} instead. This overload will be removed in the next major release.
	 */
	@Deprecated(since = "4.1.0", forRemoval = true)
	public static WatermarkIdListResolver fromModel(PrintModel printModel) {
		return new WatermarkIdListResolver(getWatermarksOfPrintModel(printModel));
	}

	/**
	 * Creates a new {@link WatermarkIdListResolver} from the {@link PrintModel}s + {@link PrintFragmentModel}s {@link Watermark} list.
	 */
	public static WatermarkIdListResolver fromModel(PrintModel printModel, PrintFragmentModelResolver printFragmentModelResolver) {
		return printModel.getContent().getWatermarks().map(watermarkContainer ->
			new WatermarkIdListResolver(
				FragmentModelDefinitionResolver.resolveWithFragmentModels(
					getWatermarksOfPrintModel(printModel),
					watermarkContainer.getReferences(),
					WatermarkIdListResolver::getWatermarksOfPrintModel,
					printFragmentModelResolver,
					"Watermark"
				)
			)
		).orElseGet(() -> new WatermarkIdListResolver(Collections.emptyMap()));
	}

	private static Map<String, PrintModelTreeTrace<Watermark>> getWatermarksOfPrintModel(PrintModel printModel) {
		return printModel.getContent().getWatermarks().<Map<String, PrintModelTreeTrace<Watermark>>>map(watermarkContainer ->
			FragmentModelDefinitionResolver.loadDefinitions(
				printModel,
				"watermarks",
				watermarkContainer
			)
		).orElseGet(HashMap::new);
	}

	@Override
	public Optional<PrintModelTreeTrace<Watermark>> resolveWatermarkId(String id) {
		return Optional.ofNullable(watermarkMap.get(id));
	}
}
