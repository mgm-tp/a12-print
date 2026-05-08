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
import { useMemo } from "react";

import { Model } from "@com.mgmtp.a12.base/base-model-api/lib/main/model";
import { PrintModelEditorLight } from "@com.mgmtp.a12.print/print-model-editor-component/lib/app/PrintModelEditorLight";
import { PrintModelMarshaller } from "@com.mgmtp.a12.print/print-model-api-utils/lib/marshaller";
import { DocumentModel, DocumentServiceFactory } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { FontResourceMap } from "@com.mgmtp.a12.print/print-fonts/lib/types/font";

import { StyledPrintModelEditorLightWrapper } from "./PrintModelEditorLightWrapper.styled";

const printModelMarshaller = new PrintModelMarshaller();
const documentModelMarshaller = new DocumentServiceFactory().getDocumentModelSerializer();

interface PrintEditorProps {
	printModel: Model;
	documentModels?: Model[];
	customFonts?: FontResourceMap;
}

export function PrintModelEditorLightWrapper({
	printModel,
	documentModels = [],
	customFonts,
}: Readonly<PrintEditorProps>) {
	const firstDocumentModel = documentModels[0];

	const documentModelInstance: DocumentModel | null = useMemo(() => {
		if (!firstDocumentModel) {
			return null;
		}
		return documentModelMarshaller.deserialize(JSON.stringify(firstDocumentModel));
	}, [firstDocumentModel]);

	const printModelInstance = useMemo(() => {
		if (!documentModelInstance) {
			return null;
		}
		const res = printModelMarshaller.deserialize(JSON.stringify(printModel), [documentModelInstance]);
		return res.result;
	}, [printModel, documentModelInstance]);

	if (!documentModelInstance || !printModelInstance) {
		return null;
	}

	return (
		<StyledPrintModelEditorLightWrapper className="print-editor">
			<PrintModelEditorLight
				printModel={printModelInstance}
				documentModel={documentModelInstance}
				onChange={(printModel, dirty) => {
					console.log("Print model changed", printModel, dirty);
				}}
				customFonts={customFonts}
			/>
		</StyledPrintModelEditorLightWrapper>
	);
}
