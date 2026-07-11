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

import { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";
import { ListingRegion, TableRegion, TextRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { PrintEngineSelectors } from "../../store/selectors.js";
import {
	EditorMode,
	isPageBreakConfigFormState,
	isVisibilityConfigFormState,
	NavigationSelectors,
} from "../../redux/index.js";
import { RESOURCE_KEYS, PrintLocalizer } from "../../localization/index.js";
import { ValidationSelectors } from "../../redux//validation/selectors.js";
import type { PrintEngineState } from "../../../a12internal/api/index.js";

import { BarChartFormContainer } from "./BarChartFormContainer.js";
import { ExpressionFormContainer } from "./ExpressionFormContainer.js";
import { StyledOuterContainer } from "./FormContainer.styled.js";
import { LineChartFormContainer } from "./LineChartFormContainer.js";
import { LineFormContainer } from "./LineFormContainer.js";
import { PieChartFormContainer } from "./PieChartFormContainer.js";
import { FormHeader } from "./shared-components/index.js";
import { TextFormContainer } from "./TextFormContainer.js";
import { ImageFormContainer } from "./image-form-container/index.js";
import { TableFormContainer } from "./table-form-container/index.js";
import { TableLayoutFormContainer } from "./TableLayoutFormContainer.js";
import { ListingFormContainer } from "./listing-form-container/index.js";
import { BoundingBoxFormContainer } from "./BoundingBoxFormContainer.js";
import { OverrideFormContainer } from "./OverrideFormContainer.js";
import { HideConditionsConfig } from "./hide-conditions-form/HideConditionsConfig.js";
import { AreaFormContainer } from "./AreaFormContainer.js";
import { SwitchFormContainer } from "./SwitchFormContainer.js";
import { LayoutConfigForm } from "./layout-config-form/LayoutConfigForm.js";

const FormContainerProvider: Record<ElementType | string, React.ComponentType> = {
	[ElementType.Text]: TextFormContainer,
	[ElementType.Line]: LineFormContainer,
	[ElementType.Expression]: ExpressionFormContainer,
	[ElementType.Image]: ImageFormContainer,
	[ElementType.PieChart]: PieChartFormContainer,
	[ElementType.LineChart]: LineChartFormContainer,
	[ElementType.BarChart]: BarChartFormContainer,
	[ElementType.Table]: TableFormContainer,
	[ElementType.TableLayout]: TableLayoutFormContainer,
	[ElementType.Listing]: ListingFormContainer,
	[ElementType.BoundingBox]: BoundingBoxFormContainer,
	[ElementType.Override]: OverrideFormContainer,
	[ElementType.Area]: AreaFormContainer,
	[ElementType.Switch]: SwitchFormContainer,
};

const DefaultModeElementForm = () => {
	const element = useSelector(PrintEngineSelectors.rootFormElement);
	const currentForm = useSelector(NavigationSelectors.currentForm);
	const formValidationCounter = useSelector(ValidationSelectors.formHeaderValidationCounter);

	const localizer = PrintLocalizer.useLocalizer();

	const elementType = element?.type;

	const elementName = React.useMemo(() => {
		switch (currentForm?.type) {
			case ListingRegion.LISTING_COLUMN_FORM:
				return localizer(RESOURCE_KEYS.elementForm.listing.columns.title);
			case ListingRegion.FIELD_COMPUTATION_FORM:
				return localizer(RESOURCE_KEYS.elementForm.listing.fieldComputations.title);
			case TableRegion.TABLE_COLUMN_FORM:
				return localizer(RESOURCE_KEYS.elementForm.table.column.title);
			case TextRegion.TEXT_FROM_CALCULATION:
				return localizer(RESOURCE_KEYS.editor.element.Calculation);
			case TextRegion.TEXT_FROM_FIELD:
				return localizer(RESOURCE_KEYS.editor.element.Field);
			default:
				return elementType ? localizer(RESOURCE_KEYS.editor.element[elementType]) : null;
		}
	}, [currentForm, localizer, elementType]);

	const FormComponentToRender = elementType ? FormContainerProvider[elementType] : Placeholder;

	const headline = `${localizer(RESOURCE_KEYS.elementForm.headline)} - ${elementName}`;

	return (
		<StyledOuterContainer data-testid="detail-form-container">
			<FormHeader headline={headline} validationCounter={formValidationCounter} />
			<FormComponentToRender />
		</StyledOuterContainer>
	);
};

const DefaultModeForm = () => {
	const currentForm = useSelector(NavigationSelectors.currentForm);
	const formValidationCounter = useSelector(ValidationSelectors.formHeaderValidationCounter);
	const localizer = PrintLocalizer.useLocalizer();

	if (!currentForm) {
		return null;
	}

	if (isVisibilityConfigFormState(currentForm)) {
		return (
			<StyledOuterContainer data-testid="detail-form-container">
				<FormHeader
					headline={localizer(RESOURCE_KEYS.elementForm.hideConditions.headline)}
					validationCounter={formValidationCounter}
				/>
				<HideConditionsConfig />
			</StyledOuterContainer>
		);
	}

	return <DefaultModeElementForm />;
};

const LayoutModeForm = () => {
	const currentForm = useSelector(NavigationSelectors.currentReferenceForm);

	const referenceValidationCounter = useSelector((state: PrintEngineState) =>
		ValidationSelectors.placeableRefLayoutCounter(state, currentForm?.referenceId || "")
	);

	const localizer = PrintLocalizer.useLocalizer();

	if (currentForm && isPageBreakConfigFormState(currentForm)) {
		return (
			<StyledOuterContainer data-testid="detail-form-container">
				<FormHeader
					headline={localizer(RESOURCE_KEYS.elementForm.layoutConfig.headline)}
					validationCounter={referenceValidationCounter}
				/>
				<LayoutConfigForm />
			</StyledOuterContainer>
		);
	}

	return (
		<StyledOuterContainer data-testid="detail-form-container">
			<Placeholder />
		</StyledOuterContainer>
	);
};

export const FormContainer = () => {
	const editorMode = useSelector(NavigationSelectors.currentMode);

	if (editorMode === EditorMode.Default) {
		return <DefaultModeForm />;
	}

	if (editorMode === EditorMode.Layout) {
		return <LayoutModeForm />;
	}

	return null;
};

const Placeholder = () => {
	return <div>{`No specific form container could be found`}</div>;
};
