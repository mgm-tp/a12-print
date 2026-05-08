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
import { nanoid } from "nanoid";

import {
	BaseColumnType,
	Table,
	TableRenderPropsType,
} from "@com.mgmtp.a12.widgets/widgets-core/lib/table/new-api/index.js";
import { Message } from "@com.mgmtp.a12.widgets/widgets-core/lib/message/index.js";
import { addPrefix } from "@com.mgmtp.a12.widgets/widgets-core/lib/common/index.js";
import { Button } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/index.js";
import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/index.js";
import { DeepPartialErrorMap, ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";
import { Autocomplete, GlobalMessageBox } from "@com.mgmtp.a12.widgets/widgets-core";
import { AnnotationEntity } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { RESOURCE_KEYS } from "../../localization/keys.js";
import { useDefaultLocalizer, useLocalizer } from "../../localization/localizer.js";
import { DataKeys } from "../../types/role-table.js";
import { PrintSettingModel } from "../../../api/model/print-setting-model.js";

import { ConfirmDeletionModal } from "../modal/ConfirmDeletionModal.js";

interface CustomFontsTableProps {
	annotations: AnnotationEntity[];
	onChange: (fonts: AnnotationEntity[]) => void;
	errorMap?: DeepPartialErrorMap<PrintSettingModel>;
	availableRoles?: string[];
}

function extractRoles(annotations: AnnotationEntity[]): string[] {
	const rolesEntry = annotations.find(a => a.name === "roles");
	if (!rolesEntry?.value) {
		return [];
	}
	return rolesEntry.value.split(",");
}

function getRolesInAnnotationsIndex(annotations: AnnotationEntity[]) {
	const rolesIndex = annotations.findIndex(a => a.name === "roles");
	return rolesIndex;
}

function updateRoles(annotations: AnnotationEntity[], newRoles: string[]): AnnotationEntity[] {
	const filtered = annotations.filter(a => a.name !== "roles");
	if (!newRoles.length) {
		return filtered;
	}

	return [...filtered, { id: nanoid(), name: "roles", value: newRoles.join(",") }];
}

export const RolesTable = ({ annotations, onChange, errorMap, availableRoles }: CustomFontsTableProps) => {
	const [roles, setRoles] = useState<string[]>(extractRoles(annotations));
	const { rolesErrors, rolesWarnings } = useRoleValidationMessages(annotations, errorMap);

	const [deletingRowIndex, setDeletingRowIndex] = useState<number>();
	const localizer = useLocalizer();
	const defaultLocalizer = useDefaultLocalizer();
	const columns = useColumns();

	const onRoleNameChange = (newValue: string, index: number) => {
		const updated = [...roles];
		updated[index] = newValue.trim();
		setRoles(updated);
		onChange(updateRoles(annotations, updated));
	};

	const onClickDelete = () => {
		if (deletingRowIndex !== undefined) {
			const updated = roles.filter((_, i) => i !== deletingRowIndex);
			setRoles(updated);
			onChange(updateRoles(annotations, updated));
			setDeletingRowIndex(undefined);
		}
	};

	const onClickAdd = () => {
		const updated = [...roles, ""];
		setRoles(updated);
		onChange(updateRoles(annotations, updated));
	};

	const bodyContentRenderer = (props: TableRenderPropsType.BodyContentProps<string>) => {
		const { column, row, rowIndex } = props;

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

		if (column.dataKey === DataKeys.roleName) {
			return (
				<Autocomplete
					items={availableRoles || []}
					value={row}
					onValueChange={role => typeof role === "string" && onRoleNameChange(role, rowIndex)}
					allowAddingNewItem
					hintTemplate={localizer(RESOURCE_KEYS.roleSettings.autocompleteHint) ?? ""}
				/>
			);
		}

		return null;
	};

	return (
		<>
			{rolesErrors?.errorMessage.length && (
				<GlobalMessageBox content={defaultLocalizer(...rolesErrors.errorMessage)} variant="error" />
			)}
			{rolesWarnings?.errorMessage.length && (
				<GlobalMessageBox content={defaultLocalizer(...rolesWarnings.errorMessage)} variant="warning" />
			)}
			<Table<string> data={roles} columns={columns} componentRenderers={{ bodyContentRenderer }} />
			{!roles.length && (
				<Message className={addPrefix("-u-text-center")}>
					{localizer(RESOURCE_KEYS.roleSettings.placeholderContent)}
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

function useRoleValidationMessages(
	annotations: AnnotationEntity[],
	errorMap: DeepPartialErrorMap<PrintSettingModel> | undefined
) {
	return useMemo(() => {
		const rolesInAnnotationsIndex = getRolesInAnnotationsIndex(annotations);
		const rolesErrorMap =
			rolesInAnnotationsIndex >= 0 ? errorMap?.header?.annotations?.[rolesInAnnotationsIndex] : undefined;

		const headerRolesErrors = errorMap?.header?.[ErrorSeverity.ERROR]?.find(e =>
			e.parameters?.rulePath?.toLowerCase().includes("role")
		);
		const headerRolesWarnings = errorMap?.header?.[ErrorSeverity.WARNING]?.find(e =>
			e.parameters?.rulePath?.toLowerCase().includes("role")
		);

		const rolesErrors = rolesErrorMap?.[ErrorSeverity.ERROR]?.[0] ?? headerRolesErrors;
		const rolesWarnings = rolesErrorMap?.[ErrorSeverity.WARNING]?.[0] ?? headerRolesWarnings;

		return { rolesErrors, rolesWarnings };
	}, [annotations, errorMap]);
}

const useColumns = (): BaseColumnType[] => {
	const localizer = useLocalizer();

	return useMemo(
		() => [
			{
				label: localizer(RESOURCE_KEYS.roleSettings.columns.roleName),
				dataKey: DataKeys.roleName,
			},
			{
				label: "",
				dataKey: DataKeys.actions,
				actionColumn: true,
				pinning: "right",
			},
		],
		[localizer]
	);
};
