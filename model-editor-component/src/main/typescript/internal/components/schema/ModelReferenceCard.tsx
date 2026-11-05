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
import { useSelector } from "react-redux";

import type { ModelReferenceEntity } from "@com.mgmtp.a12.print/print-model-api/model";
import { Icon, InputElements } from "@com.mgmtp.a12.widgets/widgets-core";
import { ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";

import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { ValidationSelectors } from "../../redux/validation/selectors.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";

import {
	StyledAliasColumn,
	StyledButtonSetting,
	StyledCollapsibleSetting,
	StyledFieldAliasWrapper,
	StyledModelReferenceCard,
	StyledModelReferenceRow,
	StyledReferenceError,
	StyledReferenceField,
} from "./ModelReferenceCard.styled.js";

interface ModelReferenceCardProps {
	modelReference: ModelReferenceEntity;
	dataTestId: string;
	/** Splits the row into name and alias column. An empty alias still splits it, so the names stay lined up. */
	alias?: string;
	/** What the settings button opens below the row. The card stays unaware of what is being edited. */
	renderSettings?: (collapse: () => void) => React.ReactNode;
	/** Highlights the card and opens its settings right away. */
	isNewReference?: boolean;
}

export const ModelReferenceCard = ({
	modelReference,
	dataTestId,
	alias,
	renderSettings,
	isNewReference,
}: ModelReferenceCardProps) => {
	const isSplitRow = alias !== undefined;
	const [isOpenSetting, setIsOpenSetting] = React.useState(isNewReference);
	const [highlight, setHighlight] = React.useState(isNewReference);
	const localizer = PrintLocalizer.useLocalizer();
	const errorMessageLocalizer = PrintLocalizer.useErrorMessageLocalizer();
	const referenceError = useSelector((state: PrintEngineState) =>
		ValidationSelectors.modelReferenceError(state, modelReference.id)
	);
	const errorMessage = errorMessageLocalizer(referenceError?.[ErrorSeverity.ERROR]);
	// Inside the field a full message would be cut off at the width of the field; a compact one becomes a tooltip.
	const { error: errorInteraction } = useSelector(ValidationSelectors.validationInteraction);
	const isMessageShownInFull = Boolean(errorMessage) && errorInteraction !== "compact";

	const collapseSettings = React.useCallback(() => setIsOpenSetting(false), []);

	React.useEffect(() => {
		let timerId: ReturnType<typeof setTimeout> | undefined;
		if (highlight) {
			timerId = setTimeout(() => {
				setHighlight(false);
			}, 500);
		}
		return () => {
			clearTimeout(timerId);
		};
	}, [highlight]);

	return (
		<StyledModelReferenceCard data-testid={dataTestId} highlight={highlight}>
			<StyledModelReferenceRow>
				<StyledFieldAliasWrapper>
					{isMessageShownInFull && (
						<StyledReferenceError>
							<InputElements.Error dataRole="model-reference-error-message" errorMessage={errorMessage} />
						</StyledReferenceError>
					)}
					<StyledReferenceField
						value={modelReference.reference}
						readonly
						errorMessage={isMessageShownInFull ? undefined : errorMessage}
						$fullWidth={!isSplitRow}
					/>
					{isSplitRow && <StyledAliasColumn>{alias}</StyledAliasColumn>}
				</StyledFieldAliasWrapper>
				{renderSettings && (
					<StyledButtonSetting
						title={localizer(RESOURCE_KEYS.button[isOpenSetting ? "closeSetting" : "openSetting"])}
						icon={<Icon>settings</Icon>}
						onClick={() => setIsOpenSetting(true)}
						isOpen={Boolean(isOpenSetting)}
					></StyledButtonSetting>
				)}
			</StyledModelReferenceRow>

			{renderSettings && isOpenSetting && (
				<StyledCollapsibleSetting>{renderSettings(collapseSettings)}</StyledCollapsibleSetting>
			)}
		</StyledModelReferenceCard>
	);
};
