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
package com.mgmtp.a12.print.engine.runtime.internal.engine.constant;

import com.mgmtp.a12.print.engine.api.PrintEngineConfig;
import com.mgmtp.a12.print.model.api.model.textStyle.TextStyle;

import java.util.Optional;

public class Constants {

	public static final String HEADING_PATTERN = "h[1-6]";

	public static final String DOCUMENT_MODEL_TYPE = "document";

	public static final String PRINT_MODEL_TYPE = "print";
	public static final String NO_SELECTED_DOCUMENT_ID = "_noSelectedDomainModel";
	public static final String DEFAULT_THREAD_NAME = "print-pool";
	public static final String HYPHEN = "-";
	public static final String STRING_FORMAT = "%s";
	public static final String NEW_LINE = "\\r\\n|\\r|\\n";
	public static final String BR_TAG = "<br />";
	public static final String OPEN_SQUARE_BRACKET = "[";
	public static final String CLOSED_SQUARE_BRACKET = "]";
	public static final String SLASH = "/";
	public static final String EMPTY_STRING = "";

	public static final TextStyle DEFAULT_TEXT_STYLE = new TextStyle() {
		@Override
		public String getName() {
			return "Default Text Style";
		}

		@Override
		public String getFont() {
			return PrintEngineConfig.DEFAULT_TEXT_STYLE_FONT_KEY;
		}

		@Override
		public float getFontSize() {
			return 12;
		}

		@Override
		public float getLineHeight() {
			return 18;
		}

		@Override
		public Semantic getSemantic() {
			return Semantic.P;
		}

		@Override
		public Optional<String> getTypesettingModelName() {
			return Optional.empty();
		}

		@Override
		public Optional<StaticHyphenator> getStaticHyphenator() {
			return Optional.empty();
		}

		@Override
		public String getId() {
			return "default-text-style-id";
		}
	};

	public static final TextStyle NO_TEXT_STYLE_FALLBACK = new TextStyle() {
		@Override
		public String getName() {
			return "No text style fallback";
		}

		@Override
		public String getFont() {
			return PrintEngineConfig.DEFAULT_TEXT_STYLE_FONT_KEY;
		}

		@Override
		public float getFontSize() {
			return 12;
		}

		@Override
		public float getLineHeight() {
			return 15.86f;
		}

		@Override
		public Semantic getSemantic() {
			return Semantic.P;
		}

		@Override
		public Optional<String> getTypesettingModelName() {
			return Optional.empty();
		}

		@Override
		public Optional<StaticHyphenator> getStaticHyphenator() {
			return Optional.empty();
		}

		@Override
		public String getId() {
			return "no-text-style-fallback-id";
		}
	};
}
