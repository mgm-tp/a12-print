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

import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react/lib/main/index.js";
import { Button } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/index.js";
import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/index.js";

import { GlobalOverride } from "../../../global-override.styled.js";

import { PrintModelEditor } from "../PrintModelEditor.js";
import { useContextApi } from "../hooks/use-context-api.js";

import { createGlobalFontFaces } from "./font-face.js";
import { SidebarFooter } from "./SidebarFooter.js";
import { PrintEditorSMEBaseProps } from "./types.js";

interface PrintEditorAppProps extends PrintEditorSMEBaseProps {
	printModelId: string;
	isNewPrintModel: boolean;
}
export const PrintModelEditorSMEView = ({
	printModelId,
	customFonts,
	onClose,
	onPreview,
	onDeploy,
	isNewPrintModel,
	isConnectedToServer,
	modelIconPath,
}: PrintEditorAppProps) => {
	const { localizer } = useContext(LocalizerContext);

	const contextApi = useContextApi({ customFonts, localizer });
	const fontMap = contextApi.getFonts();

	const toolbarProps = useMemo(() => {
		return {
			modelIcon: modelIconPath,
			rightSlots: [
				<Button key={"preview"} onClick={onPreview} icon={<Icon>print</Icon>} title="Print" />,
				<Button key={"close"} onClick={onClose} icon={<Icon>close</Icon>} title="Close" />,
			],
		};
	}, [modelIconPath, onClose, onPreview]);

	return (
		<>
			<style>{createGlobalFontFaces(fontMap)}</style>
			<GlobalOverride />
			<PrintModelEditor
				contextApi={contextApi}
				printModelId={printModelId}
				toolbarProps={toolbarProps}
				isNewPrintModel={isNewPrintModel}
				sidebarFooter={
					<SidebarFooter onClose={onClose} onDeploy={onDeploy} isConnectedToServer={isConnectedToServer} />
				}
			/>
		</>
	);
};
