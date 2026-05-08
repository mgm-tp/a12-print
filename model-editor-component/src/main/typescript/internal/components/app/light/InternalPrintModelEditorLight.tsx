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
import { Provider } from "react-redux";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useContext, useMemo } from "react";

import { LocalizerContext } from "@com.mgmtp.a12.utils/utils-localization-react/lib/main/index.js";
import { PrintModel } from "@com.mgmtp.a12.print/print-model-api/lib/model/print-model.js";
import { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { FontResourceMap } from "@com.mgmtp.a12.print/print-fonts/lib/types/font.js";

import { EditorComponentContext } from "../../../api/index.js";
import { HiddenHeightContextWrapper } from "../../hidden-height-context-wrapper/HiddenHeightContextWrapper.js";
import { GlobalOverride } from "../../../global-override.styled.js";
import { ConfirmationDialog } from "../../confirmation-dialog/ConfirmationDialog.js";
import { DragListLayer } from "../../drag-and-drop/DragListLayer.js";

import { createGlobalFontFaces } from "../sme/font-face.js";
import { useContextApi } from "../hooks/use-context-api.js";

import { PrintEditorView } from "./views/PrintEditorView.js";
import { setupStoreLight } from "./utils/setup-store-light.js";

interface InternalPrintModelEditorLightProps {
	readonly printModel: PrintModel;
	readonly documentModel: DocumentModel;
	readonly customFonts?: FontResourceMap;
	onChange(printModel: PrintModel, dirty?: boolean): void;
}

export const InternalPrintModelEditorLight: React.ComponentType<InternalPrintModelEditorLightProps> =
	function InternalPrintModelEditorLight({ printModel, documentModel, customFonts, onChange }) {
		const { localizer, locale } = useContext(LocalizerContext);

		const contextApi = useContextApi({ customFonts, localizer });
		const fontMap = contextApi.getFonts();

		const store = useMemo(
			() => setupStoreLight(printModel, [documentModel], fontMap, locale, onChange),
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[documentModel, fontMap, printModel.header.id]
		);

		return (
			<Provider store={store}>
				<EditorComponentContext.Provider value={contextApi}>
					<DndProvider backend={HTML5Backend}>
						<HiddenHeightContextWrapper>
							<GlobalOverride />
							<style>{createGlobalFontFaces(fontMap)}</style>
							<ConfirmationDialog />
							<DragListLayer />
							<PrintEditorView />
						</HiddenHeightContextWrapper>
					</DndProvider>
				</EditorComponentContext.Provider>
			</Provider>
		);
	};
