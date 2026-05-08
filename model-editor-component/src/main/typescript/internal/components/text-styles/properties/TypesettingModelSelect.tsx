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
import { useSelector } from "react-redux";
import { useMemo } from "react";

import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/index.js";
import { SelectItem } from "@com.mgmtp.a12.widgets/widgets-core/lib/input/select/index.js";
import { HintTooltip } from "@com.mgmtp.a12.widgets/widgets-core";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { CustomA12Select } from "../../forms/custom-base-input-components/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { useTypesettingModelData } from "../../../hooks/use-typesetting-model-data.js";

import { BaseTextStylePropertyProps } from "./base-type.js";

interface TypesettingModelSelectProps extends BaseTextStylePropertyProps {
	value?: string;
	onChange: (model: string) => void;
}

export const TypesettingModelSelect = ({
	value,
	onChange,
	isDefaultTextStyle,
	errorMessage,
}: TypesettingModelSelectProps) => {
	const localizer = PrintLocalizer.useLocalizer();
	const typesettingModelReferences = useSelector(PrintEngineSelectors.typesettingModelReferences);

	const typesettingModel = useTypesettingModelData(value);

	const referenceSelectItems: SelectItem[] = useMemo(() => {
		const items: SelectItem[] = [{ label: "", value: "", graphic: <Icon></Icon> }];
		return items.concat(
			typesettingModelReferences?.map(reference => ({
				label: reference.reference,
				value: reference.reference,
			}))
		);
	}, [typesettingModelReferences]);

	const typesettingNotLoadedMsg =
		value && !typesettingModel
			? localizer(RESOURCE_KEYS.textStyles.warningMessage.typesettingModeNotFound)
			: undefined;

	return (
		<CustomA12Select
			label={localizer(RESOURCE_KEYS.textStyles.properties.typesettingModel)}
			items={referenceSelectItems}
			value={value}
			onSelect={onChange}
			errorMessage={errorMessage}
			warningMessage={typesettingNotLoadedMsg}
			disabled={isDefaultTextStyle}
			tooltips={
				<HintTooltip text={localizer(RESOURCE_KEYS.textStyles.tooltips.legacyRenderingMode)} key="hint" />
			}
		/>
	);
};
