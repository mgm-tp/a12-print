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
import { useCallback, useMemo, useReducer } from "react";

import type { Locale } from "@com.mgmtp.a12.utils/utils-localization";
import { isModelInstance, type Model } from "@com.mgmtp.a12.base/base-model-api";
import { Typography, ActionContentbox, ContentBoxElements } from "@com.mgmtp.a12.widgets/widgets-core";

import type { TypesettingModel } from "../../../../a12internal/api/index.js";
import { useLocalizer } from "../../localization/localizer.js";
import { RESOURCE_KEYS } from "../../localization/keys.js";
import { ErrorNotification } from "../../component/validation/ErrorNotification.js";
import { TypesettingModelMarshaller } from "../../../../a12internal/api/marshaller/index.js";
import { RolesTable } from "../../component/roles-editor/RolesTable.js";
import { PreventLineBreakRuleEditor } from "../../component/prevent-line-break-rule/PreventLineBreakRuleEditor.js";
import { createInitialTypesettingState, reducer } from "../../store/reducer.js";
import type { Action, SetSerializedResultPayload } from "../../store/action.js";
import { isEditAction, SET_SERIALIZED_RESULT } from "../../store/action.js";
import { TypesettingEditorContext } from "../../store/context.js";
import { PreventLineBreakRuleValidator } from "../../utils/custom-validator.js";
import { OrphanWidowSettings } from "../../component/orphan-widow-settings/OrphanWidowSettings.js";
import type { FooterSlots } from "../../../../a12internal/ui/app/typesetting-model-editor/types.js";

import { TypesettingModelFooter } from "./TypesettingModelFooter.js";

const typesettingModelMarshaller = new TypesettingModelMarshaller();

export interface TypesettingModelContainerProps {
	locale: Locale;
	modelIconPath?: string;
	model?: Model;
	onSave: (model: Model) => void;
	onChange?: (model: Model) => void;
	availableRoles?: string[];
	footerSlots?: FooterSlots;
}

export const TypesettingModelContainer = ({
	model,
	modelIconPath,
	onSave,
	onChange,
	availableRoles,
	footerSlots,
}: TypesettingModelContainerProps) => {
	const localizer = useLocalizer();

	const [state, dispatch] = useReducer(reducer, { model }, createInitialTypesettingState);
	const { model: typesettingModel, deserializeReport, serializeReport, customValidation } = state;

	const onClickSave = () => {
		if (!typesettingModel) {
			return;
		}

		const result = typesettingModelMarshaller.serialize(typesettingModel);
		if (!result.result) {
			const action: Action<SetSerializedResultPayload> = {
				type: SET_SERIALIZED_RESULT,
				data: {
					errorMap: result.report.errorMap,
					hasErrors: true,
				},
			};
			dispatch(action);
			return;
		}

		const { noErrorOccurred } = PreventLineBreakRuleValidator.validate(
			typesettingModel.content.preventLineBreakRules
		);

		if (!noErrorOccurred) {
			return;
		}

		onSave(result.result as Model);
	};

	const annotations = typesettingModel?.header?.annotations || [];
	const preventLineBreakRules = typesettingModel?.content.preventLineBreakRules || [];
	const orphan = typesettingModel?.content.orphan;
	const widow = typesettingModel?.content.widow;

	const { errorMap } = serializeReport || deserializeReport || {};

	const disableSave = deserializeReport?.hasErrors || serializeReport?.hasErrors || customValidation?.hasErrors;

	const handleOnChange = useCallback(
		(model: TypesettingModel) => {
			if (onChange) {
				const result = typesettingModelMarshaller.serialize(model);
				result.result && isModelInstance(result.result) && onChange(result.result);
			}
		},
		[onChange]
	);

	const dispatchWithMiddleware = useCallback(
		(action: Action<unknown>) => {
			if (isEditAction(action)) {
				action.onChange = handleOnChange;
			}
			dispatch(action);
		},
		[handleOnChange]
	);

	const context = useMemo(() => {
		return { customValidation, dispatch: dispatchWithMiddleware };
	}, [customValidation, dispatchWithMiddleware]);

	return (
		<TypesettingEditorContext value={context}>
			<ActionContentbox
				footer={
					<TypesettingModelFooter
						onClickSave={onClickSave}
						footerSlots={footerSlots}
						disableSave={disableSave}
					/>
				}
				notificationArea={
					deserializeReport?.hasErrors && deserializeReport?.errorMap ? (
						<ErrorNotification errorMap={deserializeReport?.errorMap} />
					) : undefined
				}
				headingElements={
					<ContentBoxElements.Title
						ariaLevel={1}
						text={
							<>
								<img src={modelIconPath} alt="" style={{ marginRight: "8px" }} />
								{localizer(RESOURCE_KEYS.editorTitle)}
							</>
						}
					/>
				}
			>
				<section>
					<Typography.Headline level={2}>
						{localizer(RESOURCE_KEYS.preventLineBreakRules.header.section)}
					</Typography.Headline>
					<PreventLineBreakRuleEditor rules={preventLineBreakRules} />
				</section>
				<section>
					<Typography.Headline level={2}>
						{localizer(RESOURCE_KEYS.orphansWidowsSettings.header)}
					</Typography.Headline>
					<OrphanWidowSettings orphan={orphan} widow={widow} errorMap={errorMap} />
				</section>
				<section>
					<Typography.Headline level={2}>
						{localizer(RESOURCE_KEYS.roleSettings.header.section)}
					</Typography.Headline>
					<RolesTable annotations={annotations} errorMap={errorMap} availableRoles={availableRoles} />
				</section>
			</ActionContentbox>
		</TypesettingEditorContext>
	);
};
