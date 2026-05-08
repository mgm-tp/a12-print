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
import { memo, useMemo } from "react";
import { useSelector } from "react-redux";
import parse from "html-react-parser";
import sanitizeHtml from "sanitize-html";

import { BaseTypesettingApplier } from "@com.mgmtp.a12.print/print-typesetting/lib/internal/api/applier/TypesettingApplier.js";
import { StaticHyphenatorKey } from "@com.mgmtp.a12.print/print-typesetting/lib/internal/api/constant/static-hyphenator.js";

import { PrintEngineSelectors } from "../../store/selectors.js";
import { PrintEngineState } from "../../store/root-reducer.js";
import { useTypesettingModelData } from "../../hooks/use-typesetting-model-data.js";

interface TypeSettingApplierProps {
	children: string;
	textStyleId?: string;
}

export const TypeSettingApplier = memo(function TypeSettingApplier({ children, textStyleId }: TypeSettingApplierProps) {
	const textStyle = useSelector((state: PrintEngineState) =>
		textStyleId ? PrintEngineSelectors.textStyle(state, textStyleId) : undefined
	);
	const typesettingModel = useTypesettingModelData(textStyle?.typesettingModelName);

	const typesettingApplier = useMemo(() => {
		return new BaseTypesettingApplier(
			textStyle?.staticHyphenator as unknown as StaticHyphenatorKey,
			typesettingModel,
			"\u00AD",
			'<span style="white-space: nowrap;">',
			"</span>"
		);
	}, [textStyle?.staticHyphenator, typesettingModel]);

	/*// @ts-expect-error Fix ESM default import issue */
	return <>{parse(sanitize(typesettingApplier.applyToHtml(children)))}</>;
});

function sanitize(html: string) {
	return sanitizeHtml(html, {
		allowedTags: ["span"],
		allowedAttributes: {
			span: ["style"],
		},
		disallowedTagsMode: "discard",
		allowedSchemes: [],
		allowedSchemesByTag: {},
		allowedSchemesAppliedToAttributes: [],
		allowProtocolRelative: false,
		enforceHtmlBoundary: true,
	});
}
