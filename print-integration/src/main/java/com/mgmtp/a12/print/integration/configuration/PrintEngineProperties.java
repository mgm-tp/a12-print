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
package com.mgmtp.a12.print.integration.configuration;

import com.mgmtp.a12.dataservices.configuration.ExposePropertiesToActuator;
import com.mgmtp.a12.dataservices.utils.ConfigurationParsingUtils;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;
import java.util.TimeZone;

import static com.mgmtp.a12.dataservices.configuration.DataServicesCoreProperties.MATCH_ALL;

/**
 * Configuration properties for the Print Engine integration.
 */
@ExposePropertiesToActuator
@Data
@ConfigurationProperties(prefix = "mgmtp.a12.print.engine")
public class PrintEngineProperties {

	/**
	 * Restricts pre-compiling to specified models while disabling all others.
	 * Setting the value to "\*" permits all existing models. Note: If "*" isn't the only string in the list, no special meaning will be applied.
	 *
	 * @default `*`
	 */
	private List<String> preCompilingEnabledForModels = new ArrayList<>(List.of(MATCH_ALL));

	public boolean isPreCompilationEnabledForModel(String headerId) {
		return ConfigurationParsingUtils.matchOrAll(headerId, preCompilingEnabledForModels);
	}

	/**
	 * Allows you to define the time zone, which is needed for the localization of language specific content and dates
	 *
	 * @default TimeZone.getTimeZone("UTC")
	 */
	private TimeZone timeZone = TimeZone.getTimeZone("UTC");
}
