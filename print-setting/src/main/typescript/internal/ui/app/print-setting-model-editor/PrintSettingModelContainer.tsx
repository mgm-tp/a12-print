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
import { useEffect, useReducer } from "react";

import { ActionContentbox, ContentBoxElements } from "@com.mgmtp.a12.widgets/widgets-core/lib/contentbox/index.js";
import { Locale } from "@com.mgmtp.a12.utils/utils-localization/lib/main/index.js";
import { isModelInstance, Model } from "@com.mgmtp.a12.base/base-model-api/lib/main/model/index.js";

import { useLocalizer } from "../../localization/localizer.js";
import { RESOURCE_KEYS } from "../../localization/keys.js";
import { ErrorNotification } from "../../component/validation/ErrorNotification.js";
import { PrintSettingModelMarshaller } from "../../../api/marshaller/print-setting-marshaller.js";
import { validateAllFontPaths } from "../../utils/font-path.js";
import { PrintSettingModel } from "../../../api/model/print-setting-model.js";

import {
	Action,
	SET_FONT_PATH_ERRORS,
	SET_PRINT_SETTING_MODEL,
	SetFontPathErrorsPayload,
	SetPrintSettingModelPayload,
} from "./store/action.js";
import { createInitialPrintSettingState, reducer } from "./store/reducer.js";
import { PrintSettingModelFooter } from "./PrintSettingModelFooter.js";
import { FooterSlots } from "./types.js";
import { PrintSettingModelView } from "./PrintSettingModelView.js";

const printSettingModelMarshaller = new PrintSettingModelMarshaller();

type ValidateFontPathFunction = (path: string) => Promise<boolean>;

export interface PrintSettingModelContentProps {
	locale: Locale;
	footerSlots?: FooterSlots;
	model?: Model;
	modelIconPath?: string;
	onSave?: (model: Model) => void;
	onChange?: (model: Model) => void;
	validateFontPath?: ValidateFontPathFunction;
	availableRoles?: string[];
}

export const PrintSettingModelContainer = ({
	model,
	modelIconPath,
	locale,
	footerSlots,
	onSave,
	onChange,
	validateFontPath,
	availableRoles,
}: PrintSettingModelContentProps) => {
	const [state, dispatch] = useReducer(reducer, { model, locale }, createInitialPrintSettingState);
	const { model: printSettingModel, deserializeReport, serializeReport } = state;
	const localizer = useLocalizer();

	const isDisableSubmit = deserializeReport?.hasErrors || serializeReport?.hasErrors;

	const onClickSave = () => {
		if (!printSettingModel) {
			return;
		}
		const result = printSettingModelMarshaller.serialize(printSettingModel, []);
		onSave && result.result && isModelInstance(result.result) && onSave(result.result);
	};

	const onPrintSettingModelChange = (model: PrintSettingModel) => {
		const action: Action<SetPrintSettingModelPayload> = {
			type: SET_PRINT_SETTING_MODEL,
			data: model,
		};
		dispatch(action);

		if (onChange) {
			const result = printSettingModelMarshaller.serialize(model, []);
			result.result && isModelInstance(result.result) && onChange(result.result);
		}
	};

	useEffect(() => {
		const executeFontPathValidation = async (
			model: PrintSettingModel,
			validateFontPath: ValidateFontPathFunction
		) => {
			const fontPathErrors = await validateAllFontPaths(model, validateFontPath);
			const action: Action<SetFontPathErrorsPayload> = {
				type: SET_FONT_PATH_ERRORS,
				errors: fontPathErrors,
			};
			dispatch(action);
		};
		if (printSettingModel && validateFontPath) {
			executeFontPathValidation(printSettingModel, validateFontPath);
		}
	}, [printSettingModel, validateFontPath]);

	const { errorMap } = serializeReport || deserializeReport || {};

	return (
		<ActionContentbox
			footer={
				<PrintSettingModelFooter
					onClickSave={onClickSave}
					footerSlots={footerSlots}
					disableSave={isDisableSubmit}
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
			<PrintSettingModelView
				printSetting={printSettingModel}
				onChange={onPrintSettingModelChange}
				errorMap={errorMap}
				availableRoles={availableRoles}
			/>
		</ActionContentbox>
	);
};
