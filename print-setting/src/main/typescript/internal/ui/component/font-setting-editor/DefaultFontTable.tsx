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
import { useMemo } from "react";

import { Typography } from "@com.mgmtp.a12.widgets/widgets-core/lib/typography/index.js";
import {
	BaseColumnType,
	DefaultTableComponentRenderers,
	Table,
	TableRenderPropsType,
} from "@com.mgmtp.a12.widgets/widgets-core/lib/table/new-api/index.js";
import { Tooltip } from "@com.mgmtp.a12.widgets/widgets-core/lib/tooltip/index.js";
import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/index.js";
import { addPrefix } from "@com.mgmtp.a12.widgets/widgets-core/lib/common/index.js";

import { RESOURCE_KEYS } from "../../localization/keys.js";
import { useLocalizer } from "../../localization/localizer.js";
import { DataKeys } from "../../types/font-table.js";
import { Font, Font_1 } from "../../../api/model/index.js";

interface DefaultFontTableProps {
	defaultFonts: Font_1[];
	customFonts?: Font[];
}

export const DefaultFontTable = ({ defaultFonts, customFonts = [] }: DefaultFontTableProps) => {
	const columns = useColumns();
	const localizer = useLocalizer();

	const customFontNameSet = useMemo(() => {
		return customFonts?.reduce((nameSet, font) => {
			nameSet.add(font.name);
			return nameSet;
		}, new Set());
	}, [customFonts]);

	const bodyContentRenderer = (props: TableRenderPropsType.BodyContentProps<Font_1>) => {
		const { column, row } = props;

		if (column.dataKey === DataKeys.name && customFontNameSet.has(row.name)) {
			return (
				<div className={addPrefix("-u-line-through")}>
					{row.name}
					<Tooltip variant="warning" text={localizer(RESOURCE_KEYS.fontSettings.messages.overwriteFont)}>
						<Icon>info</Icon>
					</Tooltip>
				</div>
			);
		}

		return DefaultTableComponentRenderers.bodyContentRenderer(props);
	};

	return (
		<>
			<Typography.Headline level={3}>{localizer(RESOURCE_KEYS.fontSettings.header.defaults)}</Typography.Headline>
			<Table<Font_1> data={defaultFonts} columns={columns} componentRenderers={{ bodyContentRenderer }} />
		</>
	);
};

const useColumns = () => {
	const localizer = useLocalizer();

	return useMemo(
		() =>
			[
				{
					label: localizer(RESOURCE_KEYS.fontSettings.columns.fontName),
					dataKey: DataKeys.name,
				},
			] as BaseColumnType[],
		[localizer]
	);
};
