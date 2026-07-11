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
import * as ModelAPI from "@com.mgmtp.a12.print/print-model-api/model";
import type * as GeneratedDTO from "@com.mgmtp.a12.print/print-model-api/generated/a12internal";
import type { ExtendedEntityInstancePath, PrintError } from "@com.mgmtp.a12.print/print-model-api/errors";
import { DeepPartialErrorMap, ErrorOrigin, ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";

import {
	getPlainLocalizableArgs,
	InternalLocalizableError,
} from "../../internal/validation/internal-localizable-error.js";

import type { Serializer, SerializerResult } from "./serializer.js";
import { mapMeasure } from "./measure-serializer.js";
import { mapDataContext } from "./data-context-serializer.js";
import { mapMargin } from "./margin-serializer.js";
import { mapInputSource, mapMeasureInputSource } from "./input-source-serializer.js";
import { mapComputationAlternative } from "./computation-alternative-serializer.js";

export class ElementDefinitionSerializer implements Serializer<
	ModelAPI.PrintModelElement,
	GeneratedDTO.ElementDefinitionsDTO
> {
	errorMap = DeepPartialErrorMap.getEmptyMap<ModelAPI.PrintModelElement>();

	serialize(
		apiObject: ModelAPI.PrintModelElement,
		parentPath: ExtendedEntityInstancePath = [],
		index: number = 1
	): SerializerResult<ModelAPI.PrintModelElement, GeneratedDTO.ElementDefinitionsDTO> {
		try {
			const dtoObject = this.selectElement(apiObject, parentPath, index);
			return {
				result: dtoObject,
				errorMap: this.errorMap,
			};
		} catch (msg) {
			this.errorMap[ErrorSeverity.ERROR].push(msg as PrintError);
			return {
				errorMap: this.errorMap,
			};
		}
	}

	selectElement(
		element: ModelAPI.PrintModelElement,
		parentPath: ExtendedEntityInstancePath,
		index: number
	): GeneratedDTO.ElementDefinitionsDTO {
		switch (element.type) {
			case ModelAPI.ElementType.Text:
				return this.mapTextElement(element as ModelAPI.Text);
			case ModelAPI.ElementType.Field:
				return this.mapFieldElement(element as ModelAPI.Field);
			case ModelAPI.ElementType.Calculation:
				return this.mapCalculationElement(element as ModelAPI.Calculation);
			case ModelAPI.ElementType.Expression:
				return this.mapExpressionElement(element as ModelAPI.Expression);
			case ModelAPI.ElementType.Line:
				return this.mapLineElement(element as ModelAPI.Line);
			case ModelAPI.ElementType.Image:
				return this.mapImage(element as ModelAPI.Image);
			case ModelAPI.ElementType.Listing:
				return this.mapListing(element as ModelAPI.Listing);
			case ModelAPI.ElementType.Table:
				return this.mapTable(element as ModelAPI.Table);
			case ModelAPI.ElementType.TableLayout:
				return this.mapTableLayout(element as ModelAPI.TableLayout);
			case ModelAPI.ElementType.BarChart:
				return this.mapBarChart(element as ModelAPI.BarChart);
			case ModelAPI.ElementType.LineChart:
				return this.mapLineChart(element as ModelAPI.LineChart);
			case ModelAPI.ElementType.PieChart:
				return this.mapPieChart(element as ModelAPI.PieChart);
			case ModelAPI.ElementType.BoundingBox:
				return this.mapBoundingBoxElement(element as ModelAPI.BoundingBox);
			case ModelAPI.ElementType.Override:
				return this.mapOverrideElement(element as ModelAPI.Override);
			case ModelAPI.ElementType.Area:
				return this.mapAreaElement(element as ModelAPI.Area);
			case ModelAPI.ElementType.Switch:
				return this.mapSwitchElement(element as ModelAPI.Switch);
			case ModelAPI.ElementType.PageNumber:
			case ModelAPI.ElementType.PageNumberTotal:
				return { id: element.id, type: element.type };
			default:
				throw {
					jsonPath: [...parentPath, { elementName: "elementDefinition", index }],
					errorCode: InternalLocalizableError.unsupportedElementType.key,
					severity: "ERROR",
					parameters: {
						id: element.id,
						type: element.type,
					},
					origin: ErrorOrigin.SERIALIZER,
					errorMessage: [
						{
							...InternalLocalizableError.unsupportedElementType,
							args: getPlainLocalizableArgs({ type: element.type }),
						},
					],
				};
		}
	}

	private mapPieChart(element: ModelAPI.PieChart): GeneratedDTO.ElementDefinitionsDTO {
		return {
			id: element.id,
			type: element.type,
			pieChart: {
				id: element?.pieChart?.id,
				model: element?.pieChart?.model,
				basePath: element?.pieChart?.basePath,
				dimensions: {
					id: element?.pieChart?.dimensions?.id,
					height: mapMeasure(element?.pieChart?.dimensions.height),
					width: mapMeasure(element?.pieChart?.dimensions.width),
				},
				title: mapInputSource<string>(element?.pieChart?.title),
				data: {
					id: element?.pieChart?.data?.id,
					keyField: element?.pieChart?.data?.keyField,
					labelIsNumeration: element?.pieChart?.data?.labelIsNumeration,
					valueField: element?.pieChart.data?.valueField,
				},
			},
			borderProperties: this.mapBorderProperties(element?.borderProperties),
			textProperties: this.mapInputSourceTextProperties(element?.textProperties),
		};
	}

	private mapLineChart(element: ModelAPI.LineChart): GeneratedDTO.ElementDefinitionsDTO {
		return {
			id: element.id,
			type: element.type,
			lineChart: {
				id: element?.lineChart?.id,
				model: element?.lineChart?.model,
				basePath: element?.lineChart?.basePath,
				dimensions: {
					id: element?.lineChart?.dimensions?.id,
					height: mapMeasure(element?.lineChart?.dimensions.height),
					width: mapMeasure(element?.lineChart?.dimensions.width),
				},
				labelX: mapInputSource<string>(element?.lineChart?.labelX),
				labelY: mapInputSource<string>(element?.lineChart?.labelY),
				orientation: element.lineChart?.orientation,
				title: mapInputSource<string>(element?.lineChart?.title),
				data: this.mapRepeatableGroup(element?.lineChart?.data, data => {
					return {
						id: data?.id,
						valueField: data?.valueField,
						color: data?.color,
						seriesName: data?.seriesName,
						labelIsNumeration: data?.labelIsNumeration,
					};
				}),
			},
			borderProperties: this.mapBorderProperties(element?.borderProperties),
			textProperties: this.mapInputSourceTextProperties(element?.textProperties),
		};
	}

	private mapBarChart(element: ModelAPI.BarChart): GeneratedDTO.ElementDefinitionsDTO {
		return {
			id: element.id,
			type: element.type,
			barChart: {
				id: element?.barChart?.id,
				model: element?.barChart?.model,
				basePath: element?.barChart?.basePath,
				dimensions: {
					id: element?.barChart?.dimensions?.id,
					height: mapMeasure(element?.barChart?.dimensions.height),
					width: mapMeasure(element?.barChart?.dimensions.width),
				},
				labelX: mapInputSource<string>(element?.barChart?.labelX),
				labelY: mapInputSource<string>(element?.barChart?.labelY),
				orientation: element?.barChart?.orientation,
				title: mapInputSource<string>(element?.barChart?.title),
				data: this.mapRepeatableGroup(element?.barChart?.data, data => {
					return {
						id: data?.id,
						valueField: data?.valueField,
						keyField: data?.keyField,
						color: data?.color,
						labelIsNumeration: data?.labelIsNumeration,
						seriesName: data?.seriesName,
					};
				}),
			},
			borderProperties: this.mapBorderProperties(element?.borderProperties),
			textProperties: this.mapInputSourceTextProperties(element?.textProperties),
		};
	}

	private mapTableLayout(element: ModelAPI.TableLayout): GeneratedDTO.ElementDefinitionsDTO {
		return {
			id: element.id,
			type: element.type,
			tableLayout: {
				id: element?.tableLayout?.id,
				columnCount: element?.tableLayout?.columnCount,
				rowCount: element?.tableLayout?.rowCount,
				columnProperties: this.mapRepeatableGroup(element?.tableLayout?.columnProperties, props => {
					return {
						id: props?.id,
						index: props?.index,
						verticalAlignment: props?.verticalAlignment,
						width: mapMeasureInputSource(props?.width),
					};
				}),
				rowProperties: this.mapRepeatableGroup(element?.tableLayout?.rowProperties, props => {
					return {
						id: props?.id,
						index: props?.index,
						minHeight: mapMeasureInputSource(props?.minHeight),
					};
				}),
				cells: this.mapRepeatableGroup(element?.tableLayout?.cells, cell => {
					return {
						id: cell?.id,
						refId: cell?.refId,
						column: cell?.column,
						row: cell?.row,
					};
				}),
			},
			borderProperties: this.mapBorderProperties(element?.borderProperties),
		};
	}

	private mapTable(element: ModelAPI.Table): GeneratedDTO.ElementDefinitionsDTO {
		return {
			id: element.id,
			type: element.type,
			table: {
				id: element?.table?.id,
				model: element?.table?.model,
				basePath: element?.table?.basePath,
				filterExpression: element?.table?.filterExpression,
				headerTextProperties: this.mapInputSourceTextProperties(element?.table?.headerTextProperties),
				maxRowCount: mapInputSource(element?.table?.maxRowCount),
				sumLabel: mapInputSource(element?.table?.sumLabel),
				hideHeader: element?.table?.hideHeader,
				columns: this.mapRepeatableGroup(element?.table?.columns, column => {
					return {
						id: column?.id,
						refId: column?.refId,
						hasCustomTextProperties: column?.hasCustomTextProperties,
						headerLabelHidden: column?.headerLabelHidden,
						label: mapInputSource(column?.label),
						sumColumn: column?.sumColumn,
						width: mapMeasureInputSource(column?.width),
					};
				}),
			},
			borderProperties: this.mapBorderProperties(element?.borderProperties),
			textProperties: this.mapInputSourceTextProperties(element?.textProperties),
		};
	}

	private mapListing(element: ModelAPI.Listing): GeneratedDTO.ElementDefinitionsDTO {
		return {
			id: element.id,
			type: element.type,
			listing: {
				id: element?.listing?.id,
				model: element?.listing?.model,
				basePath: element?.listing?.basePath,
				headerTextProperties: this.mapInputSourceTextProperties(element?.listing?.headerTextProperties),
				showRepeatedGroupEntries: element?.listing?.showRepeatedGroupEntries,
				hideHeader: element?.listing?.hideHeader,
				columns: this.mapRepeatableGroup(element?.listing?.columns, this.mapListingColumn),
				rowPropertyComputations: this.mapRepeatableGroup(element?.listing?.rowPropertyComputations, comp => {
					return {
						id: comp.id,
						property: comp?.property,
						computationAlternatives: this.mapRepeatableGroup(
							comp?.computationAlternatives,
							mapComputationAlternative
						),
					};
				}),
				groupPropertyComputations: this.mapRepeatableGroup(
					element?.listing?.groupPropertyComputations,
					comp => {
						return {
							id: comp.id,
							property: comp?.property,
							groupPath: comp?.groupPath,
							computationAlternatives: this.mapRepeatableGroup(
								comp?.computationAlternatives,
								this.mapRequiredComputationAlternative
							),
						};
					}
				),
			},
			borderProperties: this.mapBorderProperties(element?.borderProperties),
			textProperties: this.mapInputSourceTextProperties(element?.textProperties),
		};
	}

	private mapListingColumn(element: ModelAPI.ListingColumn): GeneratedDTO.ColumnsDTO_1 {
		return {
			id: element.id,
			label: mapInputSource(element?.label),
			width: mapMeasureInputSource(element?.width),
			...(element.default && {
				default: {
					id: element.default.id,
					propertyComputations: this.mapRepeatableGroup(
						element.default.propertyComputations,
						this.mapPropertyComputations
					),
					valueComputationAlternatives: this.mapRepeatableGroup(
						element.default.valueComputationAlternatives,
						mapComputationAlternative
					),
				},
			}),
			...(element.group && {
				group: {
					id: element.group.id,
					propertyComputations: this.mapRepeatableGroup(
						element.group.propertyComputations,
						this.mapPropertyComputations
					),
					valueComputationAlternatives: this.mapRepeatableGroup(
						element.group.valueComputationAlternatives,
						mapComputationAlternative
					),
				},
			}),
			field: this.mapRepeatableGroup(element.field, field => {
				return {
					id: field?.id,
					inputFieldTypeSerialized: field?.inputFieldTypeSerialized,
					outputFieldTypeSerialized: field?.outputFieldTypeSerialized,
					displayOptions: this.mapDisplayOptions(field?.displayOptions),
					propertyComputations: this.mapRepeatableGroup(
						field?.propertyComputations,
						this.mapPropertyComputations
					),
					valueComputationAlternatives: this.mapRepeatableGroup(
						field?.valueComputationAlternatives,
						mapComputationAlternative
					),
				};
			}),
			isSortingIndex: element.isSortingIndex,
			hasCustomTextProperties: element.hasCustomTextProperties,
			hasCustomBorderProperties: element.hasCustomBorderProperties,
			textProperties: this.mapInputSourceTextProperties(element?.textProperties),
			borderProperties: this.mapBorderProperties(element?.borderProperties),
		};
	}

	private mapPropertyComputations(comps: ModelAPI.ColumnPropertyComputations): GeneratedDTO.PropertyComputationsDTO {
		return {
			id: comps?.id,
			property: comps?.property,
			computationAlternatives: this.mapRepeatableGroup(comps?.computationAlternatives, mapComputationAlternative),
		};
	}

	private mapRequiredComputationAlternative(
		comps: Required<ModelAPI.ComputationAlternative>
	): GeneratedDTO.ComputationAlternativesDTO_1 {
		return {
			id: comps?.id,
			operation: comps?.operation,
			precondition: comps?.precondition,
		};
	}
	private mapImage(element: ModelAPI.Image): GeneratedDTO.ElementDefinitionsDTO {
		return {
			id: element.id,
			type: element.type,
			image: {
				id: element?.image?.id,
				imageSrcType: element?.image?.imageSrcType,
				alternativeText: element?.image?.alternativeText,
				dimensions: {
					id: element?.image?.dimensions?.id,
					height: mapMeasure(element?.image?.dimensions?.height),
					originalHeight: mapMeasure(element?.image?.dimensions?.originalHeight),
					width: mapMeasure(element?.image?.dimensions?.width),
					originalWidth: mapMeasure(element?.image?.dimensions?.originalWidth),
				},
				resourceSource: this.mapResourceSource(element.image),
				fieldSource: this.mapFieldSource(element.image),
			},
			borderProperties: this.mapBorderProperties(element?.borderProperties),
			textProperties: this.mapInputSourceTextProperties(element?.textProperties),
		};
	}
	private mapResourceSource(image?: ModelAPI.ImageProperties): GeneratedDTO.ResourceSourceDTO | undefined {
		if (image?.imageSrcType === ModelAPI.ImageSrcType.Static) {
			return {
				id: image?.resourceSource?.id,
				resourceName: image?.resourceSource?.resourceName,
			};
		}
		return undefined;
	}
	private mapFieldSource(image?: ModelAPI.ImageProperties): GeneratedDTO.FieldSourceDTO | undefined {
		if (image?.imageSrcType === ModelAPI.ImageSrcType.Dynamic) {
			return {
				id: image?.fieldSource?.id,
				model: image?.fieldSource?.model,
				path: image?.fieldSource?.path,
			};
		}
		return undefined;
	}

	private mapLineElement(element: ModelAPI.Line): GeneratedDTO.ElementDefinitionsDTO {
		return {
			id: element.id,
			type: element.type,
			borderProperties: this.mapBorderProperties(element?.borderProperties),
			textProperties: this.mapInputSourceTextProperties(element?.textProperties),
		};
	}

	private mapExpressionElement(element: ModelAPI.Expression): GeneratedDTO.ElementDefinitionsDTO {
		return {
			id: element.id,
			type: element.type,
			expression: {
				id: element?.expression?.id,
				model: element?.expression?.model,
				basePath: element?.expression?.basePath,
				text: element?.expression?.text,
				hideIfEmpty: element?.expression?.hideIfEmpty,
			},
			textProperties: this.mapInputSourceTextProperties(element?.textProperties),
			borderProperties: this.mapBorderProperties(element?.borderProperties),
		};
	}

	private mapCalculationElement(element: ModelAPI.Calculation): GeneratedDTO.ElementDefinitionsDTO {
		return {
			id: element.id,
			type: element.type,
			calculation: {
				id: element?.calculation?.id,
				model: element?.calculation?.model,
				name: element?.calculation?.name,
				computationAlternatives: this.mapRepeatableGroup(element?.calculation?.computationAlternatives, c => {
					return {
						id: c.id,
						operation: c.operation,
						precondition: c.precondition,
					};
				}),
				displayOptions: this.mapDisplayOptions(element?.calculation?.displayOptions),
				fieldType: element.calculation?.fieldType
					? {
							id: element.calculation?.fieldType?.id,
							fieldType: element.calculation?.fieldType?.fieldType,
							typeDefinition: element.calculation?.fieldType?.typeDefinition,
						}
					: undefined,
			},
		};
	}

	private mapFieldElement(element: ModelAPI.Field): GeneratedDTO.ElementDefinitionsDTO {
		return {
			id: element.id,
			type: element.type,
			field: {
				id: element?.field?.id,
				model: element?.field?.model,
				path: element?.field?.path,
				displayOptions: this.mapDisplayOptions(element?.field?.displayOptions),
			},
			textProperties: this.mapInputSourceTextProperties(element?.textProperties),
			borderProperties: this.mapBorderProperties(element?.borderProperties),
		};
	}

	private mapTextElement(element: ModelAPI.Text): GeneratedDTO.ElementDefinitionsDTO {
		return {
			id: element.id,
			type: element.type,
			text: {
				id: element?.text?.id,
				text: element?.text?.text,
				entities: this.mapRepeatableGroup(element?.text?.entities, e => {
					return {
						id: e.id,
						refId: e.refId,
					};
				}),
				hideIfEmpty: element?.text?.hideIfEmpty,
			},
			textProperties: this.mapInputSourceTextProperties(element?.textProperties),
			borderProperties: this.mapBorderProperties(element?.borderProperties),
		};
	}

	private mapBoundingBoxElement(element: ModelAPI.BoundingBox): GeneratedDTO.ElementDefinitionsDTO {
		return {
			id: element.id,
			type: element.type,
			boundingBox: {
				id: element.boundingBox?.id,
				dimensions: {
					id: element.boundingBox?.dimensions?.id,
					height: mapMeasure(element.boundingBox?.dimensions?.height),
					width: mapMeasure(element.boundingBox?.dimensions?.width),
				},
				elementReferences: this.mapRepeatableGroup(
					element.boundingBox?.elementReferences,
					this.mapElementReference
				),
			},
			borderProperties: this.mapBorderProperties(element?.borderProperties),
		};
	}

	private mapOverrideElement(element: ModelAPI.Override): GeneratedDTO.ElementDefinitionsDTO {
		return {
			id: element.id,
			type: element.type,
			override: {
				id: element.override.id,
				refId: element.override.refId,
				overrideType: element.override.overrideType,
				source: {
					id: element.override?.source?.id,
					sourceType: element.override?.source?.sourceType,
					referenceType: element.override?.source?.referenceType,
					referenceElementId: element.override?.source?.referenceElementId,
				},
				boundingBox: {
					id: element.override?.boundingBox?.id,
					elementReferences: this.mapRepeatableGroup(
						element.override?.boundingBox?.elementReferences,
						this.mapElementReference
					),
				},
			},
		};
	}

	private mapAreaElement(element: ModelAPI.Area): GeneratedDTO.ElementDefinitionsDTO {
		return {
			id: element.id,
			type: element.type,
			area: {
				id: element.area?.id,
				dimensions: {
					id: element.area?.dimensions?.id,
					height: mapMeasure(element.area?.dimensions?.height),
					width: mapMeasure(element.area?.dimensions?.width),
					overflowHeight: mapMeasure(element.area.dimensions?.overflowHeight),
				},
				elementReferences: this.mapRepeatableGroup(element.area?.elementReferences, this.mapElementReference),
				dataContexts: this.mapRepeatableGroup(element.area?.dataContexts, mapDataContext),
			},
			borderProperties: this.mapBorderProperties(element?.borderProperties),
		};
	}

	private mapSwitchElement(element: ModelAPI.Switch): GeneratedDTO.ElementDefinitionsDTO {
		return {
			id: element.id,
			type: element.type,
			switch: {
				id: element.switch?.id,
				name: element.switch?.name,
				model: element.switch?.model,
				dimensions: {
					id: element.switch?.dimensions?.id,
					height: mapMeasure(element.switch?.dimensions?.height),
					width: mapMeasure(element.switch?.dimensions?.width),
				},
				cases: this.mapRepeatableGroup(element.switch?.cases, switchCase => ({
					id: switchCase?.id,
					precondition: switchCase?.precondition,
					refId: switchCase?.refId,
				})),
			},
		};
	}

	private mapElementReference(ref: ModelAPI.PlaceableReference): GeneratedDTO.ElementReferencesDTO {
		return {
			id: ref?.id,
			refId: ref?.refId,
			position: {
				id: ref?.position?.id,
				x: mapMeasure(ref?.position?.x),
				y: mapMeasure(ref?.position?.y),
			},
			dimensions: {
				id: ref?.dimensions?.id,
				minHeight: mapMeasure(ref?.dimensions?.minHeight),
				minWidth: mapMeasure(ref?.dimensions?.minWidth),
			},
			margins: ref.margins
				? {
						id: ref.margins.id,
						top: ref.margins.top ? mapMargin(ref.margins.top) : undefined,
						bottom: ref.margins.bottom ? mapMargin(ref.margins.bottom) : undefined,
					}
				: undefined,
			screenReadingOrder: ref?.screenReadingOrder,
			hideConditions: this.mapRepeatableGroup(ref?.hideConditions, cond => {
				return {
					id: cond?.id,
					precondition: cond?.precondition,
				};
			}),
			pageBreakBehavior: mapInputSource<ModelAPI.PageBreakBehavior>(ref.pageBreakBehavior),
		};
	}

	private mapDisplayOptions(options?: ModelAPI.DisplayOptions): GeneratedDTO.DisplayOptionsDTO | undefined {
		if (options) {
			return {
				id: options.id,
				checkboxChecked: options.checkboxChecked,
				checkboxUnchecked: options.checkboxUnchecked,
				dateFormat: options.dateFormat,
				dateRangeFormatEnd: options.dateRangeFormatEnd,
				dateRangeFormatStart: options.dateRangeFormatStart,
				dateRangeDelimiter: options.dateRangeDelimiter,
				displayType: options.displayType,
				suffix: options.suffix !== "" && options.suffix !== undefined ? `#${options.suffix}#` : options.suffix,
			};
		}
		return undefined;
	}

	private mapBorderProperties(props?: ModelAPI.BorderProperties): GeneratedDTO.BorderPropertiesDTO | undefined {
		if (props) {
			return {
				id: props.id,
				borderStyle: props.borderStyle,
				borderWidth: props.borderWidth,
				borderColor: props.borderColor,
			};
		}
		return undefined;
	}

	private mapInputSourceTextProperties(
		props?: ModelAPI.TextProperties
	): GeneratedDTO.HeaderTextPropertiesDTO | undefined {
		if (props) {
			return {
				id: props.id,
				textStyleId: mapInputSource(props.textStyleId),
				bold: mapInputSource(props.bold),
				italic: mapInputSource(props.italic),
				underlined: mapInputSource(props.underlined),
				alignment: mapInputSource(props.alignment),
				color: mapInputSource(props.color),
				backgroundColor: mapInputSource(props.backgroundColor),
			};
		}
		return undefined;
	}

	private mapRepeatableGroup = <I, O>(
		repeatableGroup: readonly I[] | undefined,
		serializer: (item: I, index: number) => O
	): O[] => {
		return repeatableGroup?.map((item, index) => serializer.call(this, item, index)) || [];
	};
}
