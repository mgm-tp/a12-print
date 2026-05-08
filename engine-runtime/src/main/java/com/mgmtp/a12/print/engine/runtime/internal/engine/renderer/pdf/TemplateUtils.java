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
package com.mgmtp.a12.print.engine.runtime.internal.engine.renderer.pdf;

import com.mgmtp.a12.print.engine.api.exception.impl.TemplateLoadingException;
import freemarker.template.Configuration;
import com.mgmtp.a12.print.engine.api.constant.ConfigConstants;

import java.io.File;
import java.io.IOException;

public class TemplateUtils extends ResourceUtils {

	public static void setTemplateLoading(String path, Configuration cfg) {
		try {
			if (path.startsWith(ConfigConstants.CLASSPATH_SUFFIX)) {
				cfg.setClassForTemplateLoading(TemplateUtils.class, getClassPathPath(path));
				return;
			} else if (path.startsWith(ConfigConstants.FILEPATH_SUFFIX)) {
				File file = new File(path.replace(ConfigConstants.FILEPATH_SUFFIX, ""));
				cfg.setDirectoryForTemplateLoading(file);
				return;
			}
		} catch (IOException e) {
			throw new TemplateLoadingException("Error loading template {}.", path, e);
		}
		throw new TemplateLoadingException("{} is no valid filepath qualifier", path);
	}

}
