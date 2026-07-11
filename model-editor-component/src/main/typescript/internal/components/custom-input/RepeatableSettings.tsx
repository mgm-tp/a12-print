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
import { nanoid } from "nanoid";
import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";

import type { DataContext } from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";
import type { DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/errors";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";

import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { ElementMapUtils } from "../../utils/element-map-utils.js";
import type { DataContextEntry } from "../../types/data-context.js";
import { useConfirmationDialog } from "../../hooks/use-confirmation-dialog.js";
import { ConfirmationDialogType } from "../../redux/index.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";
import { DocumentModelDataSelectors } from "../../redux/document-model-data/selectors.js";

import { AllowedElementType, DataContextSelection } from "../forms/shared-components/DataContextSelection.js";
import { FormContainerHeadline } from "../forms/shared-components/FormContainerHeadline.js";
import { DocumentModelSelect } from "../forms/shared-components/DocumentModelSelect.js";
import { CustomTextField } from "../forms/custom-base-input-components/index.js";

import { StyledDataContextContainer } from "./RepeatableSettings.styled.js";

interface DataContextInputProps {
	dataContexts?: readonly DeepPartial<DataContext>[];
	onUpdateDataContexts: (dataContexts: DeepPartial<DataContext>[]) => void;
	wrapperDataContext: DataContextEntry[];
	dataContextErrorMap?: DeepPartialErrorMap<DataContext>[];
}

export const RepeatableSettings = ({
	dataContexts,
	wrapperDataContext,
	onUpdateDataContexts,
	dataContextErrorMap,
}: DataContextInputProps) => {
	const localizer = PrintLocalizer.useLocalizer();
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();

	const repeatableDataContext = useMemo(() => {
		return dataContexts?.find(dataContext => dataContext.isRepetition);
	}, [dataContexts]);

	const elementMap = useSelector(
		(state: PrintEngineState) =>
			DocumentModelDataSelectors.documentModelData(state, repeatableDataContext?.model)?.elementMap
	);

	const processedElementMap = useMemo(() => {
		return ElementMapUtils.createEntriesFromDataContext(Object.values(elementMap || {}), wrapperDataContext);
	}, [elementMap, wrapperDataContext]);

	const repeatableDataContextId = repeatableDataContext?.id;
	const pathErrorMessage = useMemo(() => {
		if (!repeatableDataContextId || !dataContextErrorMap) {
			return undefined;
		}
		return errorMessageLocalizer(
			dataContextErrorMap.find(dataContext => dataContext["@id"] === repeatableDataContextId)?.path?.[
				ErrorSeverity.ERROR
			]
		);
	}, [dataContextErrorMap, errorMessageLocalizer, repeatableDataContextId]);

	const updateDataContexts = useCallback(
		(updatedData: Partial<DataContext>) => {
			let newDataContexts = [...(dataContexts || [])];
			if (repeatableDataContext) {
				newDataContexts = newDataContexts.map(dataContext =>
					dataContext.id === repeatableDataContext.id
						? { ...dataContext, ...updatedData, id: repeatableDataContext.id }
						: dataContext
				);
			} else {
				newDataContexts.push({ ...updatedData, id: nanoid() });
			}

			onUpdateDataContexts(newDataContexts);
		},
		[dataContexts, onUpdateDataContexts, repeatableDataContext]
	);

	const confirm = useConfirmationDialog();

	const onDeleteDocumentModel = useCallback(async () => {
		if (!repeatableDataContext) {
			return;
		}

		const confirmed = await confirm(ConfirmationDialogType.DELETE);
		if (!confirmed) {
			return;
		}

		const newDataContexts = (dataContexts || []).filter(dataContext => dataContext.id !== repeatableDataContext.id);
		onUpdateDataContexts(newDataContexts);
	}, [confirm, dataContexts, onUpdateDataContexts, repeatableDataContext]);

	const onChangeDocumentModel = useCallback(
		(model?: string) => {
			updateDataContexts({ model, isRepetition: true });
		},
		[updateDataContexts]
	);

	const onChangeDataContextGroup = useCallback(
		(path?: string) => {
			updateDataContexts({ path });
		},
		[updateDataContexts]
	);

	return (
		<>
			<FormContainerHeadline label={localizer(RESOURCE_KEYS.input.repeatableSettings.headline)} />
			<DocumentModelSelect
				value={repeatableDataContext?.model}
				onValueChanged={onChangeDocumentModel}
				onDelete={onDeleteDocumentModel}
			/>
			<CustomTextField
				readonly
				label={localizer(RESOURCE_KEYS.elementForm.model.group)}
				value={repeatableDataContext?.path}
				errorMessage={pathErrorMessage}
			/>
			<StyledDataContextContainer>
				<DataContextSelection
					type={AllowedElementType.repeatableGroup}
					elementMapEntries={processedElementMap}
					selectedPath={repeatableDataContext?.path}
					setSelectedPath={onChangeDataContextGroup}
					maxRepeatLevel={0}
					isInstanceContext
				/>
			</StyledDataContextContainer>
		</>
	);
};
