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
import { useContext, useMemo } from "react";

import { LayoutGrid } from "@com.mgmtp.a12.widgets/widgets-core/lib/layout/layout-grid/main/layout-grid.view.js";
import { DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/lib/errors/deep-partial-error-map.js";
import { HintTooltip } from "@com.mgmtp.a12.widgets/widgets-core";

import { Action, SET_ORPHAN, SET_WIDOW, SetOrphanWidowPayload } from "../../store/action.js";
import { TypesettingEditorContext } from "../../store/context.js";
import { TypesettingModel } from "../../../api/model/typesetting-model.js";
import { useDefaultLocalizer, useLocalizer } from "../../localization/localizer.js";
import { RESOURCE_KEYS } from "../../localization/keys.js";

import { CustomTextField } from "../input/CustomTextField.js";

const { Grid, Row, Column } = LayoutGrid;
const NUMBER_PROPS = { type: "number", min: 0, max: 10 };

interface OrphanWidowSettingsProps {
	orphan?: number;
	widow?: number;
	errorMap?: DeepPartialErrorMap<TypesettingModel>;
}

export const OrphanWidowSettings = ({ orphan, widow, errorMap }: OrphanWidowSettingsProps) => {
	const { dispatch } = useContext(TypesettingEditorContext);
	const defaultLocalizer = useDefaultLocalizer();
	const localizer = useLocalizer();

	const onOrphanChange = (value: string) => {
		const action: Action<SetOrphanWidowPayload> = {
			type: SET_ORPHAN,
			data: value !== undefined && value !== "" ? Number(value) : undefined,
		};
		dispatch(action);
	};

	const onWidowChange = (value: string) => {
		const action: Action<SetOrphanWidowPayload> = {
			type: SET_WIDOW,
			data: value !== undefined && value !== "" ? Number(value) : undefined,
		};
		dispatch(action);
	};

	const orphanError = useMemo(() => {
		const error = errorMap?.content?.orphan?.["@error"]?.[0];
		return error ? defaultLocalizer(...error.errorMessage) : undefined;
	}, [errorMap, defaultLocalizer]);

	const widowError = useMemo(() => {
		const error = errorMap?.content?.widow?.["@error"]?.[0];
		return error ? defaultLocalizer(...error.errorMessage) : undefined;
	}, [errorMap, defaultLocalizer]);

	return (
		<Grid>
			<Row>
				<Column size={{ sm: 12, md: 6, lg: 6 }}>
					<CustomTextField
						value={String(orphan ?? "")}
						inputProps={NUMBER_PROPS}
						onValueChange={onOrphanChange}
						errorMessage={orphanError}
						label={localizer(RESOURCE_KEYS.orphansWidowsSettings.orphans.label)}
						addonAfter={
							<HintTooltip
								text={localizer(RESOURCE_KEYS.orphansWidowsSettings.orphans.hint)}
								key="hint"
							/>
						}
					/>
				</Column>
				<Column size={{ sm: 12, md: 6, lg: 6 }}>
					<CustomTextField
						value={String(widow ?? "")}
						inputProps={NUMBER_PROPS}
						onValueChange={onWidowChange}
						errorMessage={widowError}
						label={localizer(RESOURCE_KEYS.orphansWidowsSettings.widows.label)}
						addonAfter={
							<HintTooltip text={localizer(RESOURCE_KEYS.orphansWidowsSettings.widows.hint)} key="hint" />
						}
					/>
				</Column>
			</Row>
		</Grid>
	);
};
