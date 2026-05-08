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
import { useSelector } from "react-redux";
import { styled } from "styled-components";
import sortBy from "lodash/sortBy.js";

import { SelectItem, SelectProps } from "@com.mgmtp.a12.widgets/widgets-core/lib/input/select/index.js";
import { Button, Icon } from "@com.mgmtp.a12.widgets/widgets-core";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";

import { CustomSelect } from "../custom-base-input-components/index.js";

interface DocumentModelSelectProps extends Omit<SelectProps, "items"> {
	value?: string;
	onValueChanged: (value?: string) => void;
	onDelete?: () => void;
}

export const DocumentModelSelect = ({ value, onValueChanged, onDelete, ...restProps }: DocumentModelSelectProps) => {
	const localizer = PrintLocalizer.useLocalizer();
	const modelReferences = useSelector(PrintEngineSelectors.documentModelReferences);
	const wrappers = useSelector(PrintEngineSelectors.wrappers);
	const repeatableDataContext = React.useMemo(() => {
		let nearestDataContext;
		for (let i = wrappers.length - 1; i >= 0; i--) {
			const nearestRepeatable = wrappers[i].dataContexts?.find(dataContext => dataContext.isRepetition);
			if (nearestRepeatable) {
				nearestDataContext = nearestRepeatable;
				break;
			}
		}
		return nearestDataContext;
	}, [wrappers]);

	const repeatableDataContextModel = repeatableDataContext?.model;
	const modelReferenceOptions: SelectItem[] = React.useMemo(() => {
		return sortBy(
			modelReferences.map(reference => ({
				value: reference.reference,
				label: reference.alias || reference.reference,
				disabled: Boolean(repeatableDataContextModel && repeatableDataContextModel !== reference.reference),
			})),
			"label"
		);
	}, [modelReferences, repeatableDataContextModel]);

	return (
		<StyledDocumentModelSelectWrapper>
			<CustomSelect
				placeholder={localizer(RESOURCE_KEYS.input.selectPlaceholder)}
				value={value}
				onValueChanged={onValueChanged}
				label={localizer(RESOURCE_KEYS.elementForm.model.documentModel)}
				items={modelReferenceOptions}
				fitToParent={true}
				{...restProps}
			/>
			{onDelete && value && (
				<Button
					destructive
					icon={<Icon>delete</Icon>}
					title={localizer(RESOURCE_KEYS.elementForm.model.deleteDocumentModelButton)}
					onClick={() => onDelete()}
				/>
			)}
		</StyledDocumentModelSelectWrapper>
	);
};

const StyledDocumentModelSelectWrapper = styled.div`
	display: flex;
	align-items: flex-end;
	gap: 2px;
`;
