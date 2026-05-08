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
package com.mgmtp.a12.print.model.migration.internal;

public class MigrationResult {
	private final String startVersion;
	private final int startStep;

	private String previousVersion;
	private String targetVersion;
	private int targetStep;
	private String resultDocument;

	public MigrationResult(
		String resultDocument,
		String startVersion,
		int startStep
	) {
		this.resultDocument = resultDocument;
		this.startVersion = startVersion;
		this.targetVersion = startVersion;
		this.previousVersion = startVersion;
		this.startStep = startStep;
		this.targetStep = startStep;
	}

	public String getStartVersion() {
		return startVersion;
	}

	public int getStartStep() {
		return startStep;
	}

	public String getResultDocument() {
		return resultDocument;
	}

	public void setResultDocument(String resultDocument) {
		this.resultDocument = resultDocument;
	}

	public String getTargetVersion() {
		return targetVersion;
	}

	public void setTargetVersion(String endVersion) {
		this.targetVersion = endVersion;
	}

	public int getTargetStep() {
		return targetStep;
	}

	public void incrementStepIndex() {
		this.targetStep = targetStep + 1;
	}

	public void resetStepIndex() {
		this.targetStep = -1;
	}

	public String getPreviousVersion() {
		return previousVersion;
	}

	public void setPreviousVersion(String previousVersion) {
		this.previousVersion = previousVersion;
	}
}
