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

import type { SelectItem } from "@com.mgmtp.a12.widgets/widgets-core";
import {
	CollapsiblePanel,
	Button,
	Icon,
	Select,
	addPrefix,
	TextField,
	Tooltip,
} from "@com.mgmtp.a12.widgets/widgets-core";

import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { DINTemplateActions } from "../../redux//din-template/index.js";
import { RequestApiSelectors } from "../../redux//request-api/selectors.js";
import { RequestApiActions } from "../../redux/index.js";

import { StyledSchemaToolbar } from "./DocumentModelReferencesToolbar.styled.js";
import { StyledPrintModelReferenceContainer } from "./PrintModelReference.styled.js";

export const PrintModelReferences = () => {
	const localizer = PrintLocalizer.useLocalizer();
	const [isOpenPrintModelReferences, togglePrintModelReferences] = React.useReducer(state => !state, false);
	const printModelReferences = useSelector(PrintEngineSelectors.printModelReferences);

	return (
		<CollapsiblePanel
			onClick={togglePrintModelReferences}
			title={localizer(RESOURCE_KEYS.sidebar.schema.tab.printModelReferenced)}
		>
			{isOpenPrintModelReferences && (
				<>
					<PrintModelReferencesToolbar />
					{printModelReferences.length > 0 &&
						printModelReferences.map(({ reference }) => (
							<PrintModelReference key={reference} reference={reference} />
						))}
				</>
			)}
		</CollapsiblePanel>
	);
};

const PrintModelReferencesToolbar = () => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const [selectedPrintModel, setSelectedPrintModel] = React.useState("");
	const [pendingModel, setPendingModel] = React.useState<string | null>(null);

	const dinTemplateSegments = useSelector(RequestApiSelectors.dinTemplatePrintModels);
	const printModelIds = useSelector(RequestApiSelectors.selectablePrintModelIds);
	const printHeader = useSelector(PrintEngineSelectors.printHeader);
	const dinTemplatePrintModelItems: SelectItem[] = React.useMemo(
		() =>
			(printModelIds || []).map(id => ({
				value: id,
				label: id,
			})),
		[printModelIds]
	);

	const segmentsAlreadyLoaded = React.useMemo(() => {
		return Object.keys(dinTemplateSegments).includes(selectedPrintModel);
	}, [dinTemplateSegments, selectedPrintModel]);

	const dinTemplateSegmentsLoading =
		pendingModel !== null && !Object.keys(dinTemplateSegments).includes(pendingModel);

	const currentSelectedModelHasTemplateSegments = React.useMemo(() => {
		if (segmentsAlreadyLoaded) {
			return dinTemplateSegments[selectedPrintModel].length > 0;
		}
		return false;
	}, [dinTemplateSegments, segmentsAlreadyLoaded, selectedPrintModel]);

	const addReferencedPrintModel = React.useCallback(() => {
		dispatch(
			DINTemplateActions.addReferenceEntry({
				incomingPrintModelId: selectedPrintModel,
				outgoingPrintModelId: printHeader.id,
			})
		);
		setSelectedPrintModel("");
	}, [dispatch, printHeader, selectedPrintModel]);

	const onValueChanged = React.useCallback(
		(newValue: string) => {
			const alreadyLoaded = Object.keys(dinTemplateSegments).includes(newValue);
			if (!alreadyLoaded) {
				dispatch(RequestApiActions.loadDINTemplatePrintModel(newValue));
				setPendingModel(newValue);
			}
			setSelectedPrintModel(newValue);
		},
		[dinTemplateSegments, dispatch]
	);

	const addButtonLabel = localizer(RESOURCE_KEYS.button.add);

	return (
		<StyledSchemaToolbar>
			<Select
				className={addPrefix("-u-flex-1")}
				placeholder={localizer(RESOURCE_KEYS.input.selectPlaceholder)}
				value={selectedPrintModel}
				onValueChanged={onValueChanged}
				items={dinTemplatePrintModelItems}
				fitToParent={false}
			/>
			<Tooltip
				disabled={currentSelectedModelHasTemplateSegments || !selectedPrintModel}
				variant="hint"
				text={localizer(RESOURCE_KEYS.sidebar.schema.tooltips.printModelReferenceWithoutSegments)}
			>
				<Button
					loading={dinTemplateSegmentsLoading}
					title={addButtonLabel}
					label={addButtonLabel}
					icon={<Icon>add</Icon>}
					disabled={!selectedPrintModel || !currentSelectedModelHasTemplateSegments}
					onClick={addReferencedPrintModel}
				/>
			</Tooltip>
		</StyledSchemaToolbar>
	);
};

const PrintModelReference = ({ reference }: { reference: string }) => {
	return (
		<StyledPrintModelReferenceContainer>
			<TextField value={reference} readonly />
		</StyledPrintModelReferenceContainer>
	);
};
