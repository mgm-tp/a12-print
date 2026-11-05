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

import { ActionContentbox } from "@com.mgmtp.a12.widgets/widgets-core";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";

import { StyledOuterContainer } from "../FormContainer.styled.js";
import { FormHeader } from "../shared-components/index.js";

import { ElementLibrary } from "./ElementLibrary.js";

export const ElementLibraryFormContainer = () => {
	const localizer = PrintLocalizer.useLocalizer();
	const selectableFragmentElements = useSelector(PrintEngineSelectors.selectableFragmentElements);
	const dinTemplateWarning = useDinTemplateWarning();

	return (
		<StyledOuterContainer data-testid="element-library-form">
			<FormHeader
				headline={localizer(RESOURCE_KEYS.elementForm.elementLibrary.headline)}
				warning={dinTemplateWarning}
			/>
			<ActionContentbox padding={false}>
				<ElementLibrary />
				{selectableFragmentElements.length > 0 && <ElementLibrary isFragmentLibrary />}
			</ActionContentbox>
		</StyledOuterContainer>
	);
};

const useDinTemplateWarning = (): string | undefined => {
	const localizer = PrintLocalizer.useLocalizer();

	const isIncomingDinTemplatePrintModel = useSelector(PrintEngineSelectors.isIncomingDinTemplatePrintModel);
	const isDinTemplateSegmentEditor = useSelector(PrintEngineSelectors.isDinTemplateSegmentEditor);
	const isDinEditable = useSelector(PrintEngineSelectors.isDinEditable);

	if (isIncomingDinTemplatePrintModel) {
		return localizer(RESOURCE_KEYS.elementForm.elementLibrary.incomingDinTemplate);
	}
	if (isDinTemplateSegmentEditor && !isDinEditable) {
		return localizer(RESOURCE_KEYS.elementForm.elementLibrary.dinTemplateSegmentEditor);
	}
	return undefined;
};
