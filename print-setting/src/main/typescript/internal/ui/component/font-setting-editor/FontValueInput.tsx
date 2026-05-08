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
import { useCallback, useMemo, useState } from "react";
import { useTheme } from "styled-components";
import get from "lodash/get.js";

import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/index.js";
import { InputElements } from "@com.mgmtp.a12.widgets/widgets-core/lib/input/base/index.js";
import { addPrefix } from "@com.mgmtp.a12.widgets/widgets-core/lib/common/index.js";
import { DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";

import { useDefaultLocalizer, useLocalizer } from "../../localization/localizer.js";
import { RESOURCE_KEYS } from "../../localization/keys.js";
import { Font, FontAttachment, FontSettingType } from "../../../api/model/print-setting-model.js";

import { CustomUpload } from "../input/CustomUpload.js";
import { CustomInput } from "../input/CustomInput.js";

import { StyledQuickAccessButton } from "./FontValueInput.styled.js";

interface FontInputModeProps {
	font: Font;
	onChange: (value: Font) => void;
	errorMap?: DeepPartialErrorMap<Font>;
}

export const FontValueInput = ({ font, onChange, errorMap }: FontInputModeProps) => {
	const [mode, setMode] = useState<FontSettingType>(font.type || "path");
	const theme = useTheme();

	const errorLocalizer = useDefaultLocalizer();
	const localizer = useLocalizer();

	const onModeChange = useCallback(
		(newMode: FontSettingType) => {
			setMode(newMode);
			onChange({ ...font, fontAttachment: undefined, path: undefined, type: newMode });
		},
		[font, onChange]
	);

	const onAttachmentChange = useCallback(
		(newAttachment: FontAttachment) => {
			onChange({ ...font, type: mode, fontAttachment: newAttachment });
		},
		[font, mode, onChange]
	);

	const onPathChange = useCallback(
		(value: string) => {
			onChange({ ...font, type: mode, path: value });
		},
		[font, mode, onChange]
	);

	const error = mode === "path" ? errorMap?.path?.["@error"]?.[0] : errorMap?.fontAttachment?.["@error"]?.[0];
	const warning = mode === "path" ? errorMap?.path?.["@warning"]?.[0] : errorMap?.fontAttachment?.["@warning"]?.[0];

	const actionItems = useMemo(() => {
		const items: FontSettingType[] = ["path", "attachment"];
		return items.map(item => {
			return {
				text: localizer(RESOURCE_KEYS.fontSettings.type[item]),
				meta: mode === item ? <Icon>check</Icon> : undefined,
				onClick: () => onModeChange(item),
				style: mode === item ? { backgroundColor: get(theme, "colors.interaction.selected.colorLight") } : {},
			};
		});
	}, [localizer, mode, onModeChange, theme]);

	const mainAction = useMemo(() => {
		if (mode === "path") {
			return (
				<CustomInput hasError={!!error} hasWarning={!!warning} initialValue={font.path} onBlur={onPathChange} />
			);
		}

		return <CustomUpload attachment={font.fontAttachment} onChange={onAttachmentChange} />;
	}, [mode, error, warning, font.fontAttachment, font.path, onAttachmentChange, onPathChange]);

	return (
		<>
			{error && (
				<InputElements.Error
					className={addPrefix("-u-width-full")}
					errorMessage={errorLocalizer(...error.errorMessage)}
				/>
			)}
			{warning && (
				<InputElements.Warning
					className={addPrefix("-u-width-full")}
					warningMessage={errorLocalizer(...warning.errorMessage)}
				/>
			)}
			<StyledQuickAccessButton
				primary
				mainAction={mainAction}
				className={addPrefix("-u-width-full")}
				actionItems={actionItems}
			/>
		</>
	);
};
