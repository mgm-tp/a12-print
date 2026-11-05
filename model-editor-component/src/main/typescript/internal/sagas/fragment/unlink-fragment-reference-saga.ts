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
import type { SagaGenerator } from "typed-redux-saga";
import { call, put, select, takeLatest } from "typed-redux-saga";
import type { PayloadAction } from "@reduxjs/toolkit";
import { nanoid } from "nanoid";

import { GlobalRegion, StageRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { TransactionLogEntry, TransactionLogStore } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type {
	FragmentModelReference,
	PartialAnyPrintModelElement,
	PartialPrintModelContent,
	PartialSection,
	PartialSegment,
	PartialTextStyle,
	PartialWatermark,
	PrintModelContent,
	SectionFragmentReference,
} from "@com.mgmtp.a12.print/print-model-api/model";
import { collectRequiredModelReferences, collectUsedTextStyleIds } from "@com.mgmtp.a12.print/print-model-api/utils";

import {
	ConfirmationDialogType,
	FragmentActions,
	type AnyTransactionLogAction,
	InteractionLogActions,
	TransactionLogStateActions,
	type FragmentReferenceEntityType,
	type RequiredModelDependency,
} from "../../redux/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { RequestApiSelectors } from "../../redux/request-api/selectors.js";
import { RESOURCE_KEYS } from "../../localization/index.js";
import { DEFAULT_ERROR_TOAST_DURATION } from "../../constant/configs.js";
import { EditorComponentApiActions } from "../../../a12internal/api/actions-api.js";
import type { PrintEngineState } from "../../../a12internal/api/PrintEngineState.js";

import { openConfirmationDialogSaga } from "../confirmation-dialog/open-confirmation-dialog-saga.js";
import { getContainerElements } from "../transaction-log/log-action-handlers/element-reference-handler.js";

const MAX_SECTION_DEFINITIONS = 4;
const MAX_WATERMARK_DEFINITIONS = 2;

interface FragmentModelDependencyResult {
	canUnlink: boolean;
	dependencyAction?: AnyTransactionLogAction;
}

export function* unlinkFragmentReferenceSaga(): SagaGenerator<void> {
	yield* takeLatest(FragmentActions.unlinkReference.match, handleUnlinkFragmentReference);
}

export function* handleUnlinkFragmentReference(
	action: PayloadAction<FragmentActions.UnlinkReferencePayload>
): SagaGenerator<void> {
	const { referenceId, entityType, fragmentReference } = action.payload;

	// An element reference is not in any referencesEntry map, so it cannot be looked up from the
	// store by id - the caller already has it at hand and passes it via the payload instead.
	const ref: { model: string; refId: string } | undefined =
		entityType === "element"
			? fragmentReference
			: yield* select((state: PrintEngineState) => selectReferenceById(state, entityType, referenceId));
	if (!ref) {
		return;
	}

	const printModelData = yield* select(RequestApiSelectors.printModelData);
	const fragmentContent = printModelData?.[ref.model]?.content;
	if (!fragmentContent) {
		yield* call(notifyUnlinkError, RESOURCE_KEYS.fragmentUnlink.error.fragmentNotLoaded);
		return;
	}

	const resolved = resolveFragmentDefinition(entityType, fragmentContent, ref.refId);
	if (!resolved) {
		yield* call(notifyUnlinkError, RESOURCE_KEYS.fragmentUnlink.error.definitionMissing);
		return;
	}

	if (entityType === "section") {
		const unlinkSection = yield* call(canUnlinkSection, ref as FragmentModelReference, resolved);
		if (!unlinkSection) {
			return;
		}
	}

	if (entityType === "watermark") {
		const unlinkWatermark = yield* call(canUnlinkWatermark, resolved);
		if (!unlinkWatermark) {
			return;
		}
	}

	const { canUnlink, dependencyAction } = yield* createFragmentModelDependencyAction(
		entityType,
		resolved,
		fragmentContent
	);
	if (!canUnlink) {
		return;
	}
	const unlinkAction = createUnlinkAction(entityType, referenceId, fragmentContent);

	const confirmed = yield* call(openConfirmationDialogSaga, ConfirmationDialogType.FRAGMENT_UNLINK);
	if (!confirmed) {
		return;
	}

	const priorInteractionIds = yield* collectPriorInteractionIds(entityType, referenceId);
	if (priorInteractionIds.length > 0) {
		yield* put(InteractionLogActions.markPreventUndo({ interactionIds: priorInteractionIds }));
	}

	yield* put(
		InteractionLogActions.start({
			description: getUnlinkDescription(entityType),
			region: entityType === "element" ? StageRegion.DEFAULT : GlobalRegion.SIDEBAR,
			transactionLogActions: [...(dependencyAction ? [dependencyAction] : []), unlinkAction],
			preventUndo: true,
		})
	);
}

function selectReferenceById(
	state: PrintEngineState,
	entityType: FragmentReferenceEntityType,
	referenceId: string
): FragmentModelReference | undefined {
	switch (entityType) {
		case "section":
			return PrintEngineSelectors.sectionReferences(state).find(reference => reference.id === referenceId);
		case "watermark":
			return PrintEngineSelectors.watermarkReferences(state).find(reference => reference.id === referenceId);
		case "segment":
			return PrintEngineSelectors.segmentFragmentReferences(state).find(
				reference => reference.id === referenceId
			);
		case "textStyle":
			return PrintEngineSelectors.textStyleReferences(state).find(reference => reference.id === referenceId);
		case "element":
			// An element reference is never in a referencesEntry map - see handleUnlinkFragmentReference.
			return undefined;
	}
}

type ResolvedFragmentEntities =
	PartialSection | PartialSegment | PartialWatermark | PartialTextStyle | PartialAnyPrintModelElement;

function resolveFragmentDefinition(
	entityType: FragmentReferenceEntityType,
	fragmentContent: PartialPrintModelContent,
	refId: string
): ResolvedFragmentEntities | undefined {
	switch (entityType) {
		case "section":
			return fragmentContent.sections?.definitions?.find(definition => definition.id === refId);
		case "watermark":
			return fragmentContent.watermarks?.definitions?.find(definition => definition.id === refId);
		case "segment":
			return fragmentContent.segments?.definitions?.find(definition => definition.id === refId);
		case "textStyle":
			return fragmentContent.textStyles?.definitions?.find(definition => definition.id === refId);
		case "element":
			return fragmentContent.elementDefinitions?.find(definition => definition.id === refId);
	}
}

function* canUnlinkSection(ref: FragmentModelReference, resolved: ResolvedFragmentEntities): SagaGenerator<boolean> {
	const sectionRef = ref as SectionFragmentReference;
	if (!sectionRef.sectionUsage) {
		yield* call(notifyUnlinkError, RESOURCE_KEYS.fragmentUnlink.error.invalidSectionUsage);
		return false;
	}
	const localSections = (yield* select(PrintEngineSelectors.orderedSectionItems))
		.filter(item => !item.referenceId)
		.map(item => item.section);
	const hasSlotConflict = localSections.some(
		section =>
			section.sectionUsage === sectionRef.sectionUsage &&
			section.pageOrientation === (resolved as PartialSection).pageOrientation
	);
	if (hasSlotConflict) {
		yield* call(notifyUnlinkError, RESOURCE_KEYS.fragmentUnlink.error.slotConflict);
		return false;
	}
	if (localSections.length >= MAX_SECTION_DEFINITIONS) {
		yield* call(notifyUnlinkError, RESOURCE_KEYS.fragmentUnlink.error.cardinalityExceeded);
		return false;
	}
	return true;
}

function* canUnlinkWatermark(resolved: ResolvedFragmentEntities): SagaGenerator<boolean> {
	const localWatermarks = (yield* select(PrintEngineSelectors.orderedWatermarkItems))
		.filter(item => !item.referenceId)
		.map(item => item.watermark);
	const hasSlotConflict = localWatermarks.some(
		watermark => watermark.pageOrientation === (resolved as PartialWatermark).pageOrientation
	);
	if (hasSlotConflict) {
		yield* call(notifyUnlinkError, RESOURCE_KEYS.fragmentUnlink.error.slotConflict);
		return false;
	}
	if (localWatermarks.length >= MAX_WATERMARK_DEFINITIONS) {
		yield* call(notifyUnlinkError, RESOURCE_KEYS.fragmentUnlink.error.cardinalityExceeded);
		return false;
	}
	return true;
}

function* createFragmentModelDependencyAction(
	entityType: FragmentReferenceEntityType,
	resolved: ResolvedFragmentEntities,
	fragmentContent: PrintModelContent
): SagaGenerator<FragmentModelDependencyResult> {
	const required = computeRequiredReferences(entityType, resolved, fragmentContent);

	if (required.documentModels.size > 1) {
		yield* call(notifyUnlinkError, RESOURCE_KEYS.fragmentUnlink.error.multipleDocumentModels);
		return { canUnlink: false };
	}
	const [requiredDocumentModel] = required.documentModels;

	const hostDocumentModels = yield* select(PrintEngineSelectors.documentModelReferences);
	const hostTypesettingModels = yield* select(PrintEngineSelectors.typesettingModelReferences);

	if (requiredDocumentModel) {
		const matchesHost = hostDocumentModels.some(
			modelReference =>
				modelReference.reference === requiredDocumentModel || modelReference.alias === requiredDocumentModel
		);
		if (hostDocumentModels.length > 0 && !matchesHost) {
			yield* call(notifyUnlinkError, RESOURCE_KEYS.fragmentUnlink.error.documentModelConflict, {
				required: requiredDocumentModel,
				existing: hostDocumentModels[0].reference,
			});
			return { canUnlink: false };
		}
	}

	const missingTypesettingModels = [...required.typesettingModels].filter(
		typesettingModelName =>
			!hostTypesettingModels.some(
				modelReference =>
					modelReference.reference === typesettingModelName || modelReference.alias === typesettingModelName
			)
	);
	const needsDocumentModelAdd = Boolean(requiredDocumentModel) && hostDocumentModels.length === 0;

	const dependencies: RequiredModelDependency[] = [
		...(needsDocumentModelAdd && requiredDocumentModel
			? [{ modelType: "document" as const, reference: requiredDocumentModel }]
			: []),
		...missingTypesettingModels.map(reference => ({ modelType: "typesetting" as const, reference })),
	];

	if (dependencies.length > 0) {
		const confirmed = yield* call(
			openConfirmationDialogSaga,
			ConfirmationDialogType.FRAGMENT_UNLINK_ADDS_DEPENDENCIES,
			{ dependencies }
		);
		if (!confirmed) {
			return { canUnlink: false };
		}
	}

	const printHeader = yield* select(PrintEngineSelectors.printHeader);
	const dependencyAction =
		dependencies.length > 0
			? TransactionLogStateActions.updatePrintHeader({
					data: {
						...printHeader,
						modelReferences: [
							...(printHeader.modelReferences ?? []),
							...dependencies.map(dependency => ({
								id: nanoid(),
								modelType: dependency.modelType,
								reference: dependency.reference,
								purpose: "data binding",
							})),
						],
					},
				})
			: undefined;
	return { canUnlink: true, dependencyAction };
}

function computeRequiredReferences(
	entityType: FragmentReferenceEntityType,
	resolved: ResolvedFragmentEntities,
	fragmentContent: PartialPrintModelContent
): { documentModels: Set<string>; typesettingModels: Set<string> } {
	if (entityType === "textStyle") {
		const textStyle = resolved as PartialTextStyle;
		return {
			documentModels: new Set(),
			typesettingModels: textStyle.typesettingModelName ? new Set([textStyle.typesettingModelName]) : new Set(),
		};
	}
	const container = resolved as PartialSection | PartialSegment | PartialWatermark | PartialAnyPrintModelElement;
	const usedTextStyleIds = collectUsedTextStyleIds(container, fragmentContent);
	return collectRequiredModelReferences(container, fragmentContent, usedTextStyleIds);
}

function createUnlinkAction(
	entityType: FragmentReferenceEntityType,
	referenceId: string,
	fragmentContent: PartialPrintModelContent
): AnyTransactionLogAction {
	switch (entityType) {
		case "section":
			return TransactionLogStateActions.unlinkSectionReference({ data: { referenceId, fragmentContent } });
		case "watermark":
			return TransactionLogStateActions.unlinkWatermarkReference({ data: { referenceId, fragmentContent } });
		case "segment":
			return TransactionLogStateActions.unlinkSegmentFragmentReference({
				data: { referenceId, fragmentContent },
			});
		case "textStyle":
			return TransactionLogStateActions.unlinkTextStyleReference({ data: { referenceId, fragmentContent } });
		case "element":
			return TransactionLogStateActions.unlinkElementReference({ data: { referenceId, fragmentContent } });
	}
}

/**
 * Once a reference is unlinked, any earlier edits recorded against it (e.g. reordering,
 * usage/position changes made while it was still a fragment reference) no longer apply to
 * anything undo could sensibly restore, so their interactions must also become preventUndo.
 */
function* collectPriorInteractionIds(
	entityType: FragmentReferenceEntityType,
	referenceId: string
): SagaGenerator<string[]> {
	const transactionLogState = yield* select(PrintEngineSelectors.transactionLogState);
	const relatedLog = yield* selectFragmentReferenceLog(entityType, transactionLogState);
	const interactionIds = relatedLog.filter(entry => entry.objectId === referenceId).map(entry => entry.interactionId);
	return [...new Set(interactionIds)];
}

function* selectFragmentReferenceLog(
	entityType: FragmentReferenceEntityType,
	transactionLogState: TransactionLogStore
): SagaGenerator<ReadonlyArray<TransactionLogEntry>> {
	switch (entityType) {
		case "section":
			return transactionLogState.sections?.referencesEntry?.log ?? [];
		case "watermark":
			return transactionLogState.watermarks?.referencesEntry?.log ?? [];
		case "textStyle":
			return transactionLogState.textStyles?.referencesEntry?.log ?? [];
		case "segment":
			return transactionLogState.segments?.fragmentReferencesEntry?.log ?? [];
		case "element": {
			// Element references have no shared referencesEntry - they live inline inside
			// whichever container currently holds them, resolved the same way the actual
			// mutation (ElementReferenceTransactionLogHandler) resolves it.
			const { currentContainerElement, wrapperElement } = yield* call(getContainerElements);
			const containerId = (wrapperElement ?? currentContainerElement)?.id;
			return containerId ? getElementContainerLog(transactionLogState, containerId) : [];
		}
	}
}

function getElementContainerLog(
	transactionLogState: TransactionLogStore,
	containerId: string
): ReadonlyArray<TransactionLogEntry> {
	return (
		transactionLogState.segments?.map?.[containerId]?.log ??
		transactionLogState.sections?.map?.[containerId]?.log ??
		transactionLogState.watermarks?.map?.[containerId]?.log ??
		transactionLogState.printModelElements?.[containerId]?.log ??
		[]
	);
}

function getUnlinkDescription(entityType: FragmentReferenceEntityType): string {
	switch (entityType) {
		case "section":
			return RESOURCE_KEYS.interaction.section.sectionCard.unlinkSectionReference;
		case "watermark":
			return RESOURCE_KEYS.interaction.watermark.watermarkCard.unlinkWatermarkReference;
		case "segment":
			return RESOURCE_KEYS.interaction.segment.segmentReferenceSection.unlinkSegmentReference;
		case "textStyle":
			return RESOURCE_KEYS.interaction.textStyle.textStyleReferenceSection.unlinkTextStyleReference;
		case "element":
			return RESOURCE_KEYS.interaction.editor.unlinkFragmentElementReference;
	}
}

function* notifyUnlinkError(messageKey: string, args?: Record<string, string>): SagaGenerator<void> {
	yield* put(
		EditorComponentApiActions.addNotification({
			title: { key: RESOURCE_KEYS.fragmentUnlink.error.title },
			message: {
				key: messageKey,
				args: args
					? Object.fromEntries(
							Object.entries(args).map(([placeholder, value]) => [
								placeholder,
								{ type: "plain" as const, value },
							])
						)
					: undefined,
			},
			severity: "error",
			duration: DEFAULT_ERROR_TOAST_DURATION,
		})
	);
}
