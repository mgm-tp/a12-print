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
import { useCallback, useContext, useMemo, useState } from "react";

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
import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react/lib/main/index.js";
import { Localizer } from "@com.mgmtp.a12.utils/utils-localization/lib/main/index.js";
import { EntityKey, getEntityId } from "@com.mgmtp.a12.print/print-model-api/lib/model/print-model.js";

import { RESOURCE_KEYS } from "../../../localization/keys.js";
import { PrintLocalizer } from "../../../localization/localizer.js";
import { useConfirmationDialog } from "../../../hooks/use-confirmation-dialog.js";
import { ConfirmationDialogType } from "../../../redux/index.js";

import { AnnotationData } from "../annotations/annotation.js";
import { StyledGeneralRolesTable } from "../General.styled.js";

interface GeneralRolesTableProps {
	annotations: AnnotationData[];
	onChange: (annotations: AnnotationData[]) => void;
	errorMap?: DeepPartialErrorMap<AnnotationData>[];
	availableRoles?: string[];
}

const useDefaultLocalizer = (): Localizer => {
	const { localizer } = useContext(LocalizerContext);
	return localizer;
};

enum DataKeys {
	roleName = "roleName",
	actions = "roleActions",
}

function extractRoles(annotations: AnnotationData[]): string[] {
	const rolesEntry = annotations.find(a => a.name === "roles");
	if (!rolesEntry?.value) {
		return [];
	}
	return rolesEntry.value.split(",");
}

function updateRoles(annotations: AnnotationData[], newRoles: string[]): AnnotationData[] {
	const filtered = annotations.filter(a => a.name !== "roles");
	if (!newRoles.length) {
		return filtered;
	}
	if (!annotations.find(a => a.name === "roles")) {
		annotations.push({ id: getEntityId(EntityKey.Annotations, ""), name: "roles", value: "" });
	}
	return annotations.map(a => {
		if (a.name === "roles") {
			return { ...a, value: newRoles.join(",") };
		}
		return a;
	});
}

export const RolesTable = ({ annotations, onChange, errorMap, availableRoles }: GeneralRolesTableProps) => {
	const [roles, setRoles] = useState<string[]>(extractRoles(annotations));
	const { rolesErrors, rolesWarnings } = useRoleValidationMessages(errorMap);

	const localizer = PrintLocalizer.useLocalizer();
	const defaultLocalizer = useDefaultLocalizer();
	const columns = useColumns();

	const onRoleNameChange = (newValue: string, index: number) => {
		const updated = [...roles];
		updated[index] = newValue.trim();
		setRoles(updated);
		onChange(updateRoles(annotations, updated));
	};

	const onClickAdd = () => {
		const updated = [...roles, ""];
		setRoles(updated);
		onChange(updateRoles(annotations, updated));
	};

	const confirm = useConfirmationDialog();

	const deleteRole = useCallback(
		async (rowIndex: number) => {
			const confirmed = await confirm(ConfirmationDialogType.DELETE);
			if (!confirmed) {
				return;
			}
			if (rowIndex !== undefined) {
				const updated = roles.filter((_, i) => i !== rowIndex);
				setRoles(updated);
				onChange(updateRoles(annotations, updated));
			}
		},
		[confirm, onChange, roles, annotations]
	);

	const bodyContentRenderer = (props: TableRenderPropsType.BodyContentProps<string>) => {
		const { column, row, rowIndex } = props;

		if (column.dataKey === DataKeys.actions) {
			return (
				<Button
					destructive
					icon={<Icon title={localizer(RESOURCE_KEYS.button.delete)}>delete</Icon>}
					title={localizer(RESOURCE_KEYS.button.delete)}
					onClick={() => deleteRole(rowIndex)}
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
					hintTemplate={localizer(RESOURCE_KEYS.sidebar.general.roleSettings.autocompleteHint) ?? ""}
				/>
			);
		}

		return null;
	};

	return (
		<StyledGeneralRolesTable>
			{rolesErrors?.errorMessage.length && (
				<GlobalMessageBox content={defaultLocalizer(...rolesErrors.errorMessage)} variant="error" />
			)}
			{rolesWarnings?.errorMessage.length && (
				<GlobalMessageBox content={defaultLocalizer(...rolesWarnings.errorMessage)} variant="warning" />
			)}
			<Table<string> data={roles} columns={columns} componentRenderers={{ bodyContentRenderer }} />
			{!roles.length && (
				<Message className={addPrefix("-u-text-center")}>
					{localizer(RESOURCE_KEYS.sidebar.general.roleSettings.placeholderContent)}
				</Message>
			)}

			<div>
				<Button className={addPrefix("-u-margin-t-base")} onClick={onClickAdd}>
					{localizer(RESOURCE_KEYS.button.add)}
				</Button>
			</div>
		</StyledGeneralRolesTable>
	);
};

function useRoleValidationMessages(errorMap: DeepPartialErrorMap<AnnotationData>[] | undefined) {
	return useMemo(() => {
		const rolesErrors = getRoleErrorByType(errorMap, ErrorSeverity.ERROR);
		const rolesWarnings = getRoleErrorByType(errorMap, ErrorSeverity.WARNING);

		return { rolesErrors, rolesWarnings };
	}, [errorMap]);
}

const getRoleErrorByType = (errorMap: DeepPartialErrorMap<AnnotationData>[] | undefined, errorType: ErrorSeverity) => {
	const rolesErrorTypeInErrorMapIndex = getRuleIndexInErrorMap(errorMap, errorType);

	const rolesErrorTypeMap =
		rolesErrorTypeInErrorMapIndex >= 0 ? errorMap?.[rolesErrorTypeInErrorMapIndex] : undefined;

	const headerRolesErrorType = rolesErrorTypeMap?.[errorType]?.find(e =>
		e.parameters?.rulePath?.toLowerCase().includes("role")
	);

	return rolesErrorTypeMap?.[errorType]?.[0] ?? headerRolesErrorType;
};

const getRuleIndexInErrorMap = (
	errorMap: DeepPartialErrorMap<AnnotationData>[] | undefined,
	errorType: ErrorSeverity
) => {
	if (!errorMap) {
		return -1;
	}
	for (let i = 0; i < errorMap.length; i++) {
		if (errorMap[i]?.[errorType]?.find(e => e.parameters?.rulePath?.toLowerCase().includes("role"))) {
			return i;
		}
	}
	return -1;
};

const useColumns = (): BaseColumnType[] => {
	const localizer = PrintLocalizer.useLocalizer();

	return useMemo(
		() => [
			{
				label: localizer(RESOURCE_KEYS.sidebar.general.roleSettings.columns.roleName),
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
