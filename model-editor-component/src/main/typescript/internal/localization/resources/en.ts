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
import type { RESOURCE_KEYS } from "../keys.js";

export const en: typeof RESOURCE_KEYS = {
	application: {
		title: "Print Model Editor",
	},
	sidebar: {
		general: {
			name: "General",
			modelName: "Model name*",
			description: "Description",
			annotations: {
				headline: "Annotations",
				name: "Name",
				value: "Value",
			},
			message: {
				fieldRequired: "This field is required.",
				modelNameValidation:
					"Use only letters, digits, hyphens, underscores and periods. Furthermore, the name may only start with a letter or underscore, but not with 'xml'.",
				annotationNameDuplicate: "The annotation name must be unique",
				annotationNameProtected: "This annotation name is not allowed",
			},
			roleSettings: {
				header: {
					section: "Roles",
				},
				columns: {
					roleName: "Role*",
				},
				autocompleteHint: "{count} out of {total} options",
				placeholderContent: "There are no entries yet",
				confirmDeletion: {
					title: "Delete Row",
					message: "Deleting this Row cannot be reverted. Are you sure you want to delete it?",
				},
			},
			metadata: {
				headline: "PDF Metadata",
				title: "Title",
				description: "Description",
				author: "Author",
				language: "Language",
			},
		},
		schema: {
			name: "Schema",
			aliasLabel: "Alias",
			tab: {
				documentModelReferenced: "Document Model References",
				printModelReferenced: "Print Model References",
				typesettingModelReferenced: "Typesetting Model References",
			},
			tooltips: {
				defaultTypesettingModel: "Default typesetting model",
				printModelReferenceWithoutSegments: "The selected print model does not have a DINTemplate segment",
			},
		},
		content: "Content",
		textStyles: "Text Styles",
		segment: {
			name: "Segment",
			repeatable: "Repeatable",
			button: {
				menuSetting: "Open Menu",
			},
			setting: {
				name: "Name",
				namePlaceholder: "Segment title",
				reference: "Reference",
				segmentTemplate: "Segment Template",
			},
			toolbar: {
				namePlaceholder: "New Segmentation",
				dinTemplate: {
					selectPlaceHolder: "Select DINTemplate Segment",
				},
			},
		},
		section: {
			name: "Section",
			titlePlaceholder: "Section title",
			type: {
				first: "First",
				remaining: "Remaining",
			},
		},
		watermark: {
			name: "Watermark",
			titlePlaceholder: "Watermark title",
			setting: {
				opacity: "Opacity",
				conditions: "Conditions",
				description:
					"Below you can provide a set of A12 rules, under which the current watermark will be shown in print. If any of the rules holds true, then the watermark will be printed. When there are no conditions, the watermark is visible too",
			},
		},
		commitChanges: {
			title: "Commit changes",
			columns: {
				descriptions: "Description",
				propertyName: "Property Name",
				propertyValue: "Property Value",
				status: "Status",
				timestamp: "Date",
			},
			status: {
				commit: "Commit",
				pending: "Pending",
				overwritten: "Overwritten",
			},
			emptyDescription: "No description",
			commit: "Commit selected changes and truncate history",
			discard: "Discard all changes",
			error: {
				commitChangesFailed: "The pending changes could not be commited to the print model",
			},
		},
	},
	editor: {
		mode: {
			default: "Default",
			layout: "Layout",
			readingOrder: "Reading Order",
		},
		topMenu: {
			elementLibrary: {
				title: "Open/Close Element Library",
				headline: "Add Element",
				floatLibrary: "Change to floating Element Library",
				popupLibrary: "Change to pop-up Element Library",
				incomingDinTemplate:
					"This model is currently being used as a DINTemplate, therefore only BoundingBox is addable.",
				dinTemplateSegmentEditor: "This is a DINTemplate Segment, therefore no elements are allowed to add.",
			},
			layout: "Layout",
			tabOrder: "Tab-Order",
			hideFrames: "Hide Frames",
			showFrames: "Show Frames",
			hideMargins: "Hide Margins",
			showMargins: "Show Margins",
			textStyles: "TextStyle",
			deleteElement: "Delete selected elements",
			copyElement: "Copy selected elements",
			groupElement: "Group selected elements into Area",
			openElement: "Open Detail Edit",
			quickEditBar: {
				x: {
					placeholder: "Left",
					label: "Position left",
				},
				y: {
					placeholder: "Top",
					label: "Position top",
				},
				width: {
					placeholder: "Width",
					label: "Width",
				},
				height: {
					placeholder: "Height",
					label: "Height",
				},
			},
		},
		contextMenu: {
			copy: "Copy",
			paste: "Paste",
			delete: "Delete",
			groupElement: "Group into Area",
			hideConditions: "Hide conditions",
		},
		pageOrientation: {
			portrait: "Portrait",
			landscape: "Landscape",
		},
		type: {
			default: "Non-Repeatable",
		},
		element: {
			Text: "Text",
			Line: "Line",
			Table: "Table",
			Listing: "Listing",
			Expression: "Expression",
			Image: "Image",
			TableLayout: "Table Layout",
			LineChart: "Line Chart",
			BarChart: "Bar Chart",
			PieChart: "Pie Diagram",
			Field: "Field",
			Calculation: "Calculation",
			BoundingBox: "Bounding Box",
			PageNumber: "Page Number",
			PageNumberTotal: "Page Number Total",
			Override: "Override",
			Area: "Area",
			Switch: "Switch",
		},
		page: "Page",
		pageTotal: "TotalPage",
		pageOnTotal: "Page $page$/$total$",
		richTextEditor: {
			toolbarButton: {
				removeStyles: "Remove all styles",
			},
		},
	},
	layoutEditor: {
		topMenu: {
			topMargin: "Top Margin",
			bottomMargin: "Bottom Margin",
		},
	},
	input: {
		selectPlaceholder: "Please choose...",
		inputSource: {
			possibleSource: {
				default: "Default Value",
				input: "Enter User Input",
				unset: "Unset Value",
				inherited: "Value inherited from parent",
			},
			unsetPlaceholder: "Value not defined",
		},
		repeatableSettings: {
			headline: "Repeatability Settings",
		},
	},
	button: {
		add: "Add",
		apply: "Apply",
		discardChanges: "Discard Changes",
		save: "Save",
		cancel: "Cancel",
		edit: "Edit",
		delete: "Delete",
		close: "Close",
		open: "Open",
		duplicate: "Duplicate",
		back: "Back",
		openSetting: "Open Setting",
		closeSetting: "Close Setting",
		openEditor: "Open Editor",
		maximized: "Maximized",
		minimized: "Minimized",
		up: "Up",
		down: "Down",
		undo: "Undo",
		redo: "Redo",
		openMenu: "Open Menu",
	},
	indicator: {
		repeatable: "Repeatable",
		pageBreakAvoid: "Page break avoid",
	},
	elements: {
		tableLayout: {
			selectContentType: "Select Content Type",
			editCell: "Edit Cell",
			deleteCell: "Delete Cell",
		},
		table: {
			emptyHeader: "No label",
		},
	},
	elementForm: {
		switch: {
			name: "Name",
			precondition: "Precondition",
			elements: "Elements",
			emptyMessage: "There are no cases",
		},
		dataContextSelection: {
			repeatableGroup: "Repeatable group",
			repeatableInstance: "Instance of repeatable group",
			group: "group",
			field: "field",
			noTreeData: "There are no valid nodes (groups/fields) to select",
			hintMessage: {
				fieldType: "Available only for fields within non-repeatable groups or the selected instance",
				nonRepeatableGroup: "Available only for non-repeatable groups",
				repeatableGroup: "Available only for repeatable groups",
				anyGroup: "Available only for groups",
				instanceFieldType: "Available only for fields of the selected instance",
				instanceNonRepeatableGroup: "Available only for non-repeatable groups of the selected instance",
				instanceRepeatableGroup: "Available only for repeatable groups of the selected instance",
				instanceAnyGroup: "Available only for groups",
			},
		},
		hideConditions: {
			headline: "Hide conditions",
			description:
				"Below you can provide a set of A12 rules, under which the current page element will be hidden in print. If any of the rules holds true, then the page element will not be printed and each page element below the hidden element will be moved up to fill the resulting blank space.",
		},
		layoutConfig: {
			headline: "Layout Settings",
			pageBreakBehavior: {
				headline: "Page Break Settings",
				input: "Page Break Behavior",
				avoidInfoMessage: {
					containerElement:
						"If the element (including gaps between child elements and child elements that are also set to 'Avoid') falls on a page break, the whole element is pushed to the next page, even if it won't fit completely",
					standaloneElement:
						"If the element falls on a page break, it is pushed to the next page to avoid splitting. If it won't fit on the next page at all, it remains in its current position",
				},
			},
		},
		headline: "Page Element",
		textProperties: {
			headline: "Text Properties",
			bold: "Bold",
			italic: "Italic",
			underline: "Underline",
			color: "Color",
			backgroundColor: "Background Color",
			alignment: "Alignment",
			clearButton: "Clear Text Properties",
			legacyWarning:
				"This element has text properties from a previous editor version. These may affect PDF output. Clear them if they are not needed.",
		},
		borderProperties: {
			headline: "Border Properties",
			borderWidth: "Border Width",
			borderStyle: "Border Style",
			borderColor: "Border Color",
		},
		model: {
			documentModel: "Document Model",
			field: "Field",
			group: "Group",
			deleteDocumentModelButton: "Remove Document Model",
		},
		field: {
			fieldType: "Field Type",
			checkboxUnchecked: "Checkbox Icon (unchecked)",
			checkboxChecked: "Checkbox Icon (checked)",
			dateFormat: "Date Format",
			dateRangeFormatStart: "Date Format (Start)",
			dateRangeFormatEnd: "Date Format (End)",
			dateRangeDelimiter: "Date Separator",
			dateFormatHint: "The date format is based on Java DateTimeFormatter. Click for further information",
			suffix: "Suffix",
		},
		computation: {
			condition: "Condition",
			precondition: "Precondition",
			operation: "Operation",
		},
		text: {
			text: "Text",
		},
		line: {
			linePropertiesHeadline: "Line Properties",
		},
		textFlow: {
			hideIfEmpty: "Hide this element if all nested entities are empty",
			field: {
				saveButton: "save field",
			},
			computation: {
				name: "Name",
				formattingType: "Formatting Type",
				typeDefinition: "TypeDefinition from the DocumentModel",
				saveButton: "save computation",
			},
		},
		image: {
			imageSrc: "Image source",
			imageSrcType: {
				static: "Static",
				dynamic: "Dynamic",
			},
			field: "Field",
			attachment: "Attachment",
			alt: "Alternative Text",
			height: "Height",
			width: "Width",
			action: {
				replace: "Replace",
				download: "Download",
				upload: "Upload",
			},
			resource: {
				selector: "Resource",
				internalFilename: "Internal Filename",
				size: "Size",
				mimeType: "MIME Type",
			},
		},
		expression: {
			expressionText: "Content",
			generalPropertiesHeadline: "General Properties",
			hideIfEmpty: "Hide this element if all nested entities are empty",
		},
		listing: {
			columns: {
				title: "Listing Column",
				headline: "Columns",
				label: "Column label",
				width: "Column width",
				isSortingIndex: "Sorting index",
				isSortingIndexFormLabel: "Sort group content by this column",
				hasCustomTextProperties: "Column has custom text properties",
				hasCustomBorderProperties: "Column has custom border properties",
			},
			rowPropertiesComputations: {
				headline: "Row Property Computations",
			},
			defaultComputations: {
				headline: "Default Computations",
				description: `These computations will be executed for all rows. Their results will be treated as a default value, that
					will be overridden by any result of the corresponding groups-computation or fields-computation.`,
			},
			valueComputations: {
				headline: "Value Computation",
			},
			groupComputations: {
				headline: "Group Computations",
				description: "These computations will be executed only on the group rows of the listing.",
			},
			fieldComputations: {
				title: "Listing Field Computation",
				headline: "Field Computations",
				documentFieldType: "Document Field Type",
				documentFieldTypeDescription: `Select the input field type for this set of computations. These computations will only be executed on
					rows, which target fields with the selected field-type.`,
				resultFieldType: "Computation Result Field Type",
				resultFieldTypeDescription: "Select the field type of the results of the value computations.",
				fieldTypeSerialized: "Computation Input Type",
				fieldTypeSerializedOutput: "Computation Output Type",
			},
			propertyComputations: {
				headline: "Property Computation",
				property: "Property*",
			},
			groupPropertyComputation: {
				headline: "Group Property Computations",
				groupPath: "Group Path",
				property: "Property*",
				preconditionHint:
					"The precondition is only allowed to evaluate to true for fields and groups within the selected group path",
				basePathRequiredMessage: "To select a group path, please first choose a group in the Listing form",
			},
			headerProperties: {
				headline: "Header Properties",
				hideHeader: "Hide header row?",
			},
			bodyProperties: {
				headline: "Body Properties",
			},
		},
		table: {
			column: {
				title: "Table Column",
				type: "Element type",
				label: "Label",
				headerLabelHidden: "Hide label?",
				width: "Width",
				button: {
					back: "Back",
				},
				field: {
					text: "Field",
					sumColumn: "Sum column",
				},
			},
			generalPropertiesHeadline: "General Properties",
			maxRowCount: "Max row count",
			sumLabel: "Sum row label",
			filteringHeadline: "Filtering",
			filterExpression: "Filter expression",
			headerPropertiesHeadline: "Header Properties",
			hideHeader: "Hide Header?",
			bodyPropertiesHeadline: "Body Properties",
		},
		tableLayout: {
			rowCount: "Number of Rows",
			columnCount: "Number of Columns",
			rowProperties: {
				headline: "Row Options",
				index: "Index",
				minHeight: "Minimum Height",
			},
			columnProperties: {
				headline: "Column Options",
				index: "Index",
				width: "Width",
				verticalAlignment: {
					label: "Vertical Alignment",
					top: "Top",
					middle: "Middle",
					bottom: "Bottom",
				},
			},
		},
		chart: {
			title: "Title",
			height: "Height",
			width: "Width",
			labelX: "Label Category Axis",
			labelY: "Label Value Axis",
			orientation: {
				label: "Orientation",
				vertical: "Vertical",
				horizontal: "Horizontal",
			},
			data: {
				valueField: "Field with value",
				keyField: "Field for labels",
				seriesName: "Name of series",
				labelIsNumeration: "Use numeration as label",
			},
		},
		override: {
			boundingBox: {
				notAllowedToEdit: "Bounding Box Override element is not allowed to edit",
			},
		},
	},
	elementOptions: {
		fieldTypes: {
			string: "String",
			number: "Number",
			bool: "Boolean",
			typeDefinition: "TypeDefinition",
		},
		formattingItems: {
			date: "Date",
			dateRange: "Date Range",
			html: "HTML",
			checkbox: "Checkbox",
		},
		tableColumnType: {
			field: "Field",
			expression: "Expression",
		},
		pathColumnTypes: {
			path: "Path",
			label: "Field Label",
		},
		alignment: {
			left: "Left",
			right: "Right",
			center: "Center",
			justify: "Justify",
		},
		borderStyles: {
			none: "None",
			solid: "Solid",
			dotted: "Dotted",
			dashed: "Dashed",
		},
		propertyItems: {
			bold: "Bold",
			italic: "Italic",
			underline: "Underlined",
			font: "Font",
			fontSize: "Font size",
			lineHeight: "Line Height",
			horizontalAlignment: "Horizontal Alignment",
			verticalAlignment: "Vertical Alignment",
			color: "Color",
			backgroundColor: "Background color",
			borderStyle: "Border style",
			borderWidth: "Border width",
			borderColor: "Border color",
			columnSpan: "Column span",
			isHidden: "Hide cell",
			isContentHidden: "Hide value",
			isHiddenRow: "Hide row",
			paddingTop: "Padding top",
			paddingBottom: "Padding bottom",
			paddingLeft: "Padding left",
			paddingRight: "Padding right",
		},
		groupPropertyItem: {
			isHidden: "Hide group",
		},
		pageBreakBehavior: {
			allow: "Allow",
			avoid: "Avoid",
		},
	},
	ruleCodeEditor: {
		warningMessage: "Editor initialization failed",
	},
	validation: {
		title: {
			toolbar: {
				error: "There are $count$ error(s) on the current view",
				warning: "There are $count$ warning(s) the current view",
			},
			element: {
				error: "There are $count$ error(s) on the element",
				warning: "There are $count$ warning(s) on the element",
			},
			segment: {
				error: "There are $count$ error(s) on the segment",
				warning: "There are $count$ warning(s) on the segment",
			},
			form: {
				error: "There are $count$ error(s) on the form",
				warning: "There are $count$ warning(s) on the form",
			},
			contextMenu: {
				hideConditions: "There are $count$ error(s) on the hide conditions",
			},
		},
		error: {
			internalError: "Internal error",
			setPrintModel: "Could not set print model",
			uploadStaticImage: "Could not upload image",
			loadStaticImage: "Could not load image",
		},
		errorTree: {
			heading: "Validation Issues",
			elements: "Elements",
			messageBox: {
				noValidationErrors: "No Validation Issues",
				debugMode:
					"You are currently in debug mode. The error tree reflects the underlying JSON structure of the print model.",
				missingErrors: "There are some Errors missing in this view. Please select debug mode.",
			},
			buttons: {
				debugMode: "debug",
				viewErrorLocation: "Go to Issue",
			},
		},
		attachment: {
			upload: {
				title: "Cannot upload this file",
				supportedExtensions: "Only $extensions$ are supported.",
			},
		},
	},
	precompile: {
		messages: {
			heading: "Precompiling Issues",
			copy: "Copy Stacktrace",
		},
	},
	textStyles: {
		label: "Text Styles",
		button: {
			addNewTextStyle: "Add New Text Style",
		},
		headline: {
			textStyleSetting: "Text Style Setting",
			typographySetting: "Typography Setting",
		},
		properties: {
			name: "Name",
			semantic: "Semantic",
			font: "Font",
			fontSize: "Font Size",
			lineHeight: "Line Height",
			typesettingModel: "Typesetting Model",
			hyphenator: "Static Hyphenation",
		},
		semantic: {
			P: "Paragraph",
			H1: "Headline 1",
			H2: "Headline 2",
			H3: "Headline 3",
			H4: "Headline 4",
			H5: "Headline 5",
			H6: "Headline 6",
		},
		errorMessage: {
			name: {
				required: "Name is required",
			},
		},
		warningMessage: {
			fontIsNotConfigured:
				"Font does not exist in the workspace resources. Elements using this text style will be printed with the default font.",
			typesettingModeNotFound: "This typesetting model not found in the workspace",
		},
		notification: {
			preventDelete: {
				title: "The Text Style cannot be deleted",
				description: "The Text Style cannot be deleted since it was used by some elements",
			},
			preventUndo: {
				title: "Cannot undo this action",
				description: "Cannot undo the action of creating the Text Style, which was used by some elements",
			},
			cannotLoadFont: {
				title: "Cannot load font",
				description: "The font $font$ configured in the print engine cannot be loaded",
			},
			useUnconfiguredFont: {
				title: `Text style "$textStyle$" uses a non-existent font`,
				description: `"$font$" does not exist in the workspace resources. Check that the resource file name matches the selected font name.`,
			},
			cannotLoadTypesetting: {
				title: "Cannot load typesetting",
				description: "The typesetting $typesetting$ cannot be loaded",
			},
		},
		tooltips: {
			defaultConfigurationFont: "Default configuration font",
			fontSizeLineHeightNote:
				"Please note that the recommended line height should be 1.5 times greater than the Font Size, e. g. if you are working with a Font Size of 12, the recommended Line Height is 18",
		},
		annotation: {
			default: "Default",
		},
		newTextStyleName: "New Text Style",
	},
	confirmationDialog: {
		cannotBeUndone: {
			title: "Warning: Cannot be undone action!",
			text: "Do you really want to perform this action? Please keep in mind that this action can not be undone! ",
		},
		delete: {
			title: "Delete",
			text: "Do you really want to delete this entry?",
		},
		discardChanges: {
			title: "Warning: Discard all changes",
			text: "All pending changes will be discarded and cannot be restored. What do you want to do?",
		},
	},
	interaction: {
		other: {
			fixInvalidElementHeights:
				"WARNING: Invalid heights of elements were automatically fixed. The PrintModel might contain some invalid data",
		},
		editor: {
			createNewElement: "Created new element on stage",
			deleteElementsOnStage: "Deleted elements on stage",
			groupElementsOnStage: "Grouped elements on stage into Area",
			moveElementByArrowKey: "Moved elements on stage",
		},
		relativeLayout: {
			changeMargin: "Changed margins of elements on stage",
			changePageBreakBehavior: "Changed page break behavior",
		},
		useCopyPaste: {
			pasteElements: "Paste copied elements",
		},
		tableLayout: {
			selectCellElement: "Selected a cell element of Table Layout element",
			removeCell: "Deleted a cell element of Table Layout element",
		},
		form: {
			hideConditions: {
				changeHideConditions: "Changed hide conditions of element",
			},
			barChartFormContainer: {
				changeBasePath: "Changed base path of Bar Chart element",
				changeGeneralDiagramProps: "Changed general diagram properties of Bar Chart element",
				changeDocumentModel: "Changed Document Model of Bar Chart element",
				changeDiagramTableData: "Changed diagram table data of Bar Chart element",
			},
			expressionFormContainer: {
				changeDocumentModel: "Changed Document Model of Expression element",
				changeContent: "Changed Content of Expression element",
				changeGeneralProperties: "Changed General Properties of Expression element",
				changeBorderProperties: "Changed Border Properties of Expression element",
				changeTextProperties: "Changed Text Properties of Expression element",
			},
			lineChartFormContainer: {
				changeBasePath: "Changed base path of Line Chart element",
				changeGeneralDiagramProps: "Changed general diagram properties of Line Chart element",
				changeDocumentModel: "Changed Document Model of Line Chart element",
				changeDiagramTableData: "Changed diagram table data of Line Chart element",
			},
			lineFormContainer: {
				changeBorderProperties: "Changed Border Properties of Line element",
			},
			pieChartFormContainer: {
				changeBasePath: "Changed base path of Pie Chart element",
				changeGeneralDiagramProps: "Changed general diagram properties of Pie Chart element",
				changeDocumentModel: "Changed Document Model of Pie Chart element",
				changeAxisProps: "Changed axis properties of of Pie Chart element",
				toggleUseNumerationAsLabel: "Toggled use numeration as label of Pie Chart element",
			},
			tableLayoutFormContainer: {
				changeNumberOfRow: "Changed Number of Rows of Table Layout element",
				changeNumberOfRowSource: "Changed Source for Number of Rows of Table Layout element",
				changeNumberOfColumn: "Changed Number of Columns of Table Layout element",
				changeRowOption: "Changed Row Options of Table Layout element",
				changeColumnOption: "Changed Column Options of Table Layout element",
				changeBorderProperties: "Changed Border Properties of Table Layout element",
			},
			textFormContainer: {
				toggleHideIfEmpty: "Toggle hide text element if all nested entities are empty of Text element",
				changeBorderProperties: "Changed Border Properties of Text element",
				changeTextProperties: "Changed Text Properties of Text element",
				clearCalculationTextProperties: "Cleared text properties of Calculation in Text element",
			},
			imageFormContainer: {
				generalProperties: {
					changeAltText: "Changed Alternative Text of Image element",
					changeHeight: "Changed Height of Image element",
					changeWidth: "Changed Width of Image element",
				},
				sourceType: {
					changeSourceType: "Changed Image source type of Image element",
				},
				sourceTypeAttachment: {
					deleteImgAttachment: "Deleted Image attachment of Image element",
					updateImgAttachment: "Updated Image attachment of Image element",
				},
				sourceTypeField: {
					changeBasePath: "Changed base path of Image element",
					changeDocumentModel: "Changed Document Model of Image element",
				},
			},
			listingFormContainer: {
				form: {
					column: {
						propertyComputation: {
							changePropertyComputation: "Changed Property Computation for a column of Listing element",
						},
						defaultComputation: {
							changeDefaultComputation: "Changed Default Computation for a column of Listing element",
						},
						groupComputation: {
							changeGroupComputation: "Changed Group Computation for a column of Listing element",
						},
						listingColumnForm: {
							changeColumnLabel: {
								source: "Changed Source for Column label of Listing element",
								value: "Changed Column label of Listing element",
							},
							changeColumnWidth: {
								source: "Changed Source for Column width of Listing element",
								value: "Changed Column width of Listing element",
							},
							toggleSortGroupContent: "Toggled Sort group by content for a column of Listing element",
							toggleColumnTextProperty:
								"Toggled Column has custom text properties for a column of Listing element",
							toggleColumnBorderProperty:
								"Toggled Column has custom border propperties for a column of Listing element",
							changeTextProperties: "Changed Column Text Properties of Listing element",
							changeBorderProperties: "Changed Column Border Properties of Listing element",
						},
						tableFieldComputation: {
							addColumn: "Added column for Listing element",
							deleteColumn: "Deleted column for Listing element",
						},
					},
					fieldComputation: {
						fieldComputation: {
							changeFieldComputation: "Changed Field Computations of Listing element",
						},
						fieldPropertyComputation: {
							changeFieldPropertyComputation: "Changed Field Property Computation of Listing element",
						},
					},
					main: {
						headerProperties: {
							toggleHideHeaderRow: "Toggle hide header row of Listing element",
							changeHeaderProperties: "Changed Header Properties of Listing element",
						},
						mainForm: {
							changeBasePath: "Changed base path of Listing element",
							deletePropertyComputation: "Deleted Property Computation of Listing element",
							changeBorderProperties: "Changed Border Properties of Listing element",
							changeTextProperties: "Changed Text Properties of Listing element",
							changeDocumentModel: "Changed Document Model of Listing element",
							updatePropertyComputation: "Changed Property Computation of Listing element",
						},
						mainPropertyComputationForm: {
							changePropertyComputation: "Changed Property Computation of Listing element",
						},
						tableColumn: {
							addColumn: "Added new column for Listing element",
							moveDown: "Moved down a column of Listing element",
							moveUp: "Moved up a column of Listing element",
							toggleSortingIndex: "Toggled Sorting index for a column of Listing element",
							deleteColumn: "Deleted a column of Listing element",
						},
					},
				},
			},
			sharedComponent: {
				calculationForm: {
					changeCalculationForm: "Changed Calculation Form",
				},
				fieldForm: {
					changeFieldForm: "Changed Field Form",
				},
				fieldTypeConfiguration: {
					changeFieldTypeConfiguration: "Changed Field TypeDefinition",
				},
			},
			tableFormContainer: {
				generalProperties: {
					changeMaxRowCount: {
						value: "Changed Max row count of Table element",
						source: "Changed the source of the Max row count of Table element",
					},
					changeSumLabel: {
						value: "Changed Sum row label of Table element",
						source: "Changed the source of the Sum row label of Table element",
					},
					changeFilterExpression: "Changed Filter expression of Table element",
				},
				headerProperties: {
					toggleHideHeader: "Toggled Hide header of Table element",
					changeTextProperties: "Changed text properties of header of Table element",
				},
				tableColumn: {
					addColumn: "Added new column for Table element",
					deleteColumn: "Deleted a column of Table element",
				},
				tableColumnExpression: {
					changeContent: "Changed Content of expression column of Table element",
					clearTextProperties: "Cleared text properties of Expression in Table column",
				},
				tableColumnFieldForm: {
					changeField: "Changed Field column of Table element",
					changeFieldFormatting: "Changed Field Formatting of Table element",
					clearTextProperties: "Cleared text properties of Field in Table column",
				},
				tableColumnForm: {
					default: "Updated Table Column of Table element",
					changeElementType: "Changed Element type for a column of Table element",
					changeLabel: {
						value: "Changed Label for a column of Table element",
						source: "Changed the source of Label of Table element",
					},
					toggleHideLabel: "Toggled Hide label for a column of Table element",
					changeWidth: {
						value: "Changed Width for a column of Table element",
						source: "Changed the source of Width of Table element",
					},
					toggleSumColumn: "Toggled Sum column for a column of Table element",
				},
				tableForm: {
					changeBasePath: "Changed base path of Table element",
					changeBorderProperties: "Changed Border Properties of Table element",
					changeTextProperties: "Changed Text Properties of Table element",
					changeDocumentModel: "Changed Document Model of Table element",
				},
			},
			boundingBoxFormContainer: {
				changeBorderProperties: "Changed Border Properties of Bounding Box element",
			},
			areaFormContainer: {
				changeBorderProperties: "Changed Border Properties of Area element",
				changeDataContext: "Changed Data Context of Area element",
			},
			switchFormContainer: {
				changeName: "Changed name of Switch element",
				changeDocumentModel: "Changed Document Model of Switch element",
				addCase: "Add Switch precondition case",
				removeCase: "Remove Switch precondition case",
				reorderCase: "Reorder Switch cases",
				editCasePrecondition: "Edit Switch precondition case",
			},
		},
		general: {
			changeName: "Changed Model name",
			changeDescription: "Changed Model's description",
			changeAnnotation: "Changed Annotations",
			changeMetadataModel: "Changed Document Model for Metadata",
			changeMetadataTitle: "Changed Title Computation",
			changeMetadataDescription: "Changed Description Computation",
			changeMetadataAuthor: "Changed Author Computation",
			changeMetadataLanguage: "Changed Language Computation",
		},
		quickEditBar: {
			changePosition: "Change position of selected element",
			changeDimension: "Change dimension of selected element",
		},
		resizable: {
			resizeElement: "Resize element",
		},
		richTextEditor: {
			changeText: "Edited text of Text element",
		},
		schema: {
			schemaCard: {
				changeAlias: "Changed alias for a Document Model",
			},
			schemaToolbar: {
				addSchema: "Added a Document Model Reference",
			},
			printModelReferences: {
				addReferenceEntry: "Add Reference Entry",
			},
		},
		section: {
			sectionCard: {
				addSection: "Added a Section",
				changeTitle: "Changed Title of Section",
				deleteSection: "Deleted a Section",
			},
			section: {
				resizeSection: "Resized a Section",
			},
		},
		watermark: {
			watermarkCard: {
				addWatermark: "Added a Watermark",
				changeTitle: "Change Title of Watermark",
				changeOpacity: "Change Opacity of Watermark",
				changePreconditions: "Changed pre conditions of watermark",
				deleteWatermark: "Deleted a Watermark",
			},
		},
		segment: {
			segmentCard: {
				duplicateSegment: "Duplicated a Segment",
				deleteSegment: "Deleted a Segment",
				updateSegment: "Updated a Segment",
				updateSegmentBasePath: "Updated segment basepath",
			},
			segmentContent: {
				reorderSegment: "Reordered Segments",
			},
			SegmentToolbar: {
				addSegment: "Added a Segment",
				loadOverrideElements: "Loaded Override Elements",
				addReferenceSegment: "Added Reference Segment",
			},
		},
		textStyle: {
			textStyle: {
				add: "Added a Text Style",
			},
			textStyleCard: {
				removeTextStyle: "Removed a Text Style",
				duplicateTextStyle: "Duplicated a Text Style",
			},
			textStyleEditor: {
				changeTextStyleProperties: "Changed Text Style's properties",
			},
			textStyleContent: {
				reorderTextStyle: "Reordered Text Styles",
			},
		},
		utils: {
			movePrintModelElement: "Moved Print Model Element",
		},
	},
};
