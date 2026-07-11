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

import { Icon, Button } from "@com.mgmtp.a12.widgets/widgets-core";
import type {
	PartialAnyPrintModelElement,
	PartialValidPlaceableReference,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { PartialArea, PartialBoundingBox, PartialOverride } from "@com.mgmtp.a12.print/print-model-api/model";

import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { ElementsUtils } from "../../utils/index.js";

import { EditorContext } from "../editor-stage/editor-context.js";

interface OpenWrapperStageButtonProps {
	element: PartialAnyPrintModelElement;
	reference?: PartialValidPlaceableReference;
}

export const OpenWrapperStageButton = ({ element, reference }: OpenWrapperStageButtonProps) => {
	const localizer = PrintLocalizer.useLocalizer();
	const { openWrapperStage } = React.useContext(EditorContext);

	const handleOpenWrapperStage = () => {
		if (!ElementsUtils.isWrapperElement(element)) {
			throw new Error(`Expected element of type Bounding Box/Area/Switch but got ${element.type}`);
		}

		let dimension;
		let dataContext;

		if (PartialBoundingBox.isInstance(element)) {
			dimension = element.boundingBox?.dimensions;
		} else if (PartialArea.isInstance(element)) {
			dimension = element.area?.dimensions;
			dataContext = [...(element?.area?.dataContexts || [])];
		} else if (PartialOverride.isInstance(element)) {
			if (reference) {
				dimension = reference.dimensions;
			}
		} else {
			dimension = element.switch?.dimensions;
		}

		openWrapperStage(element.id, element.type, dimension, dataContext, { placeableReference: reference });
	};

	return (
		<Button
			title={localizer(RESOURCE_KEYS.button.edit)}
			secondary
			icon={<Icon>edit</Icon>}
			onClick={handleOpenWrapperStage}
		/>
	);
};
