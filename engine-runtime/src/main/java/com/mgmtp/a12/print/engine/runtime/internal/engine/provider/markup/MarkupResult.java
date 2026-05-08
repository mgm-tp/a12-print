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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup;

import com.mgmtp.a12.print.model.document.internal.base.IContentHolder;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NonNull;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

@AllArgsConstructor
public class MarkupResult implements IContentHolder {
	@NonNull
	private final String id;
	@NonNull
	private final String markup;

	@Getter
	private LinkedHashMap<String, AttachmentToAppend> attachmentsToAppend = new LinkedHashMap<>();

	@Getter
	private Map<String, String> pageNumberGlobalStyles = new HashMap<>();

	private boolean hasEmptyContent = false;
	private boolean isHidden = false;

	public MarkupResult(
		@NonNull String id,
		@NonNull String markup,
		boolean hasEmptyContent
	) {
		this.id = id;
		this.markup = markup;
		this.hasEmptyContent = hasEmptyContent;
	}

	public MarkupResult(
		@NonNull String id,
		@NonNull String markup,
		boolean hasEmptyContent,
		LinkedHashMap<String, AttachmentToAppend> attachmentsToAppend
	) {
		this.id = id;
		this.markup = markup;
		this.hasEmptyContent = hasEmptyContent;
		this.attachmentsToAppend = attachmentsToAppend;
	}

	public MarkupResult(
		@NonNull String id,
		@NonNull String markup,
		boolean hasEmptyContent,
		boolean isHidden,
		Map<String, String> pageNumberGlobalStyles
	) {
		this.id = id;
		this.markup = markup;
		this.hasEmptyContent = hasEmptyContent;
		this.isHidden = isHidden;
		this.pageNumberGlobalStyles = pageNumberGlobalStyles;
	}

	public MarkupResult(
		@NonNull String id,
		@NonNull String markup
	) {
		this.id = id;
		this.markup = markup;
	}

	public MarkupResult(
		@NonNull String id,
		@NonNull String markup,
		LinkedHashMap<String, AttachmentToAppend> attachmentsToAppend
	) {
		this.id = id;
		this.markup = markup;
		this.attachmentsToAppend = attachmentsToAppend;
	}

	public @NonNull String getMarkup() {
		return markup;
	}

	public @NonNull String getId() {
		return id;
	}

	public boolean hasEmptyContent() {
		return hasEmptyContent;
	}

	public boolean isHidden() {
		return isHidden;
	}

}
