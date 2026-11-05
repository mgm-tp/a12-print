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
package com.mgmtp.a12.print.model.api.model;

import com.mgmtp.a12.model.header.Annotation;
import com.mgmtp.a12.model.header.Header;

import java.util.List;

/**
 * Utility for accessing the Model Sub Type stored in a print model {@link Header}'s annotations.
 */
public final class ModelSubTypeAccessor {

	/**
	 * Name of the {@link Header} annotation carrying the Model Sub Type.
	 */
	public static final String MODEL_SUB_TYPE_ANNOTATION = "modelSubType";
	/**
	 * Model Sub Type marking a Print Model as a Print Fragment Model.
	 */
	public static final String FRAGMENT_MODEL_SUB_TYPE = "fragment";

	private ModelSubTypeAccessor() {
	}

	/**
	 * @return {@code true} if the given {@link Header} marks its Print Model as a Print Fragment Model.
	 */
	public static boolean isFragmentModel(Header header) {
		return FRAGMENT_MODEL_SUB_TYPE.equals(getModelSubType(header));
	}

	/**
	 * @return Model Sub Type, can be null.
	 */
	public static String getModelSubType(Header header) {
		List<Annotation> annotations = header.getAnnotations();
		return annotations
			.stream()
			.filter(annotation -> annotation.getName().equals(MODEL_SUB_TYPE_ANNOTATION))
			.map(Annotation::getValue)
			.findFirst()
			.orElse(null);
	}
}
