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
import { ExtendedEntityInstancePath } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";
import {
	AnnotationEntity,
	LabelEntity,
	LocaleEntity,
	ModelReferenceEntity,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { Deserializer } from "../../../marshaller/deserializer/deserializer.js";

import { BaseHeaderDTO } from "./base-header-dto.js";
import {
	AnnotationDeserializer,
	LocalesDeserializer,
	LocalizedTextDeserializer,
	ModelReferencesDeserializer,
} from "./header-field-deserializers.js";

/**
 * Configuration for BaseHeaderDeserializer to specify which optional properties are supported.
 */
export interface HeaderDeserializerConfig {
	hasDescription?: boolean;
	hasLocales?: boolean;
	hasLabels?: boolean;
	hasModelReferences?: boolean;
}

interface BaseHeaderAPI {
	readonly id: string;
	readonly modelType: string;
	readonly modelVersion: string;
	readonly annotations?: AnnotationEntity[];
	readonly locales?: ReadonlyArray<LocaleEntity>;
	readonly labels?: ReadonlyArray<LabelEntity>;
	readonly modelReferences?: ReadonlyArray<ModelReferenceEntity>;
	readonly description?: string;
}

/**
 * Base deserializer for header objects shared across print-model, print-setting-model, and typesetting-model.
 * Uses a configuration object to specify which optional properties are supported by each model type.
 *
 * @template DTOType - The DTO type extending BaseHeaderDTO
 * @template APIType - The API type extending BaseHeaderAPI
 */
export abstract class BaseHeaderDeserializer<
	DTOType extends BaseHeaderDTO,
	APIType extends BaseHeaderAPI,
> extends Deserializer<DTOType, APIType> {
	prefix = "header";

	protected readonly config: HeaderDeserializerConfig;

	constructor(
		parentPath: ExtendedEntityInstancePath,
		config: HeaderDeserializerConfig,
		index: number = 1,
		isRepeatable: boolean = false
	) {
		super(parentPath, index, isRepeatable);
		this.config = config;
	}

	map(property: keyof DTOType, dto: DTOType): APIType[keyof APIType] {
		switch (property) {
			case "id":
				return dto.id as APIType[keyof APIType];
			case "modelType":
				return this.getRequired(dto.modelType, property) as APIType[keyof APIType];
			case "modelVersion":
				return this.getRequired(dto.modelVersion, property) as APIType[keyof APIType];
			case "annotations":
				return (this as Deserializer<BaseHeaderDTO, BaseHeaderAPI>).deserializeRepeatable(
					dto.annotations,
					index => new AnnotationDeserializer(this.path, index, true),
					property
				) as APIType[keyof APIType];
		}

		if (property === "description" && this.config.hasDescription) {
			return (dto as BaseHeaderDTO).description as APIType[keyof APIType];
		}

		if (property === "locales" && this.config.hasLocales) {
			return (this as Deserializer<BaseHeaderDTO, BaseHeaderAPI>).deserializeRepeatable(
				dto.locales,
				index => new LocalesDeserializer(this.path, index, true),
				property
			) as APIType[keyof APIType];
		}

		if (property === "labels" && this.config.hasLabels) {
			return (this as Deserializer<BaseHeaderDTO, BaseHeaderAPI>).deserializeRepeatable(
				dto.labels,
				index => new LocalizedTextDeserializer(this.path, index, true),
				property
			) as APIType[keyof APIType];
		}

		if (property === "modelReferences" && this.config.hasModelReferences) {
			return (this as Deserializer<BaseHeaderDTO, BaseHeaderAPI>).deserializeRepeatable(
				dto.modelReferences,
				index => new ModelReferencesDeserializer(this.path, index, true),
				property
			) as APIType[keyof APIType];
		}

		// Allow subclasses to handle custom/unknown properties
		return this.mapAdditionalProperty(property);
	}

	/**
	 * Override this method in subclasses to custom header properties
	 */
	protected mapAdditionalProperty(property: keyof DTOType): APIType[keyof APIType] {
		this.unknownProperty(property as never);
		return undefined as unknown as APIType[keyof APIType];
	}
}
