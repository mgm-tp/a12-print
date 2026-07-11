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
import { ListingRegion, TableRegion, TextRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";

export type PropertyComputationField = "default" | "group";

export interface BaseElementFormState {
	type: string;
	/**
	 * Element ID
	 */
	id: string;
}

export interface BaseReferenceFormState {
	type: string;
	/**
	 * Reference ID (e.g. VisibilityConfig or PageBreakConfig reference)
	 */
	referenceId: string;
}

export interface VisibilityConfigFormState extends BaseReferenceFormState {
	type: "VisibilityConfig";
}

export interface PageBreakConfigFormState extends BaseReferenceFormState {
	type: "PageBreakConfig";
}

export interface TextCalculationFormState extends BaseElementFormState {
	type: typeof TextRegion.TEXT_FROM_CALCULATION;
}

export interface TextFieldFormState extends BaseElementFormState {
	type: typeof TextRegion.TEXT_FROM_FIELD;
}

export interface TableColumnFormState extends BaseElementFormState {
	type: typeof TableRegion.TABLE_COLUMN_FORM;
	columnId: string;
	columnIndex: number;
}

export interface ListingColumnFormState extends BaseElementFormState {
	type: typeof ListingRegion.LISTING_COLUMN_FORM;
	columnId: string;
	columnIndex: number;
}

export interface ListingGroupPropertyCompFormState extends BaseElementFormState {
	type: typeof ListingRegion.GROUP_PROPERTY_COMPUTATION_FORM;
	propertyCompId: string;
	propertyCompIndex: number;
}

export interface ListingPropertyCompFormState extends BaseElementFormState {
	type: typeof ListingRegion.PROPERTY_COMPUTATION_FORM;
	parentForm: "Main" | "Column" | "Field";
	propertyCompId: string;
	propertyCompIndex: number;
	propertyCompType?: PropertyComputationField;
}

export interface ListingFieldCompFormState extends BaseElementFormState {
	type: typeof ListingRegion.FIELD_COMPUTATION_FORM;
	fieldCompId: string;
	fieldCompIndex: number;
}

export interface ElementFormState extends BaseElementFormState {
	type: ElementType;
}

export type BaseFormState = BaseElementFormState | BaseReferenceFormState;

export type AnyFormState =
	| ElementFormState
	| VisibilityConfigFormState
	| PageBreakConfigFormState
	| TextCalculationFormState
	| TextFieldFormState
	| TableColumnFormState
	| ListingColumnFormState
	| ListingGroupPropertyCompFormState
	| ListingPropertyCompFormState
	| ListingFieldCompFormState;

export function isTableColumnFormState(form: BaseFormState): form is TableColumnFormState {
	return form.type === TableRegion.TABLE_COLUMN_FORM;
}

export function isElementFormState(form: BaseFormState): form is ElementFormState {
	return Object.values(ElementType).includes(form.type as ElementType);
}

export function isVisibilityConfigFormState(form: BaseFormState): form is VisibilityConfigFormState {
	return form.type === "VisibilityConfig";
}

export function isPageBreakConfigFormState(form: BaseFormState): form is PageBreakConfigFormState {
	return form.type === "PageBreakConfig";
}

export function isTextCalculationFormState(form: BaseFormState): form is TextCalculationFormState {
	return form.type === TextRegion.TEXT_FROM_CALCULATION;
}

export function isTextFieldFormState(form: BaseFormState): form is TextFieldFormState {
	return form.type === TextRegion.TEXT_FROM_FIELD;
}

export function isListingColumnFormState(form: BaseFormState): form is ListingColumnFormState {
	return form.type === ListingRegion.LISTING_COLUMN_FORM;
}

export function isListingGroupPropertyCompFormState(form: BaseFormState): form is ListingGroupPropertyCompFormState {
	return form.type === ListingRegion.GROUP_PROPERTY_COMPUTATION_FORM;
}

export function isListingPropertyCompFormState(form: BaseFormState): form is ListingPropertyCompFormState {
	return form.type === ListingRegion.PROPERTY_COMPUTATION_FORM;
}

export function isListingFieldCompFormState(form: BaseFormState): form is ListingFieldCompFormState {
	return form.type === ListingRegion.FIELD_COMPUTATION_FORM;
}

export function isBaseReferenceFormState(form: BaseFormState): form is BaseReferenceFormState {
	return "referenceId" in form;
}

export function isBaseElementFormState(form: BaseFormState): form is BaseElementFormState {
	return "id" in form;
}

export interface EditorModeState {
	/**
	 * ID of the element currently selected (highlighted) on the canvas.
	 * Intentionally separate from detailForm: the user can close the form
	 * panel while keeping the element highlighted. detailForm: undefined means
	 * the panel is closed, but selectedElementId may still be set.
	 */
	selectedElementId?: string;

	/**
	 * The detail form panel state for this (level, mode).
	 * undefined = panel is closed. When set, formStack[0] is always the
	 * root form for the element type; formStack.at(-1) is what renders.
	 */
	detailForm?: DetailFormState;
}

export interface DetailFormState {
	isFullScreen?: boolean;
	/**
	 * Stack of form states for the selected element.
	 *   [0]  = root form for the element/reference (always present — tuple enforced)
	 *            Contains the element ID to identify what's being edited
	 *   last = currently rendered form (formStack.at(-1).type drives router)
	 * Push to go deeper, pop to go back, replace entire array for jump links.
	 * Config overlays (VisibilityConfig, PageBreakConfig) are pushed on top;
	 * popping them restores the element form naturally.
	 */
	formStack: [AnyFormState, ...AnyFormState[]];
}
