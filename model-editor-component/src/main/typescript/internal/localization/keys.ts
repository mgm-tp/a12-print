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
import { initializeKeys } from "@com.mgmtp.a12.utils/utils-localization";

export const RESOURCE_KEYS = {
	application: {
		title: "",
	},
	sidebar: {
		general: {
			name: "",
			modelName: "",
			description: "",
			annotations: {
				headline: "",
				name: "",
				value: "",
			},
			roleSettings: {
				header: {
					section: "",
				},
				columns: {
					roleName: "",
				},
				autocompleteHint: "",
				placeholderContent: "",
				confirmDeletion: {
					title: "",
					message: "",
				},
			},
			metadata: {
				headline: "",
				title: "",
				description: "",
				author: "",
				language: "",
			},
			message: {
				fieldRequired: "",
				modelNameValidation: "",
				annotationNameDuplicate: "",
				annotationNameProtected: "",
			},
		},
		schema: {
			name: "",
			aliasLabel: "",
			tab: {
				documentModelReferenced: "",
				printModelReferenced: "",
				typesettingModelReferenced: "",
			},
			tooltips: {
				defaultTypesettingModel: "",
				printModelReferenceWithoutSegments: "",
			},
		},
		content: "",
		textStyles: "",
		segment: {
			name: "",
			repeatable: "",
			button: {
				menuSetting: "",
			},
			setting: {
				name: "",
				namePlaceholder: "",
				reference: "",
				segmentTemplate: "",
			},
			toolbar: {
				namePlaceholder: "",
				dinTemplate: {
					selectPlaceHolder: "",
				},
			},
		},
		section: {
			name: "",
			titlePlaceholder: "",
			type: {
				first: "",
				remaining: "",
			},
		},
		watermark: {
			name: "",
			titlePlaceholder: "",
			setting: {
				opacity: "",
				conditions: "",
				description: "",
			},
		},
		commitChanges: {
			title: "",
			columns: {
				status: "",
				descriptions: "",
				propertyName: "",
				propertyValue: "",
				timestamp: "",
			},
			status: {
				commit: "",
				pending: "",
				overwritten: "",
			},
			emptyDescription: "",
			commit: "",
			discard: "",
			error: {
				commitChangesFailed: "",
			},
		},
	},
	editor: {
		mode: {
			default: "",
			layout: "",
			readingOrder: "",
		},
		topMenu: {
			elementLibrary: {
				title: "",
				headline: "",
				floatLibrary: "",
				popupLibrary: "",
				incomingDinTemplate: "",
				dinTemplateSegmentEditor: "",
			},
			layout: "",
			tabOrder: "",
			hideFrames: "",
			showFrames: "",
			hideMargins: "",
			showMargins: "",
			textStyles: "",
			deleteElement: "",
			copyElement: "",
			groupElement: "",
			openElement: "",
			quickEditBar: {
				x: {
					placeholder: "",
					label: "",
				},
				y: {
					placeholder: "",
					label: "",
				},
				width: {
					placeholder: "",
					label: "",
				},
				height: {
					placeholder: "",
					label: "",
				},
			},
		},
		contextMenu: {
			copy: "",
			paste: "",
			delete: "",
			groupElement: "",
			hideConditions: "",
		},
		pageOrientation: {
			portrait: "",
			landscape: "",
		},
		type: {
			default: "",
		},
		element: {
			Text: "",
			Line: "",
			Table: "",
			Listing: "",
			Expression: "",
			Image: "",
			TableLayout: "",
			LineChart: "",
			BarChart: "",
			PieChart: "",
			Field: "",
			Calculation: "",
			BoundingBox: "",
			PageNumber: "",
			PageNumberTotal: "",
			Override: "",
			Area: "",
			Switch: "",
		},
		page: "",
		pageTotal: "",
		pageOnTotal: "",
		richTextEditor: {
			toolbarButton: {
				removeStyles: "",
			},
		},
	},
	layoutEditor: {
		topMenu: {
			topMargin: "",
			bottomMargin: "",
		},
	},
	button: {
		add: "",
		apply: "",
		discardChanges: "",
		save: "",
		cancel: "",
		edit: "",
		delete: "",
		close: "",
		open: "",
		duplicate: "",
		back: "",
		openSetting: "",
		closeSetting: "",
		openEditor: "",
		maximized: "",
		minimized: "",
		up: "",
		down: "",
		undo: "",
		redo: "",
		openMenu: "",
	},
	input: {
		selectPlaceholder: "",
		inputSource: {
			possibleSource: {
				default: "",
				input: "",
				unset: "",
				inherited: "",
			},
			unsetPlaceholder: "",
		},
		repeatableSettings: {
			headline: "",
		},
	},
	indicator: {
		repeatable: "",
		pageBreakAvoid: "",
	},
	elements: {
		tableLayout: {
			selectContentType: "",
			editCell: "",
			deleteCell: "",
		},
		table: {
			emptyHeader: "",
		},
	},
	elementForm: {
		dataContextSelection: {
			repeatableGroup: "",
			repeatableInstance: "",
			group: "",
			field: "",
			noTreeData: "",
			hintMessage: {
				fieldType: "",
				nonRepeatableGroup: "",
				repeatableGroup: "",
				anyGroup: "",
				instanceFieldType: "",
				instanceNonRepeatableGroup: "",
				instanceRepeatableGroup: "",
				instanceAnyGroup: "",
			},
		},
		hideConditions: {
			headline: "",
			description: "",
		},
		layoutConfig: {
			headline: "",
			pageBreakBehavior: {
				headline: "",
				input: "",
				avoidInfoMessage: {
					containerElement: "",
					standaloneElement: "",
				},
			},
		},
		headline: "",
		textProperties: {
			headline: "",
			bold: "",
			italic: "",
			underline: "",
			color: "",
			backgroundColor: "",
			alignment: "",
			clearButton: "",
			legacyWarning: "",
		},
		borderProperties: {
			headline: "",
			borderWidth: "",
			borderStyle: "",
			borderColor: "",
		},
		model: {
			documentModel: "",
			field: "",
			group: "",
			deleteDocumentModelButton: "",
		},
		field: {
			fieldType: "",
			checkboxUnchecked: "",
			checkboxChecked: "",
			dateFormat: "",
			dateRangeFormatStart: "",
			dateRangeFormatEnd: "",
			dateRangeDelimiter: "",
			dateFormatHint: "",
			suffix: "",
		},
		computation: {
			condition: "",
			precondition: "",
			operation: "",
		},
		text: {
			text: "",
		},
		line: {
			linePropertiesHeadline: "",
		},
		textFlow: {
			hideIfEmpty: "",
			field: {
				saveButton: "",
			},
			computation: {
				name: "",
				formattingType: "",
				typeDefinition: "",
				saveButton: "",
			},
		},
		image: {
			imageSrc: "",
			imageSrcType: {
				static: "",
				dynamic: "",
			},
			field: "",
			attachment: "",
			alt: "",
			height: "",
			width: "",
			action: {
				replace: "",
				download: "",
				upload: "",
			},
			resource: {
				selector: "",
				internalFilename: "",
				size: "",
				mimeType: "",
			},
		},
		expression: {
			expressionText: "",
			generalPropertiesHeadline: "",
			hideIfEmpty: "",
		},
		switch: {
			name: "",
			precondition: "",
			elements: "",
			emptyMessage: "",
		},
		listing: {
			columns: {
				title: "",
				headline: "",
				label: "",
				width: "",
				isSortingIndex: "",
				isSortingIndexFormLabel: "",
				hasCustomTextProperties: "",
				hasCustomBorderProperties: "",
			},
			rowPropertiesComputations: {
				headline: "",
			},
			defaultComputations: {
				headline: "",
				description: "",
			},
			groupComputations: {
				headline: "",
				description: "",
			},
			fieldComputations: {
				title: "",
				headline: "",
				documentFieldType: "",
				documentFieldTypeDescription: "",
				resultFieldType: "",
				resultFieldTypeDescription: "",
				fieldTypeSerialized: "",
				fieldTypeSerializedOutput: "",
			},
			valueComputations: {
				headline: "",
			},
			propertyComputations: {
				headline: "",
				property: "",
			},
			groupPropertyComputation: {
				headline: "",
				groupPath: "",
				property: "",
				preconditionHint: "",
				basePathRequiredMessage: "",
			},
			headerProperties: {
				headline: "",
				hideHeader: "",
			},
			bodyProperties: {
				headline: "",
			},
		},
		table: {
			column: {
				title: "",
				type: "",
				label: "",
				headerLabelHidden: "",
				width: "",
				button: {
					back: "",
				},
				field: {
					text: "",
					sumColumn: "",
				},
			},
			generalPropertiesHeadline: "",
			maxRowCount: "",
			sumLabel: "",
			filteringHeadline: "",
			filterExpression: "",
			headerPropertiesHeadline: "",
			hideHeader: "",
			bodyPropertiesHeadline: "",
		},
		tableLayout: {
			rowCount: "",
			columnCount: "",
			rowProperties: {
				headline: "",
				index: "",
				minHeight: "",
			},
			columnProperties: {
				headline: "",
				index: "",
				width: "",
				verticalAlignment: {
					label: "",
					top: "",
					middle: "",
					bottom: "",
				},
			},
		},
		chart: {
			title: "",
			height: "",
			width: "",
			labelX: "",
			labelY: "",
			orientation: {
				label: "",
				vertical: "",
				horizontal: "",
			},
			data: {
				valueField: "",
				keyField: "",
				seriesName: "",
				labelIsNumeration: "",
			},
		},
		override: {
			boundingBox: {
				notAllowedToEdit: "",
			},
		},
	},
	elementOptions: {
		fieldTypes: {
			string: "",
			number: "",
			bool: "",
			typeDefinition: "",
		},
		formattingItems: {
			date: "",
			dateRange: "",
			html: "",
			checkbox: "",
		},
		tableColumnType: {
			field: "",
			expression: "",
		},
		pathColumnTypes: {
			path: "",
			label: "",
		},
		alignment: {
			left: "",
			right: "",
			center: "",
			justify: "",
		},
		borderStyles: {
			none: "",
			solid: "",
			dotted: "",
			dashed: "",
		},
		propertyItems: {
			bold: "",
			italic: "",
			underline: "",
			font: "",
			fontSize: "",
			lineHeight: "",
			horizontalAlignment: "",
			verticalAlignment: "",
			color: "",
			backgroundColor: "",
			borderStyle: "",
			borderWidth: "",
			borderColor: "",
			columnSpan: "",
			isHidden: "",
			isContentHidden: "",
			isHiddenRow: "",
			paddingTop: "",
			paddingBottom: "",
			paddingLeft: "",
			paddingRight: "",
		},
		groupPropertyItem: {
			isHidden: "",
		},
		pageBreakBehavior: {
			allow: "",
			avoid: "",
		},
	},
	ruleCodeEditor: {
		warningMessage: "",
	},
	validation: {
		title: {
			toolbar: {
				error: "",
				warning: "",
			},
			element: {
				error: "",
				warning: "",
			},
			segment: {
				error: "",
				warning: "",
			},
			form: {
				error: "",
				warning: "",
			},
			contextMenu: {
				hideConditions: "",
			},
		},
		error: {
			internalError: "",
			setPrintModel: "",
			uploadStaticImage: "",
			loadStaticImage: "",
		},
		errorTree: {
			heading: "",
			elements: "",
			messageBox: {
				noValidationErrors: "",
				debugMode: "",
				missingErrors: "",
			},
			buttons: {
				debugMode: "",
				viewErrorLocation: "",
			},
		},
		attachment: {
			upload: {
				title: "",
				supportedExtensions: "",
			},
		},
	},
	precompile: {
		messages: {
			heading: "",
			copy: "",
		},
	},
	textStyles: {
		label: "",
		button: {
			addNewTextStyle: "",
		},
		headline: {
			textStyleSetting: "",
			typographySetting: "",
		},
		properties: {
			name: "",
			semantic: "",
			font: "",
			fontSize: "",
			lineHeight: "",
			typesettingModel: "",
			hyphenator: "",
		},
		semantic: {
			P: "",
			H1: "",
			H2: "",
			H3: "",
			H4: "",
			H5: "",
			H6: "",
		},
		errorMessage: {
			name: {
				required: "",
			},
		},
		warningMessage: {
			fontIsNotConfigured: "",
			typesettingModeNotFound: "",
		},
		notification: {
			preventDelete: {
				title: "",
				description: "",
			},
			preventUndo: {
				title: "",
				description: "",
			},
			cannotLoadFont: {
				title: "",
				description: "",
			},
			useUnconfiguredFont: {
				title: "",
				description: "",
			},
			cannotLoadTypesetting: {
				title: "",
				description: "",
			},
		},
		tooltips: {
			defaultConfigurationFont: "",
			fontSizeLineHeightNote: "",
		},
		annotation: {
			default: "",
		},
		newTextStyleName: "",
	},
	confirmationDialog: {
		cannotBeUndone: {
			title: "",
			text: "",
		},
		delete: {
			title: "",
			text: "",
		},
		discardChanges: {
			title: "",
			text: "",
		},
	},
	interaction: {
		editor: {
			createNewElement: "",
			deleteElementsOnStage: "",
			groupElementsOnStage: "",
			moveElementByArrowKey: "",
		},
		relativeLayout: {
			changeMargin: "",
			changePageBreakBehavior: "",
		},
		useCopyPaste: {
			pasteElements: "",
		},
		tableLayout: {
			selectCellElement: "",
			removeCell: "",
		},
		form: {
			hideConditions: {
				changeHideConditions: "",
			},
			barChartFormContainer: {
				changeBasePath: "",
				changeGeneralDiagramProps: "",
				changeDocumentModel: "",
				changeDiagramTableData: "",
			},
			expressionFormContainer: {
				changeDocumentModel: "",
				changeContent: "",
				changeGeneralProperties: "",
				changeBorderProperties: "",
				changeTextProperties: "",
			},
			lineChartFormContainer: {
				changeBasePath: "",
				changeGeneralDiagramProps: "",
				changeDocumentModel: "",
				changeDiagramTableData: "",
			},
			lineFormContainer: {
				changeBorderProperties: "",
			},
			pieChartFormContainer: {
				changeBasePath: "",
				changeGeneralDiagramProps: "",
				changeDocumentModel: "",
				changeAxisProps: "",
				toggleUseNumerationAsLabel: "",
			},
			tableLayoutFormContainer: {
				changeNumberOfRow: "",
				changeNumberOfRowSource: "",
				changeNumberOfColumn: "",
				changeRowOption: "",
				changeColumnOption: "",
				changeBorderProperties: "",
			},
			textFormContainer: {
				toggleHideIfEmpty: "",
				changeBorderProperties: "",
				changeTextProperties: "",
				clearCalculationTextProperties: "",
			},
			imageFormContainer: {
				generalProperties: {
					changeAltText: "",
					changeHeight: "",
					changeWidth: "",
				},
				sourceType: {
					changeSourceType: "",
				},
				sourceTypeAttachment: {
					updateImgAttachment: "",
					deleteImgAttachment: "",
				},
				sourceTypeField: {
					changeBasePath: "",
					changeDocumentModel: "",
				},
			},
			listingFormContainer: {
				form: {
					column: {
						propertyComputation: {
							changePropertyComputation: "",
						},
						defaultComputation: {
							changeDefaultComputation: "",
						},
						groupComputation: {
							changeGroupComputation: "",
						},
						listingColumnForm: {
							changeColumnLabel: {
								source: "",
								value: "",
							},
							changeColumnWidth: {
								source: "",
								value: "",
							},
							toggleSortGroupContent: "",
							toggleColumnTextProperty: "",
							toggleColumnBorderProperty: "",
							changeTextProperties: "",
							changeBorderProperties: "",
						},
						tableFieldComputation: {
							addColumn: "",
							deleteColumn: "",
						},
					},
					fieldComputation: {
						fieldComputation: {
							changeFieldComputation: "",
						},
						fieldPropertyComputation: {
							changeFieldPropertyComputation: "",
						},
					},
					main: {
						headerProperties: {
							toggleHideHeaderRow: "",
							changeHeaderProperties: "",
						},
						mainForm: {
							changeBasePath: "",
							deletePropertyComputation: "",
							changeBorderProperties: "",
							changeTextProperties: "",
							changeDocumentModel: "",
							updatePropertyComputation: "",
						},
						mainPropertyComputationForm: {
							changePropertyComputation: "",
						},
						tableColumn: {
							addColumn: "",
							moveDown: "",
							moveUp: "",
							toggleSortingIndex: "",
							deleteColumn: "",
						},
					},
				},
			},
			sharedComponent: {
				calculationForm: {
					changeCalculationForm: "",
				},
				fieldForm: {
					changeFieldForm: "",
				},
				fieldTypeConfiguration: {
					changeFieldTypeConfiguration: "",
				},
			},
			tableFormContainer: {
				generalProperties: {
					changeMaxRowCount: {
						source: "",
						value: "",
					},
					changeSumLabel: {
						source: "",
						value: "",
					},
					changeFilterExpression: "",
				},
				headerProperties: {
					toggleHideHeader: "",
					changeTextProperties: "",
				},
				tableColumn: {
					addColumn: "",
					deleteColumn: "",
				},
				tableColumnExpression: {
					changeContent: "",
					clearTextProperties: "",
				},
				tableColumnFieldForm: {
					changeField: "",
					changeFieldFormatting: "",
					clearTextProperties: "",
				},
				tableColumnForm: {
					default: "",
					changeElementType: "",
					changeLabel: {
						value: "",
						source: "",
					},
					toggleHideLabel: "",
					changeWidth: {
						value: "",
						source: "",
					},
					toggleSumColumn: "",
				},
				tableForm: {
					changeBasePath: "",
					changeBorderProperties: "",
					changeTextProperties: "",
					changeDocumentModel: "",
				},
			},
			boundingBoxFormContainer: {
				changeBorderProperties: "",
			},
			areaFormContainer: {
				changeBorderProperties: "",
				changeDataContext: "",
			},
			switchFormContainer: {
				changeName: "",
				changeDocumentModel: "",
				addCase: "",
				removeCase: "",
				reorderCase: "",
				editCasePrecondition: "",
			},
		},

		general: {
			changeName: "",
			changeDescription: "",
			changeAnnotation: "",
			changeMetadataModel: "",
			changeMetadataTitle: "",
			changeMetadataDescription: "",
			changeMetadataAuthor: "",
			changeMetadataLanguage: "",
		},
		quickEditBar: {
			changePosition: "",
			changeDimension: "",
		},
		resizable: {
			resizeElement: "",
		},
		richTextEditor: {
			changeText: "",
		},
		schema: {
			schemaCard: {
				changeAlias: "",
			},
			schemaToolbar: {
				addSchema: "",
			},
			printModelReferences: {
				addReferenceEntry: "",
			},
		},
		section: {
			sectionCard: {
				addSection: "",
				changeTitle: "",
				deleteSection: "",
			},
			section: {
				resizeSection: "",
			},
		},
		watermark: {
			watermarkCard: {
				addWatermark: "",
				changeTitle: "",
				changeOpacity: "",
				changePreconditions: "",
				deleteWatermark: "",
			},
		},
		segment: {
			segmentCard: {
				duplicateSegment: "",
				deleteSegment: "",
				updateSegment: "",
				updateSegmentBasePath: "",
			},
			segmentContent: {
				reorderSegment: "",
			},
			SegmentToolbar: {
				addSegment: "",
				loadOverrideElements: "",
				addReferenceSegment: "",
			},
		},
		textStyle: {
			textStyle: {
				add: "",
			},
			textStyleCard: {
				removeTextStyle: "",
				duplicateTextStyle: "",
			},
			textStyleEditor: {
				changeTextStyleProperties: "",
			},
			textStyleContent: {
				reorderTextStyle: "",
			},
		},
		utils: {
			movePrintModelElement: "",
		},
		other: {
			fixInvalidElementHeights: "",
		},
	},
};

initializeKeys(RESOURCE_KEYS);
