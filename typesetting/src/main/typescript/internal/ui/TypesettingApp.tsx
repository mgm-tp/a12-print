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
import "@com.mgmtp.a12.widgets/widgets-core/lib/theme/basic.css";

import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { StyleSheetManager, ThemeProvider, styled } from "styled-components";

import { GlobalStyles, flatCompactTheme, WidgetsRoot, shouldForwardProp } from "@com.mgmtp.a12.widgets/widgets-core";
import {
	alwaysFalseCondition,
	alwaysTrueCondition,
	CustomConditionName,
} from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { TypesettingModelEditor } from "../../a12internal/ui/app/typesetting-model-editor/TypesettingModelEditor.js";

import { TypesettingModelValidator } from "../api/validation/typesetting-model-validator.js";

const mountPoint = document.getElementById("component-root");

const AppContent = styled.div`
	margin: auto;
	margin-top: 10%;
	width: 50%;
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const devProps: Record<string, any> = {
	roles: ["admin", "guest"],
};

TypesettingModelValidator.getInstance()
	.getCustomConditionFactory()
	.setCustomCondition(
		CustomConditionName.RolesModelPresent,
		devProps.roles?.length ? alwaysTrueCondition : alwaysFalseCondition
	);
TypesettingModelValidator.getInstance()
	.getCustomConditionFactory()
	.setCustomCondition(
		CustomConditionName.RolesModelNotPresent,
		!devProps.roles?.length ? alwaysTrueCondition : alwaysFalseCondition
	);

export const TypesttingApp = () => {
	return (
		<StrictMode>
			<StyleSheetManager shouldForwardProp={shouldForwardProp}>
				<ThemeProvider theme={flatCompactTheme}>
					<GlobalStyles />
					<WidgetsRoot>
						<AppContent>
							<TypesettingModelEditor
								onSave={model => console.log(model)}
								onChange={model => console.log(model)}
								availableRoles={devProps.roles}
							/>
						</AppContent>
					</WidgetsRoot>
				</ThemeProvider>
			</StyleSheetManager>
		</StrictMode>
	);
};

ReactDOM.createRoot(mountPoint!).render(<TypesttingApp />);
