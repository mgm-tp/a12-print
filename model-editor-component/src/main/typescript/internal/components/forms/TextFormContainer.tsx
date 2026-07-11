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
import { useDispatch, useSelector } from "react-redux";
import { nanoid } from "nanoid";
import { useMemo } from "react";

import type {
	PartialAnyPrintModelElement,
	Text,
	PartialTextProperties,
	PartialBorderProperties,
} from "@com.mgmtp.a12.print/print-model-api/model";
import {
	PartialTableLayout,
	PartialCalculation,
	PartialField,
	PartialText,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { GlobalRegion, TextRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";

import { PrintEngineSelectors } from "../../store/selectors.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { NavigationActions, TransactionLogStateActions } from "../../redux/index.js";
import { InteractionLogActions } from "../../redux//interaction-log/index.js";
import { NavigationSelectors } from "../../redux/navigation/selectors.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import { ValidationSelectors } from "../../redux//validation/selectors.js";
import { createBorderPropertiesInheritedResolver, type OmitId } from "../../utils/index.js";
import { useBorderPropertiesErrorMessage } from "../../utils/index.js";
import { hasAnyTextProperties, isStyleable } from "../../utils/text-properties-utils.js";
import { BORDER_PROPERTIES_PATH } from "../../constant/element-property-path.js";

import { PrintRichTextEditor } from "../richtext-editor/index.js";

import {
	FieldForm,
	TextPropertiesForm,
	BorderPropertiesForm,
	CalculationForm,
	ClearTextPropertiesSection,
	BackButtonGroup,
	CompactErrorWrapper,
} from "./shared-components/index.js";
import { CustomCheckbox } from "./custom-base-input-components/index.js";
import type { ElementWithoutIdAndType } from "./type.js";

export const TextFormContainer = () => {
	const dispatch = useDispatch();
	const localize = PrintLocalizer.useLocalizer();
	const element = useSelector(PrintEngineSelectors.rootFormElement);
	const entityElement = useSelector(PrintEngineSelectors.currentSubFormElement);
	const allPrintModelElements = useSelector(PrintEngineSelectors.printModelElements);
	const parentElement = React.useMemo(
		() =>
			element &&
			allPrintModelElements?.find(
				el => PartialTableLayout.isInstance(el) && el.tableLayout?.cells?.some(c => c?.refId === element.id)
			),
		[allPrintModelElements, element]
	);
	const getErrorMessage = useTextPropertyErrorMessage(element?.id);
	const textPropertiesErrors = useSelector(
		(state: PrintEngineState) => ValidationSelectors.styleableElement(state, element?.id)?.textProperties
	);

	if (!element || !PartialText.isInstance(element)) {
		throw Error("Expected element of type Text");
	}

	const { tab, entityId: navEntityId, mode } = useSelector(NavigationSelectors.currentCanvasStageContext);

	const text = element.text;

	const { isBorderPropertiesInherited, inheritedWidthResolver, inheritedStyleResolver, inheritedColorResolver } =
		React.useMemo(() => {
			if (!parentElement || !PartialTableLayout.isInstance(parentElement)) {
				return {
					isBorderPropertiesInherited: false,
					inheritedWidthResolver: () => undefined,
					inheritedStyleResolver: () => undefined,
					inheritedColorResolver: () => undefined,
				};
			}
			return {
				isBorderPropertiesInherited: true,
				...createBorderPropertiesInheritedResolver((parentElement as PartialTableLayout).borderProperties),
			};
		}, [parentElement]);

	const onHideIfEmptyChange = React.useCallback(
		(checked: boolean) => {
			const updatedElement = { ...element, text: { id: nanoid(), ...text, hideIfEmpty: checked } };
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.textFormContainer.toggleHideIfEmpty,
					region: GlobalRegion.FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element, text]
	);

	const setBorderProperties = React.useCallback(
		(newProps: OmitId<PartialBorderProperties>) => {
			const updatedElement = {
				...element,
				borderProperties: { id: nanoid(), ...element.borderProperties, ...newProps },
			};
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.textFormContainer.changeBorderProperties,
					region: GlobalRegion.FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element]
	);

	const setTextProperties = React.useCallback(
		(newProps: OmitId<PartialTextProperties>) => {
			const updatedElement = {
				...element,
				textProperties: { id: nanoid(), ...element.textProperties, ...newProps },
			};
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.textFormContainer.changeTextProperties,
					region: GlobalRegion.FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element]
	);

	const onChangeEntity = React.useCallback(
		(entity?: PartialAnyPrintModelElement) => {
			if (!entity) {
				return;
			}
			const formType = PartialCalculation.isInstance(entity)
				? TextRegion.TEXT_FROM_CALCULATION
				: TextRegion.TEXT_FROM_FIELD;

			dispatch(
				NavigationActions.replaceOrAddFormByType({
					tab,
					entityId: navEntityId,
					mode,
					form: { type: formType, id: entity.id },
				})
			);
		},
		[dispatch, mode, tab, navEntityId]
	);

	const checked = Boolean(element.text?.hideIfEmpty);
	const borderPropertiesErrorMessage = useBorderPropertiesErrorMessage(element.id);

	const TextForm = useMemo(() => {
		if (entityElement && (PartialCalculation.isInstance(entityElement) || PartialField.isInstance(entityElement))) {
			return <EntityForm entityElement={entityElement} />;
		}

		return (
			<>
				<CustomCheckbox
					checked={checked}
					onChange={onHideIfEmptyChange}
					label={localize(RESOURCE_KEYS.elementForm.textFlow.hideIfEmpty)}
					fitToParent={false}
				/>
				<TextPropertiesForm
					element={element}
					textProperties={element.textProperties}
					setTextProperties={setTextProperties}
					showBackgroundColor={false}
					showBold={false}
					showColor={false}
					showItalic={false}
					showUnderline={false}
					textPropertyErrors={textPropertiesErrors}
				/>
				<BorderPropertiesForm
					element={element}
					determineInheritedSource={() => isBorderPropertiesInherited}
					propertiesPath={BORDER_PROPERTIES_PATH}
					borderProperties={element.borderProperties}
					setBorderProperties={setBorderProperties}
					getErrorMessage={borderPropertiesErrorMessage}
					resolveWidth={inheritedWidthResolver}
					resolveStyle={inheritedStyleResolver}
					resolveColor={inheritedColorResolver}
				/>
			</>
		);
	}, [
		entityElement,
		checked,
		onHideIfEmptyChange,
		localize,
		element,
		setTextProperties,
		textPropertiesErrors,
		setBorderProperties,
		borderPropertiesErrorMessage,
		inheritedWidthResolver,
		inheritedStyleResolver,
		inheritedColorResolver,
		isBorderPropertiesInherited,
	]);

	return (
		<>
			<CompactErrorWrapper
				errorMessage={getErrorMessage("text")}
				Child={PrintRichTextEditor}
				childProps={{ element, onChangeEntity }}
				childKey={element.id}
			/>
			{TextForm}
		</>
	);
};

interface EntityFormProps {
	entityElement: PartialAnyPrintModelElement;
}

const EntityForm = ({ entityElement }: EntityFormProps) => {
	const dispatch = useDispatch();
	const { tab, entityId, mode } = useSelector(NavigationSelectors.currentCanvasStageContext);

	const onBackClick = React.useCallback(() => {
		dispatch(NavigationActions.popFormStack({ tab, entityId, mode }));
	}, [dispatch, tab, entityId, mode]);

	const clearEntityTextProperties = React.useCallback(() => {
		const updatedElement = { ...entityElement, textProperties: undefined };
		dispatch(
			InteractionLogActions.start({
				description: RESOURCE_KEYS.interaction.form.textFormContainer.clearCalculationTextProperties,
				region: GlobalRegion.FORM,
				transactionLogActions: [
					TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
				],
			})
		);
	}, [dispatch, entityElement]);

	const entityTextProperties = isStyleable(entityElement) ? entityElement.textProperties : undefined;

	const renderedEntityForm = React.useMemo(() => {
		if (PartialCalculation.isInstance(entityElement)) {
			return <CalculationForm element={entityElement} />;
		}
		if (PartialField.isInstance(entityElement)) {
			return <FieldForm element={entityElement} />;
		}
		return <div>{`Element of type ${entityElement.type} is not a valid entity`}</div>;
	}, [entityElement]);

	return (
		<>
			{renderedEntityForm}
			<ClearTextPropertiesSection
				hasLegacyProperties={hasAnyTextProperties(entityTextProperties)}
				onClear={clearEntityTextProperties}
			/>
			<BackButtonGroup onBack={onBackClick} className="-u-margin-t-md" />
		</>
	);
};

function useTextPropertyErrorMessage<T extends keyof ElementWithoutIdAndType<Text>>(id = "") {
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const error = useSelector((state: PrintEngineState) => ValidationSelectors.textElement(state, id));

	return (property: T) => (error ? errorMessageLocalizer(error[property]?.[ErrorSeverity.ERROR]) : undefined);
}
