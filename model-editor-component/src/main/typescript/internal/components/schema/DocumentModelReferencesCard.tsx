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

import { ModelReference } from "@com.mgmtp.a12.base/base-model-api/lib/main/header/index.js";
import { Button } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/main/button.view.js";
import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/index.js";
import { ButtonGroup } from "@com.mgmtp.a12.widgets/widgets-core/lib/button-group/index.js";

import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { InteractionLogActions, TransactionLogStateActions } from "../../redux/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";

import { CustomTextLineStateless } from "../forms/custom-base-input-components/index.js";

import {
	StyledCollapsibleSetting,
	StyledSchemaAliasColumn,
	StyledSchemaCard,
	StyledSchemaCardContainer,
	StyledButtonSetting,
	StyledTextLineStatelessReference,
} from "./DocumentModelReferencesCard.styled.js";

interface DocumentModelReferencesCardProps {
	modelReference: ModelReference;
	isNewReference?: boolean;
}

export const DocumentModelReferencesCard = ({ modelReference, isNewReference }: DocumentModelReferencesCardProps) => {
	const [isOpenSetting, setIsOpenSetting] = React.useState(isNewReference);
	const [highlight, setHighlight] = React.useState(isNewReference);
	const localizer = PrintLocalizer.useLocalizer();

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
		<StyledSchemaCardContainer data-testid="document-model-reference-card" highlight={highlight}>
			<StyledSchemaCard>
				<StyledTextLineStatelessReference value={modelReference.reference} readonly />
				<StyledSchemaAliasColumn>{modelReference.alias}</StyledSchemaAliasColumn>
				<StyledButtonSetting
					title={localizer(RESOURCE_KEYS.button[isOpenSetting ? "closeSetting" : "openSetting"])}
					icon={<Icon>settings</Icon>}
					onClick={() => setIsOpenSetting(true)}
					isOpen={Boolean(isOpenSetting)}
				></StyledButtonSetting>
			</StyledSchemaCard>

			{isOpenSetting && (
				<CollapsibleSchemaSetting
					modelReference={modelReference}
					onCollapse={() => setIsOpenSetting(false)}
				></CollapsibleSchemaSetting>
			)}
		</StyledSchemaCardContainer>
	);
};

interface CollapsibleSchemaSettingProps {
	modelReference: ModelReference;
	onCollapse: () => void;
}

export const CollapsibleSchemaSetting = ({ modelReference, onCollapse }: CollapsibleSchemaSettingProps) => {
	const dispatch = useDispatch();
	const printHeader = useSelector(PrintEngineSelectors.printHeader);
	const localizer = PrintLocalizer.useLocalizer();
	const [alias, setAlias] = React.useState(modelReference.alias);

	const handleUpdateAlias = React.useCallback(() => {
		onCollapse();
		if (alias?.trim() === modelReference.alias) {
			return;
		}

		dispatch(
			InteractionLogActions.start({
				description: RESOURCE_KEYS.interaction.schema.schemaCard.changeAlias,
				region: "sidebar",
				transactionLogActions: [
					TransactionLogStateActions.updatePrintHeader({
						data: {
							...printHeader,
							modelReferences: (printHeader.modelReferences || []).map(reference => {
								if (reference.reference === modelReference.reference) {
									return {
										...reference,
										alias: alias?.trim(),
									};
								}
								return reference;
							}),
						},
					}),
				],
			})
		);
	}, [alias, dispatch, modelReference.alias, modelReference.reference, onCollapse, printHeader]);

	const onChangeAlias = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		setAlias(event.target.value);
	}, []);

	const saveButtonLabel = localizer(RESOURCE_KEYS.button.save);
	const cancelButtonLabel = localizer(RESOURCE_KEYS.button.cancel);

	return (
		<StyledCollapsibleSetting>
			{localizer(RESOURCE_KEYS.sidebar.schema.aliasLabel)}
			<CustomTextLineStateless value={alias} style={{ flex: 1 }} onChange={onChangeAlias} />
			<ButtonGroup>
				<Button
					title={saveButtonLabel}
					icon={<Icon size={"big"}>check</Icon>}
					onClick={handleUpdateAlias}
					primary
				/>
				<Button
					title={cancelButtonLabel}
					icon={<Icon size={"big"}>close</Icon>}
					destructive
					onClick={onCollapse}
				/>
			</ButtonGroup>
		</StyledCollapsibleSetting>
	);
};
