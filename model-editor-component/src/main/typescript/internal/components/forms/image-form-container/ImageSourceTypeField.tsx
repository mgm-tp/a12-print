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

import { FieldSource, PartialImage } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { TransactionLogStateActions } from "../../../redux/index.js";
import { InteractionLogActions } from "../../../redux/interaction-log/index.js";
import { PrintEngineState } from "../../../store/root-reducer.js";
import { ValidationSelectors } from "../../../redux/validation/selectors.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { ElementMapUtils } from "../../../utils/element-map-utils.js";
import { DocumentModelDataSelectors } from "../../../redux/document-model-data/selectors.js";

import { AllowedElementType, DataContextSelection } from "../shared-components/index.js";
import { DocumentModelSelect } from "../shared-components/DocumentModelSelect.js";
import { ElementWithoutIdAndType } from "../type.js";
import { CustomTextLineStateless } from "../custom-base-input-components/index.js";

interface ImageSourceTypeFieldProps {
	element: PartialImage;
}

export const ImageSourceTypeField = ({ element }: ImageSourceTypeFieldProps) => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const wrapperDataContext = useSelector(PrintEngineSelectors.wrapperDataContext);

	const image = element.image;
	const model = image?.fieldSource?.model;

	const elementMap = useSelector(
		(state: PrintEngineState) => DocumentModelDataSelectors.documentModelData(state, model)?.elementMap
	);

	const updateImage = React.useCallback(
		(imageElement: PartialImage, description: string) => {
			dispatch(
				InteractionLogActions.start({
					description: description,
					region: "form",
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({ data: [imageElement] }),
					],
				})
			);
		},
		[dispatch]
	);

	const setSelectedPath = React.useCallback(
		(path: string) => {
			const updatedElement: PartialImage = {
				...element,
				image: { id: nanoid(), ...image, fieldSource: { id: nanoid(), ...image?.fieldSource, path } },
			};
			updateImage(
				updatedElement,
				RESOURCE_KEYS.interaction.form.imageFormContainer.sourceTypeField.changeBasePath
			);
		},
		[element, image, updateImage]
	);

	const onChangeDocumentModel = React.useCallback(
		(model?: string) => {
			const updatedElement: PartialImage = {
				...element,
				image: {
					id: nanoid(),
					...image,
					fieldSource: { id: nanoid(), ...image?.fieldSource, model, path: "" },
				},
			};
			updateImage(
				updatedElement,
				RESOURCE_KEYS.interaction.form.imageFormContainer.sourceTypeField.changeDocumentModel
			);
		},
		[element, image, updateImage]
	);

	const processedElementMap = React.useMemo(() => {
		return ElementMapUtils.createEntriesFromDataContext(Object.values(elementMap || {}), wrapperDataContext);
	}, [elementMap, wrapperDataContext]);

	const selectedPath = image?.fieldSource?.path;
	const getFieldSourceErrorMessage = useImageFieldSourceErrorMessage(element.id);
	return (
		<>
			<DocumentModelSelect
				value={model}
				onValueChanged={onChangeDocumentModel}
				errorMessage={getFieldSourceErrorMessage("model")}
			/>
			<CustomTextLineStateless
				readonly
				label={localizer(RESOURCE_KEYS.elementForm.model.field)}
				value={selectedPath}
				errorMessage={getFieldSourceErrorMessage("path")}
			/>
			<DataContextSelection
				type={AllowedElementType.field}
				elementMapEntries={processedElementMap}
				selectedPath={selectedPath}
				setSelectedPath={setSelectedPath}
				maxRepeatLevel={0}
			/>
		</>
	);
};

function useImageFieldSourceErrorMessage<T extends keyof ElementWithoutIdAndType<FieldSource>>(id = "") {
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const error = useSelector((state: PrintEngineState) => ValidationSelectors.image(state, id));

	return (property: T) =>
		error ? errorMessageLocalizer(error.image?.fieldSource?.[property]?.[ErrorSeverity.ERROR]) : undefined;
}
