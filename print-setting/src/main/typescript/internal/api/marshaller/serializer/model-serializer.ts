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
	DeepPartialErrorMap,
	ErrorSeverity,
	PrintError,
} from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";
import { Serializer, SerializerResult } from "@com.mgmtp.a12.print/print-model-api-utils";
import { removeUndefinedProperties } from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/utils/object-utils.js";

import * as ModelAPI from "../../model/index.js";
import * as GeneratedDTO from "../../generated/dto/PrintSettingModelDTO.js";

export class PrintSettingModelSerializer
	implements Serializer<ModelAPI.PrintSettingModel, GeneratedDTO.PrintSettingModelDTO>
{
	errorMap = DeepPartialErrorMap.getEmptyMap<ModelAPI.PrintSettingModel>();

	serialize(
		apiObject: ModelAPI.PrintSettingModel
	): SerializerResult<ModelAPI.PrintSettingModel, GeneratedDTO.PrintSettingModelDTO> {
		this.errorMap = DeepPartialErrorMap.getEmptyMap();

		try {
			const serializedModel = {
				header: this.mapHeader(apiObject.header),
				content: this.mapContent(apiObject.content),
			};
			const cleanSerializedModel = removeUndefinedProperties(serializedModel);
			return {
				result: cleanSerializedModel,
				errorMap: DeepPartialErrorMap.getEmptyMap<ModelAPI.PrintSettingModel>(),
			};
		} catch (e) {
			this.errorMap[ErrorSeverity.ERROR].push(e as PrintError);
			return {
				errorMap: this.errorMap,
			};
		}
	}

	private mapHeader(header?: ModelAPI.PrintSettingHeader): GeneratedDTO.HeaderDTO | undefined {
		if (!header) {
			return undefined;
		}
		this.errorMap.header = DeepPartialErrorMap.getEmptyMap<ModelAPI.PrintSettingHeader>();
		return {
			id: header.id,
			modelType: header.modelType,
			modelVersion: header.modelVersion,
			annotations: this.mapRepeatableGroup(header.annotations, annotation => ({
				name: annotation.name,
				value: annotation.value,
			})),
		};
	}

	private mapContent(content?: ModelAPI.PrintSettingContent): GeneratedDTO.ContentDTO | undefined {
		if (!content) {
			return undefined;
		}
		this.errorMap.content = DeepPartialErrorMap.getEmptyMap<ModelAPI.PrintSettingContent>();
		return {
			settings: this.mapSettings(content.settings),
			defaults: this.mapDefaults(content.defaults),
		};
	}

	private mapSettings(settings?: ModelAPI.Settings): GeneratedDTO.SettingsDTO | undefined {
		if (!settings) {
			return undefined;
		}
		return {
			fonts: this.mapRepeatableGroup(settings.fonts, font => this.mapFonts(font)),
		};
	}

	private mapDefaults(defaults?: ModelAPI.Defaults): GeneratedDTO.DefaultsDTO | undefined {
		if (!defaults) {
			return undefined;
		}
		return {
			fonts: this.mapRepeatableGroup(defaults.fonts, font => ({
				name: font.name,
				fallback: font.fallback,
			})),
		};
	}

	private mapFonts(font: ModelAPI.Font): GeneratedDTO.FontsDTO {
		return {
			name: font.name,
			fallback: font.fallback,
			type: font.type,
			path: font.path,
			fontAttachment: this.mapFontAttachment(font.fontAttachment),
		};
	}

	private mapFontAttachment(fontAttachment?: ModelAPI.FontAttachment): GeneratedDTO.FontAttachmentDTO | undefined {
		if (!fontAttachment) {
			return undefined;
		}
		return {
			original_filename: fontAttachment.original_filename,
			internal_filename: fontAttachment.internal_filename,
			content: fontAttachment.content,
			attachment_id: fontAttachment.attachment_id,
			size: fontAttachment.size,
			mime_type: fontAttachment.mime_type,
			category: fontAttachment.category,
			description: fontAttachment.description,
		};
	}

	private readonly mapRepeatableGroup = <I, O>(
		repeatableGroup: readonly I[] | undefined,
		serializer: (item: I, index: number) => O
	): O[] => {
		return repeatableGroup?.map((item, index) => serializer.call(this, item, index)) || [];
	};
}
