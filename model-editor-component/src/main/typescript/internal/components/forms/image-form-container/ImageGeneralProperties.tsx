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

import { TextAffix } from "@com.mgmtp.a12.widgets/widgets-core";
import {
	ImageSrcType,
	MeasureUnit,
	type ImageDimensions,
	type ImageProperties,
	type Measure,
	type PartialImage,
	type PrintModelEntity,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";
import type { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/utils";
import { GlobalRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import type { UpdateElementsTransactionLogAction } from "../../../redux/index.js";
import { TransactionLogStateActions } from "../../../redux/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { InteractionLogActions } from "../../../redux/interaction-log/index.js";
import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";
import { ValidationSelectors } from "../../../redux/validation/selectors.js";
import { changePartialMmMeasureValue, DEFAULT_ELEMENT_WIDTH, DEFAULT_IMAGE_HEIGHT } from "../../../utils/index.js";
import { PositiveNumberInput } from "../../custom-input/PositiveNumberInput.js";

import { DynamicSourceTextField } from "../custom-base-input-components/index.js";
import type { ElementWithoutIdAndType } from "../type.js";

import { ImageFlexContainer } from "./ImageFormContainer.styled.js";

interface ImageGeneralPropertiesProps {
	element: PartialImage;
}

export const ImageGeneralProperties = ({ element }: ImageGeneralPropertiesProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const elementReferences = useSelector(PrintEngineSelectors.elementReferences);
	const image = element.image;

	const onBlurAltText = React.useCallback(
		(event: React.FocusEvent<HTMLInputElement>) => {
			const updatedElement: PartialImage = {
				...element,
				image: { id: nanoid(), ...image, alternativeText: event.target.value },
			};
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.imageFormContainer.generalProperties.changeAltText,
					region: GlobalRegion.FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		},
		[dispatch, element, image]
	);

	const formatOnChange = React.useCallback((newValue: string, oldValue?: string) => {
		if (!Number.isSafeInteger(Number(newValue))) {
			return oldValue;
		}
		return newValue;
	}, []);

	const onDimensionsBlur = React.useCallback(
		(key: "height" | "width", eventValue: string) => {
			const baseDimensions = {
				id: nanoid(),
				...image?.dimensions,
				[key]: Number(eventValue)
					? changePartialMmMeasureValue(Number(eventValue), image?.dimensions?.[key])
					: undefined,
			} as ImageDimensions;

			const shouldScaleToAspectRatio =
				image?.imageSrcType === ImageSrcType.Static && !baseDimensions?.height?.value;
			const scaledDimensions = shouldScaleToAspectRatio
				? scaleDimensionsToOriginalAspectRatio(baseDimensions)
				: baseDimensions;

			const updatedElement: PartialImage = {
				...element,
				image: {
					id: nanoid(),
					...image,
					dimensions: baseDimensions,
				},
			};
			const actions: UpdateElementsTransactionLogAction[] = [
				TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
			];
			const newMeasure =
				key === "height"
					? createNewMeasureForReferenceElement(key, scaledDimensions?.height, element)
					: createNewMeasureForReferenceElement(key, scaledDimensions?.width, element);
			// container elements have different dimension properties than images so the key must be adapted when updating the references
			const refKey = key === "height" ? "minHeight" : "minWidth";
			if (elementReferences) {
				actions.push(
					TransactionLogStateActions.updateReferenceElements({
						data: elementReferences.map(el => {
							if (el.refId === element.id) {
								return {
									...el,
									dimensions: {
										...el.dimensions,
										[refKey]: newMeasure,
										...(shouldScaleToAspectRatio && {
											minHeight: createNewMeasureForReferenceElement(
												"height",
												scaledDimensions?.height,
												element
											),
										}),
									},
								};
							}

							return el;
						}),
					})
				);
			}
			const interactionDescription =
				key === "height"
					? RESOURCE_KEYS.interaction.form.imageFormContainer.generalProperties.changeHeight
					: RESOURCE_KEYS.interaction.form.imageFormContainer.generalProperties.changeWidth;
			dispatch(
				InteractionLogActions.start({
					description: interactionDescription,
					region: GlobalRegion.FORM,
					transactionLogActions: actions,
				})
			);
		},
		[dispatch, element, elementReferences, image]
	);

	const getDimensionError = useImageDimensionsPropertyErrorMessage(element.id);

	return (
		<>
			<DynamicSourceTextField
				inputProps={{ "data-testid": "image-alt-text" } as React.HTMLProps<HTMLInputElement>}
				value={image?.alternativeText}
				onBlur={onBlurAltText}
				label={localizer(RESOURCE_KEYS.elementForm.image.alt)}
				errorMessage={useImagePropertiesPropertyErrorMessage(element.id)("alternativeText")}
			/>
			<ImageFlexContainer>
				<PositiveNumberInput
					inputProps={
						{
							step: 1,
							"data-testid": "image-height-input",
						} as React.HTMLProps<HTMLInputElement>
					}
					label={localizer(RESOURCE_KEYS.elementForm.image.height)}
					value={String(image?.dimensions?.height?.value || "")}
					onBlur={e => onDimensionsBlur("height", e.target.value)}
					formatOnChange={formatOnChange}
					suffixes={<TextAffix id={"height-suffix"}>mm</TextAffix>}
					ariaDescribedby={"height-suffix"}
					errorMessage={getDimensionError("height")}
				/>
				<PositiveNumberInput
					inputProps={
						{
							step: 1,
							"data-testid": "image-width-input",
						} as React.HTMLProps<HTMLInputElement>
					}
					label={localizer(RESOURCE_KEYS.elementForm.image.width)}
					value={String(image?.dimensions?.width?.value || "")}
					onBlur={e => onDimensionsBlur("width", e.target.value)}
					formatOnChange={formatOnChange}
					suffixes={<TextAffix id={"width-suffix"}>mm</TextAffix>}
					ariaDescribedby={"width-suffix"}
					errorMessage={getDimensionError("width")}
				/>
			</ImageFlexContainer>
		</>
	);
};

export function useImagePropertiesPropertyErrorMessage<T extends keyof ElementWithoutIdAndType<ImageProperties>>(
	id = ""
) {
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const error = useSelector((state: PrintEngineState) => ValidationSelectors.image(state, id));

	return (property: T) => (error ? errorMessageLocalizer(error.image?.[property]?.[ErrorSeverity.ERROR]) : undefined);
}

function useImageDimensionsPropertyErrorMessage<T extends keyof ElementWithoutIdAndType<ImageDimensions>>(id = "") {
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const error = useSelector((state: PrintEngineState) => ValidationSelectors.image(state, id));

	return (property: T) =>
		error ? errorMessageLocalizer(error.image?.dimensions?.[property]?.[ErrorSeverity.ERROR]) : undefined;
}

function scaleDimensionsToOriginalAspectRatio(imageDimensions: ImageDimensions): ImageDimensions {
	const originalWidth = imageDimensions.originalWidth;
	const originalHeight = imageDimensions.originalHeight;
	const originalAspectRatio =
		originalWidth?.value && originalHeight?.value ? originalWidth.value / originalHeight.value : undefined;
	if (!originalAspectRatio) {
		return imageDimensions;
	}
	const newWidth = imageDimensions.width?.value ?? originalWidth?.value ?? 0;
	return {
		...imageDimensions,
		width: {
			...imageDimensions.width,
			id: imageDimensions.width?.id ?? nanoid(),
			unit: imageDimensions.width?.unit ?? MeasureUnit.Millimeter,
			value: newWidth,
		},
		height: {
			...imageDimensions.height,
			id: imageDimensions.height?.id ?? nanoid(),
			unit: imageDimensions.height?.unit ?? MeasureUnit.Millimeter,
			value: Math.round(newWidth / originalAspectRatio),
		},
	};
}

function createNewMeasureForReferenceElement(
	key: "height" | "width",
	imageMeasure: (DeepPartialRecursive<Measure> & PrintModelEntity) | undefined,
	imageElement: PartialImage
) {
	const originalMeasure =
		key === "height"
			? imageElement.image?.dimensions?.originalHeight
			: imageElement.image?.dimensions?.originalWidth;
	return {
		id: imageMeasure?.id ?? nanoid(),
		value:
			imageMeasure?.value ??
			originalMeasure?.value ??
			(key === "height" ? DEFAULT_IMAGE_HEIGHT : DEFAULT_ELEMENT_WIDTH),
		unit: imageMeasure?.unit ?? originalMeasure?.unit ?? MeasureUnit.Millimeter,
	};
}
