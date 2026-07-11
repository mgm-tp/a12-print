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
import md5 from "md5";

import type { Header, ModelReference } from "@com.mgmtp.a12.base/base-model-api";
import type { LocalizedText } from "@com.mgmtp.a12.utils/utils-localization";

import type {
	ComputationAlternative,
	DataContext,
	Measure,
	Precondition,
	PrintModelElement,
	PrintModelEntity,
} from "./elements/index.js";
import type { PlaceableReference, ReferenceContainer, ReferenceContainerLabels } from "./reference/index.js";

/**
 * Almost all groups in PrintModel extend PrintModelEntity and can therefore be uniquely identified.
 */
export interface PrintModel {
	readonly header: PrintModelHeader;
	readonly content: PrintModelContent;
}

export interface LabelEntity extends LocalizedText, PrintModelEntity {}

export interface ModelReferenceEntity extends ModelReference, PrintModelEntity {}

export interface AnnotationEntity extends PrintModelEntity {
	readonly name: string;
	readonly value?: string;
}

export interface LocaleEntity extends PrintModelEntity {
	readonly code: string;
}

export interface PrintModelHeader extends Header {
	readonly modelType: "print";
	readonly description: string;
	readonly locales?: LocaleEntity[];
	readonly labels?: ReadonlyArray<LabelEntity>;
	readonly annotations?: AnnotationEntity[];
	readonly modelReferences?: ModelReferenceEntity[];
}

export interface PrintModelContent extends PrintModelEntity {
	readonly general: PrintModelContentGeneral;
	readonly segments: SegmentsContainer;
	readonly elementDefinitions: ReadonlyArray<PrintModelElement>;
	readonly sections?: SectionsContainer;
	readonly watermarks?: WatermarksContainer;
	readonly textStyles?: TextStylesContainer;
}

/**
 * @param structure - List of {@link Segment} ids. The order is very important to properly display the print model.
 * @param sections - List of {@link Section} ids that are in use in this print model. Therefore it can also be empty even with available sections.
 * @param watermarks - List of {@link Watermark} ids that are in use in this print model. Therefore it can also be empty even with available watermarks.
 * @param textStyles - List of {@link TextStyle} ids that are in use in this print model. Therefore it can also be empty even with available text styles.
 */
export interface PrintModelContentGeneral extends PrintModelEntity {
	readonly metadata: Metadata;
	readonly structure: ReadonlyArray<string>;
	readonly segmentDefaults: SegmentDefaults;
	readonly runtimeVariables?: ReadonlyArray<RuntimeVariable>;
	readonly sections?: ReadonlyArray<string>;
	readonly watermarks?: ReadonlyArray<string>;
	readonly textStyles?: ReadonlyArray<string>;
}

export interface Metadata extends PrintModelEntity {
	readonly model?: string;
	readonly titleComputation: ReadonlyArray<ComputationAlternative>;
	readonly descriptionComputation: ReadonlyArray<ComputationAlternative>;
	readonly authorComputation: ReadonlyArray<ComputationAlternative>;
	readonly languageComputation: ReadonlyArray<ComputationAlternative>;
}

export interface SegmentDefaults extends PrintModelEntity {
	readonly fontSize: number;
	readonly model?: string;
}

export interface RuntimeVariable extends PrintModelEntity {
	readonly name: string;
	readonly type: RuntimeVariableType;
}

export enum RuntimeVariableType {
	Boolean = "Boolean",
	String = "String",
	StringArray = "StringArray",
}

export interface TextStylesContainer extends PrintModelEntity {
	definitions: ReadonlyArray<TextStyle>;
}

export interface TextStyle extends PrintModelEntity {
	name: string;
	font: string;
	fontSize: number;
	lineHeight: number;
	semantic: Semantic;
	typesettingModelName?: string;
	staticHyphenator?: StaticHyphenator;
}

export enum StaticHyphenator {
	en_US = "en_US",
	de_1996 = "de_1996",
	fr = "fr",
	cs = "cs",
	pt = "pt",
	vi = "vi",
}

export enum Semantic {
	P = "P",
	H1 = "H1",
	H2 = "H2",
	H3 = "H3",
	H4 = "H4",
	H5 = "H5",
	H6 = "H6",
}

/**
 * @param references - This is used for the DinTemplate feature to link segments.
 */
export interface SegmentsContainer extends PrintModelEntity {
	definitions: ReadonlyArray<Segment>;
	references: ReadonlyArray<SegmentReference>;
}

export interface SectionsContainer extends PrintModelEntity {
	definitions: ReadonlyArray<Section>;
}

export interface WatermarksContainer extends PrintModelEntity {
	definitions: ReadonlyArray<Watermark>;
}

export interface Segment
	extends ReferenceContainer<ReferenceContainerLabels.elementReferences, PlaceableReference>, PrintModelEntity {
	readonly title: string;
	readonly type: SegmentType;
	readonly defaultSegment?: DefaultSegmentProperties;
	readonly dinTemplate?: DINTemplateProperties;
	readonly dataContexts?: DataContext[];
}

export enum SegmentType {
	Default = "Default",
	Repeatable = "Repeatable",
}

export namespace SegmentType {
	export function isInstance(value: unknown): value is SegmentType {
		return Object.values(SegmentType).includes(value as SegmentType);
	}
}

export interface DefaultSegmentProperties extends PrintModelEntity {
	readonly pageOrientation: PageOrientation;
}

export interface DINTemplateProperties extends PrintModelEntity {
	readonly referenceId?: string;
	readonly refId?: string;
}

export enum PageOrientation {
	Portrait = "Portrait",
	Landscape = "Landscape",
}

export interface SegmentReference extends PrintModelEntity {
	readonly purpose: SegmentReferencePurpose;
	readonly referenceModel: string;
	readonly direction: SegmentReferenceDirection;
	readonly refIds?: SegmentReferenceRefIdContainer[];
}

export enum SegmentReferencePurpose {
	DINTemplate = "DINTemplate",
}

export enum SegmentReferenceDirection {
	IncomingReference = "IncomingReference",
	OutgoingReference = "OutgoingReference",
}

export interface SegmentReferenceRefIdContainer extends PrintModelEntity {
	readonly refId: string;
}

export interface Section
	extends ReferenceContainer<ReferenceContainerLabels.elementReferences, PlaceableReference>, PrintModelEntity {
	readonly title: string;
	readonly sectionUsage: SectionUsage;
	readonly pageOrientation: PageOrientation;
	readonly footerHeight: Measure;
	readonly headerHeight: Measure;
}

export interface Watermark
	extends ReferenceContainer<ReferenceContainerLabels.elementReferences, PlaceableReference>, PrintModelEntity {
	readonly title: string;
	readonly pageOrientation: PageOrientation;
	readonly opacity?: number;
	readonly conditions?: ReadonlyArray<Precondition>;
}

export enum SectionUsage {
	First = "First",
	Remaining = "Remaining",
}

export function isObject(value: unknown): value is Record<string, unknown> {
	return value instanceof Object;
}

export function isPrintModel(value: unknown): value is PrintModel {
	return isObject(value) && value.header !== undefined && isPrintModelContent(value.content);
}

export function isPrintModelHeader(value: unknown): value is PrintModelHeader {
	return (
		isObject(value) &&
		value.modelType === "print" &&
		value.id !== undefined &&
		value.modelVersion !== undefined &&
		value.description !== undefined
	);
}

export function isPrintModelContent(value: unknown): value is PrintModelContent {
	return isObject(value) && isPrintModelContentGeneral(value.general);
}

export function isPrintModelContentGeneral(value: unknown): value is PrintModelContentGeneral {
	return isObject(value) && "id" in value && "title" in value && "details" in value && "segmentDefaults" in value;
}

export function isSegment(value: unknown): value is Segment {
	return (
		isObject(value) &&
		"id" in value &&
		"title" in value &&
		"type" in value &&
		SegmentType.isInstance(value.type) &&
		"elementReferences" in value
	);
}

export function isSection(value: unknown): value is Section {
	return (
		isObject(value) &&
		"id" in value &&
		"title" in value &&
		"pageOrientation" in value &&
		"sectionUsage" in value &&
		"elementReferences" in value
	);
}

export function isWatermark(value: unknown): value is Watermark {
	return (
		isObject(value) &&
		"id" in value &&
		"title" in value &&
		"pageOrientation" in value &&
		!("sectionUsage" in value) &&
		"elementReferences" in value
	);
}

export function isTextStyle(value: unknown): value is TextStyle {
	return (
		isObject(value) &&
		"id" in value &&
		"name" in value &&
		"fontSize" in value &&
		"lineHeight" in value &&
		"semantic" in value
	);
}

export enum EntityKey {
	Locales = "locales",
	ModelReferences = "modelReferences",
	Labels = "labels",
	Annotations = "annotations",
	Attachment = "attachment",
}

export function getEntityId(key: EntityKey, value: string) {
	return md5(`${key}_${value}`);
}
