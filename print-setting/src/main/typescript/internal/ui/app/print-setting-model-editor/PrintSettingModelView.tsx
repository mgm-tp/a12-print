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
import get from "lodash/get.js";

import { Typography } from "@com.mgmtp.a12.widgets/widgets-core/lib/typography/index.js";
import { DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";
import { AnnotationEntity } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { RESOURCE_KEYS } from "../../localization/keys.js";
import { CustomFontTable, DefaultFontTable } from "../../component/font-setting-editor/index.js";
import { useLocalizer } from "../../localization/localizer.js";
import { FallbackSelect } from "../../component/font-setting-editor/FallbackSelect.js";
import { RolesTable } from "../../component/roles-editor/RolesTable.js";
import { Font, PrintSettingModel } from "../../../api/model/print-setting-model.js";

interface PrintSettingModelViewProps {
	printSetting?: PrintSettingModel;
	onChange: (printSetting: PrintSettingModel) => void;
	errorMap?: DeepPartialErrorMap<PrintSettingModel>;
	availableRoles?: string[];
}

export const PrintSettingModelView = ({
	printSetting,
	onChange,
	errorMap,
	availableRoles,
}: PrintSettingModelViewProps) => {
	const localizer = useLocalizer();

	const { fontErrors } = useMemo(() => {
		return {
			fontErrors: get(errorMap, "content.settings.fonts"),
		};
	}, [errorMap]);

	const defaultFonts = printSetting?.content?.defaults?.fonts || [];
	const customFonts = printSetting?.content?.settings?.fonts || [];
	const annotations = printSetting?.header?.annotations || [];

	const onFontSettingChange = (fonts: Font[]) => {
		if (printSetting) {
			onChange({
				...printSetting,
				content: { ...printSetting.content, settings: { ...printSetting.content?.settings, fonts } },
			});
		}
	};

	const onAnnotationsChange = (annotations: AnnotationEntity[]) => {
		if (printSetting?.header) {
			onChange({
				...printSetting,
				header: { ...printSetting.header, annotations },
			});
		}
	};

	const onFallbackFontChange = (fontName: string) => {
		if (printSetting) {
			onChange({
				...printSetting,
				content: {
					...printSetting.content,
					settings: {
						...printSetting.content?.settings,
						fonts: printSetting.content?.settings?.fonts?.map(font => ({
							...font,
							fallback: font.name === fontName || undefined,
						})),
					},
				},
			});
		}
	};

	return (
		<>
			<section>
				<Typography.Headline level={2}>
					{localizer(RESOURCE_KEYS.roleSettings.header.section)}
				</Typography.Headline>
				<RolesTable
					annotations={annotations}
					onChange={onAnnotationsChange}
					errorMap={errorMap}
					availableRoles={availableRoles}
				/>
			</section>
			<section>
				<Typography.Headline level={2}>
					{localizer(RESOURCE_KEYS.fontSettings.header.section)}
				</Typography.Headline>
				<CustomFontTable customFonts={customFonts} onChange={onFontSettingChange} errorMap={fontErrors} />
				<DefaultFontTable defaultFonts={defaultFonts} customFonts={customFonts} />
				<FallbackSelect customFonts={customFonts} defaultFonts={defaultFonts} onChange={onFallbackFontChange} />
			</section>
		</>
	);
};
