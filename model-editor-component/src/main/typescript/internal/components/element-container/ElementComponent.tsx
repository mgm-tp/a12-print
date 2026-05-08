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
import * as React from "react";

import { ElementType } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import type { BaseElementProps } from "../elements/base.js";
import { Text } from "../elements/Text.js";
import { Line } from "../elements/Line.js";
import { Expression } from "../elements/Expression.js";
import { Listing } from "../elements/Listing.js";
import { Image } from "../elements/Image.js";
import { Table } from "../elements/Table.js";
import { Diagram } from "../elements/Diagram.js";
import { TableLayout } from "../elements/table-layout/TableLayout.js";
import { BoundingBox } from "../elements/bounding-box/BoundingBox.js";
import { Override } from "../elements/override/Override.js";
import { Area } from "../elements/area/Area.js";
import { Switch } from "../elements/Switch.js";

export const ElementComponent: React.ComponentType<BaseElementProps> = props => {
	const { element } = props;

	switch (element.type) {
		case ElementType.Text:
			return <Text {...props} />;
		case ElementType.Line:
			return <Line {...props} />;
		case ElementType.Expression:
			return <Expression {...props} />;
		case ElementType.Listing:
			return <Listing {...props} />;
		case ElementType.Image:
			return <Image {...props} />;
		case ElementType.Table:
			return <Table {...props} />;
		case ElementType.LineChart:
		case ElementType.BarChart:
		case ElementType.PieChart:
			return <Diagram {...props} />;
		case ElementType.TableLayout:
			return <TableLayout {...props} />;
		case ElementType.BoundingBox:
			return <BoundingBox {...props} />;
		case ElementType.Override:
			return <Override {...props} />;
		case ElementType.Area:
			return <Area {...props} />;
		case ElementType.Switch:
			return <Switch {...props} />;
		default:
			console.error("Unknown element type:", element.type);
			return null;
	}
};
