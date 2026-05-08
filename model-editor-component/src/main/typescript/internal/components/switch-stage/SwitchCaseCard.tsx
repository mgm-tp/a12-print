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
import { useSelector } from "react-redux";

import { Button } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/index.js";
import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/index.js";
import { GRAMMAR_ROOT_RULE_NAMES } from "@com.mgmtp.a12.dml/dml/lib/ruleCodeEditor/constants.js";
import { PartialArea } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { InputElements } from "@com.mgmtp.a12.widgets/widgets-core/lib/input/index.js";
import { PrintError } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";

import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { PrintEngineState } from "../../store/root-reducer.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { useModelNameAliasConverter } from "../../hooks/index.js";
import { DocumentModelDataSelectors } from "../../redux/document-model-data/selectors.js";

import { SwitchAreaContainer } from "./SwitchAreaContainer.js";
import {
	StyledActionColumn,
	StyledAreaColumn,
	StyledCaseCard,
	StyledDragColumn,
	StyledPreconditionColumn,
	StyledDragIcon,
	StyledRuleCodeEditor,
} from "./SwitchCaseCard.styled.js";
import { PartialSwitchCase } from "./switch-stage.js";

export interface SwitchCaseProps {
	row: PartialSwitchCase;
	deleteBodyRow?: () => void;
	setRowData?: (newValue: PartialSwitchCase) => void;
	scale?: number;
	isDragging?: boolean;
	documentModel?: string;
	validationErrors?: PrintError[];
}

export const SwitchCaseCard = ({
	row,
	deleteBodyRow,
	scale,
	setRowData,
	isDragging,
	documentModel,
	validationErrors,
}: SwitchCaseProps) => {
	const localizer = PrintLocalizer.useLocalizer();
	const areaElement = useSelector((state: PrintEngineState) =>
		PrintEngineSelectors.printModelElement(state, row.refId)
	) as PartialArea;

	const documentModelData = useSelector((state: PrintEngineState) =>
		DocumentModelDataSelectors.documentModelData(state, documentModel)
	);
	const { aliasDocumentModel, convertModelNameToAlias, convertAliasToModelName } =
		useModelNameAliasConverter(documentModel);

	const setNewRowData = (newData: string) => {
		setRowData && setRowData({ ...row, precondition: convertAliasToModelName(newData) });
	};

	return (
		<StyledCaseCard isDragging={isDragging}>
			<StyledDragColumn>
				<StyledDragIcon size="big">drag_handle</StyledDragIcon>
			</StyledDragColumn>
			<StyledPreconditionColumn>
				<StyledRuleCodeEditor
					key={aliasDocumentModel || documentModel}
					rootRuleName={GRAMMAR_ROOT_RULE_NAMES.COMPUTATION_PRECONDITION}
					label={localizer(RESOURCE_KEYS.elementForm.switch.precondition)}
					setNewRowData={setNewRowData}
					value={convertModelNameToAlias(row.precondition)}
					documentModel={documentModel}
					suggestionType="default"
					aliasDocumentModel={aliasDocumentModel}
					documentModelData={documentModelData}
					validationErrors={validationErrors}
				/>
			</StyledPreconditionColumn>
			<StyledAreaColumn>
				<InputElements.Label label={localizer(RESOURCE_KEYS.elementForm.switch.elements)} />
				<SwitchAreaContainer areaElement={areaElement} scale={scale} />
			</StyledAreaColumn>
			<StyledActionColumn>
				<Button
					destructive
					icon={<Icon>delete</Icon>}
					title={localizer(RESOURCE_KEYS.button.delete)}
					onClick={deleteBodyRow}
				/>
			</StyledActionColumn>
		</StyledCaseCard>
	);
};
