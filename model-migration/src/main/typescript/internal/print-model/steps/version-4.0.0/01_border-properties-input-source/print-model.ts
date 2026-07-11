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
// Automatically generated from DomainPrintMetaModel.json on 4/21/2026, 5:18:33 PM.

export interface LocalesDTO {
	code: string;
}

export interface LabelsDTO {
	locale: string;
	text: string;
}

export interface AnnotationsDTO {
	name: string;
	value?: string;
}

export interface ModelReferencesDTO {
	reference: string;
	modelType: string;
	alias?: string;
	purpose?: string;
}

export interface HeaderDTO {
	id: string;
	modelType: string;
	modelVersion: string;
	description: string;
	locales?: LocalesDTO[];
	labels?: LabelsDTO[];
	annotations?: AnnotationsDTO[];
	modelReferences?: ModelReferencesDTO[];
}

export interface TitleComputationDTO {
	id: string;
	operation: string;
	precondition?: string;
}

export interface DescriptionComputationDTO {
	id: string;
	operation: string;
	precondition?: string;
}

export interface LanguageComputationDTO {
	id: string;
	operation: string;
	precondition?: string;
}

export interface AuthorComputationDTO {
	id: string;
	operation: string;
	precondition?: string;
}

export interface MetadataDTO {
	id: string;
	model?: string;
	titleComputation?: TitleComputationDTO[];
	descriptionComputation?: DescriptionComputationDTO[];
	languageComputation?: LanguageComputationDTO[];
	authorComputation?: AuthorComputationDTO[];
}

export interface SegmentDefaultsDTO {
	id: string;
	fontSize: number;
	model?: string;
}

export interface RuntimeVariablesDTO {
	id: string;
	name: string;
	type: Enumeration_RuntimeVariables_TypeDTO;
}

export interface TextStylesDTO {
	id: string;
}

export interface StructureDTO {
	id: string;
}

export interface SectionsDTO {
	id: string;
}

export interface WatermarksDTO {
	id: string;
}

export interface GeneralDTO {
	id: string;
	metadata?: MetadataDTO;
	segmentDefaults?: SegmentDefaultsDTO;
	runtimeVariables?: RuntimeVariablesDTO[];
	textStyles?: TextStylesDTO[];
	structure?: StructureDTO[];
	sections?: SectionsDTO[];
	watermarks?: WatermarksDTO[];
}

export interface DefaultSegmentDTO {
	id?: string;
	pageOrientation?: Enumeration_DefaultSegment_PageOrientationDTO;
}

export interface XDTO {
	id?: string;
	value?: number;
	unit?: Enumeration_X_UnitDTO;
}

export interface YDTO {
	id?: string;
	value?: number;
	unit?: Enumeration_Y_UnitDTO;
}

export interface PositionDTO {
	id: string;
	x?: XDTO;
	y?: YDTO;
}

export interface MinHeightDTO {
	id?: string;
	value?: number;
	unit?: Enumeration_MinHeight_UnitDTO;
}

export interface MinWidthDTO {
	id?: string;
	value?: number;
	unit?: Enumeration_MinWidth_UnitDTO;
}

export interface DimensionsDTO {
	id: string;
	minHeight?: MinHeightDTO;
	minWidth?: MinWidthDTO;
}

export interface HideConditionsDTO {
	id: string;
	precondition: string;
}

export interface ScreenReadingOrderDTO {
	id: string;
	screenReadingOrderWeight: number;
}

export interface MarginDTO {
	id?: string;
	value?: number;
	unit?: Enumeration_Margin_UnitDTO;
}

export interface TopDTO {
	id?: string;
	type?: Enumeration_Top_TypeDTO;
	margin?: MarginDTO;
}

export interface BottomDTO {
	id?: string;
	type?: Enumeration_Bottom_TypeDTO;
	margin?: MarginDTO;
}

export interface MarginsDTO {
	id?: string;
	top?: TopDTO;
	bottom?: BottomDTO;
}

export interface InputSourceDTO<T> {
	id: string;
	path: string;
	source: Enumeration_PageBreakBehavior_SourceDTO;
	value?: T;
	reference?: string;
}

export interface ElementReferencesDTO {
	id: string;
	refId: string;
	position?: PositionDTO;
	dimensions?: DimensionsDTO;
	hideConditions?: HideConditionsDTO[];
	screenReadingOrder?: ScreenReadingOrderDTO;
	margins?: MarginsDTO;
	pageBreakBehavior?: InputSourceDTO<Enumeration_PageBreakBehavior_ValueDTO>;
}

export interface DinTemplateDTO {
	id?: string;
	referenceId?: string;
	refId?: string;
}

export interface DataContextsDTO {
	path: string;
	isRepetition: boolean;
	id: string;
	model: string;
}

export interface DefinitionsDTO {
	id: string;
	title: string;
	type: Enumeration_Definitions_TypeDTO;
	defaultSegment?: DefaultSegmentDTO;
	elementReferences?: ElementReferencesDTO[];
	dinTemplate?: DinTemplateDTO;
	dataContexts?: DataContextsDTO[];
}

export interface RefIdsDTO {
	id?: string;
	refId: string;
}

export interface ReferencesDTO {
	id: string;
	purpose: Enumeration_References_PurposeDTO;
	direction: Enumeration_References_DirectionDTO;
	referenceModel: string;
	refIds?: RefIdsDTO[];
}

export interface SegmentsDTO {
	id: string;
	definitions?: DefinitionsDTO[];
	references?: ReferencesDTO[];
}

export interface HeaderHeightDTO {
	id?: string;
	value?: number;
	unit?: Enumeration_HeaderHeight_UnitDTO;
}

export interface FooterHeightDTO {
	id?: string;
	value?: number;
	unit?: Enumeration_FooterHeight_UnitDTO;
}

export interface DefinitionsDTO_1 {
	id: string;
	title: string;
	sectionUsage: Enumeration_Definitions_SectionUsageDTO;
	pageOrientation: Enumeration_Definitions_PageOrientationDTO;
	headerHeight?: HeaderHeightDTO;
	footerHeight?: FooterHeightDTO;
	elementReferences?: ElementReferencesDTO[];
}

export interface SectionsDTO_1 {
	id?: string;
	definitions?: DefinitionsDTO_1[];
}

export interface DisplayOptionsDTO {
	id?: string;
	displayType?: Enumeration_DisplayOptions_DisplayTypeDTO;
	dateFormat?: string;
	dateRangeFormatStart?: string;
	dateRangeFormatEnd?: string;
	dateRangeDelimiter?: string;
	checkboxChecked?: string;
	checkboxUnchecked?: string;
	suffix?: string;
}

export interface FieldDTO {
	id?: string;
	model?: string;
	path?: string;
	displayOptions?: DisplayOptionsDTO;
}

export interface TypeDefinitionDTO {
	id?: string;
}

export interface FieldTypeDTO {
	id?: string;
	fieldType?: Enumeration_FieldType_FieldTypeDTO;
	typeDefinition?: TypeDefinitionDTO;
}

export interface ComputationAlternativesDTO {
	id: string;
	operation: string;
	precondition?: string;
}

export interface CalculationDTO {
	id?: string;
	model?: string;
	name?: string;
	fieldType?: FieldTypeDTO;
	computationAlternatives?: ComputationAlternativesDTO[];
	displayOptions?: DisplayOptionsDTO;
}

export interface EntitiesDTO {
	id: string;
	refId: string;
}

export interface TextElementDTO {
	id?: string;
	text?: string;
	hideIfEmpty?: boolean;
	entities?: EntitiesDTO[];
}

export interface ExpressionDTO {
	id?: string;
	model?: string;
	basePath?: string;
	text?: string;
	hideIfEmpty?: boolean;
}

export interface HeightDTO {
	id?: string;
	value?: number;
	unit?: Enumeration_Height_UnitDTO;
}

export interface WidthDTO {
	id?: string;
	value?: number;
	unit?: Enumeration_Width_UnitDTO;
}

export interface OriginalHeightDTO {
	id?: string;
	value?: number;
	unit?: Enumeration_OriginalHeight_UnitDTO;
}

export interface OriginalWidthDTO {
	id?: string;
	value?: number;
	unit?: Enumeration_OriginalWidth_UnitDTO;
}

export interface DimensionsDTO_1 {
	id?: string;
	height?: HeightDTO;
	width?: WidthDTO;
	originalHeight?: OriginalHeightDTO;
	originalWidth?: OriginalWidthDTO;
}

export interface ImageAttachmentDTO {
	original_filename?: string;
	internal_filename?: string;
	content?: string;
	attachment_id?: string;
	size?: number;
	mime_type?: string;
	category?: string;
	description?: string;
}

export interface AttachmentSourceDTO {
	id?: string;
	imageAttachment?: ImageAttachmentDTO;
}

export interface FieldSourceDTO {
	id?: string;
	model?: string;
	path?: string;
}

export interface ImageDTO {
	id?: string;
	imageSrcType?: Enumeration_Image_ImageSrcTypeDTO;
	alternativeText?: string;
	dimensions?: DimensionsDTO_1;
	attachmentSource?: AttachmentSourceDTO;
	fieldSource?: FieldSourceDTO;
}

export interface MeasureInputSourceDTO {
	id: string;
	path: string;
	source?: Enumeration_Width_SourceDTO;
	value?: number;
	unit: Enumeration_Width_UnitDTO;
}

export interface LabelDTO {
	id: string;
	path: string;
	source?: Enumeration_Label_SourceDTO;
	value?: string;
}

export interface ColumnsDTO {
	id: string;
	refId: string;
	headerLabelHidden?: boolean;
	sumColumn?: boolean;
	hasCustomTextProperties?: boolean;
	width?: MeasureInputSourceDTO;
	label?: LabelDTO;
}

export interface HeaderTextPropertiesDTO {
	id?: string;
	color?: InputSourceDTO<string>;
	backgroundColor?: InputSourceDTO<string>;
	alignment?: InputSourceDTO<Enumeration_Alignment_ValueDTO>;
	bold?: InputSourceDTO<boolean>;
	italic?: InputSourceDTO<boolean>;
	underlined?: InputSourceDTO<boolean>;
	textStyleId?: InputSourceDTO<string>;
}

export interface SumLabelDTO {
	id: string;
	path: string;
	source?: Enumeration_SumLabel_SourceDTO;
	value?: string;
}

export interface MaxRowCountDTO {
	id: string;
	path: string;
	source?: Enumeration_MaxRowCount_SourceDTO;
	value?: number;
}

export interface TableDTO {
	id?: string;
	model?: string;
	basePath?: string;
	filterExpression?: string;
	hideHeader?: boolean;
	columns?: ColumnsDTO[];
	headerTextProperties?: HeaderTextPropertiesDTO;
	sumLabel?: SumLabelDTO;
	maxRowCount?: MaxRowCountDTO;
}

export interface RowPropertiesDTO {
	id: string;
	index: number;
	minHeight?: MeasureInputSourceDTO;
}

export interface ColumnPropertiesDTO {
	id: string;
	index: number;
	verticalAlignment?: Enumeration_ColumnProperties_VerticalAlignmentDTO;
	width?: MeasureInputSourceDTO;
}

export interface CellsDTO {
	id: string;
	refId: string;
	row: number;
	column: number;
}

export interface TableLayoutDTO {
	id?: string;
	rowCount?: number;
	columnCount?: number;
	rowProperties?: RowPropertiesDTO[];
	columnProperties?: ColumnPropertiesDTO[];
	cells?: CellsDTO[];
}

export interface RowPropertyComputationsDTO {
	id: string;
	property: Enumeration_RowPropertyComputations_PropertyDTO;
	computationAlternatives?: ComputationAlternativesDTO[];
}

export interface ComputationAlternativesDTO_1 {
	id: string;
	operation: string;
	precondition: string;
}

export interface GroupPropertyComputationsDTO {
	id: string;
	property: Enumeration_GroupPropertyComputations_PropertyDTO;
	groupPath: string;
	computationAlternatives?: ComputationAlternativesDTO_1[];
}

export interface PropertyComputationsDTO {
	id: string;
	property: Enumeration_PropertyComputations_PropertyDTO;
	computationAlternatives?: ComputationAlternativesDTO[];
}

export interface ValueComputationAlternativesDTO {
	id: string;
	operation: string;
	precondition?: string;
}

export interface DefaultDTO {
	id?: string;
	propertyComputations?: PropertyComputationsDTO[];
	valueComputationAlternatives?: ValueComputationAlternativesDTO[];
}

export interface GroupDTO {
	id?: string;
	propertyComputations?: PropertyComputationsDTO[];
	valueComputationAlternatives?: ValueComputationAlternativesDTO[];
}

export interface FieldDTO_1 {
	id: string;
	inputFieldTypeSerialized: string;
	outputFieldTypeSerialized: string;
	propertyComputations?: PropertyComputationsDTO[];
	valueComputationAlternatives?: ValueComputationAlternativesDTO[];
	displayOptions?: DisplayOptionsDTO;
}

export interface BorderPropertiesDTO {
	id?: string;
	borderColor?: InputSourceDTO<string>;
	borderStyle?: InputSourceDTO<Enumeration_BorderStyle_ValueDTO>;
	borderWidth?: InputSourceDTO<number>;
}

export interface TextPropertiesDTO {
	id?: string;
	color?: InputSourceDTO<string>;
	backgroundColor?: InputSourceDTO<string>;
	alignment?: InputSourceDTO<Enumeration_Alignment_ValueDTO>;
	bold?: InputSourceDTO<boolean>;
	italic?: InputSourceDTO<boolean>;
	underlined?: InputSourceDTO<boolean>;
	textStyleId?: InputSourceDTO<string>;
}

export interface ColumnsDTO_1 {
	id: string;
	isSortingIndex?: boolean;
	hasCustomTextProperties?: boolean;
	hasCustomBorderProperties?: boolean;
	default?: DefaultDTO;
	group?: GroupDTO;
	field?: FieldDTO_1[];
	borderProperties?: BorderPropertiesDTO;
	textProperties?: TextPropertiesDTO;
	width?: MeasureInputSourceDTO;
	label?: LabelDTO;
}

export interface ListingDTO {
	id?: string;
	model?: string;
	basePath?: string;
	showRepeatedGroupEntries?: boolean;
	hideHeader?: boolean;
	rowPropertyComputations?: RowPropertyComputationsDTO[];
	groupPropertyComputations?: GroupPropertyComputationsDTO[];
	columns?: ColumnsDTO_1[];
	headerTextProperties?: HeaderTextPropertiesDTO;
}

export interface DataDTO {
	id: string;
	valueField: string;
	keyField?: string;
	seriesName?: string;
	color?: string;
	labelIsNumeration?: boolean;
}

export interface DimensionsDTO_2 {
	id?: string;
	height?: HeightDTO;
	width?: WidthDTO;
}

export interface TitleDTO {
	id: string;
	path: string;
	source?: Enumeration_Title_SourceDTO;
	value?: string;
}

export interface LabelXDTO {
	id: string;
	path: string;
	source?: Enumeration_LabelX_SourceDTO;
	value?: string;
}

export interface LabelYDTO {
	id: string;
	path: string;
	source?: Enumeration_LabelY_SourceDTO;
	value?: string;
}

export interface BarChartDTO {
	id?: string;
	model?: string;
	basePath?: string;
	orientation?: Enumeration_BarChart_OrientationDTO;
	data?: DataDTO[];
	dimensions?: DimensionsDTO_2;
	title?: TitleDTO;
	labelX?: LabelXDTO;
	labelY?: LabelYDTO;
}

export interface DataDTO_1 {
	id: string;
	valueField: string;
	seriesName?: string;
	labelIsNumeration?: boolean;
	color?: string;
}

export interface LineChartDTO {
	id?: string;
	model?: string;
	basePath?: string;
	orientation?: Enumeration_LineChart_OrientationDTO;
	data?: DataDTO_1[];
	dimensions?: DimensionsDTO_2;
	title?: TitleDTO;
	labelX?: LabelXDTO;
	labelY?: LabelYDTO;
}

export interface DataDTO_2 {
	id?: string;
	valueField?: string;
	keyField?: string;
	labelIsNumeration?: boolean;
}

export interface PieChartDTO {
	id?: string;
	model?: string;
	basePath?: string;
	data?: DataDTO_2;
	dimensions?: DimensionsDTO_2;
	title?: TitleDTO;
}

export interface OverflowHeightDTO {
	id?: string;
	value?: number;
	unit?: Enumeration_OverflowHeight_UnitDTO;
}

export interface DimensionsDTO_3 {
	id?: string;
	width?: WidthDTO;
	height?: HeightDTO;
	overflowHeight?: OverflowHeightDTO;
}

export interface AreaDTO {
	id?: string;
	dimensions?: DimensionsDTO_3;
	elementReferences?: ElementReferencesDTO[];
	dataContexts?: DataContextsDTO[];
	maxRepetitions?: number;
}

export interface CasesDTO {
	id: string;
	precondition: string;
	refId: string;
}

export interface SwitchDTO {
	id?: string;
	name?: string;
	model?: string;
	dimensions?: DimensionsDTO_2;
	cases?: CasesDTO[];
}

export interface BoundingBoxDTO {
	id?: string;
	dimensions?: DimensionsDTO_2;
	elementReferences?: ElementReferencesDTO[];
}

export interface SourceDTO {
	id?: string;
	sourceType?: Enumeration_Source_SourceTypeDTO;
	referenceType?: Enumeration_Source_ReferenceTypeDTO;
	referenceElementId?: string;
}

export interface BoundingBoxDTO_1 {
	id?: string;
	elementReferences?: ElementReferencesDTO[];
}

export interface OverrideDTO {
	id?: string;
	refId?: string;
	overrideType?: Enumeration_Override_OverrideTypeDTO;
	source?: SourceDTO;
	boundingBox?: BoundingBoxDTO_1;
}

export interface ElementDefinitionsDTO {
	id: string;
	type: Enumeration_ElementDefinitions_TypeDTO;
	field?: FieldDTO;
	calculation?: CalculationDTO;
	text?: TextElementDTO;
	expression?: ExpressionDTO;
	image?: ImageDTO;
	table?: TableDTO;
	tableLayout?: TableLayoutDTO;
	listing?: ListingDTO;
	barChart?: BarChartDTO;
	lineChart?: LineChartDTO;
	pieChart?: PieChartDTO;
	area?: AreaDTO;
	switch?: SwitchDTO;
	boundingBox?: BoundingBoxDTO;
	override?: OverrideDTO;
	borderProperties?: BorderPropertiesDTO;
	textProperties?: TextPropertiesDTO;
}

export interface DefinitionsDTO_2 {
	id: string;
	name: string;
	font: string;
	fontSize: number;
	lineHeight: number;
	semantic: Enumeration_Definitions_SemanticDTO;
	typesettingModelName?: string;
	staticHyphenator?: Enumeration_Definitions_StaticHyphenatorDTO;
}

export interface TextStylesDTO_1 {
	id?: string;
	definitions?: DefinitionsDTO_2[];
}

export interface ConditionsDTO {
	id: string;
	precondition: string;
}

export interface DefinitionsDTO_3 {
	id: string;
	title: string;
	pageOrientation: Enumeration_Definitions_PageOrientationDTO;
	opacity?: number;
	conditions?: ConditionsDTO[];
	elementReferences?: ElementReferencesDTO[];
}

export interface WatermarksDTO_1 {
	id?: string;
	definitions?: DefinitionsDTO_3[];
}

export interface ContentDTO {
	id: string;
	general?: GeneralDTO;
	segments?: SegmentsDTO;
	sections?: SectionsDTO_1;
	elementDefinitions?: ElementDefinitionsDTO[];
	textStyles?: TextStylesDTO_1;
	watermarks?: WatermarksDTO_1;
}

export interface PrintModelDTO {
	header: HeaderDTO;
	content: ContentDTO;
}

export type Enumeration_RuntimeVariables_TypeDTO = "Boolean" | "String" | "StringArray";

export type Enumeration_Definitions_TypeDTO = "Default" | "Repeatable";

export type Enumeration_DefaultSegment_PageOrientationDTO = "Portrait" | "Landscape";

export type Enumeration_X_UnitDTO = "Millimeter" | "Percent";

export type Enumeration_Y_UnitDTO = "Millimeter" | "Percent";

export type Enumeration_MinHeight_UnitDTO = "Millimeter" | "Percent";

export type Enumeration_MinWidth_UnitDTO = "Millimeter" | "Percent";

export type Enumeration_Top_TypeDTO = "Implicit" | "Explicit";

export type Enumeration_Margin_UnitDTO = "Millimeter" | "Percent";

export type Enumeration_Bottom_TypeDTO = "Implicit" | "Explicit";

export type Enumeration_PageBreakBehavior_SourceDTO = "INPUT" | "DEFAULT" | "UNSET" | "INHERITED";

export type Enumeration_PageBreakBehavior_ValueDTO = "Allow" | "Avoid";

export type Enumeration_References_PurposeDTO = "DINTemplate";

export type Enumeration_References_DirectionDTO = "IncomingReference" | "OutgoingReference";

export type Enumeration_Definitions_SectionUsageDTO = "First" | "Remaining";

export type Enumeration_Definitions_PageOrientationDTO = "Portrait" | "Landscape";

export type Enumeration_HeaderHeight_UnitDTO = "Millimeter" | "Percent";

export type Enumeration_FooterHeight_UnitDTO = "Millimeter" | "Percent";

export type Enumeration_ElementDefinitions_TypeDTO =
	| "Text"
	| "Expression"
	| "Image"
	| "Table"
	| "TableLayout"
	| "Listing"
	| "BarChart"
	| "LineChart"
	| "PieChart"
	| "Line"
	| "Field"
	| "Calculation"
	| "PageNumber"
	| "PageNumberTotal"
	| "BoundingBox"
	| "Override"
	| "Area"
	| "Switch";

export type Enumeration_DisplayOptions_DisplayTypeDTO = "Date" | "Checkbox" | "DateRange";

export type Enumeration_FieldType_FieldTypeDTO = "Boolean" | "Number" | "String" | "TypeDefinition";

export type Enumeration_Image_ImageSrcTypeDTO = "Attachment" | "Field";

export type Enumeration_Height_UnitDTO = "Millimeter" | "Percent";

export type Enumeration_Width_UnitDTO = "Millimeter" | "Percent";

export type Enumeration_OriginalHeight_UnitDTO = "Millimeter" | "Percent";

export type Enumeration_OriginalWidth_UnitDTO = "Millimeter" | "Percent";

export type Enumeration_Width_SourceDTO = "INPUT" | "DEFAULT" | "UNSET" | "INHERITED";

export type Enumeration_Label_SourceDTO = "INPUT" | "DEFAULT" | "UNSET" | "INHERITED";

export type Enumeration_Color_SourceDTO = "INPUT" | "DEFAULT" | "UNSET" | "INHERITED";

export type Enumeration_BackgroundColor_SourceDTO = "INPUT" | "DEFAULT" | "UNSET" | "INHERITED";

export type Enumeration_Alignment_SourceDTO = "INPUT" | "DEFAULT" | "UNSET" | "INHERITED";

export type Enumeration_Alignment_ValueDTO = "Left" | "Center" | "Right" | "Justify";

export type Enumeration_Bold_SourceDTO = "INPUT" | "DEFAULT" | "UNSET" | "INHERITED";

export type Enumeration_Italic_SourceDTO = "INPUT" | "DEFAULT" | "UNSET" | "INHERITED";

export type Enumeration_Underlined_SourceDTO = "INPUT" | "DEFAULT" | "UNSET" | "INHERITED";

export type Enumeration_TextStyleId_SourceDTO = "INPUT" | "DEFAULT" | "UNSET" | "INHERITED";

export type Enumeration_SumLabel_SourceDTO = "INPUT" | "DEFAULT" | "UNSET" | "INHERITED";

export type Enumeration_MaxRowCount_SourceDTO = "INPUT" | "DEFAULT" | "UNSET" | "INHERITED";

export type Enumeration_MinHeight_SourceDTO = "INPUT" | "DEFAULT" | "UNSET" | "INHERITED";

export type Enumeration_ColumnProperties_VerticalAlignmentDTO = "Top" | "Middle" | "Bottom";

export type Enumeration_RowPropertyComputations_PropertyDTO =
	| "Bold"
	| "Italic"
	| "Underline"
	| "Font"
	| "FontSize"
	| "LineHeight"
	| "HorizontalAlignment"
	| "VerticalAlignment"
	| "Color"
	| "BackgroundColor"
	| "BorderStyle"
	| "BorderWidth"
	| "BorderColor"
	| "IsHidden"
	| "PaddingTop"
	| "PaddingBottom"
	| "PaddingLeft"
	| "PaddingRight";

export type Enumeration_GroupPropertyComputations_PropertyDTO = "IsHidden";

export type Enumeration_PropertyComputations_PropertyDTO =
	| "Bold"
	| "Italic"
	| "Underline"
	| "Font"
	| "FontSize"
	| "LineHeight"
	| "HorizontalAlignment"
	| "VerticalAlignment"
	| "Color"
	| "BackgroundColor"
	| "BorderStyle"
	| "BorderWidth"
	| "BorderColor"
	| "IsHidden"
	| "IsContentHidden"
	| "ColumnSpan"
	| "PaddingTop"
	| "PaddingBottom"
	| "PaddingLeft"
	| "PaddingRight";

export type Enumeration_BorderColor_SourceDTO = "INPUT" | "DEFAULT" | "INHERITED";

export type Enumeration_BorderStyle_ValueDTO = "Solid" | "Dotted" | "Dashed";

export type Enumeration_BorderStyle_SourceDTO = "INPUT" | "UNSET" | "INHERITED";

export type Enumeration_BorderWidth_SourceDTO = "INPUT" | "DEFAULT" | "INHERITED";

export type Enumeration_BarChart_OrientationDTO = "Horizontal" | "Vertical";

export type Enumeration_Title_SourceDTO = "INPUT" | "DEFAULT" | "UNSET" | "INHERITED";

export type Enumeration_LabelX_SourceDTO = "INPUT" | "DEFAULT" | "UNSET" | "INHERITED";

export type Enumeration_LabelY_SourceDTO = "INPUT" | "DEFAULT" | "UNSET" | "INHERITED";

export type Enumeration_LineChart_OrientationDTO = "Horizontal" | "Vertical";

export type Enumeration_OverflowHeight_UnitDTO = "Millimeter" | "Percent";

export type Enumeration_Override_OverrideTypeDTO = "BoundingBox";

export type Enumeration_Source_SourceTypeDTO = "Reference";

export type Enumeration_Source_ReferenceTypeDTO = "Segment";

export type Enumeration_Definitions_SemanticDTO = "P" | "H1" | "H2" | "H3" | "H4" | "H5" | "H6";

export type Enumeration_Definitions_StaticHyphenatorDTO = "en_US" | "de_1996" | "fr" | "cs" | "pt" | "vi";
