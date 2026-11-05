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
import type { PartialPrintModel, PrintModel } from "@com.mgmtp.a12.print/print-model-api/model";
import { FRAGMENT_MODEL_REFERENCE_PURPOSE } from "@com.mgmtp.a12.print/print-model-api/model";
import type { PrintError } from "@com.mgmtp.a12.print/print-model-api/errors";
import {
	ErrorOrigin,
	DeepPartialErrorMap,
	ExtendedEntityInstancePathBuilder,
} from "@com.mgmtp.a12.print/print-model-api/errors";
import type { Localizable } from "@com.mgmtp.a12.utils/utils-localization";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import type { CollectedTypesettingUsage } from "../../types/reference-path.js";

/** Label used in the error message, per Model Reference kind. */
const MODEL_TYPE_LABEL = {
	document: "Document Model",
	fragment: "Fragment Model",
	print: "Print Model",
	typesetting: "Typesetting Model",
} as const;

type ModelReferenceKind = keyof typeof MODEL_TYPE_LABEL;

interface ModelReferenceCatalogs {
	documentModels?: readonly DocumentModel[];
	fragmentModels?: PrintModel[];
	printModelIds?: readonly string[];
	typesettingModelIds?: readonly string[];
}

/**
 * Validates that every Model Reference declared in the print model header points at a model that exists in the workspace
 */
export namespace ReferenceDeclarationValidation {
	export function validateModelReferenceDeclarations(
		printModel: PartialPrintModel,
		catalogs: ModelReferenceCatalogs = {}
	) {
		let errorMap = DeepPartialErrorMap.getEmptyMap();
		const knownIdsByKind: Record<ModelReferenceKind, readonly string[] | undefined> = {
			document: catalogs.documentModels?.map(model => model.header.id),
			fragment: catalogs.fragmentModels?.map(model => model.header.id),
			print: catalogs.printModelIds,
			typesetting: catalogs.typesettingModelIds,
		};

		(printModel.header?.modelReferences ?? []).forEach((modelReference, index) => {
			if (!modelReference?.reference) {
				return;
			}
			const { id, reference, modelType, purpose } = modelReference;

			const kind = getReferenceKind(modelType, purpose);
			const knownIds = kind && knownIdsByKind[kind];
			if (!knownIds || knownIds.includes(reference)) {
				return;
			}

			const path = ExtendedEntityInstancePathBuilder.ROOT_PATH.with("header")
				.with("modelReferences", index)
				.toArray();
			const error = createMissingModelReferenceError({ id, reference, kind }, path);
			errorMap = DeepPartialErrorMap.pushAtPath(errorMap, path, error);
		});

		return errorMap;
	}

	function getReferenceKind(modelType: unknown, purpose: unknown): ModelReferenceKind | undefined {
		if (modelType === "document") {
			return "document";
		}
		if (modelType === "print") {
			return purpose === FRAGMENT_MODEL_REFERENCE_PURPOSE ? "fragment" : "print";
		}
		if (modelType === "typesetting") {
			return "typesetting";
		}
		return undefined;
	}

	function createMissingModelReferenceError(
		modelReference: { id?: string; reference: string; kind: ModelReferenceKind },
		path: ReturnType<ExtendedEntityInstancePathBuilder["toArray"]>
	): PrintError {
		const label = MODEL_TYPE_LABEL[modelReference.kind];
		const pathError: Localizable = {
			key: "print.validation.error",
			args: {
				reference: { type: "plain", value: modelReference.reference },
				label: { type: "plain", value: label },
			},
			defaults: {
				en: `The referenced $label$ '$reference$' does not exist`,
				de: `Das referenzierte $label$ '$reference$' existiert nicht`,
			},
		};
		return {
			severity: "ERROR",
			errorCode: pathError.key,
			jsonPath: path,
			origin: ErrorOrigin.VALIDATOR,
			errorMessage: [pathError],
			refId: modelReference.id,
		};
	}

	/**
	 * Validates the Typesetting Model a text style uses. A text style of a fragment model names it without the print
	 * model referencing it - the reference belongs to the fragment model - so only its existence can be checked here.
	 */
	export function validateTypesettingUsages(
		typesettingUsages: ReadonlyArray<CollectedTypesettingUsage>,
		typesettingModelIds?: readonly string[]
	) {
		let errorMap = DeepPartialErrorMap.getEmptyMap();
		if (!typesettingModelIds) {
			return errorMap;
		}

		for (const usage of typesettingUsages) {
			if (typesettingModelIds.includes(usage.typesettingModelName)) {
				continue;
			}
			/*
			 * At the naming field, so the text style editor can show it there. For a text style of a fragment model the
			 * path is frozen at its reference, since the naming field belongs to the fragment model, not to this one.
			 */
			const path = usage.printModelPath.with("typesettingModelName").toArray();
			errorMap = DeepPartialErrorMap.pushAtPath(
				errorMap,
				path,
				createMissingTypesettingModelWarning(usage, path)
			);
		}

		return errorMap;
	}

	function createMissingTypesettingModelWarning(
		usage: CollectedTypesettingUsage,
		path: ReturnType<ExtendedEntityInstancePathBuilder["toArray"]>
	): PrintError {
		const pathError: Localizable = {
			key: "print.validation.error",
			args: {
				reference: { type: "plain", value: usage.typesettingModelName },
				label: { type: "plain", value: MODEL_TYPE_LABEL.typesetting },
			},
			defaults: {
				en: `The $label$ '$reference$' used by this text style does not exist`,
				de: `Das $label$ '$reference$', das dieser Textstil verwendet, existiert nicht`,
			},
		};
		return {
			severity: "WARNING",
			errorCode: pathError.key,
			jsonPath: path,
			origin: ErrorOrigin.VALIDATOR,
			errorMessage: [pathError],
			// Names the field for a text style of a fragment model, whose path stops at the reference.
			parameters: { field: "typesettingModelName" },
			refId: usage.textStyleId,
		};
	}
}
