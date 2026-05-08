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
import {
	AnnotationEntity,
	EntityKey,
	getEntityId,
	LabelEntity,
	LocaleEntity,
	ModelReferenceEntity,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { Deserializer } from "../../../marshaller/deserializer/deserializer.js";

import { AnnotationsDTO, LabelsDTO, LocalesDTO, ModelReferencesDTO } from "./base-header-dto.js";

export class LocalizedTextDeserializer extends Deserializer<LabelsDTO, LabelEntity> {
	prefix = "labels";

	map(property: keyof LabelsDTO, dto: LabelsDTO) {
		switch (property) {
			case "locale":
				this.addAdditionalProperty("id", getEntityId(EntityKey.Labels, dto.locale));
				return dto.locale;
			case "text":
				return dto.text;
		}
		this.unknownProperty(property);
	}
}

export class AnnotationDeserializer extends Deserializer<AnnotationsDTO, AnnotationEntity> {
	prefix = "annotations";

	map(property: keyof AnnotationsDTO, dto: AnnotationsDTO) {
		switch (property) {
			case "name":
				this.addAdditionalProperty("id", getEntityId(EntityKey.Annotations, dto.name));
				return dto.name;
			case "value":
				return dto.value;
		}
		this.unknownProperty(property);
	}
}

export class LocalesDeserializer extends Deserializer<LocalesDTO, LocaleEntity> {
	prefix = "locales";

	map(property: keyof LocalesDTO, dto: LocalesDTO) {
		switch (property) {
			case "code":
				this.addAdditionalProperty("id", getEntityId(EntityKey.Locales, dto.code));
				return dto.code;
		}
		this.unknownProperty(property);
	}
}

export class ModelReferencesDeserializer extends Deserializer<ModelReferencesDTO, ModelReferenceEntity> {
	prefix = "modelReferences";

	map(property: keyof ModelReferencesDTO, dto: ModelReferencesDTO) {
		switch (property) {
			case "alias":
				return dto.alias;
			case "reference":
				this.addAdditionalProperty("id", getEntityId(EntityKey.ModelReferences, dto.reference));
				return dto.reference;
			case "modelType":
				return dto.modelType;
			case "purpose":
				return dto.purpose;
		}
		this.unknownProperty(property);
	}
}
