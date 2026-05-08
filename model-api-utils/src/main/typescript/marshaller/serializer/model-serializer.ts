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
import * as ModelAPI from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { SegmentType } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import * as GeneratedDTO from "@com.mgmtp.a12.print/print-model-api/lib/generated/internal/dto/PrintModelDTO.js";
import {
	DeepPartialErrorMap,
	ErrorOrigin,
	ErrorSeverity,
	PrintError,
} from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";

import {
	getPlainLocalizableArgs,
	InternalLocalizableError,
} from "../../internal/validation/internal-localizable-error.js";
import { removeUndefinedProperties } from "../../internal/utils/object-utils.js";

import { ElementDefinitionSerializer } from "./element-definition-serializer.js";
import { Serializer, SerializerResult } from "./serializer.js";
import { mapMeasure } from "./measure-serializer.js";
import { mapMargin } from "./margin-serializer.js";
import { mapDataContext } from "./data-context-serializer.js";
import { mapComputationAlternative } from "./computation-alternative-serializer.js";
import { mapInputSource } from "./input-source-serializer.js";

export class PrintModelSerializer implements Serializer<ModelAPI.PrintModel, GeneratedDTO.PrintModelDTO> {
	errorMap = DeepPartialErrorMap.getEmptyMap<ModelAPI.PrintModel>();

	serialize(apiObject: ModelAPI.PrintModel): SerializerResult<ModelAPI.PrintModel, GeneratedDTO.PrintModelDTO> {
		this.errorMap = DeepPartialErrorMap.getEmptyMap<ModelAPI.PrintModel>();
		try {
			const serializedModel = {
				header: this.mapHeader(apiObject.header),
				content: this.mapContent(apiObject.content),
			};
			const cleanSerializedModel = removeUndefinedProperties(serializedModel);
			return {
				result: cleanSerializedModel,
				errorMap: DeepPartialErrorMap.getEmptyMap<ModelAPI.PrintModel>(),
			};
		} catch (e) {
			this.errorMap[ErrorSeverity.ERROR].push(e as PrintError);
			return {
				errorMap: this.errorMap,
			};
		}
	}

	private mapHeader(header: ModelAPI.PrintModelHeader): GeneratedDTO.HeaderDTO {
		this.errorMap.header = DeepPartialErrorMap.getEmptyMap<ModelAPI.PrintModelHeader>();
		return {
			id: header.id,
			modelType: header.modelType,
			modelVersion: header.modelVersion,
			description: header.description,
			annotations: this.mapRepeatableGroup(header.annotations, annotation => {
				return {
					name: annotation.name,
					value: annotation.value,
				};
			}),
			labels: this.mapRepeatableGroup(header.labels, label => {
				return {
					locale: label.locale,
					text: label.text,
				};
			}),
			locales: this.mapRepeatableGroup(header.locales, locale => {
				return {
					code: locale.code,
				};
			}),
			modelReferences: this.mapRepeatableGroup(header.modelReferences, ref => {
				return {
					modelType: ref.modelType,
					reference: ref.reference,
					alias: ref.alias,
					purpose: ref.purpose,
				};
			}),
		};
	}

	private mapContent(content: ModelAPI.PrintModelContent): GeneratedDTO.ContentDTO {
		this.errorMap.content = DeepPartialErrorMap.getEmptyMap<ModelAPI.PrintModelContent>();
		this.errorMap.content.elementDefinitions = [];
		return {
			id: content.id,
			general: {
				id: content.general.id,
				metadata: {
					id: content.general.metadata.id,
					model: content.general.metadata.model,
					titleComputation: this.mapRepeatableGroup(
						content.general.metadata.titleComputation,
						mapComputationAlternative
					),
					descriptionComputation: this.mapRepeatableGroup(
						content.general.metadata.descriptionComputation,
						mapComputationAlternative
					),
					authorComputation: this.mapRepeatableGroup(
						content.general.metadata.authorComputation,
						mapComputationAlternative
					),
					languageComputation: this.mapRepeatableGroup(
						content.general.metadata.languageComputation,
						mapComputationAlternative
					),
				},
				segmentDefaults: content.general.segmentDefaults,
				structure: this.mapRepeatableGroup(content.general.structure, id => ({ id })),
				sections: this.mapRepeatableGroup(content.general.sections, id => ({ id })),
				watermarks: this.mapRepeatableGroup(content.general.watermarks, id => ({ id })),
				runtimeVariables: this.mapRepeatableGroup(content.general.runtimeVariables, variable => ({
					id: variable.id,
					name: variable.name,
					type: variable.type,
				})),
				textStyles: this.mapRepeatableGroup(content.general.textStyles, id => ({ id })),
			},
			segments: this.mapSegmentsContainer(content.segments),
			sections: content.sections ? this.mapSectionsContainer(content.sections) : undefined,
			watermarks: content.watermarks ? this.mapWatermarksContainer(content.watermarks) : undefined,
			elementDefinitions: this.mapRepeatableGroup(content.elementDefinitions, this.mapElementDefinition),
			textStyles: content.textStyles ? this.mapTextStylesContainer(content.textStyles) : undefined,
		};
	}

	private mapSegmentsContainer(segmentsContainer: ModelAPI.SegmentsContainer): GeneratedDTO.SegmentsDTO {
		return {
			id: segmentsContainer.id,
			definitions: this.mapRepeatableGroup(segmentsContainer.definitions, this.mapSegment),
			references: this.mapRepeatableGroup(segmentsContainer.references, this.mapSegmentReference),
		};
	}

	private mapSegment(segment: ModelAPI.Segment): GeneratedDTO.DefinitionsDTO {
		return this.mapSegmentProperties(segment, {
			id: segment.id,
			title: segment.title,
			type: segment.type,
			defaultSegment: segment.defaultSegment ? this.mapDefaultSegment(segment.defaultSegment) : undefined,
			elementReferences: this.mapRepeatableGroup(segment.elementReferences, this.mapElementReference),
			dinTemplate: segment.dinTemplate ? this.mapSegmentDinTemplate(segment.dinTemplate) : undefined,
			dataContexts: this.mapRepeatableGroup(segment?.dataContexts, mapDataContext),
		});
	}

	private mapSegmentReference(segmentReference: ModelAPI.SegmentReference): GeneratedDTO.ReferencesDTO {
		return {
			id: segmentReference.id,
			purpose: segmentReference.purpose,
			referenceModel: segmentReference.referenceModel,
			direction: segmentReference.direction,
			refIds: this.mapRepeatableGroup(segmentReference.refIds, ({ id, refId }) => ({ id, refId })),
		};
	}

	private mapSegmentDinTemplate(segmentDinTemplate: ModelAPI.DINTemplateProperties): GeneratedDTO.DinTemplateDTO {
		return {
			id: segmentDinTemplate.id,
			refId: segmentDinTemplate?.refId,
			referenceId: segmentDinTemplate?.referenceId,
		};
	}

	private mapDefaultSegment(defaultSegment: ModelAPI.DefaultSegmentProperties): GeneratedDTO.DefaultSegmentDTO {
		return {
			id: defaultSegment.id,
			pageOrientation: defaultSegment.pageOrientation,
		};
	}

	private mapSegmentProperties(
		segment: ModelAPI.Segment,
		segmentDTO: GeneratedDTO.DefinitionsDTO
	): GeneratedDTO.DefinitionsDTO {
		if ([SegmentType.Default, SegmentType.Repeatable].includes(segment.type)) {
			return segmentDTO;
		}
		throw new Error("Segment type is not supported");
	}

	private mapSectionsContainer(sectionsContainer?: ModelAPI.SectionsContainer): GeneratedDTO.SectionsDTO_1 {
		return {
			id: sectionsContainer?.id,
			definitions: this.mapRepeatableGroup(sectionsContainer?.definitions, this.mapSection),
		};
	}

	private mapSection(section: ModelAPI.Section): GeneratedDTO.DefinitionsDTO_1 {
		return {
			id: section.id,
			pageOrientation: section.pageOrientation,
			sectionUsage: section.sectionUsage,
			title: section.title,
			footerHeight: mapMeasure(section.footerHeight),
			headerHeight: mapMeasure(section.headerHeight),
			elementReferences: this.mapRepeatableGroup(section.elementReferences, this.mapElementReference),
		};
	}

	private mapWatermarksContainer(watermarksContainer?: ModelAPI.WatermarksContainer): GeneratedDTO.WatermarksDTO_1 {
		return {
			id: watermarksContainer?.id,
			definitions: this.mapRepeatableGroup(watermarksContainer?.definitions, this.mapWatermark),
		};
	}

	private mapWatermark(watermark: ModelAPI.Watermark): GeneratedDTO.DefinitionsDTO_3 {
		return {
			id: watermark.id,
			title: watermark.title,
			pageOrientation: watermark.pageOrientation,
			opacity: watermark.opacity,
			conditions: this.mapRepeatableGroup(watermark.conditions, cond => {
				return {
					id: cond.id,
					precondition: cond.precondition,
				};
			}),
			elementReferences: this.mapRepeatableGroup(watermark.elementReferences, this.mapElementReference),
		};
	}

	private mapElementDefinition(
		element: ModelAPI.PrintModelElement,
		index: number
	): GeneratedDTO.ElementDefinitionsDTO {
		const parentPath = [
			{ elementName: "content", index: 1, isRepeatable: false },
			{ elementName: "elementDefinitions", index: index, isRepeatable: true },
		];
		const result = new ElementDefinitionSerializer().serialize(element, parentPath);

		if (this.errorMap.content && this.errorMap.content.elementDefinitions) {
			this.errorMap.content.elementDefinitions.push(result.errorMap);
			Object.values(ErrorSeverity).map(severity => {
				this.errorMap.content?.[severity]?.push(...result.errorMap[severity]);
				this.errorMap[severity].push(...result.errorMap[severity]);
			});
		}
		if (result.result) {
			return result.result;
		}

		const stringPath = parentPath
			.map(el => {
				return `${el.elementName}[${el.index}]`;
			})
			.concat(element.id)
			.join(".");

		throw {
			jsonPath: parentPath,
			errorCode: InternalLocalizableError.serializeError.key,
			severity: "ERROR",
			origin: ErrorOrigin.SERIALIZER,
			parameters: {
				index: index,
				id: element.id,
			},
			errorMessage: [
				{
					...InternalLocalizableError.serializeError,
					args: getPlainLocalizableArgs({ path: stringPath }),
				},
			],
		};
	}

	private mapTextStylesContainer(textStylesContainer?: ModelAPI.TextStylesContainer): GeneratedDTO.TextStylesDTO_1 {
		return {
			id: textStylesContainer?.id,
			definitions: this.mapRepeatableGroup(textStylesContainer?.definitions, this.mapTextStyle),
		};
	}

	private mapTextStyle(textStyle: ModelAPI.TextStyle): GeneratedDTO.DefinitionsDTO_2 {
		return {
			id: textStyle.id,
			name: textStyle.name,
			font: textStyle.font,
			fontSize: textStyle.fontSize,
			lineHeight: textStyle.lineHeight,
			semantic: textStyle.semantic,
			typesettingModelName: textStyle.typesettingModelName,
			staticHyphenator: textStyle.staticHyphenator,
		};
	}

	private mapElementReference(ref: ModelAPI.PlaceableReference): GeneratedDTO.ElementReferencesDTO {
		return {
			id: ref.id,
			refId: ref.refId,
			position: {
				id: ref.position.id,
				x: mapMeasure(ref.position.x),
				y: mapMeasure(ref.position.y),
			},
			dimensions: {
				id: ref.dimensions.id,
				minHeight: mapMeasure(ref.dimensions.minHeight),
				minWidth: mapMeasure(ref.dimensions.minWidth),
			},
			screenReadingOrder: ref.screenReadingOrder,
			hideConditions: this.mapRepeatableGroup(ref.hideConditions, cond => {
				return {
					id: cond.id,
					precondition: cond.precondition,
				};
			}),
			margins: ref.margins
				? {
						id: ref.margins.id,
						top: ref.margins.top ? mapMargin(ref.margins.top) : undefined,
						bottom: ref.margins.bottom ? mapMargin(ref.margins.bottom) : undefined,
					}
				: undefined,
			pageBreakBehavior: mapInputSource<ModelAPI.PageBreakBehavior>(ref.pageBreakBehavior),
		};
	}

	private mapRepeatableGroup = <I, O>(
		repeatableGroup: readonly I[] | undefined,
		serializer: (item: I, index: number) => O
	): O[] => {
		return repeatableGroup?.map((item, index) => serializer.call(this, item, index)) || [];
	};
}
