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

import { Breadcrumb, Link, Icon } from "@com.mgmtp.a12.widgets/widgets-core";

import { PrintEngineSelectors } from "../../store/selectors.js";
import { EditorConst } from "../../constant/editor.js";
import { PrintLocalizer } from "../../localization/index.js";
import { ElementTypes } from "../../constant/elements.js";
import { formatNumberToString } from "../../utils/index.js";
import { isAreaStackEntry } from "../../redux/index.js";

import { EditorContext } from "../editor-stage/editor-context.js";

const { MM_TO_CM } = EditorConst;

export const BreadcrumbNavigation = () => {
	const { openPreviousStage } = React.useContext(EditorContext);
	const wrappers = useSelector(PrintEngineSelectors.wrappers);
	const currentContainerElement = useSelector(PrintEngineSelectors.currentContainerElement);
	const localizer = PrintLocalizer.useLocalizer();

	if (!wrappers.length || !currentContainerElement) {
		return null;
	}

	return (
		<Breadcrumb>
			<Breadcrumb.Item>
				<Link onClick={() => openPreviousStage(currentContainerElement)}>{currentContainerElement.title}</Link>
			</Breadcrumb.Item>

			{wrappers.map((wrapper, idx) => {
				const wrapperWidth = formatNumberToString(MM_TO_CM(wrapper.dimensions?.width?.value || 0));
				const wrapperHeight = formatNumberToString(MM_TO_CM(wrapper.dimensions?.height?.value || 0));
				const wrapperType = localizer(ElementTypes[wrapper.type]?.name || "");
				const isWrapperRepeatableArea = isAreaStackEntry(wrapper) && !!wrapper?.dataContexts?.length;
				return (
					<Breadcrumb.Item key={wrapper.id}>
						{wrapper.id && (
							<Link
								onClick={() =>
									idx !== wrappers.length - 1 &&
									openPreviousStage(currentContainerElement, wrapper.id)
								}
							>
								{isWrapperRepeatableArea && <Icon>repeat</Icon>}
								{wrapperType} (w: {wrapperWidth} cm; h: {wrapperHeight} cm)
							</Link>
						)}
					</Breadcrumb.Item>
				);
			})}
		</Breadcrumb>
	);
};
