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

import { DefaultFileUpload } from "@com.mgmtp.a12.widgets/widgets-core/lib/file-upload/index.js";
import { ResponsiveImageContainer } from "@com.mgmtp.a12.widgets/widgets-core/lib/responsive-image-container/index.js";
import { PopUpMenu } from "@com.mgmtp.a12.widgets/widgets-core/lib/pop-up-menu/index.js";
import { Button } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/index.js";
import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/index.js";
import { List } from "@com.mgmtp.a12.widgets/widgets-core/lib/list/index.js";
import {
	Attachment,
	Dimensions,
	EntityKey,
	getEntityId,
	Image as PrintImage,
	ImageDimensions,
	isMeasure,
	PartialImage,
	PrintModelElement,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { UpdateElementsTransactionLogAction, TransactionLogStateActions } from "../../../redux/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { InteractionLogActions } from "../../../redux/interaction-log/index.js";
import { PrintEngineState } from "../../../store/root-reducer.js";
import { ValidationSelectors } from "../../../redux/validation/selectors.js";
import { changePartialMmMeasureValue, createMmMeasure, downloadFile } from "../../../utils/index.js";
import { DEFAULT_ELEMENT_WIDTH, DEFAULT_IMAGE_HEIGHT } from "../../../utils/elements-utils.js";
import {
	EditorConst,
	SUPPORTED_IMAGE_EXTENSIONS,
	SUPPORTED_IMAGE_EXTENSIONS_JOINED,
	SUPPORTED_IMAGE_EXTENSIONS_STRING,
} from "../../../constant/editor.js";
import { EditorComponentApiActions } from "../../../api/index.js";
import { DEFAULT_ERROR_TOAST_DURATION } from "../../../constant/configs.js";

const DEFAULT_UPLOAD_AREA_SIZE = { width: 150, height: 150 };

const { PX_TO_MM } = EditorConst;

interface ImageSourceTypeAttachmentProps {
	element: PrintModelElement & DeepPartial<PrintImage>;
}

export const ImageSourceTypeAttachment = ({ element }: ImageSourceTypeAttachmentProps) => {
	const dispatch = useDispatch();
	const inputRef = React.useRef<HTMLInputElement | null>(null);
	const localizer = PrintLocalizer.useLocalizer();
	const elementReferences = useSelector(PrintEngineSelectors.elementReferences);

	const image = element.image;

	const updateAttachment = React.useCallback(
		(newProps: Attachment, dimensions: ImageDimensions) => {
			const updatedElement: PartialImage = {
				...element,
				image: {
					id: nanoid(),
					...image,
					attachmentSource: { id: nanoid(), imageAttachment: newProps },
					dimensions,
				},
			};
			const actions: UpdateElementsTransactionLogAction[] = [
				TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
			];
			if (elementReferences) {
				actions.push(
					TransactionLogStateActions.updateReferenceElements({
						data: elementReferences.map(el =>
							el.refId === element.id
								? {
										...el,
										dimensions: {
											...el.dimensions,
											minHeight:
												dimensions.height ||
												changePartialMmMeasureValue(DEFAULT_IMAGE_HEIGHT, dimensions.height),
											minWidth:
												dimensions.width ||
												changePartialMmMeasureValue(DEFAULT_ELEMENT_WIDTH, dimensions.width),
										} as Dimensions,
									}
								: el
						),
					})
				);
			}
			dispatch(
				InteractionLogActions.start({
					description:
						RESOURCE_KEYS.interaction.form.imageFormContainer.sourceTypeAttachment.updateImgAttachment,
					region: "form",
					transactionLogActions: actions,
				})
			);
		},
		[elementReferences, dispatch, element, image]
	);

	const onUploadAttachment = React.useCallback(
		(files: FileList) => {
			const file: File = files[0];

			if (!SUPPORTED_IMAGE_EXTENSIONS.includes(file.type)) {
				dispatch(
					EditorComponentApiActions.addNotification({
						title: { key: RESOURCE_KEYS.validation.attachment.upload.title },
						message: {
							key: RESOURCE_KEYS.validation.attachment.upload.supportedExtensions,
							args: {
								extensions: { type: "plain", value: SUPPORTED_IMAGE_EXTENSIONS_STRING },
							},
						},
						severity: "error",
						duration: DEFAULT_ERROR_TOAST_DURATION,
					})
				);
				return;
			}

			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = function () {
				if (reader.result?.toString()) {
					const imageHtml = new Image();
					imageHtml.src = reader.result?.toString();
					imageHtml.onload = function () {
						const naturalHeight = createMmMeasure(PX_TO_MM(imageHtml.naturalHeight));
						const naturalWidth = createMmMeasure(PX_TO_MM(imageHtml.naturalWidth));
						updateAttachment(
							{
								id: getEntityId(EntityKey.Attachment, imageHtml.src),
								content: imageHtml.src,
								internal_filename: file.name,
								mime_type: file.type,
								size: file.size,
								original_filename: file.name,
							},
							{
								id: nanoid(),
								height: isMeasure(image?.dimensions?.height)
									? image?.dimensions?.height
									: naturalHeight,
								width: isMeasure(image?.dimensions?.width) ? image?.dimensions?.width : naturalWidth,
								originalHeight: naturalHeight,
								originalWidth: naturalWidth,
							}
						);
					};
				}
			};
		},
		[dispatch, image?.dimensions?.height, image?.dimensions?.width, updateAttachment]
	);

	const onTriggerDelete = React.useCallback(() => {
		if (image?.attachmentSource) {
			const updatedElement: PartialImage = {
				...element,
				image: {
					...image,
					attachmentSource: undefined,
					dimensions: {
						id: nanoid(),
						...image.dimensions,
						originalHeight: undefined,
						originalWidth: undefined,
					},
				},
			};
			dispatch(
				InteractionLogActions.start({
					description:
						RESOURCE_KEYS.interaction.form.imageFormContainer.sourceTypeAttachment.deleteImgAttachment,
					region: "form",
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [updatedElement] }),
					],
				})
			);
		}
	}, [dispatch, element, image]);

	const onTriggerDownload = React.useCallback(() => {
		const name = image?.attachmentSource?.imageAttachment?.internal_filename;
		const source = image?.attachmentSource?.imageAttachment?.content;

		if (source) {
			downloadFile(source, name);
		}
	}, [image]);

	const onTriggerReplace = React.useCallback(() => {
		inputRef.current?.click();
	}, []);

	const content = image?.attachmentSource?.imageAttachment?.content;

	return (
		<DefaultFileUpload
			fileInputRef={ref => {
				inputRef.current = ref;
			}}
			uploadAreaSize={DEFAULT_UPLOAD_AREA_SIZE}
			accept={SUPPORTED_IMAGE_EXTENSIONS_JOINED}
			placeholderIconTitle="file"
			onChange={onUploadAttachment}
			image={content && <ResponsiveImageContainer src={content} />}
			errorMessage={useImageAttachmentSourceContentErrorMessage(element.id)}
			actionItem={
				content && (
					<PopUpMenu triggerElement={<Button secondary icon={<Icon>more_vert</Icon>} />}>
						<List>
							<List.Item
								text={localizer(RESOURCE_KEYS.elementForm.image.action.replace)}
								graphic={<Icon>file_upload</Icon>}
								onClick={onTriggerReplace}
							/>
							<List.Item
								text={localizer(RESOURCE_KEYS.elementForm.image.action.download)}
								graphic={<Icon>get_app</Icon>}
								onClick={onTriggerDownload}
							/>
							<List.Item
								text={localizer(RESOURCE_KEYS.elementForm.image.action.delete)}
								graphic={<Icon variant={"error"}>delete</Icon>}
								onClick={onTriggerDelete}
							/>
						</List>
					</PopUpMenu>
				)
			}
		/>
	);
};

function useImageAttachmentSourceContentErrorMessage(id = "") {
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const error = useSelector((state: PrintEngineState) => ValidationSelectors.image(state, id));

	return error
		? errorMessageLocalizer(error.image?.attachmentSource?.imageAttachment?.content?.[ErrorSeverity.ERROR])
		: undefined;
}
