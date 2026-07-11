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

import { GlobalRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { Typography, InputElements, LayoutGrid } from "@com.mgmtp.a12.widgets/widgets-core";

import { PrintEngineSelectors } from "../../../store/selectors.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../../localization/index.js";
import { TransactionLogStateActions } from "../../../redux/transaction-log-state/actions.js";
import { InteractionLogActions } from "../../../redux/interaction-log/index.js";
import { ValidationSelectors } from "../../../redux/validation/selectors.js";
import { DocumentModelSelect } from "../../forms/shared-components/DocumentModelSelect.js";
import type { ComputationRepeatRowType } from "../../forms/shared-components/ComputationRepeat.js";
import { ComputationRepeat } from "../../forms/shared-components/ComputationRepeat.js";
import { ErrorWrapper, useErrorMessagesByPath } from "../../validation/index.js";

import { StyledMetadataGrid } from "./MetadataSection.styled.js";
import type { MetadataComputationField } from "./hooks/use-metadata-field-errors.js";
import { useMetadataFieldErrors } from "./hooks/use-metadata-field-errors.js";

const { Row, Column } = LayoutGrid;

export const MetadataSection = (): React.ReactElement => {
	const dispatch = useDispatch();
	const general = useSelector(PrintEngineSelectors.printContentGeneral);
	const metadataErrorMap = useSelector(ValidationSelectors.metadata);
	const localizer = PrintLocalizer.useLocalizer();

	const metadata = general?.metadata;

	const modelErrors = useErrorMessagesByPath("content.general.metadata.model");

	const titleErrors = useMetadataFieldErrors("titleComputation");
	const descriptionErrors = useMetadataFieldErrors("descriptionComputation");
	const authorErrors = useMetadataFieldErrors("authorComputation");
	const languageErrors = useMetadataFieldErrors("languageComputation");

	const onChangeMetadataModel = React.useCallback(
		(documentModel?: string) => {
			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.general.changeMetadataModel,
					region: GlobalRegion.SIDEBAR,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintContentGeneral({
							data: {
								...general,
								metadata: {
									...metadata,
									id: metadata?.id || "",
									model: documentModel,
								},
							},
						}),
					],
				})
			);
		},
		[dispatch, general, metadata]
	);

	const createMetadataComputationSetter = React.useCallback(
		(field: MetadataComputationField, interactionKey: string) => {
			return (newValue: ComputationRepeatRowType[]) => {
				dispatch(
					InteractionLogActions.start({
						description: interactionKey,
						region: GlobalRegion.SIDEBAR,
						transactionLogActions: [
							TransactionLogStateActions.updatePrintContentGeneral({
								data: {
									...general,
									metadata: {
										...metadata,
										id: metadata?.id || "",
										[field]: newValue,
									},
								},
							}),
						],
					})
				);
			};
		},
		[dispatch, general, metadata]
	);

	const setTitleComputation = React.useMemo(
		() =>
			createMetadataComputationSetter("titleComputation", RESOURCE_KEYS.interaction.general.changeMetadataTitle),
		[createMetadataComputationSetter]
	);

	const setDescriptionComputation = React.useMemo(
		() =>
			createMetadataComputationSetter(
				"descriptionComputation",
				RESOURCE_KEYS.interaction.general.changeMetadataDescription
			),
		[createMetadataComputationSetter]
	);

	const setAuthorComputation = React.useMemo(
		() =>
			createMetadataComputationSetter(
				"authorComputation",
				RESOURCE_KEYS.interaction.general.changeMetadataAuthor
			),
		[createMetadataComputationSetter]
	);

	const setLanguageComputation = React.useMemo(
		() =>
			createMetadataComputationSetter(
				"languageComputation",
				RESOURCE_KEYS.interaction.general.changeMetadataLanguage
			),
		[createMetadataComputationSetter]
	);

	return (
		<>
			<Typography.Headline level={3}>
				{localizer(RESOURCE_KEYS.sidebar.general.metadata.headline)}
			</Typography.Headline>
			<DocumentModelSelect
				value={metadata?.model}
				onValueChanged={onChangeMetadataModel}
				errorMessage={modelErrors.errorMessage}
				warningMessage={modelErrors.warningMessage}
			/>
			<StyledMetadataGrid>
				<Row>
					<Column size={{ lg: 6 }}>
						<InputElements.Label label={localizer(RESOURCE_KEYS.sidebar.general.metadata.title)} />
						<ErrorWrapper {...titleErrors} />
						<ComputationRepeat
							documentModel={metadata?.model}
							tableData={(metadata?.titleComputation as ComputationRepeatRowType[]) || []}
							setTableData={setTitleComputation}
							computationErrorMap={metadataErrorMap?.titleComputation}
							initiallyExpanded={titleErrors.info.length > 0}
						/>
					</Column>
					<Column size={{ lg: 6 }}>
						<InputElements.Label label={localizer(RESOURCE_KEYS.sidebar.general.metadata.description)} />
						<ErrorWrapper {...descriptionErrors} />
						<ComputationRepeat
							documentModel={metadata?.model}
							tableData={(metadata?.descriptionComputation as ComputationRepeatRowType[]) || []}
							setTableData={setDescriptionComputation}
							computationErrorMap={metadataErrorMap?.descriptionComputation}
							initiallyExpanded={descriptionErrors.info.length > 0}
						/>
					</Column>
				</Row>
				<Row>
					<Column size={{ lg: 6 }}>
						<InputElements.Label label={localizer(RESOURCE_KEYS.sidebar.general.metadata.author)} />
						<ErrorWrapper {...authorErrors} />
						<ComputationRepeat
							documentModel={metadata?.model}
							tableData={(metadata?.authorComputation as ComputationRepeatRowType[]) || []}
							setTableData={setAuthorComputation}
							computationErrorMap={metadataErrorMap?.authorComputation}
							initiallyExpanded={authorErrors.info.length > 0}
						/>
					</Column>
					<Column size={{ lg: 6 }}>
						<InputElements.Label label={localizer(RESOURCE_KEYS.sidebar.general.metadata.language)} />
						<ErrorWrapper {...languageErrors} />
						<ComputationRepeat
							documentModel={metadata?.model}
							tableData={(metadata?.languageComputation as ComputationRepeatRowType[]) || []}
							setTableData={setLanguageComputation}
							computationErrorMap={metadataErrorMap?.languageComputation}
							initiallyExpanded={languageErrors.info.length > 0}
						/>
					</Column>
				</Row>
			</StyledMetadataGrid>
		</>
	);
};
