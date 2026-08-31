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
import { useDispatch, useSelector } from "react-redux";

import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";
import type { PrintModelHeader } from "@com.mgmtp.a12.print/print-model-api/model";
import { EntityKey, getEntityId } from "@com.mgmtp.a12.print/print-model-api/model";
import { GlobalRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { Typography } from "@com.mgmtp.a12.widgets/widgets-core";

import { PrintEngineSelectors } from "../../store/selectors.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { TransactionLogStateActions } from "../../redux//transaction-log-state/actions.js";
import { InteractionLogActions } from "../../redux//interaction-log/index.js";
import { ValidationSelectors } from "../../redux//validation/selectors.js";
import { GeneralViewSelectors } from "../../redux//general-view/selectors.js";

import { RepeatTable } from "../forms/shared-components/RepeatTable.js";
import { CustomTextField, CustomTextAreaStateful } from "../forms/custom-base-input-components/index.js";
import type { RepeatColumnType } from "../forms/shared-components/types.js";
import { useErrorMessagesByPath } from "../validation/index.js";

import { StyledGeneral, StyledGeneralInput } from "./General.styled.js";
import { AnnotationCustomAdd } from "./annotations/AnnotationCustomAdd.js";
import type { AnnotationData } from "./annotations/annotation.js";
import { RolesTable } from "./roles/RolesTable.js";
import { MetadataSection } from "./metadata/MetadataSection.js";

export const ModelNameRegExp = new RegExp(/^(?!xml)[a-zA-Z_][\w\-.]*$/);

export const General = () => {
	const dispatch = useDispatch();
	const header = useSelector(PrintEngineSelectors.printHeader);
	const annotationErrorMap = useSelector(ValidationSelectors.annotation);
	const localizer = PrintLocalizer.useLocalizer();
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const availableRoles = useSelector(GeneralViewSelectors.selectAvailableRoles);

	const getAnnotationErrorMessage = React.useCallback(
		(property: keyof AnnotationData, rowIndex: number) => {
			return annotationErrorMap
				? errorMessageLocalizer(annotationErrorMap[rowIndex]?.[property]?.[ErrorSeverity.ERROR])
				: undefined;
		},
		[annotationErrorMap, errorMessageLocalizer]
	);

	const onNameChange = React.useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.general.changeName,
					region: GlobalRegion.SIDEBAR,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintHeader({
							data: {
								...header,
								id: event.target.value,
							},
						}),
					],
				})
			);
		},
		[dispatch, header]
	);

	const onDescriptionBlur = React.useCallback(
		(event: React.FocusEvent<HTMLTextAreaElement>) => {
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.general.changeDescription,
					region: GlobalRegion.SIDEBAR,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintHeader({
							data: {
								...header,
								description: event.target.value,
							},
						}),
					],
				})
			);
		},
		[dispatch, header]
	);

	const setAnnotationsData = React.useCallback(
		(data: AnnotationData[]) => {
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.general.changeAnnotation,
					region: GlobalRegion.SIDEBAR,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintHeader({
							data: {
								...header,
								annotations: data,
							},
						}),
					],
				})
			);
		},
		[dispatch, header]
	);

	const annotationsData = React.useMemo(() => header?.annotations?.slice() || [], [header?.annotations]);

	const setGenericAnnotationsData = React.useCallback(
		(data: AnnotationData[]) => {
			const protectedAnnotations = annotationsData.filter(entry => entry.name && entry.name === "roles");
			setAnnotationsData([...protectedAnnotations, ...data]);
		},
		[annotationsData, setAnnotationsData]
	);

	const { errorMessage, warningMessage } = useErrorMessagesByPath("header.description");

	const { reducedAnnotationErrorMap, roleErrorMap } = React.useMemo(() => {
		const reducedAnnotationErrorMap = [];
		const roleErrorMap = [];

		if (annotationErrorMap) {
			for (const error of annotationErrorMap) {
				if (
					error[ErrorSeverity.ERROR][0]?.parameters?.rulePath?.toLowerCase().includes("role") ||
					error[ErrorSeverity.WARNING][0]?.parameters?.rulePath?.toLowerCase().includes("role")
				) {
					roleErrorMap.push(error);
				} else {
					reducedAnnotationErrorMap.push(error);
				}
			}
		}
		return { reducedAnnotationErrorMap, roleErrorMap };
	}, [annotationErrorMap]);

	return (
		<StyledGeneral>
			<StyledGeneralInput>
				<CustomTextField
					readonly
					value={header?.id}
					onChange={onNameChange}
					label={localizer(RESOURCE_KEYS.sidebar.general.modelName)}
					errorMessage={useHeaderPropertyErrorMessage()("id")}
				/>
				<CustomTextAreaStateful
					value={header?.description}
					onBlur={onDescriptionBlur}
					label={localizer(RESOURCE_KEYS.sidebar.general.description)}
					errorMessage={errorMessage}
					warningMessage={warningMessage}
				/>
				<Typography.Headline level={3}>
					{localizer(RESOURCE_KEYS.sidebar.general.roleSettings.header.section)}
				</Typography.Headline>
				<RolesTable
					annotations={annotationsData}
					onChange={setAnnotationsData}
					errorMap={roleErrorMap}
					availableRoles={availableRoles}
				/>
				<RepeatTable<AnnotationData>
					data={stripRolesFromAnnotations(annotationsData)}
					columns={useAnnotationOptionsColumns()}
					headline={localizer(RESOURCE_KEYS.sidebar.general.annotations.headline)}
					setTableData={setGenericAnnotationsData}
					createEmptyRow={createEmptyRow}
					errorMap={reducedAnnotationErrorMap}
					getErrorMessage={getAnnotationErrorMessage}
					customRepeatAdd={<AnnotationCustomAdd data={annotationsData} setData={setAnnotationsData} />}
				/>
				<MetadataSection />
			</StyledGeneralInput>
		</StyledGeneral>
	);
};

function createEmptyRow(): AnnotationData {
	return {
		id: getEntityId(EntityKey.Annotations, ""),
	};
}

const stripRolesFromAnnotations = (annotationData: AnnotationData[]): AnnotationData[] => {
	return annotationData.filter(entry => entry.name && entry.name !== "roles");
};

const useAnnotationOptionsColumns = (): RepeatColumnType<AnnotationData>[] => {
	const localizer = PrintLocalizer.useLocalizer();

	return React.useMemo(
		() => [
			{
				label: localizer(RESOURCE_KEYS.sidebar.general.annotations.name),
				dataKey: "name",
				horizontalAlignment: "center",
				inputType: "textline",
				verticalAlignment: "middle",
				inputProps: { type: "text" },
				readonly: true,
			},
			{
				label: localizer(RESOURCE_KEYS.sidebar.general.annotations.value),
				dataKey: "value",
				horizontalAlignment: "center",
				inputType: "textline",
				verticalAlignment: "middle",
				inputProps: { type: "text" },
			},
			{
				label: "",
				dataKey: "",
				horizontalAlignment: "center",
				pinning: "right",
				actionColumn: true,
			},
		],
		[localizer]
	);
};

export const useHeaderPropertyErrorMessage = () => {
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const headerErrorMap = useSelector(ValidationSelectors.header);

	return (property: keyof Omit<PrintModelHeader, "locales" | "annotations" | "modelReferences" | "labels">) =>
		headerErrorMap ? errorMessageLocalizer(headerErrorMap[property]?.[ErrorSeverity.ERROR]) : undefined;
};
