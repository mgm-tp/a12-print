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
package com.mgmtp.a12.print.model.migration.internal.versions.version_2_1_0;

import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;

public final class Constants {
	private Constants() {
	}

	public static final class KEYS {
		private KEYS() {
		}

		public final static String CONTENT = "content";
		public final static String ELEMENT_DEFINITIONS = "elementDefinitions";
		public final static String ELEMENT_TYPE = "type";
		public final static String LISTING_GROUP = "listing";
		public static final String LISTING_COLUMNS = "columns";
		public static final String LISTING_COLUMN_LABEL = "label";
		public static final String LISTING_COLUMN_WIDTH = "width";
		public final static String TABLE_GROUPS = "table";
		public final static String TABLE_MAX_ROW_COUNT = "maxRowCount";
		public final static String TABLE_SUM_LABEL = "sumLabel";
		public final static String TABLE_COLUMNS = "columns";
		public final static String TABLE_COLUMN_LABEL = "label";
		public final static String TABLE_COLUMN_WIDTH = "width";
		public final static String TABLE_LAYOUT_GROUPS = "tableLayout";
		public final static String TABLE_LAYOUT_ROW_PROPERTIES = "rowProperties";
		public final static String TABLE_LAYOUT_MIN_HEIGHT = "minHeight";
		public final static String TABLE_LAYOUT_COLUMN_PROPERTIES = "columnProperties";
		public final static String TABLE_LAYOUT_WIDTH = "width";
		public final static String BAR_CHART_GROUPS = "barChart";
		public final static String LINE_CHART_GROUPS = "lineChart";
		public final static String PIE_CHART_GROUPS = "pieChart";
		public final static String CHART_TITLE = "title";
		public final static String CHART_LABEL_X = "labelX";
		public final static String CHART_LABEL_Y = "labelY";
		public final static String INPUT_SOURCE_VALUE = "value";
		public final static String MEASURE_UNIT_PERCENT = "Percent";
		public final static String MEASURE_UNIT_MILLIMETER = "Millimeter";


	}

	@FieldDefaults(level = AccessLevel.PUBLIC, makeFinal = true)
	public static final class VALUES {
		private VALUES() {
		}

		public static final class ELEMENT_TYPE {
			public final static String LISTING = "Listing";

			public final static String TABLE = "Table";
			public final static String TABLE_LAYOUT = "TableLayout";
			public final static String BAR_CHART = "BarChart";
			public final static String LINE_CHART = "LineChart";
			public final static String PIE_CHART = "PieChart";

		}
	}
}
