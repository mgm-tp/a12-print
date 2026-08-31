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

import { Button, Icon } from "@com.mgmtp.a12.widgets/widgets-core";
import { EntityKey, getEntityId } from "@com.mgmtp.a12.print/print-model-api/model";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { CustomTextField } from "../../forms/custom-base-input-components/index.js";

import { StyledAnnotationAddContainer } from "./AnnotationCustomAdd.styled.js";
import type { AnnotationData } from "./annotation.js";

interface AnnotationCustomAddProps {
	data: AnnotationData[];
	setData: (data: AnnotationData[]) => void;
}

export const AnnotationCustomAdd = ({ data, setData }: AnnotationCustomAddProps) => {
	const localizer = PrintLocalizer.useLocalizer();

	const [name, setName] = React.useState("");
	const [errorMessage, setErrorMessage] = React.useState<string>("");

	const onNameChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setName(e.target.value);
	}, []);

	const validateName = React.useCallback(() => {
		const trimmedName = name.trim();
		if (!trimmedName) {
			setErrorMessage("");
			return;
		}
		if (data.find(el => el.name === "roles")) {
			setErrorMessage(RESOURCE_KEYS.sidebar.general.message.annotationNameProtected);
			return;
		}
		if (data.find(el => el.name === trimmedName)) {
			setErrorMessage(RESOURCE_KEYS.sidebar.general.message.annotationNameDuplicate);
			return;
		}
		setErrorMessage("");
	}, [data, name]);

	const onAddClick = React.useCallback(() => {
		const trimmedName = name.trim();
		setData([...data, { id: getEntityId(EntityKey.Annotations, trimmedName), name: trimmedName }]);
		setName("");
	}, [data, name, setData]);

	const isButtonDisabled = Boolean(errorMessage) || !name.trim();
	return (
		<StyledAnnotationAddContainer>
			<CustomTextField
				placeholder={`${localizer(RESOURCE_KEYS.sidebar.general.annotations.name)}...`}
				value={name}
				onChange={onNameChange}
				onBlur={validateName}
				fitToParent={true}
				errorMessage={errorMessage && localizer(errorMessage)}
				addonAfter={
					<Button
						title={localizer(RESOURCE_KEYS.button.add)}
						label={localizer(RESOURCE_KEYS.button.add)}
						icon={<Icon>add</Icon>}
						disabled={isButtonDisabled}
						onClick={onAddClick}
					/>
				}
			/>
		</StyledAnnotationAddContainer>
	);
};
