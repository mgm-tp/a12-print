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
import DraftJs from "draft-js";
import { nanoid } from "nanoid";

import {
	createStaticToolbarPlugin,
	Editor,
	PluginFunctions,
	Separator,
} from "@com.mgmtp.a12.widgets/widgets-draft-js-editor";
import {
	ElementType,
	PartialAnyPrintModelElement,
	PartialCalculation,
	PartialField,
	PartialText,
	PrintModelElement,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import {
	GlobalRegion,
	SidebarItem,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/transaction-log/index.js";
import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/index.js";

import { stateFromHTML } from "../../bundled-deps/draft-js-import-html.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import {
	createImportOptions,
	DEFAULT_CALC_TEXT,
	DEFAULT_FIELD_TEXT,
	exportStateToHtml,
	getEndEntitySelection,
	getEntityAt,
	getReactStylesFromDraftInlineStyles,
	getStartEntitySelection,
	insertDecorator,
} from "../../utils/index.js";
import { BACKGROUND_COLOR, findEntityRangesByType, FONT_SIZE_PREFIX, TEXT_COLOR } from "../../utils/richtext-utils.js";
import { PrintEngineState } from "../../store/root-reducer.js";
import { RESOURCE_KEYS } from "../../localization/index.js";
import { DetailDataActions, TransactionLogStateActions } from "../../redux/index.js";
import { InteractionLogActions } from "../../redux/interaction-log/index.js";
import { useModelNameAliasGetter } from "../../hooks/index.js";
import { ElementTypes } from "../../constant/elements.js";
import { useTextStyleSelector } from "../../hooks/use-text-style-selector.js";

import {
	createCleanUpInlineStyleButton,
	createColorButton,
	createDefaultInlineButton,
	createSimpleButton,
	ToolbarContext,
} from "./richtext-toolbar-components/index.js";
import { DecoratorTypes, DraftDecoratorComponentPropsExtended, IEditPosition } from "./type.js";
import { Decorator } from "./richtext-toolbar-components/Decorator.js";

const MIN_EDITOR_HEIGHT = 200;
const EMPTY_HTML = "<p><br></p>";

interface RichTextEditorProps {
	element: PartialText;
	errorMessage?: React.ReactNode;
	onChangeEntity?: (entity?: PartialAnyPrintModelElement) => void;
}

export const RichTextEditor = ({ element, errorMessage, onChangeEntity }: RichTextEditorProps) => {
	const dispatch = useDispatch();
	const { currentRefType } = useSelector(PrintEngineSelectors.printModelRefs);
	const currentDetailDataId = useSelector(PrintEngineSelectors.currentDetailDataId);
	const editPosition = useSelector(PrintEngineSelectors.editPositionTextDetailData);

	const entityElements = useSelector((state: PrintEngineState) =>
		PrintEngineSelectors.multiplePrintModelElements(state, element.text?.entities?.map(el => el.refId || "") || [])
	);
	const editElement = useSelector(PrintEngineSelectors.textEntityElement);
	const textStyle = useTextStyleSelector(element);

	const getEntityDisplayText = useEntityTextGetter();
	const createEntityElement = useCreateEntity();

	const curElFontSize = textStyle?.fontSize;
	const [editorText, setEditorText] = React.useState(element.text?.text);
	const [editorState, setEditorState] = React.useState(createEditorState(entityElements, element.text?.text));
	const [insertEntityType, setInsertEntityType] = React.useState<DecoratorTypes | undefined>(undefined);

	useEntityFormStateHandler(editElement, editorState);

	const updateStoreData = React.useCallback(
		(updateData?: { newState?: DraftJs.EditorState; extraElements?: PartialAnyPrintModelElement[] }) => {
			const { newState, extraElements } = updateData || {};
			const { html, entities } = exportStateToHtml(newState || editorState, element.text?.entities);
			setEditorText(html);
			const updatedElement: PartialText = {
				...element,
				text: { id: nanoid(), ...element.text, text: html === EMPTY_HTML ? undefined : html, entities },
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
						{
							type: "printModelElement",
							id: updatedElement.id,
						},
					],
				})
			);
		},
		[dispatch, editorState, element]
	);

	const staticToolbarPlugin = React.useMemo(() => {
		const items = [
			createDefaultInlineButton("BOLD"),
			createDefaultInlineButton("ITALIC"),
			createDefaultInlineButton("UNDERLINE"),
			Separator,
			createColorButton(TEXT_COLOR),
			createColorButton(BACKGROUND_COLOR),
			Separator,
			createSimpleButton({
				icon: <Icon>{ElementTypes[ElementType.Field]?.iconName}</Icon>,
				onClick: () => setInsertEntityType(ElementType.Field),
				title: RESOURCE_KEYS.editor.element.Field,
			}),
			createSimpleButton({
				icon: <Icon>{ElementTypes[ElementType.Calculation]?.iconName}</Icon>,
				onClick: () => setInsertEntityType(ElementType.Calculation),
				title: RESOURCE_KEYS.editor.element.Calculation,
			}),
			createCleanUpInlineStyleButton(
				updateStoreData,
				FONT_SIZE_PREFIX,
				RESOURCE_KEYS.editor.richTextEditor.toolbarButton.removeFontSizeInlineStyles
			),
		];

		if (currentRefType === SidebarItem.SECTION) {
			items.push(
				createSimpleButton({
					icon: <Icon>{ElementTypes[ElementType.PageNumber]?.iconName}</Icon>,
					onClick: () => setInsertEntityType(ElementType.PageNumber),
					title: RESOURCE_KEYS.editor.element.PageNumber,
				})
			);
			items.push(
				createSimpleButton({
					icon: <Icon>{ElementTypes[ElementType.PageNumberTotal]?.iconName}</Icon>,
					onClick: () => setInsertEntityType(ElementType.PageNumberTotal),
					title: RESOURCE_KEYS.editor.element.PageNumberTotal,
				})
			);
		}

		return createStaticToolbarPlugin({
			structure: items,
		});
		// eslint missing dependencies: 'updateStoreData' would cause the texteditor toolbar to not work
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentRefType]);

	// Expand the selection range
	// If there is any entity is selected, select the entire entity content as well.
	const handleOnChange = React.useCallback(
		(newEditorState: DraftJs.EditorState) => {
			let resultEditorState = newEditorState;
			const selectionState = resultEditorState.getSelection();
			if (!selectionState.isCollapsed()) {
				const { newSelection: newStartSelection, isChange: isStartChange } = getStartEntitySelection(
					resultEditorState,
					selectionState
				);
				const { newSelection: newEndSelection, isChange: isEndChange } = getEndEntitySelection(
					resultEditorState,
					newStartSelection
				);
				if (isStartChange || isEndChange) {
					resultEditorState = DraftJs.EditorState.forceSelection(resultEditorState, newEndSelection);
					// We need to update the new editor state, as draft-js-plugins does not automatically update to the new state.
					// Additionally, the second parameter, 'pluginFunctions', is currently not utilized in 'createStaticToolbarPlugin', so we can leave it empty
					staticToolbarPlugin?.onChange &&
						staticToolbarPlugin.onChange(resultEditorState, {} as PluginFunctions);
				}
			}
			if (
				editPosition?.blockKey &&
				!resultEditorState.getCurrentContent()?.getBlockForKey(editPosition?.blockKey)
			) {
				let selection = resultEditorState.getSelection();
				const start = selection.getEndOffset();
				if (!selection.isCollapsed()) {
					selection = selection.merge({
						anchorOffset: start,
						focusOffset: start,
					});
				}
				dispatch(
					DetailDataActions.updateEditPositionTextForm({
						containerId: currentDetailDataId,
						editPosition: {
							...editPosition,
							blockKey: selection.getEndKey(),
						},
					})
				);
			}
			setEditorState(resultEditorState);
		},
		[staticToolbarPlugin, currentDetailDataId, dispatch, editPosition]
	);

	const handleReturn = React.useCallback(
		(event: React.KeyboardEvent<object>, newEditorState: DraftJs.EditorState): DraftJs.DraftHandleValue => {
			if (event.shiftKey) {
				setEditorState(DraftJs.RichUtils.insertSoftNewline(newEditorState));
				return "handled";
			}
			return "not-handled";
		},
		[]
	);

	const onDecoratorClicked = React.useCallback(
		(type: DecoratorTypes, props: DraftDecoratorComponentPropsExtended) => {
			const { entityKey, blockKey, start, end } = props;
			if (type === ElementType.PageNumber || type === ElementType.PageNumberTotal) {
				return;
			}
			dispatch(
				DetailDataActions.updateEditPositionTextForm({
					containerId: currentDetailDataId,
					editPosition: {
						entityKey: entityKey,
						blockKey: blockKey,
						start: start,
						end: end,
					},
				})
			);
		},
		[currentDetailDataId, dispatch]
	);

	const decorationPlugin = React.useMemo(() => {
		function getDecorator(type: DecoratorTypes): DraftJs.DraftDecorator {
			return {
				strategy: findEntityRangesByType(type),
				component: (props: DraftDecoratorComponentPropsExtended) => (
					<Decorator type={type} props={props} onDecoratorClicked={onDecoratorClicked} />
				),
			};
		}

		return {
			decorators: [
				getDecorator(ElementType.Field),
				getDecorator(ElementType.Calculation),
				getDecorator(ElementType.PageNumber),
				getDecorator(ElementType.PageNumberTotal),
			],
		};
	}, [onDecoratorClicked]);

	const customStyleFn = React.useCallback(
		(style: DraftJs.DraftInlineStyle) => getReactStylesFromDraftInlineStyles(style, curElFontSize) || {},
		[curElFontSize]
	);

	React.useEffect(() => {
		if (insertEntityType) {
			const newEntityElement: PrintModelElement = createEntityElement(insertEntityType);
			const { newState, newEditPosition } = insertDecorator(editorState, insertEntityType, newEntityElement);
			setInsertEntityType(undefined);
			setEditorState(newState);
			updateStoreData({ newState, extraElements: [newEntityElement] });
			if (insertEntityType === ElementType.Field || insertEntityType === ElementType.Calculation) {
				dispatch(
					DetailDataActions.updateEditPositionTextForm({
						containerId: currentDetailDataId,
						editPosition: newEditPosition,
					})
				);
			}
		}
	}, [currentDetailDataId, dispatch, editorState, insertEntityType, updateStoreData, createEntityElement]);

	React.useEffect(() => {
		// only set editor text when text element changes
		if (element?.text?.text !== editorText) {
			setEditorText(element?.text?.text);
			setEditorState(createEditorState(entityElements, element.text?.text));
			return;
		}

		if (editElement && editPosition) {
			const { blockKey, start, end, entityKey } = editPosition;
			const displayedText = getEntityDisplayText(editElement);

			const curContentState = editorState.getCurrentContent();
			const oldText = curContentState?.getBlockForKey(blockKey)?.getText()?.slice(start, end);
			if (!oldText || oldText === displayedText) {
				return;
			}
			const selectionState = DraftJs.SelectionState.createEmpty(blockKey).merge({
				anchorOffset: start,
				focusOffset: end,
			});
			const inlineStyle = editorState
				.getCurrentContent()
				.getBlockForKey(selectionState.getStartKey())
				.getInlineStyleAt(selectionState.getStartOffset());

			const newState = DraftJs.Modifier.replaceText(
				curContentState,
				selectionState,
				displayedText,
				inlineStyle,
				entityKey
			);
			const resultState = DraftJs.EditorState.push(editorState, newState, "insert-fragment");
			const oldStringLength = end - start;
			const newStringLength = displayedText.length;
			const diffStringLength = newStringLength - oldStringLength;
			if (diffStringLength !== 0) {
				if (editPosition) {
					dispatch(
						DetailDataActions.updateEditPositionTextForm({
							containerId: currentDetailDataId,
							editPosition: {
								...editPosition,
								end: editPosition?.end + diffStringLength,
							},
						})
					);
				}
			}
			setEditorState(resultState);
			updateStoreData({ newState: resultState });
		}
		// eslint missing dependencies: 'editorText' and 'entityElements' would cause infinite rerender
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		currentDetailDataId,
		dispatch,
		editElement,
		editPosition,
		editorState,
		updateStoreData,
		getEntityDisplayText,
		element?.text?.text,
	]);

	const staticToolbar = React.useMemo(() => {
		return (
			<ToolbarContext.Provider value={{ defaultFontsize: curElFontSize, disabled: Boolean(editPosition) }}>
				<staticToolbarPlugin.StaticToolbar />
			</ToolbarContext.Provider>
		);
	}, [curElFontSize, editPosition, staticToolbarPlugin]);

	React.useEffect(() => {
		onChangeEntity && onChangeEntity(editElement);
	}, [onChangeEntity, editElement]);

	const handleKeyCommand = React.useCallback((command: string, et: DraftJs.EditorState) => {
		if (command === "backspace-entity") {
			const selectionState = et.getSelection();
			const leftEntity = getEntityAt(et, selectionState.getStartOffset() - 1);
			if (leftEntity) {
				const newContentState = DraftJs.Modifier.replaceText(
					et.getCurrentContent(),
					selectionState.merge({
						anchorOffset: leftEntity.start,
						focusOffset: leftEntity.end,
					}),
					""
				);
				const newEditorState = DraftJs.EditorState.push(et, newContentState, "remove-range");
				setEditorState(newEditorState);
				return "handled";
			}
			return "not-handled";
		}
		return "not-handled";
	}, []);

	const keyBindingFn = React.useCallback(
		(event: React.KeyboardEvent) => {
			const selectionState = editorState.getSelection();
			if (event.key === "Backspace" && selectionState.isCollapsed()) {
				const leftEntity = getEntityAt(editorState, selectionState.getStartOffset() - 1);
				if (leftEntity) {
					return "backspace-entity";
				}
			}
			return DraftJs.getDefaultKeyBinding(event);
		},
		[editorState]
	);

	return (
		<Editor
			key={`${element.id}-${textStyle?.id || ""}`}
			editorState={editorState}
			onChange={handleOnChange}
			handleReturn={handleReturn}
			onBlur={() => updateStoreData()}
			autoExpand
			staticToolbar={staticToolbar}
			plugins={[staticToolbarPlugin, decorationPlugin]}
			customStyleFn={customStyleFn}
			minHeight={MIN_EDITOR_HEIGHT}
			disabled={Boolean(editPosition)}
			errorMessage={errorMessage}
			handleKeyCommand={handleKeyCommand}
			keyBindingFn={keyBindingFn}
		/>
	);
};

function useEntityFormStateHandler(
	editElement: PartialAnyPrintModelElement | undefined,
	editorState: DraftJs.EditorState
) {
	const dispatch = useDispatch();
	const currentDetailDataId = useSelector(PrintEngineSelectors.currentDetailDataId);
	const editPosition = useSelector(PrintEngineSelectors.editPositionTextDetailData);
	const [oldEditElement, setOldEditElement] = React.useState<PartialAnyPrintModelElement | undefined>(editElement);
	const [oldEditPosition, setOldEditPosition] = React.useState<IEditPosition | undefined>(editPosition);

	React.useEffect(() => {
		if (editElement !== undefined && oldEditElement === undefined) {
			setOldEditElement(editElement);
		} else if (editElement === undefined && oldEditElement !== undefined) {
			setOldEditElement(editElement);
			dispatch(
				DetailDataActions.updateEditPositionTextForm({
					containerId: currentDetailDataId,
					editPosition: undefined,
				})
			);
		}
	}, [currentDetailDataId, dispatch, editElement, oldEditElement, oldEditElement?.id]);

	React.useEffect(() => {
		if (
			(oldEditPosition === undefined && editPosition?.entityKey !== undefined) ||
			(oldEditPosition && editPosition?.entityKey && oldEditPosition?.entityKey !== editPosition?.entityKey)
		) {
			const refId: string = editorState.getCurrentContent().getEntity(editPosition.entityKey).getData().id;
			setOldEditPosition(editPosition);
			dispatch(
				DetailDataActions.updateAdditionalData({
					containerId: currentDetailDataId,
					text: { refId, editPosition },
				})
			);
		} else if (
			(oldEditPosition !== undefined && editPosition === undefined) ||
			(oldEditPosition &&
				editPosition &&
				oldEditPosition.blockKey === editPosition.blockKey &&
				oldEditPosition.entityKey === editPosition.entityKey &&
				oldEditPosition.start === editPosition.start &&
				oldEditPosition.end !== editPosition.end)
		) {
			setOldEditPosition(editPosition);
		}
	}, [dispatch, editPosition, editorState, oldEditPosition, currentDetailDataId]);
}

const useEntityTextGetter = () => {
	const getModelNameAlias = useModelNameAliasGetter();
	return React.useCallback(
		(element: PartialAnyPrintModelElement) => {
			if (PartialField.isInstance(element)) {
				const modelName = getModelNameAlias(element.field?.model) || element.field?.model;
				return element.field?.path ? `${modelName}${element.field?.path}` : DEFAULT_FIELD_TEXT;
			}

			if (PartialCalculation.isInstance(element)) {
				return element.calculation?.name || DEFAULT_CALC_TEXT;
			}

			return "unknown-entity";
		},
		[getModelNameAlias]
	);
};

export const createEditorState = (entityElements: PartialAnyPrintModelElement[], text?: string) => {
	return DraftJs.EditorState.createWithContent(
		text ? stateFromHTML(text, createImportOptions(entityElements)) : DraftJs.ContentState.createFromText("")
	);
};

const useCreateEntity = () =>
	React.useCallback((insertEntityType: DecoratorTypes) => {
		let newEntityElement: PartialAnyPrintModelElement = { id: nanoid(), type: insertEntityType };

		if (PartialField.isInstance(newEntityElement) || PartialCalculation.isInstance(newEntityElement)) {
			newEntityElement = {
				...newEntityElement,
				[String(insertEntityType).toLowerCase()]: {
					id: nanoid(),
				},
			};
		}

		return newEntityElement;
	}, []);
