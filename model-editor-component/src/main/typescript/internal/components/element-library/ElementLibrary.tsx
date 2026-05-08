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
import { nanoid } from "nanoid";

import { CalloutHeaderProps } from "@com.mgmtp.a12.widgets/widgets-core/lib/callout/main/template/callout.tpl.api.js";
import { Button } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/index.js";
import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/index.js";
import { CommentContainer } from "@com.mgmtp.a12.widgets/widgets-core/lib/comment/index.js";
import { ElementType, PartialValidPlaceableReference } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { ElementTypes, TOOLBOX_ELEMENTS } from "../../constant/elements.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { PrintEngineState } from "../../store/root-reducer.js";
import {
	createMmMeasure,
	DEFAULT_ELEMENT_WIDTH,
	DEFAULT_ELEMENT_HEIGHT,
	DEFAULT_ELEMENT_CONTAINER_HEIGHT,
} from "../../utils/index.js";
import { DragItem } from "../../types/index.js";

import { ElementItemWrapper } from "./ElementLibrary.styled.js";
import { DragSourceListItem } from "./DragSourceListItem.js";
import { ListItem } from "./ListItem.js";

export const ElementLibrary = () => {
	const [referenceElement, setReferenceElement] = React.useState<HTMLElement | null>(null);
	const [show, setShow] = React.useState<boolean>(false);
	const [floating, setFloating] = React.useState<boolean>(false);
	const isEditorActive = useSelector(PrintEngineSelectors.isEditorActive);
	const isIncomingDinTemplatePrintModel = useSelector(PrintEngineSelectors.isIncomingDinTemplatePrintModel);
	const isDinTemplateSegmentEditor = useSelector(PrintEngineSelectors.isDinTemplateSegmentEditor);
	const isDinEditable = useSelector(PrintEngineSelectors.isDinEditable);
	const localizer = PrintLocalizer.useLocalizer();

	const onCommentContainerClose = React.useCallback(() => {
		if (!floating) {
			setShow(false);
		}
	}, [floating]);

	const closeCallout = React.useCallback(() => setShow(false), []);

	const toggleElementLibrary = React.useCallback(() => {
		setShow(!show);
	}, [show]);

	const floatContainer = React.useCallback(() => {
		setFloating(!floating);
	}, [floating]);

	const buttonRefCallback = React.useCallback((ref: HTMLButtonElement | null) => {
		if (ref) {
			setReferenceElement(ref as HTMLElement);
		}
	}, []);

	const commentContainerHeader = useCommentContainerHeader(floating, floatContainer, closeCallout);

	const showEmptyLibrary = isDinTemplateSegmentEditor && !isDinEditable;

	return (
		<>
			<Button
				buttonRef={buttonRefCallback}
				onClick={toggleElementLibrary}
				title={localizer(RESOURCE_KEYS.editor.topMenu.elementLibrary.title)}
				icon={<Icon>category</Icon>}
				primary={show}
				secondary={!show}
				disabled={!isEditorActive}
			/>
			{show && referenceElement && (
				<CommentContainer
					style={{ width: 240 }}
					referenceElement={referenceElement}
					closeOnClickReferenceElement={false}
					resizeAndDragOptions={{
						referenceElement: referenceElement,
						closeOnOutsideClick: true,
						disableDragging: !floating,
						disableResizing: !floating,
					}}
					onClose={onCommentContainerClose}
					header={commentContainerHeader}
				>
					<ElementItemWrapper>
						{showEmptyLibrary
							? []
							: TOOLBOX_ELEMENTS.map(element => ({
									dragType: element,
									dragElement: ElementTypes[element],
								}))
									.filter(({ dragType }) =>
										isIncomingDinTemplatePrintModel ? dragType === ElementType.BoundingBox : true
									)
									.map(({ dragType, dragElement }) => {
										return dragElement ? (
											<DragSourceListItem
												dragType={dragType}
												item={getNewElement(dragType as ElementType)}
												key={`dragElementItem-${dragType}`}
											>
												<ListItem
													name={localizer(dragElement.name)}
													iconName={dragElement.iconName}
												/>
											</DragSourceListItem>
										) : null;
									})}
					</ElementItemWrapper>
				</CommentContainer>
			)}
		</>
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

function useCommentContainerHeader(
	floating: boolean,
	floatContainer: () => void,
	closeCallout: () => void
): CalloutHeaderProps {
	const localizer = PrintLocalizer.useLocalizer();
	const warningMessage = useSelector((state: PrintEngineState) => {
		if (PrintEngineSelectors.isIncomingDinTemplatePrintModel(state)) {
			return localizer(RESOURCE_KEYS.editor.topMenu.elementLibrary.incomingDinTemplate);
		} else if (
			PrintEngineSelectors.isDinTemplateSegmentEditor(state) &&
			!PrintEngineSelectors.isDinEditable(state)
		) {
			return localizer(RESOURCE_KEYS.editor.topMenu.elementLibrary.dinTemplateSegmentEditor);
		}
		return "";
	});

	return React.useMemo(
		() => ({
			title: <p>{localizer(RESOURCE_KEYS.editor.topMenu.elementLibrary.headline)}</p>,
			suffix: (
				<>
					{warningMessage && (
						<Icon variant={"warning"} title={warningMessage}>
							warning
						</Icon>
					)}
					<Button
						title={localizer(
							floating
								? RESOURCE_KEYS.editor.topMenu.elementLibrary.popupLibrary
								: RESOURCE_KEYS.editor.topMenu.elementLibrary.floatLibrary
						)}
						icon={<Icon>{floating ? "open_in_new_off" : "open_in_new"}</Icon>}
						onClick={floatContainer}
					/>
					<Button
						icon={<Icon>close</Icon>}
						title={localizer(RESOURCE_KEYS.button.close)}
						onClick={closeCallout}
					/>
				</>
			),
		}),
		[closeCallout, floatContainer, floating, warningMessage, localizer]
	);
}
