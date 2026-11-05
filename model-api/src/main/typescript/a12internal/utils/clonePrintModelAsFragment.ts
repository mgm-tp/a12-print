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
import { nanoid } from "nanoid";

import {
	FRAGMENT_SUB_TYPE,
	MODEL_SUB_TYPE_ANNOTATION_NAME,
	FRAGMENT_MODEL_REFERENCE_PURPOSE,
} from "../../model/constant.js";
import {
	type PrintModel,
	SegmentReferencePurpose,
	type AnnotationEntity,
	type Section,
	SectionUsage,
} from "../../model/print-model.js";
import {
	clonePrintModel,
	ERROR_FORBID_COPY_FRAGMENT_MODEL,
	ERROR_FORBID_COPY_DIN_REFERENCE,
	ERROR_FORBID_COPY_FRAGMENT_REFERENCE,
	ERROR_FORBID_COPY_MULTIPLE_DOCUMENT_REFERENCES,
} from "../../utils/index.js";

/**
 * Creates a deep copy of a print model as a Fragment Model.
 * Print models that cannot be represented as a Fragment Model are not allowed to be copied and will throw errors.
 */

export function clonePrintModelAsFragment(printModel: PrintModel, printModelId?: string): PrintModel {
	assertCopyableAsFragment(printModel);

	const clonedPrintModel = clonePrintModel(printModel, printModelId);

	return {
		...clonedPrintModel,
		header: {
			...clonedPrintModel.header,
			modelSubType: FRAGMENT_SUB_TYPE,
			annotations: appendFragmentAnnotation(clonedPrintModel.header.annotations),
		},
		content: {
			...clonedPrintModel.content,
			general: {
				...clonedPrintModel.content.general,
				metadata: {
					...clonedPrintModel.content.general.metadata,
					titleComputation: [],
					descriptionComputation: [],
					authorComputation: [],
					languageComputation: [],
				},
			},
			...(clonedPrintModel.content.sections && {
				sections: {
					...clonedPrintModel.content.sections,
					definitions: overwriteSectionUsageForFragment(clonedPrintModel.content.sections.definitions),
				},
			}),
		},
	};
}
/**
 * Throws when the print model has a property that a Fragment Model cannot represent.
 * The thrown error codes mirror the reasons for which the copy action is disabled in the editor.
 */
function assertCopyableAsFragment(printModel: PrintModel): void {
	const { annotations, modelReferences, modelSubType } = printModel.header;

	const isFragmentModel =
		modelSubType === FRAGMENT_SUB_TYPE ||
		annotations?.some(
			annotation => annotation.name === MODEL_SUB_TYPE_ANNOTATION_NAME && annotation.value === FRAGMENT_SUB_TYPE
		);
	if (isFragmentModel) {
		throw new Error(ERROR_FORBID_COPY_FRAGMENT_MODEL);
	}

	if (modelReferences?.some(reference => reference.purpose === SegmentReferencePurpose.DINTemplate)) {
		throw new Error(ERROR_FORBID_COPY_DIN_REFERENCE);
	}

	if (modelReferences?.some(reference => reference.purpose === FRAGMENT_MODEL_REFERENCE_PURPOSE)) {
		throw new Error(ERROR_FORBID_COPY_FRAGMENT_REFERENCE);
	}

	const documentModelReferences =
		modelReferences?.filter(reference => reference.modelType === "document").length || 0;
	if (documentModelReferences > 1) {
		throw new Error(ERROR_FORBID_COPY_MULTIPLE_DOCUMENT_REFERENCES);
	}
}
function appendFragmentAnnotation(annotations?: AnnotationEntity[]): AnnotationEntity[] {
	const fragmentAnnotation: AnnotationEntity = {
		id: nanoid(),
		name: MODEL_SUB_TYPE_ANNOTATION_NAME,
		value: FRAGMENT_SUB_TYPE,
	};

	return annotations ? [...annotations, fragmentAnnotation] : [fragmentAnnotation];
}
function overwriteSectionUsageForFragment(sections: ReadonlyArray<Section>): ReadonlyArray<Section> {
	return sections.map(section => ({
		...section,
		sectionUsage: SectionUsage.First,
	}));
}
