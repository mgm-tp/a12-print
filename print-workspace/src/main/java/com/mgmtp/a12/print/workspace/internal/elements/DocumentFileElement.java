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
package com.mgmtp.a12.print.workspace.internal.elements;

import lombok.Data;
import lombok.EqualsAndHashCode;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.lang3.StringUtils;

import java.nio.file.Path;

@Data
@EqualsAndHashCode(callSuper = true)
public class DocumentFileElement extends FileElement {
	public static final FileElementType type = FileElementType.DOCUMENT;
	public static final String EXTENSION = "json";
	private final String documentId;
	private final String documentModelId;

	public DocumentFileElement(
		Path path,
		String documentModelId,
		String documentId
	) {
		super(path);
		this.documentModelId = documentModelId;
		this.documentId = documentId;
	}

	public static boolean isDocumentFile(Path path) {
		String modelName = resolveModelName(path);
		return StringUtils.isNoneEmpty(modelName);
	}

	/**
	 * JSON files are expected to have the following filenames ${MODEL_NAME}-${SOMETHING}.json. Only ${MODEL_NAME} is important for further processing.
	 * ${SOMETHING} can contain everything except for (-). It is used only so there can be more document JSON files for same model in the same directory
	 */
	public static String resolveModelName(Path path) {
		String documentId = resolveDocumentId(path);
		return resolveModelName(documentId);
	}

	public static String resolveModelName(String documentId) {
		return StringUtils.substringBeforeLast(documentId, "-");
	}

	public static String resolveIdWithoutModel(String documentId) {
		return StringUtils.substringAfterLast(documentId, "-");
	}

	public static String resolveDocumentId(Path path) {
		return FilenameUtils.getBaseName(path.toString());
	}
}
