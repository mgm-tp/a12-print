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
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { nanoid } from "nanoid";
import { LineBreakNode, ParagraphNode } from "lexical";

import type {
	PartialAnyPrintModelElement,
	PartialReference,
	PartialText,
	PrintModelElement,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";
import { GlobalRegion, SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import {
	BoldButton,
	defaultTheme,
	Icon,
	InlineStyleTextNode,
	ItalicButton,
	RichTextEditor,
	Separator,
	TreeViewPlugin,
	UnderlineButton,
} from "@com.mgmtp.a12.widgets/widgets-core";

import { PrintEngineSelectors } from "../../store/selectors.js";
import { RESOURCE_KEYS } from "../../localization/index.js";
import { NavigationSelectors, TransactionLogStateActions } from "../../redux/index.js";
import { InteractionLogActions } from "../../redux/interaction-log/index.js";
import { useTextStyleSelector } from "../../hooks/use-text-style-selector.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";

import {
	PrintEntityNode,
	PrintTextNode,
	$createPrintTextNode,
	PrintParagraphNode,
	$createPrintParagraphNode,
} from "./nodes/index.js";
import {
	PrintEngineHtmlInputPlugin,
	PrintEngineHtmlOutputPlugin,
	EntityInsertPlugin,
	EntityLabelUpdatePlugin,
	EntityClickHandlerPlugin,
	EntityValidationBadgePlugin,
} from "./plugins/index.js";
import {
	createColorButton,
	createEntityButton,
	createRemoveStylesButton,
	createDebugButton,
	ColorButtonType,
} from "./toolbar/index.js";
import { EditorThemeStyles } from "./themes/editor-theme.js";

const IS_DEBUG_MODE = typeof process !== "undefined" && process?.env?.DEBUG;

interface RichTextEditorProps {
	element: PartialText;
	errorMessage?: React.ReactNode;
	onChangeEntity?: (entity?: PartialAnyPrintModelElement) => void;
	/** @internal Test-only callback to capture exported HTML on blur */
	_testOnBlur?: (html: string, entities: ReadonlyArray<PartialReference>) => void;
}

const EMPTY_HTML = "<p><br></p>";

export const NODE_CONFIG = [
	ParagraphNode,
	LineBreakNode,
	PrintParagraphNode,
	{
		replace: ParagraphNode,
		with: $createPrintParagraphNode,
		withKlass: PrintParagraphNode,
	},
	PrintTextNode,
	InlineStyleTextNode,
	{
		replace: InlineStyleTextNode,
		with: (node: InlineStyleTextNode) => $createPrintTextNode(node.__text),
		withKlass: PrintTextNode,
	},
	PrintEntityNode,
];

const INITIAL_CONFIG = {
	namespace: "Print Richtext Editor",
	nodes: NODE_CONFIG,
};

const EMPTY_ENTITY_ELEMENTS: string[] = [];

export const PrintRichTextEditor = ({ element, errorMessage, onChangeEntity, _testOnBlur }: RichTextEditorProps) => {
	const dispatch = useDispatch();
	const { currentRefType } = useSelector(NavigationSelectors.activeEntities);
	const selectEntityElements = React.useMemo(
		() => (state: PrintEngineState) =>
			PrintEngineSelectors.multiplePrintModelElements(
				state,
				element.text?.entities?.map(el => el.refId || "") || EMPTY_ENTITY_ELEMENTS
			),
		[element.text]
	);

	const entityElements = useSelector(selectEntityElements, shallowEqual);
	const editElement = useSelector(PrintEngineSelectors.currentSubFormElement);
	const textStyle = useTextStyleSelector(element);

	const [insertEntityType, setInsertEntityType] = React.useState<string | undefined>(undefined);
	const [showTreeView, setShowTreeView] = React.useState(false);
	const isFirstRender = React.useRef(true);

	const toolbarButtons = React.useMemo(() => {
		const isEntityFormOpen = Boolean(editElement);
		const buttons = [
			BoldButton,
			ItalicButton,
			UnderlineButton,
			Separator,
			createColorButton(ColorButtonType.TEXT_COLOR),
			createColorButton(ColorButtonType.BACKGROUND_COLOR),
			Separator,
			createEntityButton({
				onClick: () => setInsertEntityType(ElementType.Field),
				entityType: ElementType.Field,
				disabled: isEntityFormOpen,
			}),
			createEntityButton({
				onClick: () => setInsertEntityType(ElementType.Calculation),
				entityType: ElementType.Calculation,
				disabled: isEntityFormOpen,
			}),
		];

		if (currentRefType === SidebarItem.SECTION) {
			buttons.push(
				Separator,
				createEntityButton({
					onClick: () => setInsertEntityType(ElementType.PageNumber),
					entityType: ElementType.PageNumber,
					disabled: isEntityFormOpen,
				}),
				createEntityButton({
					onClick: () => setInsertEntityType(ElementType.PageNumberTotal),
					entityType: ElementType.PageNumberTotal,
					disabled: isEntityFormOpen,
				})
			);
		}

		buttons.push(createRemoveStylesButton(), Separator);

		if (IS_DEBUG_MODE) {
			buttons.push(
				createDebugButton({
					onClick: () => setShowTreeView(prev => !prev),
					isActive: () => showTreeView,
				})
			);
		}

		return buttons;
	}, [currentRefType, showTreeView, editElement]);

	const updateStoreData = React.useCallback(
		(params?: {
			html?: string;
			entities?: ReadonlyArray<PartialReference>;
			extraElements?: PartialAnyPrintModelElement[];
		}) => {
			const { html, entities, extraElements } = params || {};

			// Skip dispatch if HTML hasn't changed and no new elements are being added
			const hasHtmlChanged = html !== element.text?.text;
			const hasNewElements = extraElements && extraElements.length > 0;
			if (!hasHtmlChanged && !hasNewElements) {
				return;
			}

			const updatedElement: PartialText = {
				...element,
				text: {
					id: nanoid(),
					...element.text,
					text: html === EMPTY_HTML ? undefined : html,
					entities: entities ?? element.text?.entities ?? [],
				},
			};

			dispatch(
				InteractionLogActions.start({
					description: RESOURCE_KEYS.interaction.richTextEditor.changeText,
					region: GlobalRegion.FORM,
					transactionLogActions: [
						TransactionLogStateActions.updatePrintModelElements({
							data: [...(extraElements || []), updatedElement],
						}),
					],
					affectedItems: [
						...(extraElements || []).map(e => ({ type: "printModelElement" as const, id: e.id })),
						{ type: "printModelElement", id: updatedElement.id },
					],
				})
			);
		},
		[dispatch, element]
	);

	const handleEntityClick = React.useCallback(
		(entityId: string) => {
			const entity = entityElements.find(e => e.id === entityId);
			onChangeEntity?.(entity);
		},
		[entityElements, onChangeEntity]
	);

	React.useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}
		onChangeEntity?.(editElement);
	}, [onChangeEntity, editElement]);

	const handleBlur = React.useCallback(
		(html: string, entities: ReadonlyArray<PartialReference>) => {
			updateStoreData({ html, entities });
			_testOnBlur?.(html, entities);
		},
		[updateStoreData, _testOnBlur]
	);

	const handleEntityCreated = React.useCallback(
		(newEntities: PrintModelElement[], html: string, updatedEntityReferences: ReadonlyArray<PartialReference>) => {
			setInsertEntityType(undefined);
			updateStoreData({ html, entities: updatedEntityReferences, extraElements: newEntities });

			// Open entity form for Field/Calculation (only for single entity insert, not paste)
			if (newEntities.length === 1) {
				const entity = newEntities[0];
				if (entity.type === ElementType.Field || entity.type === ElementType.Calculation) {
					onChangeEntity?.(entity);
				}
			}
		},
		[updateStoreData, onChangeEntity]
	);

	return (
		<div>
			<EditorThemeStyles theme={defaultTheme} />
			<RichTextEditor
				key={`${element.id}-${textStyle?.id || ""}`}
				initialConfig={INITIAL_CONFIG}
				id="print-richtext-editor"
				labelGraphic={<Icon>info</Icon>}
				staticToolbarButtons={toolbarButtons}
				minHeight={100}
				disabled={Boolean(editElement)}
				errorMessage={errorMessage}
			>
				<PrintEngineHtmlInputPlugin html={element.text?.text} />
				<PrintEngineHtmlOutputPlugin existingEntities={element.text?.entities} onBlur={handleBlur} />
				<EntityInsertPlugin
					insertEntityType={insertEntityType}
					existingEntities={element.text?.entities}
					entityDefinitions={entityElements}
					onEntityCreated={handleEntityCreated}
				/>
				<EntityClickHandlerPlugin onEntityClick={handleEntityClick} />
				<EntityLabelUpdatePlugin editElement={editElement} />
				<EntityValidationBadgePlugin />
				{showTreeView && <TreeViewPlugin />}
			</RichTextEditor>
		</div>
	);
};
