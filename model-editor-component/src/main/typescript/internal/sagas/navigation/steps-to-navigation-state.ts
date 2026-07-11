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
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";
import {
	ElementType,
	PartialArea,
	PartialBoundingBox,
	PartialListing,
	PartialOverride,
	PartialSwitch,
	PartialTable,
} from "@com.mgmtp.a12.print/print-model-api/model";
import type { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { ListingRegion, TableRegion, TextRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { EditorMode } from "../../redux/editor-state/state.js";
import type { CanvasTab, EntityNavStack, NavigationState } from "../../redux/navigation/state.js";
import { FULLSCREEN_TABS, isCanvasTab, tabToEntityType } from "../../redux/navigation/state.js";
import type {
	AnyFormState,
	DetailFormState,
	ElementFormState,
	ListingColumnFormState,
	ListingFieldCompFormState,
	ListingGroupPropertyCompFormState,
	ListingPropertyCompFormState,
	PageBreakConfigFormState,
	PropertyComputationField,
	TableColumnFormState,
	TextCalculationFormState,
	TextFieldFormState,
	VisibilityConfigFormState,
} from "../../redux/navigation/types/form-state.js";
import type {
	AreaStackEntry,
	BoundingBoxStackEntry,
	EntityStackEntry,
	OverrideStackEntry,
	SwitchStackEntry,
} from "../../redux/navigation/types/stack-entry.js";
import { assertExists, assertType } from "../../utils/type-utils.js";
import { createPlainMmMeasure } from "../../utils/measure-utils.js";

import type {
	CanvasRootNavigationStep,
	ElementNavigationStep,
	NavigationStep,
	ReferenceNavigationStep,
	RootNavigationStep,
	WrapperElementNavigationStep,
} from "./navigation-steps.js";

// ─── Internal state shapes ────────────────────────────────────────────────────

interface CanvasLevelState {
	tab: CanvasTab;
	activeEntityId: string;
	stack: EntityNavStack;
}

interface FormLevelState {
	selectedElementId?: string;
	formStack: DetailFormState["formStack"];
}

// ─── Level 1: Root (non-canvas tabs) ─────────────────────────────────────────

function handleRoot(step: RootNavigationStep): DeepPartial<NavigationState>["sidebarState"] {
	return { activeTab: step.type, isOpen: true };
}

// ─── Level 2: Canvas entity + wrapper drill-in ────────────────────────────────

function handleCanvasRoot(step: CanvasRootNavigationStep): CanvasLevelState {
	const currentMode = step.jsonPath.some(e => e.elementName === "pageBreakBehavior")
		? EditorMode.Layout
		: EditorMode.Default;
	const entityEntry: EntityStackEntry = {
		id: step.entityId,
		type: tabToEntityType(step.type as CanvasTab),
		currentMode,
		modes: {},
	};
	return {
		tab: step.type as CanvasTab,
		activeEntityId: step.entityId,
		stack: [entityEntry],
	};
}

function handleWrapper(
	step: WrapperElementNavigationStep,
	steps: NavigationStep[]
): EntityNavStack[number] | undefined {
	const stepIndex = steps.findIndex(t => t === step);
	let lastPlaceableRefernece: ReferenceNavigationStep | undefined = undefined;

	for (let i = stepIndex; i >= 0; i--) {
		if (steps[i].kind === "reference") {
			lastPlaceableRefernece = steps[i] as ReferenceNavigationStep;
			break;
		}
	}

	const currentMode = step.jsonPath.some(e => e.elementName === "pageBreakBehavior")
		? EditorMode.Layout
		: EditorMode.Default;

	const elementDefinition = step.elementDef;

	if (PartialBoundingBox.isInstance(elementDefinition)) {
		return {
			id: step.elementId,
			type: elementDefinition.type,
			currentMode,
			dimensions: {
				height: createPlainMmMeasure(elementDefinition.boundingBox?.dimensions?.height?.value || 0),
				width: createPlainMmMeasure(elementDefinition.boundingBox?.dimensions?.width?.value || 0),
			},
			wrapperContext: {
				placeableReference: lastPlaceableRefernece?.referemce,
			},
			modes: {},
		} satisfies BoundingBoxStackEntry;
	}

	if (PartialArea.isInstance(elementDefinition)) {
		return {
			id: step.elementId,
			type: elementDefinition.type,
			currentMode,
			dimensions: {
				height: createPlainMmMeasure(
					(elementDefinition.area?.dimensions?.height?.value || 0) +
						(elementDefinition.area?.dimensions?.overflowHeight?.value || 0)
				),
				width: createPlainMmMeasure(elementDefinition.area?.dimensions?.width?.value || 0),
			},
			wrapperContext: {
				placeableReference: lastPlaceableRefernece?.referemce,
			},
			dataContexts: elementDefinition.area?.dataContexts ? [...elementDefinition.area.dataContexts] : [],
			modes: {},
		} satisfies AreaStackEntry;
	}

	if (PartialOverride.isInstance(elementDefinition)) {
		return {
			id: step.elementId,
			type: elementDefinition.type,
			currentMode,
			wrapperContext: {
				placeableReference: lastPlaceableRefernece?.referemce,
			},
			dimensions: {
				height: createPlainMmMeasure(lastPlaceableRefernece?.referemce.dimensions?.minHeight?.value || 0),
				width: createPlainMmMeasure(lastPlaceableRefernece?.referemce.dimensions?.minWidth?.value || 0),
			},
			modes: {},
		} satisfies OverrideStackEntry;
	}

	if (PartialSwitch.isInstance(elementDefinition)) {
		return {
			id: step.elementId,
			type: elementDefinition.type,
			currentMode: EditorMode.Default,
			wrapperContext: {
				placeableReference: lastPlaceableRefernece?.referemce,
			},
			dimensions: {
				height: createPlainMmMeasure(elementDefinition.switch?.dimensions?.height?.value || 0),
				width: createPlainMmMeasure(elementDefinition.switch?.dimensions?.width?.value || 0),
			},
			modes: {},
		} satisfies SwitchStackEntry;
	}

	return undefined;
}

function canvasLevelToTabState(state: CanvasLevelState): DeepPartial<NavigationState[SidebarItem.SEGMENT]> {
	return {
		activeEntityId: state.activeEntityId,
		entities: { [state.activeEntityId]: state.stack },
	};
}

// ─── Level 3: Element form ────────────────────────────────────────────────────

function handleElement(
	step: ElementNavigationStep,
	previousElementStep: ElementNavigationStep | null
): DetailFormState["formStack"] {
	switch (step.elementDef.type) {
		case ElementType.Field:
			return handleFieldElement(step, previousElementStep);
		case ElementType.Calculation:
			return handleCalculationElement(step, previousElementStep);
		case ElementType.Expression:
			return handleExressionElement(step, previousElementStep);
		case ElementType.Table:
			return handleTableElement(step);
		case ElementType.Listing:
			return handleListingElement(step);
		default:
			return handleDefaultElement(step);
	}
}

function handleDefaultElement(step: ElementNavigationStep): DetailFormState["formStack"] {
	const formState: ElementFormState = { type: step.elementDef.type, id: step.elementId };
	return [formState];
}

function handleFieldElement(
	step: ElementNavigationStep,
	previousElementStep: ElementNavigationStep | null
): DetailFormState["formStack"] {
	assertExists(previousElementStep, "Field element must follow a Text or Table element");

	switch (previousElementStep.elementDef.type) {
		case ElementType.Text: {
			const form: TextFieldFormState = { id: step.elementId, type: TextRegion.TEXT_FROM_FIELD };
			return [form];
		}
		case ElementType.Table: {
			const columns = previousElementStep.elementDef.table?.columns;
			const columnIndex = columns?.findIndex(col => col.refId === step.elementId) ?? -1;
			if (columnIndex < 0) throw new Error("Column not found for field in Table");

			const columnId = columns?.[columnIndex].id;
			assertExists(columnId);
			const form: TableColumnFormState = {
				id: step.elementId,
				type: TableRegion.TABLE_COLUMN_FORM,
				columnIndex,
				columnId,
			};
			return [form];
		}
		default:
			throw new Error("Field element must follow a Text or Table element");
	}
}

function handleCalculationElement(
	step: ElementNavigationStep,
	previousElementStep: ElementNavigationStep | null
): DetailFormState["formStack"] {
	assertExists(previousElementStep, "Calcualtion element must follow a Text");

	const form: TextCalculationFormState = { id: step.elementId, type: TextRegion.TEXT_FROM_CALCULATION };

	return [form];
}

function handleExressionElement(
	step: ElementNavigationStep,
	previousElementStep: ElementNavigationStep | null
): DetailFormState["formStack"] {
	if (!previousElementStep) {
		return handleDefaultElement(step);
	}
	assertType(previousElementStep.elementDef, PartialTable.isInstance);

	const columns = previousElementStep.elementDef.table?.columns;
	const columnIndex = columns?.findIndex(col => col.refId === step.elementId) ?? -1;
	if (columnIndex < 0) throw new Error("Column not found for field in Table");

	const columnId = columns?.[columnIndex].id;
	assertExists(columnId);

	const form: TableColumnFormState = {
		id: step.elementId,
		type: TableRegion.TABLE_COLUMN_FORM,
		columnIndex,
		columnId,
	};
	return [form];
}

function handleTableElement(step: ElementNavigationStep): DetailFormState["formStack"] {
	assertType(step.elementDef, PartialTable.isInstance);

	const tableForm = handleDefaultElement(step);

	const columnsEntry = step.jsonPath.find(e => e.elementName === "columns");
	if (columnsEntry) {
		const columnIndex = columnsEntry.index - 1;
		const columnId = step.elementDef.table?.columns?.[columnIndex]?.id;
		assertExists(columnId);
		const form: TableColumnFormState = {
			id: step.elementId,
			type: TableRegion.TABLE_COLUMN_FORM,
			columnIndex,
			columnId,
		};
		return [...tableForm, form];
	}

	return tableForm;
}

function handleListingElement(step: ElementNavigationStep): DetailFormState["formStack"] {
	assertType(step.elementDef, PartialListing.isInstance);

	const listingForm = handleDefaultElement(step);

	const columnsEntry = step.jsonPath.find(e => e.elementName === "columns");
	if (columnsEntry) {
		return [...listingForm, ...buildListingColumnForms(step, columnsEntry.index - 1)];
	}

	const groupPropEntry = step.jsonPath.find(e => e.elementName === "groupPropertyComputations");
	if (groupPropEntry) {
		const propertyCompIndex = groupPropEntry.index - 1;
		const propertyCompId = step.elementDef.listing?.groupPropertyComputations?.[propertyCompIndex]?.id;
		assertExists(propertyCompId);
		const form: ListingGroupPropertyCompFormState = {
			id: step.elementId,
			type: ListingRegion.GROUP_PROPERTY_COMPUTATION_FORM,
			propertyCompIndex,
			propertyCompId,
		};
		return [...listingForm, form];
	}

	const rowPropEntry = step.jsonPath.find(e => e.elementName === "rowPropertyComputations");
	if (rowPropEntry) {
		const propertyCompIndex = rowPropEntry.index - 1;
		const propertyCompId = step.elementDef.listing?.rowPropertyComputations?.[propertyCompIndex]?.id;
		assertExists(propertyCompId);
		const form: ListingPropertyCompFormState = {
			id: step.elementId,
			type: ListingRegion.PROPERTY_COMPUTATION_FORM,
			parentForm: "Main",
			propertyCompIndex,
			propertyCompId,
		};
		return [...listingForm, form];
	}

	return listingForm;
}

function buildListingColumnForms(step: ElementNavigationStep, columnIndex: number): AnyFormState[] {
	assertType(step.elementDef, PartialListing.isInstance);

	const columnId = step.elementDef.listing?.columns?.[columnIndex]?.id;
	// Skip if there is no column exists
	if (!columnId) {
		return [];
	}
	const columnForm: ListingColumnFormState = {
		id: step.elementId,
		type: ListingRegion.LISTING_COLUMN_FORM,
		columnIndex,
		columnId,
	};

	const fieldEntry = step.jsonPath.find(e => e.elementName === "field");
	if (fieldEntry) {
		return [columnForm, ...buildListingFieldForms(step, columnIndex, fieldEntry.index - 1)];
	}

	const propCompEntry = step.jsonPath.find(e => e.elementName === "propertyComputations");
	if (propCompEntry) {
		const propertyCompIndex = propCompEntry.index - 1;
		const propertyCompType = step.jsonPath.find(
			path => path.elementName === "default" || path.elementName === "group"
		)?.elementName as PropertyComputationField | undefined;
		assertExists(propertyCompType);

		const columnDef = step.elementDef.listing?.columns?.[columnIndex];
		const subField = propertyCompType === "default" ? columnDef?.default : columnDef?.group;
		const propertyCompId = subField?.propertyComputations?.[propertyCompIndex]?.id;

		assertExists(propertyCompId);
		const form: ListingPropertyCompFormState = {
			id: step.elementId,
			type: ListingRegion.PROPERTY_COMPUTATION_FORM,
			parentForm: "Column",
			propertyCompIndex,
			propertyCompId,
			propertyCompType,
		};
		return [columnForm, form];
	}

	return [columnForm];
}

function buildListingFieldForms(
	step: ElementNavigationStep,
	columnIndex: number,
	fieldCompIndex: number
): DetailFormState["formStack"] {
	assertType(step.elementDef, PartialListing.isInstance);

	const fieldCompId = step.elementDef.listing?.columns?.[columnIndex]?.field?.[fieldCompIndex]?.id;
	assertExists(fieldCompId);
	const fieldForm: ListingFieldCompFormState = {
		id: step.elementId,
		type: ListingRegion.FIELD_COMPUTATION_FORM,
		fieldCompIndex,
		fieldCompId,
	};

	const propCompEntry = step.jsonPath.find(e => e.elementName === "propertyComputations");
	if (propCompEntry) {
		const propertyCompIndex = propCompEntry.index - 1;
		const propertyCompId =
			step.elementDef.listing?.columns?.[columnIndex]?.field?.[fieldCompIndex]?.propertyComputations?.[
				propertyCompIndex
			]?.id;
		assertExists(propertyCompId);
		const form: ListingPropertyCompFormState = {
			id: step.elementId,
			type: ListingRegion.PROPERTY_COMPUTATION_FORM,
			parentForm: "Field",
			propertyCompIndex,
			propertyCompId,
		};
		return [fieldForm, form];
	}

	return [fieldForm];
}

// ─── Level 4: Reference form ──────────────────────────────────────────────────

function handleReference(step: ReferenceNavigationStep): DetailFormState["formStack"] {
	const target = step.jsonPath.find(
		el => el.elementName === "pageBreakBehavior" || el.elementName === "hideConditions"
	);

	if (target?.elementName === "pageBreakBehavior") {
		const formState: PageBreakConfigFormState = { type: "PageBreakConfig", referenceId: step.referenceId };
		return [formState];
	}

	if (target?.elementName === "hideConditions") {
		const formState: VisibilityConfigFormState = { type: "VisibilityConfig", referenceId: step.referenceId };
		return [formState];
	}
	throw new Error("Invalid navigation step");
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

/**
 * Convert an ordered NavigationStep sequence into a DeepPartial<NavigationState>
 */
export function stepsToNavigationState(steps: NavigationStep[]): DeepPartial<NavigationState> {
	const result: DeepPartial<NavigationState> = {};

	let canvasLevel: CanvasLevelState | null = null;
	let formLevel: FormLevelState | null = null;
	let lastElementStep: ElementNavigationStep | null = null;

	for (let i = 0; i <= steps.length - 1; i++) {
		const step = steps[i];
		switch (step.kind) {
			case "root":
				result.sidebarState = handleRoot(step);
				break;
			case "canvasRoot":
				result.sidebarState = {
					activeTab: step.type,
					activeCanvasTab: isCanvasTab(step.type) ? step.type : undefined,
					isOpen: true,
					isFullscreen: FULLSCREEN_TABS.includes(step.type),
				};
				canvasLevel = handleCanvasRoot(step);
				break;
			case "wrapper": {
				const entry = handleWrapper(step, steps);
				if (canvasLevel && entry) canvasLevel.stack.push(entry);
				break;
			}
			case "element": {
				const newFormStack = handleElement(step, lastElementStep);
				if (formLevel) {
					formLevel.formStack.push(...newFormStack);
				} else {
					formLevel = { selectedElementId: step.elementId, formStack: newFormStack };
				}
				lastElementStep = step;
				break;
			}
			case "reference": {
				// Only create reference form if the reference is the last on stack
				if (i === steps.length - 1) {
					const newFormStack = handleReference(step);
					formLevel = { formStack: newFormStack };
				}
				break;
			}
		}
	}

	// Flush canvas level into the tab state
	if (canvasLevel) {
		result[canvasLevel.tab] = canvasLevelToTabState(canvasLevel);

		if (formLevel) {
			const topEntry = canvasLevel.stack[canvasLevel.stack.length - 1];
			topEntry.modes[topEntry.currentMode] = {
				selectedElementId: formLevel.selectedElementId,
				detailForm: { formStack: formLevel.formStack },
			};
		}
	}

	return result;
}
