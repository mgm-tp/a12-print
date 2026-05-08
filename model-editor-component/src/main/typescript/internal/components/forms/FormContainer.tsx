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

import { ElementType } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import {
	GlobalRegion,
	ListingRegion,
	TableRegion,
	TextRegion,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/interaction-log.js";

import { PrintEngineSelectors } from "../../store/selectors.js";
import { EditorMode } from "../../redux/index.js";
import { PrintLocalizer } from "../../localization/localizer.js";
import { RESOURCE_KEYS } from "../../localization/keys.js";
import { ValidationSelectors } from "../../redux/validation/selectors.js";
import { PrintEngineState } from "../../store/root-reducer.js";

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
import { ListingViews } from "./listing-form-container/constants/form.js";
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

const DefaultModeForm = () => {
	const element = useSelector(PrintEngineSelectors.detailPrintModelElement);
	const { isVisibilityConfig } = useSelector(PrintEngineSelectors.hideConditionsFormData);
	const detailData = useSelector(PrintEngineSelectors.currentDetailData);
	const formValidationCounter = useSelector(ValidationSelectors.formHeaderValidationCounter);

	const localizer = PrintLocalizer.useLocalizer();

	const type = element?.type;

	const elementName = React.useMemo(() => {
		const currentForm = detailData?.formContainers?.slice().pop();
		if (!type) {
			return "Error";
		}

		switch (currentForm) {
			case ListingRegion.LISTING_COLUMN_FORM:
			case ListingRegion.FIELD_COMPUTATION_FORM:
				return localizer(ListingViews.titleMapping[currentForm]);
			case TableRegion.TABLE_COLUMN_FORM:
				return localizer(RESOURCE_KEYS.elementForm.table.column.title);
			case GlobalRegion.FORM:
			case TextRegion.TEXT_FROM_CALCULATION:
			case TextRegion.TEXT_FROM_FIELD:
				return localizer(RESOURCE_KEYS.editor.element[type]);
			default:
				return "Form not found";
		}
	}, [detailData?.formContainers, localizer, type]);

	if (isVisibilityConfig) {
		return (
			<StyledOuterContainer>
				<FormHeader
					headline={localizer(RESOURCE_KEYS.elementForm.hideConditions.headline)}
					validationCounter={formValidationCounter}
				/>
				<HideConditionsConfig />
			</StyledOuterContainer>
		);
	}

	const FormComponentToRender = type ? FormContainerProvider[type] : Placeholder;

	const headline = `${localizer(RESOURCE_KEYS.elementForm.headline)} - ${elementName}`;

	return (
		<StyledOuterContainer>
			<FormHeader headline={headline} validationCounter={formValidationCounter} />
			<FormComponentToRender />
		</StyledOuterContainer>
	);
};

const LayoutModeForm = () => {
	const { isPageBreakConfig } = useSelector(PrintEngineSelectors.pageBreakConfigFormData);
	const currentDetailData = useSelector(PrintEngineSelectors.currentDetailData);

	const referenceValidationCounter = useSelector((state: PrintEngineState) =>
		ValidationSelectors.placeableRefLayoutCounter(state, currentDetailData?.placeableRefId || "")
	);

	const localizer = PrintLocalizer.useLocalizer();

	if (isPageBreakConfig) {
		return (
			<StyledOuterContainer>
				<FormHeader
					headline={localizer(RESOURCE_KEYS.elementForm.layoutConfig.headline)}
					validationCounter={referenceValidationCounter}
				/>
				<LayoutConfigForm />
			</StyledOuterContainer>
		);
	}

	return (
		<StyledOuterContainer>
			<Placeholder />
		</StyledOuterContainer>
	);
};

export const FormContainer = () => {
	const editorMode = useSelector(PrintEngineSelectors.editorMode);

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
