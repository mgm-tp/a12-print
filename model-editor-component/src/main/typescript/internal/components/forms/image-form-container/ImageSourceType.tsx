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

import type { ImageProperties, PartialImage } from "@com.mgmtp.a12.print/print-model-api/model";
import { ImageSrcType } from "@com.mgmtp.a12.print/print-model-api/model";
import { Icon } from "@com.mgmtp.a12.widgets/widgets-core";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import type { UpdateElementsTransactionLogAction } from "../../../redux/index.js";
import { TransactionLogStateActions } from "../../../redux/index.js";
import { InteractionLogActions } from "../../../redux/interaction-log/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";
import { ValidationSelectors } from "../../../redux/validation/selectors.js";
import { DEFAULT_ELEMENT_WIDTH, DEFAULT_IMAGE_HEIGHT } from "../../../utils/elements-utils.js";

import {
	StyledCustomToggle,
	StyledCustomToggleItem,
} from "../custom-base-input-components/source-input/SourceInputToggles.styled.js";
import { CustomInputWrapper } from "../shared-components/CustomInputWrapper.js";
import type { ElementWithoutIdAndType } from "../type.js";

import { ImageSourceTypeAttachment } from "./ImageSourceTypeAttachment.js";
import { ImageSourceTypeField } from "./ImageSourceTypeField.js";
import { StyledImageSrcToggleContainer } from "./ImageSourceTypeAttachment.styled.js";

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
					...(imageSrcType === ImageSrcType.Dynamic
						? { resourceSource: undefined }
						: { fieldSource: undefined }),
					dimensions: {
						...element.image?.dimensions,
						id: nanoid(),
						originalHeight: undefined,
						originalWidth: undefined,
					},
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
											minHeight: {
												...el.dimensions?.minHeight,
												value: imageDimensions?.height?.value ?? DEFAULT_IMAGE_HEIGHT,
											},
											minWidth: {
												...el.dimensions?.minWidth,
												value: imageDimensions?.width?.value ?? DEFAULT_ELEMENT_WIDTH,
											},
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
			<StyledImageSrcToggleContainer>
				<CustomInputWrapper
					label={localizer(RESOURCE_KEYS.elementForm.image.imageSrc)}
					errorMessage={useImageAttachmentTypeErrorMessage(element.id)("imageSrcType")}
				>
					<StyledCustomToggle value={element.image?.imageSrcType} onValueChanged={onChangeImgSrcType}>
						<StyledCustomToggleItem
							value={ImageSrcType.Static}
							title={localizer(RESOURCE_KEYS.elementForm.image.imageSrcType.static)}
							data-testid="image-src-type-static"
						>
							<Icon style={{ margin: 0 }}>image</Icon>
						</StyledCustomToggleItem>
						<StyledCustomToggleItem
							value={ImageSrcType.Dynamic}
							title={localizer(RESOURCE_KEYS.elementForm.image.imageSrcType.dynamic)}
							data-testid="image-src-type-dynamic"
						>
							<Icon style={{ margin: 0 }}>dynamic_form</Icon>
						</StyledCustomToggleItem>
					</StyledCustomToggle>
				</CustomInputWrapper>
			</StyledImageSrcToggleContainer>
			<ImageSourceTypeProperties element={element} />
		</>
	);
};

interface ImageSourceTypePropertiesProps {
	element: PartialImage;
}

const ImageSourceTypeProperties = ({ element }: ImageSourceTypePropertiesProps) => {
	if (element.image?.imageSrcType === ImageSrcType.Static) {
		return <ImageSourceTypeAttachment element={element} />;
	}

	if (element.image?.imageSrcType === ImageSrcType.Dynamic) {
		return <ImageSourceTypeField element={element} />;
	}
	return <></>;
};

function useImageAttachmentTypeErrorMessage<T extends keyof ElementWithoutIdAndType<ImageProperties>>(id = "") {
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const error = useSelector((state: PrintEngineState) => ValidationSelectors.image(state, id));

	return (property: T) => (error ? errorMessageLocalizer(error.image?.[property]?.[ErrorSeverity.ERROR]) : undefined);
}
