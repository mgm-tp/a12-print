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
// tag::PrintModelIdInterface[]
package com.mgmtp.a12.print.engine.api;

import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.model.utils.OnlyForUsage;

/**
 * The interface PrintModel Identifier
 */
@OnlyForUsage
public interface PrintModelId {

	/**
	 * Gets the String that is used as id in the PrintModel JSON File
	 *
	 * @return the model header id
	 */
	String getModelHeaderId();

	/**
	 * From string print model id.
	 *
	 * @param printModelHeaderId the print model header id
	 * @return the print model id
	 * @throws PrintException if the provided String is null empty or blank
	 */
	static PrintModelId fromString(final String printModelHeaderId) throws PrintException {

		if(printModelHeaderId == null) {
			throw new PrintException("The provided printModelHeaderId is null");
		}
		if(printModelHeaderId.isBlank()) {
			throw new PrintException("The provided printModelHeaderId is blank");
		}

		return new PrintModelId() {
			@Override
			public String getModelHeaderId() {
				return printModelHeaderId;
			}

			@Override
			public int hashCode() {
				return getModelHeaderId().hashCode();
			}

			@Override
			public boolean equals(Object obj) {
				if (obj instanceof PrintModelId) {
					return getModelHeaderId().equals(
						((PrintModelId) obj).getModelHeaderId()
					);
				} else {
					return false;
				}
			}

			@Override
			protected Object clone()  {
				return PrintModelId.fromString(getModelHeaderId());
			}

			@Override
			public String toString() {
				return getModelHeaderId();
			}
		};
	}
}
// end::PrintModelIdInterface[]
