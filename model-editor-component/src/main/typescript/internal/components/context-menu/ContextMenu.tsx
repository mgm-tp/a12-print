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
import { useDispatch, useSelector } from "react-redux";

import type { PartialValidPlaceableReference } from "@com.mgmtp.a12.print/print-model-api/model";
import { PartialOverride } from "@com.mgmtp.a12.print/print-model-api/model";
import { List, Icon } from "@com.mgmtp.a12.widgets/widgets-core";

import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import type { PlainMeasurePosition } from "../../utils/index.js";
import { createPlainMmMeasure, createPlainMmMeasureFromPx, getShortcutText } from "../../utils/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { ValidationSelectors } from "../../redux/validation/selectors.js";
import { DetailViewActions, ValidationCounter } from "../../redux/index.js";
import type { ContextMenuItem } from "../../types/index.js";
import { ContextMenuOption } from "../../types/index.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";

import { ErrorBadge } from "../badge/ValidationBadge.js";
import { EditorContext } from "../editor-stage/editor-context.js";
import { Popup } from "../layout/index.js";

import { ContextMenuContext } from "./ContextMenuWrapper.js";

const CONTEXT_MENU_ITEMS: ContextMenuItem[] = [
	{
		id: ContextMenuOption.Copy,
		label: RESOURCE_KEYS.editor.contextMenu.copy,
		icon: <Icon>content_copy</Icon>,
		meta: getShortcutText("C", { withCtrl: true }),
	},
	{
		id: ContextMenuOption.Paste,
		label: RESOURCE_KEYS.editor.contextMenu.paste,
		icon: <Icon>content_paste</Icon>,
		meta: getShortcutText("V", { withCtrl: true }),
	},
	{
		id: ContextMenuOption.Group,
		label: RESOURCE_KEYS.editor.contextMenu.groupElement,
		icon: <Icon>padding</Icon>,
		meta: getShortcutText("G", { withCtrl: true }),
	},
	{
		id: ContextMenuOption.Delete,
		label: RESOURCE_KEYS.editor.contextMenu.delete,
		icon: <Icon variant="error">delete</Icon>,
		meta: getShortcutText("Delete"),
		isDivider: true,
	},
	{
		id: ContextMenuOption.HideConditions,
		label: RESOURCE_KEYS.editor.contextMenu.hideConditions,
		icon: <Icon>visibility_off</Icon>,
	},
];

interface ContextMenuProps {
	editorState: HTMLDivElement | null;
	selected: string[];
	elementReferences: readonly PartialValidPlaceableReference[];
	hovered: PartialValidPlaceableReference | null;
	setSelected: React.Dispatch<React.SetStateAction<string[]>>;
	onContextItemClick: (
		event: React.MouseEvent<HTMLElement>,
		contextItem: ContextMenuItem,
		position: PlainMeasurePosition
	) => void;
	children?: React.ReactNode;
}

export const ContextMenu: React.FunctionComponent<ContextMenuProps> = ({
	editorState,
	selected,
	elementReferences,
	hovered,
	onContextItemClick,
	setSelected,
	children,
}) => {
	const dispatch = useDispatch();
	const { outerContextMenu, setOuterContextMenu, showContextMenu, setShowContextMenu } =
		React.useContext(ContextMenuContext);
	const { copyElements } = React.useContext(EditorContext);
	const [additionalItems, setAdditionalItems] = React.useState<React.ReactElement[]>([]);

	const printModelElements = useSelector((state: PrintEngineState) =>
		PrintEngineSelectors.multiplePrintModelElements(state, selected)
	);
	const placeableRefErrorMap = useSelector((state: PrintEngineState) =>
		ValidationSelectors.currentPlaceableReference(
			state,
			elementReferences.find(ref => ref.refId === selected[0])?.id
		)
	);
	const hasOnlyContainerElement = useSelector((state: PrintEngineState) =>
		PrintEngineSelectors.hasOnlyContainerElement(state, selected)
	);
	const [position, setPosition] = React.useState<PlainMeasurePosition & { clientX: number; clientY: number }>({
		x: createPlainMmMeasure(0),
		y: createPlainMmMeasure(0),
		clientX: 0,
		clientY: 0,
	});
	const [items, setItems] = React.useState<ContextMenuItem[]>([]);

	const localizer = PrintLocalizer.useLocalizer();
	const getErrorTitle = useErrorTitle();

	const isOverrideElementSelected = React.useMemo(
		() => printModelElements.some(el => PartialOverride.isInstance(el)),
		[printModelElements]
	);

	const onContextMenu = React.useCallback(
		(event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
			event.preventDefault();
			if (editorState) {
				if (hovered && !selected.includes(hovered.refId)) {
					const newSelected = [hovered.refId];
					setSelected(newSelected);
					dispatch(DetailViewActions.updateVisibilityConfig({ selected: newSelected }));
				} else if (!hovered) {
					setSelected([]);
				}

				const editorRect = editorState.getBoundingClientRect();
				setPosition({
					x: createPlainMmMeasureFromPx(event.clientX - editorRect.x),
					y: createPlainMmMeasureFromPx(event.clientY - editorRect.y),
					clientX: event.clientX,
					clientY: event.clientY,
				});
				setItems(CONTEXT_MENU_ITEMS);
				setAdditionalItems(outerContextMenu);
				setShowContextMenu(true);
			}
		},
		[dispatch, editorState, hovered, outerContextMenu, selected, setSelected, setShowContextMenu]
	);

	React.useEffect(() => {
		if (!hovered) {
			setOuterContextMenu([]);
		}
	}, [hovered, setOuterContextMenu]);

	const hideMenu = React.useCallback(() => {
		setAdditionalItems([]);
		setShowContextMenu(false);
	}, [setShowContextMenu]);

	const ConditionalMenuList = React.useMemo(() => {
		const contentItems = items
			.map((contentItem, index) => {
				const disabled = isContextMenuItemDisabled(
					contentItem.id,
					isOverrideElementSelected,
					selected.length,
					copyElements,
					hasOnlyContainerElement
				);
				const isDivider = contentItem.isDivider || (index === items.length - 1 && additionalItems.length > 0);
				let meta = contentItem.meta;
				if (contentItem.id === ContextMenuOption.HideConditions && selected.length === 1) {
					const errorCount = ValidationCounter.from(placeableRefErrorMap?.hideConditions).error;
					meta = errorCount ? (
						<ErrorBadge
							type="descriptive"
							count={errorCount}
							title={getErrorTitle(errorCount)}
							standalone
						/>
					) : undefined;
				}

				if (contentItem.isSubHeader) {
					return (
						<List.SubHeader fill key={contentItem.id} graphic={contentItem.icon} meta={meta}>
							{localizer(contentItem.label)}
						</List.SubHeader>
					);
				}

				const onItemClick = (event: React.MouseEvent<HTMLElement>) => {
					onContextItemClick(event, contentItem, position);
					hideMenu();
				};

				return (
					<List.Item
						key={contentItem.id}
						text={localizer(contentItem.label)}
						graphic={contentItem.icon}
						onClick={onItemClick}
						disabled={disabled}
						divider={isDivider}
						meta={meta}
					/>
				);
			})
			.concat(additionalItems);

		return showContextMenu ? (
			<Popup position={position} onClose={hideMenu}>
				{contentItems}
			</Popup>
		) : null;
	}, [
		items,
		additionalItems,
		showContextMenu,
		position,
		hideMenu,
		isOverrideElementSelected,
		selected.length,
		copyElements,
		hasOnlyContainerElement,
		localizer,
		placeableRefErrorMap?.hideConditions,
		getErrorTitle,
		onContextItemClick,
	]);

	return (
		<div onContextMenu={onContextMenu}>
			{children}
			{ConditionalMenuList}
		</div>
	);
};

function isContextMenuItemDisabled(
	itemId: ContextMenuOption,
	isOverrideElementSelected: boolean,
	selectedItemsLength: number,
	copyElements: readonly PartialValidPlaceableReference[],
	hasOnlyContainerElement: boolean
): boolean {
	if (itemId === ContextMenuOption.Group && hasOnlyContainerElement) {
		return true;
	}

	if (
		[ContextMenuOption.Copy, ContextMenuOption.Delete, ContextMenuOption.Group].includes(itemId) &&
		!selectedItemsLength
	) {
		return true;
	}

	if (itemId === ContextMenuOption.Paste && copyElements.length === 0) {
		return true;
	}

	if (itemId === ContextMenuOption.HideConditions && selectedItemsLength !== 1) {
		return true;
	}

	return (
		isOverrideElementSelected &&
		(itemId === ContextMenuOption.Copy ||
			itemId === ContextMenuOption.Delete ||
			itemId === ContextMenuOption.HideConditions)
	);
}

const useErrorTitle = () => {
	const localizer = PrintLocalizer.useLocalizer();

	return React.useCallback(
		(errorCount: number) =>
			localizer(
				RESOURCE_KEYS.validation.title.contextMenu.hideConditions,
				PrintLocalizer.getLocalizableArgs({ count: errorCount })
			),
		[localizer]
	);
};
