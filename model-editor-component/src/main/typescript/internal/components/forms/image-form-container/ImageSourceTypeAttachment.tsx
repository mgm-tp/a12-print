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

import { Button, CustomSelect, Icon } from "@com.mgmtp.a12.widgets/widgets-core";
import type {
	Image as PrintImage,
	PrintModelElement,
	ResourceSource,
} from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";
import { ValidationSelectors } from "../../../redux/validation/selectors.js";
import { SUPPORTED_IMAGE_EXTENSIONS_JOINED, SUPPORTED_IMAGE_EXTENSIONS_STRING } from "../../../constant/editor.js";
import { RequestApiSelectors } from "../../../redux/request-api/selectors.js";
import { RequestApiActions } from "../../../redux/index.js";

import type { ElementWithoutIdAndType } from "../type.js";

import { StyledResourceSelectContainer, StyledSelectWrapper } from "./ImageSourceTypeToggle.styled.js";

interface ImageSourceTypeAttachmentProps {
	element: PrintModelElement & DeepPartial<PrintImage>;
}

export const ImageSourceTypeAttachment = ({ element }: ImageSourceTypeAttachmentProps) => {
	const initialResourceName = element.image?.resourceSource?.resourceName;
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const inputRef = React.useRef<HTMLInputElement | null>(null);

	React.useEffect(() => {
		dispatch(RequestApiActions.listStaticImages({}));
	}, [dispatch]);

	const availableResources = useSelector(RequestApiSelectors.availableResources);
	const lastUploadedResource = useSelector(RequestApiSelectors.lastUploadedResource);
	const pendingUploadRef = React.useRef(false);

	const resourceList = React.useMemo(
		() =>
			(availableResources ?? [])
				.filter(name => {
					const ext = name.slice(name.lastIndexOf(".") + 1).toUpperCase();
					return SUPPORTED_IMAGE_EXTENSIONS_STRING.includes(ext);
				})
				.map(name => ({ label: name, value: name })),
		[availableResources]
	);

	const elementId = element.id;
	const selectResource = React.useCallback(
		(name: string) => {
			dispatch(RequestApiActions.selectResource({ elementId, resourceName: name }));
		},
		[dispatch, elementId]
	);

	const onUpload = React.useCallback(
		(files: FileList) => {
			const file = files[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = () => {
				pendingUploadRef.current = true;
				dispatch(
					RequestApiActions.uploadStaticImage({
						name: file.name,
						internal_filename: file.name,
						size: file.size,
						mime_type: file.type,
						content: reader.result as string,
					})
				);
			};
			reader.readAsDataURL(file);
		},
		[dispatch]
	);

	React.useEffect(() => {
		if (pendingUploadRef.current && lastUploadedResource) {
			pendingUploadRef.current = false;
			selectResource(lastUploadedResource);
			dispatch(RequestApiActions.setLastUploadedResource(undefined));
		}
	}, [lastUploadedResource, selectResource, dispatch]);

	return (
		<StyledResourceSelectContainer>
			<StyledSelectWrapper>
				<CustomSelect
					label={localizer(RESOURCE_KEYS.elementForm.image.resource.selector)}
					items={resourceList}
					value={initialResourceName}
					onValueChanged={selectResource}
					errorMessage={useImageAttachmentSourceContentErrorMessage(element.id)("resourceName")}
				/>
			</StyledSelectWrapper>
			<Button
				icon={<Icon>upload</Icon>}
				title={localizer(RESOURCE_KEYS.elementForm.image.action.upload)}
				onClick={() => inputRef.current?.click()}
			/>
			<input
				type="file"
				ref={ref => {
					inputRef.current = ref;
				}}
				accept={SUPPORTED_IMAGE_EXTENSIONS_JOINED}
				style={{ display: "none" }}
				onChange={e => {
					if (e.target.files) onUpload(e.target.files);
					e.target.value = "";
				}}
			/>
		</StyledResourceSelectContainer>
	);
};

function useImageAttachmentSourceContentErrorMessage<T extends keyof ElementWithoutIdAndType<ResourceSource>>(id = "") {
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const error = useSelector((state: PrintEngineState) => ValidationSelectors.image(state, id));

	return (property: T) =>
		error ? errorMessageLocalizer(error.image?.resourceSource?.[property]?.[ErrorSeverity.ERROR]) : undefined;
}
