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
import { useMemo, useState } from "react";
import get from "lodash/get.js";

import { Typography } from "@com.mgmtp.a12.widgets/widgets-core/lib/typography/index.js";
import {
	BaseColumnType,
	DefaultTableComponentRenderers,
	Table,
	TableRenderPropsType,
} from "@com.mgmtp.a12.widgets/widgets-core/lib/table/new-api/index.js";
import { Message } from "@com.mgmtp.a12.widgets/widgets-core/lib/message/index.js";
import { addPrefix } from "@com.mgmtp.a12.widgets/widgets-core/lib/common/index.js";
import { Button } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/index.js";
import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/index.js";
import { DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";

import { RESOURCE_KEYS } from "../../localization/keys.js";
import { useLocalizer } from "../../localization/localizer.js";
import { DataKeys } from "../../types/font-table.js";
import { Font } from "../../../api/model/index.js";

import { ConfirmDeletionModal } from "../modal/ConfirmDeletionModal.js";
import { CustomInput } from "../input/CustomInput.js";

import { FontValueInput } from "./FontValueInput.js";

interface CustomFontsTableProps {
	customFonts: Font[];
	onChange: (fonts: Font[]) => void;
	errorMap?: DeepPartialErrorMap<Font>[];
}

export const CustomFontTable = ({ customFonts, onChange, errorMap }: CustomFontsTableProps) => {
	const [deletingRowIndex, setDeletingRowIndex] = useState<number>();
	const localizer = useLocalizer();
	const columns = useColumns();

	const onNameChange = (value: string, rowIndex: number) => {
		const cloned = [...customFonts];
		cloned[rowIndex] = {
			...cloned[rowIndex],
			name: value,
		};
		onChange(cloned);
	};

	const onValueChange = (font: Font, rowIndex: number) => {
		const cloned = [...customFonts];
		cloned[rowIndex] = font;
		onChange(cloned);
	};

	const onClickDelete = () => {
		if (deletingRowIndex !== undefined) {
			const cloned = [...customFonts];
			cloned.splice(deletingRowIndex, 1);
			onChange(cloned);
			setDeletingRowIndex(undefined);
		}
	};

	const onClickAdd = () => {
		onChange([...customFonts, { name: "", path: "", type: "path" }]);
	};

	const bodyContentRenderer = (props: TableRenderPropsType.BodyContentProps<Font>) => {
		const { column, row, rowIndex } = props;

		const rowErrorMap = errorMap?.[rowIndex];

		if (column.dataKey === DataKeys.actions) {
			return (
				<Button
					destructive
					icon={<Icon title={localizer(RESOURCE_KEYS.button.delete)}>delete</Icon>}
					title={localizer(RESOURCE_KEYS.button.delete)}
					onClick={() => setDeletingRowIndex(rowIndex)}
				/>
			);
		}

		if (column.dataKey === DataKeys.name) {
			return (
				<CustomInput
					initialValue={row.name}
					onBlur={name => {
						onNameChange(name, rowIndex);
					}}
					errorMap={get(rowErrorMap, `name[@error][0]`)}
				/>
			);
		}

		if (column.dataKey === DataKeys.value) {
			return (
				<FontValueInput
					key={`${rowIndex}-${row.type}`}
					font={row}
					onChange={value => onValueChange(value, rowIndex)}
					errorMap={rowErrorMap}
				/>
			);
		}

		return DefaultTableComponentRenderers.bodyContentRenderer(props);
	};

	return (
		<>
			<Typography.Headline level={3}>{localizer(RESOURCE_KEYS.fontSettings.header.customs)}</Typography.Headline>
			<Table<Font> data={customFonts} columns={columns} componentRenderers={{ bodyContentRenderer }} />
			{!customFonts.length && (
				<Message className={addPrefix("-u-text-center")}>
					{localizer(RESOURCE_KEYS.fontSettings.placeholderContent)}
				</Message>
			)}
			<Button className={addPrefix("-u-margin-t-base")} onClick={onClickAdd}>
				{localizer(RESOURCE_KEYS.button.add)}
			</Button>
			<ConfirmDeletionModal
				isShow={deletingRowIndex !== undefined}
				onDelete={onClickDelete}
				onClose={() => setDeletingRowIndex(undefined)}
			/>
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
				{
					label: localizer(RESOURCE_KEYS.fontSettings.columns.fontValue),
					dataKey: DataKeys.value,
				},
				{
					label: "",
					dataKey: DataKeys.actions,
					actionColumn: true,
					pinning: "right",
				},
			] as BaseColumnType[],
		[localizer]
	);
};
