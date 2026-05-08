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
import { EditorProps } from "@monaco-editor/react";

import {
	createLexer,
	createParser,
	Language,
} from "@com.mgmtp.a12.kernel/kernel-core-parser-web/lib/main/js/a12internal/index.js";
import {
	AntlrCodeEditor,
	IAntlrCodeEditorProps,
	IAntlrConfig,
	IMonacoEditorUIConfig,
} from "@com.mgmtp.a12.antlrcodeeditor/antlrcodeeditor-core";
import { Logger } from "@com.mgmtp.a12.utils/utils-logging/api.js";
import { defaultMonacoUiConfig } from "@com.mgmtp.a12.dml/dml/lib/ruleCodeEditor/theme/monacoUiConfig.js";
import { InputElements } from "@com.mgmtp.a12.widgets/widgets-core/lib/input/index.js";
import { CssEllipsis } from "@com.mgmtp.a12.widgets/widgets-core/lib/css-ellipsis/index.js";
import {
	GRAMMAR_NAME,
	GRAMMAR_ROOT_RULE_NAMES,
	MONACO_LANGUAGE_CONFIGURATION,
} from "@com.mgmtp.a12.dml/dml/lib/ruleCodeEditor/constants.js";
import { getTheme } from "@com.mgmtp.a12.dml/dml/lib/ruleCodeEditor/theme/index.js";
import {
	CompletionItemDocResolver,
	getCompletionItemProvider,
	ItemSuggestor,
} from "@com.mgmtp.a12.dml/dml/lib/ruleCodeEditor/context-assist/index.js";
import { getCommonsTokenProvider } from "@com.mgmtp.a12.dml/dml/lib/ruleCodeEditor/commonsTokenProviderFactory.js";
import { RuntimeVariable } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";
import { PrintError } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";
import { DocumentModelData } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/types/document-model-data.js";

import { PrintEngineSelectors } from "../../store/selectors.js";
import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";

import { ErrorWrapper } from "../validation/index.js";

import { getRootSuggester, getSuggester, SuggestionType } from "./rule-editor-suggesters.js";

const GRAMMAR_LANGUAGE: Language = "en";
const PARSER_PARAMETER = {
	assignmentCondition: false,
	extmp: false,
	hDV: false,
};

const initializeWidgetsDomNode = () => {
	const divContainer = document.createElement("div");
	divContainer.className = "monaco-editor";
	divContainer.id = "monaco-suggestion-container";

	document.body.append(divContainer);
	return divContainer;
};

const UI_CONFIG: IMonacoEditorUIConfig = {
	...defaultMonacoUiConfig,
	height: "120px",
	options: {
		...defaultMonacoUiConfig.options,
		readOnly: false,
		scrollBeyondLastLine: false,
		lineNumbers: "off",
		showDeprecated: false,
		showFoldingControls: "mouseover",
		wordWrap: "on",
		suggestFontSize: 10,
		suggestLineHeight: 20,
		padding: {
			top: 12,
			bottom: 12,
		},
		minimap: {
			enabled: false,
		},
		folding: false,
		bracketPairColorization: {
			enabled: true,
		},
		lineDecorationsWidth: "0px",
		overflowWidgetsDomNode: initializeWidgetsDomNode(),
	},
};

interface DebugProps {
	/**
	 * By providing this logger, log messages from calls to methods of {@link CommonsTokenProvider}
	 * will be logged
	 */
	tokenProviderLogger?: Logger;
	/**
	 * By providing this logger, log messages from calls to getSuggestions function, supplied by
	 * kernel library, will be logged
	 */
	kernelGetSuggestionsLogger?: Logger;
	/**
	 * By providing this logger, log messages from with kernel completion item provider will be logged
	 */
	kernelCompletionItemProviderLogger?: Logger;
}

export interface RuleCodeEditorProps
	extends Pick<EditorProps, "loading">,
		Pick<IAntlrConfig, "theme">,
		Pick<IAntlrCodeEditorProps, "delayFetchExternalErrors">,
		Pick<IAntlrCodeEditorProps, "codeCompletionShortcut">,
		Pick<IAntlrCodeEditorProps, "fetchExternalErrors">,
		Pick<IAntlrCodeEditorProps, "fetchHelpTextSupport">,
		DebugProps {
	rootRuleName: string;
	setNewRowData(newData: string): void;
	fieldSuggestor?: ItemSuggestor;
	groupSuggestor?: ItemSuggestor;
	rootGroupNameSuggestor?: ItemSuggestor;
	completionItemDocResolver?: CompletionItemDocResolver;
	setFormDirty?(): void;
	label?: string;
	suggestionType?: SuggestionType;
	value: string | undefined;
	documentModel: string | undefined;
	validationErrors?: PrintError[];
	aliasDocumentModel: string | undefined;
	documentModelData: DocumentModelData | undefined;
	style?: React.CSSProperties;
	className?: string;
}

export const RuleCodeEditor = (props: RuleCodeEditorProps) => {
	const {
		tokenProviderLogger,
		kernelGetSuggestionsLogger,
		kernelCompletionItemProviderLogger,
		codeCompletionShortcut,
		fetchExternalErrors,
		loading,
		fetchHelpTextSupport,
		completionItemDocResolver: completionItemDocumentationResolver,
		rootRuleName,
		setFormDirty,
		label,
		suggestionType,
		setNewRowData,
		value,
		documentModel,
		validationErrors,
		aliasDocumentModel,
		documentModelData,
		style,
		className,
	} = props;

	const localizer = PrintLocalizer.useLocalizer();
	const printGeneral = useSelector(PrintEngineSelectors.printContentGeneral);
	const [monacoModelUri, setMonacoModelUri] = React.useState<monaco.Uri>();
	const [errors, setErrors] = React.useState<monaco.editor.IMarker[]>();

	const runtimeVariables: ReadonlyArray<DeepPartial<RuntimeVariable>> = React.useMemo(() => {
		return printGeneral.runtimeVariables || [];
	}, [printGeneral.runtimeVariables]);

	const fieldSuggestor = React.useMemo(
		() =>
			getSuggester(
				false,
				documentModelData?.elementMap,
				documentModelData?.annotations,
				documentModelData?.enhancements,
				runtimeVariables,
				documentModel,
				aliasDocumentModel,
				suggestionType
			),
		[
			documentModelData?.elementMap,
			documentModelData?.annotations,
			documentModelData?.enhancements,
			runtimeVariables,
			documentModel,
			aliasDocumentModel,
			suggestionType,
		]
	);

	const groupSuggestor = React.useMemo(
		() =>
			getSuggester(
				true,
				documentModelData?.elementMap,
				documentModelData?.annotations,
				undefined,
				undefined,
				documentModel,
				aliasDocumentModel,
				suggestionType
			),
		[
			documentModelData?.elementMap,
			documentModelData?.annotations,
			documentModel,
			aliasDocumentModel,
			suggestionType,
		]
	);

	const rootGroupNameSuggestor = React.useMemo(
		() => getRootSuggester(documentModel, aliasDocumentModel),
		[aliasDocumentModel, documentModel]
	);

	const tokensProvider = React.useMemo(() => {
		const lexer = createLexer(GRAMMAR_LANGUAGE);
		const parser = createParser(PARSER_PARAMETER);
		return getCommonsTokenProvider({
			lexer,
			parser,
			grammarName: GRAMMAR_NAME,
			rootRuleName,
			logger: tokenProviderLogger,
		});
	}, [rootRuleName, tokenProviderLogger]);

	const completionItemProviderRegisterer = React.useCallback(
		(editorModel: monaco.editor.ITextModel) => {
			setMonacoModelUri(editorModel.uri); // remember it to facilitate marking the form dirty on type/paste
			return getCompletionItemProvider(
				editorModel.id,
				{
					grammarLanguage: GRAMMAR_LANGUAGE,
					parserParameter: PARSER_PARAMETER,
					rootRuleName,
					fieldSuggestor,
					groupSuggestor,
					rootGroupNameSuggestor,
					completionItemDocResolver: completionItemDocumentationResolver,
				},
				tokensProvider,
				kernelGetSuggestionsLogger,
				kernelCompletionItemProviderLogger
			);
		},
		[
			rootRuleName,
			fieldSuggestor,
			groupSuggestor,
			rootGroupNameSuggestor,
			completionItemDocumentationResolver,
			kernelGetSuggestionsLogger,
			kernelCompletionItemProviderLogger,
			tokensProvider,
		]
	);

	// Filter "empty value" errors for Precondition, since they are allowed to be empty.
	const getErrorMarkers = React.useCallback(() => {
		return props.rootRuleName === GRAMMAR_ROOT_RULE_NAMES.COMPUTATION_PRECONDITION
			? monaco.editor
					.getModelMarkers({})
					.filter(
						marker =>
							!(
								marker.resource === monacoModelUri &&
								marker.endColumn === 6 &&
								marker.endLineNumber === 1 &&
								marker.message.endsWith("'<EOF>'")
							) && marker.resource === monacoModelUri
					)
			: monaco.editor.getModelMarkers({}).filter(marker => marker.resource === monacoModelUri);
	}, [monacoModelUri, props.rootRuleName]);

	const onChangeHandler = React.useCallback(
		(changedValue: string) => {
			const errorMarkers = getErrorMarkers();
			setErrors(errorMarkers);
			setNewRowData(changedValue);
		},
		[getErrorMarkers, setNewRowData]
	);

	React.useEffect(() => {
		if (monacoModelUri) {
			setErrors(getErrorMarkers());
		}
	}, [getErrorMarkers, monacoModelUri, props.rootRuleName]);

	React.useEffect(() => {
		let disposable: monaco.IDisposable | undefined;
		if (monacoModelUri !== undefined && setFormDirty) {
			disposable = monaco.editor.getModel(monacoModelUri)?.onDidChangeContent(setFormDirty);
		}
		return () => disposable?.dispose();
	}, [monacoModelUri, setFormDirty]);

	const errorMessage = ErrorMessageList(errors, monacoModelUri);

	const validationResults = React.useMemo(() => {
		if (validationErrors) {
			return [
				validationErrors?.filter(val => val.severity === "ERROR"),
				validationErrors?.filter(val => val.severity === "WARNING"),
			];
		}
		return undefined;
	}, [validationErrors]);

	return (
		<>
			<InputElements.Label label={label} />
			{errors && errors.length > 0 && (
				<InputElements.Error className={"field__message shortened"} errorMessage={errorMessage} />
			)}
			<ErrorWrapper errors={validationResults?.[0]} warnings={validationResults?.[1]}>
				<div style={{ width: "100%", ...style }} className={className}>
					<AntlrCodeEditor
						value={value && typeof value === "string" ? value : ""}
						monacoLoader={{
							path: "/assets/static/vs/min/vs",
						}}
						tokensProvider={tokensProvider}
						customCompletionProvider={completionItemProviderRegisterer}
						languageConfiguration={MONACO_LANGUAGE_CONFIGURATION}
						customTheme={getTheme({
							readonly: false,
						})}
						onValueSubmit={onChangeHandler}
						fetchExternalErrors={fetchExternalErrors}
						fetchHelpTextSupport={fetchHelpTextSupport}
						uiConfig={UI_CONFIG}
						codeCompletionShortcut={codeCompletionShortcut}
						loading={loading}
						initializationErrorMessage={
							<InputElements.Warning
								className={"field__message"}
								warningMessage={localizer(RESOURCE_KEYS.ruleCodeEditor.warningMessage)}
							/>
						}
					/>
				</div>
			</ErrorWrapper>
		</>
	);
};

const ErrorMessageList = (
	errors: monaco.editor.IMarker[] | undefined,
	monacoModelUri: monaco.Uri | undefined
): React.ReactNode => {
	return errors && errors.length > 1 ? (
		<ul>
			{errors?.map((error, id) => (
				<li key={id}>
					<CssEllipsis maxLine={1} useTooltip tooltipVariant="error" key={`${monacoModelUri}_error_${id}`}>
						{error.message}
					</CssEllipsis>
				</li>
			))}
		</ul>
	) : (
		errors?.map((error, id) => (
			<CssEllipsis maxLine={1} useTooltip tooltipVariant="error" key={`${monacoModelUri}_error_${id}`}>
				{error.message}
			</CssEllipsis>
		))
	);
};
