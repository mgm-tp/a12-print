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

import { Typography } from "@com.mgmtp.a12.widgets/widgets-core/lib/typography/index.js";
import { Radio } from "@com.mgmtp.a12.widgets/widgets-core/lib/input/radio/index.js";
import {
	ImageSrcType,
	Measure,
	PartialImage,
	PlaceableReference,
	PartialValidPlaceableReference,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { UpdateElementsTransactionLogAction, TransactionLogStateActions } from "../../../redux/index.js";
import { InteractionLogActions } from "../../../redux/interaction-log/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { DEFAULT_ELEMENT_WIDTH, DEFAULT_IMAGE_HEIGHT } from "../../../utils/index.js";

import { ImageSourceTypeAttachment } from "./ImageSourceTypeAttachment.js";
import { ImageSourceTypeField } from "./ImageSourceTypeField.js";
import { getImageAttachmentHeight, useImagePropertiesPropertyErrorMessage } from "./ImageGeneralProperties.js";

interface ImageSourceTypeProps {
	element: PartialImage;
}

export const ImageSourceType = ({ element }: ImageSourceTypeProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const elementReferences = useSelector(PrintEngineSelectors.elementReferences);
	const imageDimensions = element.image?.dimensions;

	const onChangeImgSrcType = React.useCallback(
		(imageSrcType: ImageSrcType) => {
			const updatedElement: PartialImage = {
				...element,
				image: {
					id: nanoid(),
					...element.image,
					imageSrcType,
					...(imageSrcType === ImageSrcType.Field ? { fieldSource: { id: nanoid() } } : {}),
				},
			};
			const actions: UpdateElementsTransactionLogAction[] = [
				TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
			];

			if (elementReferences && (!imageDimensions?.height?.value || !imageDimensions?.width?.value)) {
				actions.push(
					TransactionLogStateActions.updateReferenceElements({
						data: elementReferences.map(el =>
							el.refId === element.id
								? {
										...el,
										dimensions: {
											...el.dimensions,
											...(imageDimensions?.height?.value
												? {}
												: { minHeight: getImageMinHeight(element, el, imageSrcType) }),
											...(imageDimensions?.width?.value
												? {}
												: { minWidth: getImageMinWidth(element, el) }),
										},
									}
								: el
						),
					})
				);
			}

			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.form.imageFormContainer.sourceType.changeSourceType,
					region: "form",
					transactionLogActions: actions,
				})
			);
		},
		[element, elementReferences, dispatch, imageDimensions?.height?.value, imageDimensions?.width?.value]
	);

	return (
		<>
			<Typography.Body>
				<Radio
					inline
					label={localizer(RESOURCE_KEYS.elementForm.image.imageSrcType)}
					value={element.image?.imageSrcType}
					onValueChanged={onChangeImgSrcType}
					errorMessage={useImagePropertiesPropertyErrorMessage(element.id)("imageSrcType")}
				>
					<Radio.Item
						label={localizer(RESOURCE_KEYS.elementForm.image.attachment)}
						value={ImageSrcType.Attachment}
					/>
					<Radio.Item label={localizer(RESOURCE_KEYS.elementForm.image.field)} value={ImageSrcType.Field} />
				</Radio>
			</Typography.Body>
			<ImageSourceTypeProperties element={element} />
		</>
	);
};

interface ImageSourceTypePropertiesProps {
	element: PartialImage;
}

const ImageSourceTypeProperties = ({ element }: ImageSourceTypePropertiesProps) => {
	if (element.image?.imageSrcType === ImageSrcType.Field) {
		return <ImageSourceTypeField element={element} />;
	}

	if (element.image?.imageSrcType === ImageSrcType.Attachment) {
		return <ImageSourceTypeAttachment element={element} />;
	}
	return <></>;
};

const getImageMinHeight = (
	image: PartialImage,
	elementRef: PartialValidPlaceableReference,
	imageSrcType: ImageSrcType
): Measure => {
	const minHeightValue =
		imageSrcType === ImageSrcType.Attachment
			? getImageAttachmentHeight(elementRef.dimensions, image.image?.dimensions)
			: image.image?.dimensions?.height?.value || DEFAULT_IMAGE_HEIGHT;

	return {
		...elementRef.dimensions.minHeight,
		value: minHeightValue,
	};
};

const getImageMinWidth = (image: PartialImage, elementRef: PlaceableReference): Measure => {
	const imageDimensions = image.image?.dimensions;

	return {
		...elementRef.dimensions?.minWidth,
		value: imageDimensions?.width?.value || imageDimensions?.originalWidth?.value || DEFAULT_ELEMENT_WIDTH,
	};
};
