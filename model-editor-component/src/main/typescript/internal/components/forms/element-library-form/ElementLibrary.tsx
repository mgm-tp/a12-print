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
import { useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { nanoid } from "nanoid";

import { CollapsiblePanel } from "@com.mgmtp.a12.widgets/widgets-core";
import {
	ElementType,
	type PartialValidPlaceableReference,
	type PrintModelFragmentElement,
} from "@com.mgmtp.a12.print/print-model-api/model";

import { PrintLocalizer } from "../../../localization/localizer.js";
import { RESOURCE_KEYS } from "../../../localization/keys.js";
import { ElementTypes, TOOLBOX_ELEMENTS } from "../../../constant/elements.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";
import { createMmMeasure } from "../../../utils/measure-utils.js";
import {
	DEFAULT_ELEMENT_CONTAINER_HEIGHT,
	DEFAULT_ELEMENT_HEIGHT,
	DEFAULT_ELEMENT_WIDTH,
} from "../../../utils/elements-utils.js";
import type { DragItem } from "../../../types/drag.js";

import { DragSourceListItem } from "./DragSourceListItem.js";
import { ListItem } from "./ListItem.js";
import { ElementItemWrapper, StyledEmptyLibraryMessage } from "./ElementLibrary.styled.js";

type ElementLibraryProps = {
	isFragmentLibrary?: boolean;
};

export const ElementLibrary = ({ isFragmentLibrary }: ElementLibraryProps) => {
	const localizer = PrintLocalizer.useLocalizer();

	const [elementLibraryOpen, setElementLibraryOpen] = useState(true);
	const toggleElementLibrary = useCallback(() => setElementLibraryOpen(!elementLibraryOpen), [elementLibraryOpen]);

	const isDinTemplateSegmentEditor = useSelector(PrintEngineSelectors.isDinTemplateSegmentEditor);
	const isDinEditable = useSelector(PrintEngineSelectors.isDinEditable);
	const isIncomingDinTemplatePrintModel = useSelector(PrintEngineSelectors.isIncomingDinTemplatePrintModel);
	const selectableFragmentElements = useSelector(PrintEngineSelectors.selectableFragmentElements);

	const elementItems = useMemo(() => {
		const showEmptyLibrary = isDinTemplateSegmentEditor && !isDinEditable;
		if (showEmptyLibrary) {
			return [];
		}

		return TOOLBOX_ELEMENTS.map(element => ({
			dragType: element,
			dragElement: ElementTypes[element],
		}))
			.filter(({ dragType }) => (isIncomingDinTemplatePrintModel ? dragType === ElementType.BoundingBox : true))
			.map(({ dragType, dragElement }) => {
				return dragElement ? (
					<DragSourceListItem
						dragType={dragType}
						item={getNewElement(dragType as ElementType)}
						key={`dragElementItem-${dragType}`}
					>
						<ListItem name={localizer(dragElement.name)} iconName={dragElement.iconName} />
					</DragSourceListItem>
				) : null;
			});
	}, [localizer, isDinTemplateSegmentEditor, isIncomingDinTemplatePrintModel, isDinEditable]);

	const elementLibraryContent = useMemo(
		() =>
			elementItems.length > 0 ? (
				<ElementItemWrapper data-testid="element-library-items">{elementItems}</ElementItemWrapper>
			) : (
				// Without this the DIN cases render a blank panel whose only explanation is the
				// warning icon tooltip in the form header, which no screen reader announces here.
				<StyledEmptyLibraryMessage
					data-testid="element-library-empty"
					label={localizer(RESOURCE_KEYS.elementForm.elementLibrary.empty)}
					variant="info"
					focusOnMessage={false}
				/>
			),
		[elementItems, localizer]
	);

	const fragmentLibraryContent = useMemo(() => {
		return (
			<ElementItemWrapper data-testid="element-fragment-library-items">
				{selectableFragmentElements.map(({ model, element }) => {
					const dragElement = ElementTypes[element.type];
					return dragElement ? (
						<DragSourceListItem
							dragType={element.type}
							item={getNewElementFragment(element, model)}
							key={`dragElementItem-${model}-${element.id}`}
						>
							<ListItem name={element.name} iconName={dragElement.iconName} />
						</DragSourceListItem>
					) : null;
				})}
			</ElementItemWrapper>
		);
	}, [selectableFragmentElements]);

	return (
		<CollapsiblePanel
			title={localizer(
				isFragmentLibrary
					? RESOURCE_KEYS.elementForm.fragmentLibrary.headline
					: RESOURCE_KEYS.elementForm.elementLibrary.elementsPanel
			)}
			onClick={toggleElementLibrary}
		>
			{elementLibraryOpen ? (isFragmentLibrary ? fragmentLibraryContent : elementLibraryContent) : undefined}
		</CollapsiblePanel>
	);
};

export const getNewElement = (dragType: ElementType): DragItem => {
	const placeableReference: PartialValidPlaceableReference = {
		id: nanoid(),
		refId: nanoid(),
		dimensions: {
			id: nanoid(),
			minWidth: createMmMeasure(
				dragType === ElementType.BoundingBox || dragType === ElementType.Area
					? DEFAULT_ELEMENT_CONTAINER_HEIGHT
					: DEFAULT_ELEMENT_WIDTH
			),
			minHeight: createMmMeasure(
				dragType === ElementType.BoundingBox || dragType === ElementType.Area
					? DEFAULT_ELEMENT_CONTAINER_HEIGHT
					: DEFAULT_ELEMENT_HEIGHT
			),
		},
		position: { id: nanoid(), x: createMmMeasure(0), y: createMmMeasure(0) },
	};

	return {
		...placeableReference,
		newType: dragType,
	};
};

export const getNewElementFragment = (element: PrintModelFragmentElement, model: string): DragItem => {
	const placeableReference: PartialValidPlaceableReference = {
		id: nanoid(),
		refId: element.id,
		model,
		dimensions: {
			id: nanoid(),
			minWidth: createMmMeasure(element.fragmentDimensions.width.value),
			minHeight: createMmMeasure(element.fragmentDimensions.height.value),
		},
		position: { id: nanoid(), x: createMmMeasure(0), y: createMmMeasure(0) },
	};

	return {
		...placeableReference,
		newType: element.type,
		fragmentDimensions: element.fragmentDimensions,
	};
};
