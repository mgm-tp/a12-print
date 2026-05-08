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

import { TextAffix } from "@com.mgmtp.a12.widgets/widgets-core/lib/input/text-line/index.js";
import {
	Dimensions,
	ImageDimensions,
	ImageProperties,
	ImageSrcType,
	PartialImage,
	PrintModelEntity,
	PartialValidPlaceableReference,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";
import { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";
import { GlobalRegion } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { UpdateElementsTransactionLogAction, TransactionLogStateActions } from "../../../redux/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { InteractionLogActions } from "../../../redux/interaction-log/index.js";
import { PrintEngineState } from "../../../store/root-reducer.js";
import { ValidationSelectors } from "../../../redux/validation/selectors.js";
import { changePartialMmMeasureValue, DEFAULT_IMAGE_HEIGHT } from "../../../utils/index.js";
import { PositiveNumberInput } from "../../custom-input/PositiveNumberInput.js";

import { CustomTextLineStateful } from "../custom-base-input-components/index.js";
import { ElementWithoutIdAndType } from "../type.js";

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
			const newDimensions = {
				id: nanoid(),
				...image?.dimensions,
				[key]: Number(eventValue)
					? changePartialMmMeasureValue(Number(eventValue), image?.dimensions?.[key])
					: undefined,
			};

			const updatedElement: PartialImage = {
				...element,
				image: {
					id: nanoid(),
					...image,
					dimensions: newDimensions,
				},
			};
			const actions: UpdateElementsTransactionLogAction[] = [
				TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
			];
			const newValue = key === "height" ? newDimensions?.height?.value : newDimensions?.width?.value;
			if (elementReferences) {
				actions.push(
					TransactionLogStateActions.updateReferenceElements({
						data: elementReferences.map(el => {
							if (el.refId === element.id) {
								return {
									...el,
									dimensions: getRefImageDimensions(key, newValue, el, element),
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
			<CustomTextLineStateful
				value={image?.alternativeText}
				onBlur={onBlurAltText}
				label={localizer(RESOURCE_KEYS.elementForm.image.alt)}
				errorMessage={useImagePropertiesPropertyErrorMessage(element.id)("alternativeText")}
			/>
			<ImageFlexContainer>
				<PositiveNumberInput
					inputProps={{
						step: 1,
					}}
					label={localizer(RESOURCE_KEYS.elementForm.image.height)}
					value={String(image?.dimensions?.height?.value || "")}
					onBlur={e => onDimensionsBlur("height", e.target.value)}
					formatOnChange={formatOnChange}
					suffixes={<TextAffix id={"height-suffix"}>mm</TextAffix>}
					ariaDescribedby={"height-suffix"}
					errorMessage={getDimensionError("height")}
				/>
				<PositiveNumberInput
					inputProps={{
						step: 1,
					}}
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

export function getRefImageDimensions(
	key: string,
	newValue: number | undefined,
	imageRef: PartialValidPlaceableReference,
	imageElement: PartialImage
): Dimensions {
	const imageDimensions = imageElement.image?.dimensions;
	return key === "height"
		? {
				...imageRef.dimensions,
				minHeight: {
					...imageRef.dimensions.minHeight,
					value:
						newValue ||
						(imageElement.image?.imageSrcType === ImageSrcType.Attachment
							? getImageAttachmentHeight(imageRef.dimensions, imageDimensions, newValue)
							: DEFAULT_IMAGE_HEIGHT),
				},
			}
		: key === "width"
			? {
					...imageRef.dimensions,
					minWidth: {
						...imageRef.dimensions.minWidth,
						value:
							newValue ||
							(imageElement.image?.imageSrcType === ImageSrcType.Attachment
								? imageDimensions?.originalWidth?.value || 0
								: 0),
					},
					...(!imageDimensions?.height?.value &&
						imageElement.image?.imageSrcType === ImageSrcType.Attachment && {
							minHeight: {
								...imageRef.dimensions.minHeight,
								value: getImageAttachmentHeight(
									{
										...imageRef.dimensions,
										minWidth: {
											...imageRef.dimensions.minWidth,
											value: newValue || 0,
										},
									},
									imageDimensions,
									imageRef.dimensions.minHeight.value
								),
							},
						}),
				}
			: imageRef.dimensions;
}

export const getImageAttachmentHeight = (
	imageRefDimensions: Dimensions,
	imageDimensions?: DeepPartialRecursive<ImageDimensions> & PrintModelEntity,
	defaultHeight: number = DEFAULT_IMAGE_HEIGHT
): number => {
	if (!imageDimensions) {
		return defaultHeight;
	}
	if (
		imageDimensions?.originalHeight?.value &&
		imageDimensions?.originalWidth?.value &&
		imageRefDimensions.minWidth.value
	) {
		return Math.round(
			(imageRefDimensions.minWidth.value * imageDimensions.originalHeight.value) /
				imageDimensions.originalWidth.value
		);
	}
	return imageDimensions?.originalHeight?.value || defaultHeight;
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
