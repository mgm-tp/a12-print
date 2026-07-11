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
import { isModelInstance } from "@com.mgmtp.a12.base/base-model-api";
import type { GenericModel, ModelAttributeAccessor } from "@com.mgmtp.a12.migrationtool/migrationtool-core/types";
import type { Annotation } from "@com.mgmtp.a12.base/base-model-api";

import {
	LAST_VERSION_ANNOTATION,
	MODEL_TYPE,
	PREVIOUS_STEP_ANNOTATION,
	PREVIOUS_VERSION_ANNOTATION,
} from "../constanst.js";

export function createPrintModelAttributeAccessor(): ModelAttributeAccessor {
	return {
		getId(model: GenericModel) {
			if (!isModelInstance(model)) {
				throw new Error("Model is not an A12 base model");
			}

			return model.header.id;
		},
		getVersion(model: GenericModel) {
			if (!isModelInstance(model)) {
				throw new Error("Model is not an A12 base model");
			}

			return model.header.modelVersion;
		},
		setVersion(model: GenericModel, version: string) {
			if (!isModelInstance(model)) {
				throw new Error("Model is not an A12 base model");
			}

			return {
				...model,
				header: {
					...model.header,
					modelVersion: version,
					annotations: setMigratedAnnotations(model.header.annotations, model.header.modelVersion, version),
				},
			};
		},
		isIgnoredModel(model: GenericModel) {
			if (!isModelInstance(model)) {
				throw new Error("Model is not an A12 base model");
			}

			return !!model.header.annotations?.find(annotation => annotation.name === "do-not-migrate");
		},
		isTargetModel(model: GenericModel) {
			if (!isModelInstance(model)) {
				return false;
			}

			return model.header.modelType === MODEL_TYPE;
		},
	};
}

function setMigratedAnnotations(annotations: Annotation[] = [], oldVersion: string, newVersion: string) {
	const previousVersion =
		annotations.find(annotation => annotation.name === LAST_VERSION_ANNOTATION)?.value || oldVersion;

	const newAnnotations = annotations.filter(
		annotation =>
			![LAST_VERSION_ANNOTATION, PREVIOUS_VERSION_ANNOTATION, PREVIOUS_STEP_ANNOTATION].includes(annotation.name)
	);

	newAnnotations.push({
		name: LAST_VERSION_ANNOTATION,
		value: newVersion,
	});

	newAnnotations.push({
		name: PREVIOUS_VERSION_ANNOTATION,
		value: previousVersion,
	});

	return newAnnotations;
}
