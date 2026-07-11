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
import { removeUndefinedProperties } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import type { PrintError } from "@com.mgmtp.a12.print/print-model-api/errors";
import { DeepPartialErrorMap, ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";
import type { Serializer, SerializerResult } from "@com.mgmtp.a12.print/print-model-api-utils/marshaller";

import type * as ModelAPI from "../../../../a12internal/api/model/index.js";
import type * as GeneratedDTO from "../../generated/dto/TypesettingModelDTO.js";

export class TypesettingModelSerializer implements Serializer<
	ModelAPI.TypesettingModel,
	GeneratedDTO.TypesettingModelDTO
> {
	errorMap = DeepPartialErrorMap.getEmptyMap<ModelAPI.TypesettingModel>();

	serialize(
		apiObject: ModelAPI.TypesettingModel
	): SerializerResult<ModelAPI.TypesettingModel, GeneratedDTO.TypesettingModelDTO> {
		this.errorMap = DeepPartialErrorMap.getEmptyMap<ModelAPI.TypesettingModel>();
		try {
			const serializedModel = {
				header: this.mapHeader(apiObject.header),
				content: this.mapContent(apiObject.content),
			};
			const cleanSerializedModel = removeUndefinedProperties(serializedModel);
			return {
				result: cleanSerializedModel,
				errorMap: DeepPartialErrorMap.getEmptyMap<ModelAPI.TypesettingModel>(),
			};
		} catch (e) {
			this.errorMap[ErrorSeverity.ERROR].push(e as PrintError);
			return {
				errorMap: this.errorMap,
			};
		}
	}

	private mapHeader(header: ModelAPI.TypesettingModel["header"]): GeneratedDTO.HeaderDTO {
		return {
			id: header.id,
			modelType: header.modelType,
			modelVersion: header.modelVersion,
			annotations: this.mapRepeatableGroup(header.annotations, annotation => ({
				name: annotation.name,
				value: annotation.value,
			})),
			labels: this.mapRepeatableGroup(header.labels, label => ({
				locale: label.locale,
				text: label.text,
			})),
			locales: this.mapRepeatableGroup(header.locales, locale => ({
				code: locale.code,
			})),
			modelReferences: this.mapRepeatableGroup(header.modelReferences, ref => ({
				modelType: ref.modelType,
				reference: ref.reference,
				alias: ref.alias,
				purpose: ref.purpose,
			})),
		};
	}

	private mapContent(content: ModelAPI.TypesettingModelContent): GeneratedDTO.ContentDTO {
		return {
			internal: content.internal ? this.mapInternal(content.internal) : undefined,
			customHyphenationExclusions: this.mapRepeatableGroup(
				content.customHyphenationExclusions,
				this.mapHyphenationExclusion
			),
			preventLineBreakRules: this.mapRepeatableGroup(content.preventLineBreakRules, rule => ({
				pattern: rule.pattern,
			})),
			orphan: content.orphan,
			widow: content.widow,
		};
	}

	private mapInternal(internal: ModelAPI.Internal): GeneratedDTO.InternalDTO {
		return {
			hyphenation: internal.hyphenation ? this.mapHyphenation(internal.hyphenation) : undefined,
		};
	}

	private mapHyphenation(hyphenation: ModelAPI.Hyphenation): GeneratedDTO.HyphenationDTO {
		return {
			general: this.mapHyphenationGeneral(hyphenation.general),
			patterns: this.mapRepeatableGroup(hyphenation.patterns, pattern => ({
				v: pattern.v,
			})),
			exclusions: this.mapRepeatableGroup(hyphenation.exclusions, this.mapHyphenationExclusion),
		};
	}

	private mapHyphenationGeneral(general: ModelAPI.HyphenationGeneral): GeneratedDTO.GeneralDTO {
		return {
			title: general.title,
			language: general.language
				? {
						name: general.language.name,
						tag: general.language.tag,
					}
				: undefined,
			notice: general.notice,
			copyright: general.copyright,
			version: general.version,
			licence: general.licence ? { text: general.licence } : undefined,
			source: general.source,
			texlive: general.texlive ? this.mapTexLive(general.texlive) : undefined,
			hyphenmins: general.hyphenmins ? this.mapHyphenMins(general.hyphenmins) : undefined,
			authors: this.mapRepeatableGroup(general.authors, author => ({
				name: author.name ?? "",
				contact: author.contact,
			})),
			checksum: general.checksum,
		};
	}

	private mapTexLive(texlive: ModelAPI.TexLive): GeneratedDTO.TexliveDTO {
		return {
			encoding: texlive.encoding,
			babelname: texlive.babelName,
			legacy_patterns: texlive.legacy_patterns,
			message: texlive.message,
			package: texlive.texPackage,
			use_old_patterns_comment: texlive.use_old_patterns_comment,
		};
	}

	private mapHyphenMins(hyphenmins: ModelAPI.HyphenMins): GeneratedDTO.HyphenminsDTO {
		return {
			typesetting: hyphenmins.typesetting
				? {
						left: hyphenmins.typesetting.left,
						right: hyphenmins.typesetting.right,
					}
				: undefined,
			generation: hyphenmins.generation
				? {
						left: hyphenmins.generation.left,
						right: hyphenmins.generation.right,
					}
				: undefined,
		};
	}

	private mapHyphenationExclusion(
		exclusion: ModelAPI.HyphenationExclusion
	): GeneratedDTO.ExclusionsDTO | GeneratedDTO.CustomHyphenationExclusionsDTO {
		return {
			word: exclusion.word,
			index: exclusion.index?.map(idx => ({
				v: typeof idx.v === "number" ? idx.v : parseInt(idx.v as string, 10),
			})),
		};
	}

	private mapRepeatableGroup = <I, O>(
		repeatableGroup: readonly I[] | undefined,
		serializer: (item: I, index: number) => O
	): O[] => {
		return repeatableGroup?.map((item, index) => serializer.call(this, item, index)) || [];
	};
}
