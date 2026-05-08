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
	BorderStyle,
	ElementType,
	MeasureUnit,
	PageOrientation,
	PartialBoundingBox,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { getBoundingOverrideElements } from "../din-template-utils.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function runSagaSteps<TReturn>(saga: Generator<any, TReturn, unknown>, stepValues: unknown[]): TReturn {
	let step = saga.next();
	for (const val of stepValues) {
		expect(step.value).toMatchObject({ type: "SELECT" });
		step = saga.next(val);
	}
	return step.value;
}

describe("din template utils", () => {
	const templateBoundingBoxElements: PartialBoundingBox[] = [
		{
			id: "BlueBox",
			type: ElementType.BoundingBox,
			boundingBox: {
				id: "ID_468ffedb-c4ac-4953-80df-718ee90f2024B",
				dimensions: {
					id: "ID_6c55dfd0-b6ab-4603-963f-3dc9d0cf4099B",
					width: {
						id: "ID_8c0da75b-2856-4e4a-953c-90c7e3761ab7",
						value: 96,
						unit: MeasureUnit.Millimeter,
					},
					height: {
						id: "ID_01391d82-199a-438c-96ee-a968c10f1697",
						value: 50,
						unit: MeasureUnit.Millimeter,
					},
				},
				elementReferences: [
					{
						hideConditions: [],
						id: "ID_f6e15bb8-9627-488b-87f0-1c673a0adf0eBG",
						refId: "GreenBox",
						position: {
							id: "ID_77109cdf-45ea-41e2-a2b6-4ea560ca8c38BG",
							x: {
								id: "ID_13a209a9-46cb-4106-88ca-604b7d4ddf65",
								value: 2,
								unit: MeasureUnit.Millimeter,
							},
							y: {
								id: "ID_6e722874-c492-4654-80e9-2fc9bf78c178",
								value: 2,
								unit: MeasureUnit.Millimeter,
							},
						},
						dimensions: {
							id: "ID_86449fd4-ab1e-4a28-ba7c-50fb02930620BG",
							minWidth: {
								id: "ID_e3c86fd0-9cf1-44e1-95f2-a39ccec57f3d",
								value: 12,
								unit: MeasureUnit.Millimeter,
							},
							minHeight: {
								id: "ID_900be54d-e84d-4d68-b1f5-9b599c2b7d3e",
								value: 12,
								unit: MeasureUnit.Millimeter,
							},
						},
						screenReadingOrder: {
							id: "ID_98604870-f8e7-40cf-862f-b6ff3b458e3cBG",
							screenReadingOrderWeight: 0,
						},
					},
				],
			},
			borderProperties: {
				id: "ID_8366d6ca-3e26-4451-a1eb-049961fb1109B",
				borderWidth: 0.75,
				borderStyle: BorderStyle.Solid,
				borderColor: "#57d5ff",
			},
		},
		{
			id: "GreenBox",
			type: ElementType.BoundingBox,
			boundingBox: {
				id: "ID_468ffedb-c4ac-4953-80df-718ee90f2024G",
				dimensions: {
					id: "ID_86449fd4-ab1e-4a28-ba7c-50fb02930620BG",
					width: {
						id: "ID_1ec2f013-3cf0-4a25-8d7c-b936812ca780",
						value: 43,
						unit: MeasureUnit.Millimeter,
					},
					height: {
						id: "ID_9d165d06-5e7a-405b-a0e2-fdd4688c747b",
						value: 35,
						unit: MeasureUnit.Millimeter,
					},
				},
				elementReferences: [],
			},
			borderProperties: {
				id: "ID_8366d6ca-3e26-4451-a1eb-049961fb1109G",
				borderWidth: 0.75,
				borderStyle: BorderStyle.Solid,
				borderColor: "#1CE86E",
			},
		},
		{
			id: "YellowBox",
			type: ElementType.BoundingBox,
			boundingBox: {
				id: "ID_468ffedb-c4ac-4953-80df-718ee90f2024Y",
				dimensions: {
					id: "ID_6c55dfd0-b6ab-4603-963f-3dc9d0cf4099Y",
					width: {
						id: "ID_82a49a9c-60f7-4db6-b571-8bbd68d5b2e7",
						value: 96,
						unit: MeasureUnit.Millimeter,
					},
					height: {
						id: "ID_2d80570a-4865-4fd2-964f-23cce7394543",
						value: 50,
						unit: MeasureUnit.Millimeter,
					},
				},
				elementReferences: [],
			},
			borderProperties: {
				id: "ID_8366d6ca-3e26-4451-a1eb-049961fb1109Y",
				borderWidth: 0.75,
				borderStyle: BorderStyle.Solid,
				borderColor: "#ffd557",
			},
		},
	];
	const currentOverrideElements: PartialBoundingBox[] = [];

	describe("getBoundingOverrideElements", () => {
		it("should create complete override elements and set referenceID correctly", () => {
			const generator = getBoundingOverrideElements(
				"segId",
				{
					segmentId: "0",
					segmentTitle: "Title",
					printModelId: "ModelId",
					pageOrientation: PageOrientation.Landscape,
				},
				"ReferenceIdString",
				false
			);

			const result = runSagaSteps(generator, [templateBoundingBoxElements, currentOverrideElements]);

			expect(result).toEqual([
				{
					id: expect.any(String),
					override: {
						boundingBox: {
							elementReferences: [
								{
									dimensions: {
										id: expect.any(String),
										minHeight: {
											id: "ID_900be54d-e84d-4d68-b1f5-9b599c2b7d3e",
											value: 12,
											unit: MeasureUnit.Millimeter,
										},
										minWidth: {
											id: "ID_e3c86fd0-9cf1-44e1-95f2-a39ccec57f3d",
											value: 12,
											unit: MeasureUnit.Millimeter,
										},
									},
									hideConditions: [],
									id: expect.any(String),
									position: {
										id: "ID_77109cdf-45ea-41e2-a2b6-4ea560ca8c38BG",
										x: {
											id: "ID_13a209a9-46cb-4106-88ca-604b7d4ddf65",
											value: 2,
											unit: MeasureUnit.Millimeter,
										},
										y: {
											id: "ID_6e722874-c492-4654-80e9-2fc9bf78c178",
											value: 2,
											unit: MeasureUnit.Millimeter,
										},
									},
									refId: expect.any(String),
									screenReadingOrder: {
										id: "ID_98604870-f8e7-40cf-862f-b6ff3b458e3cBG",
										screenReadingOrderWeight: 0,
									},
								},
							],
							id: expect.any(String),
						},
						id: expect.any(String),
						overrideType: "BoundingBox",
						refId: "BlueBox",
						source: {
							id: expect.any(String),
							referenceElementId: "ReferenceIdString",
							referenceType: "Segment",
							sourceType: "Reference",
						},
					},
					type: "Override",
				},
				{
					id: expect.any(String),
					override: {
						boundingBox: {
							elementReferences: [],
							id: expect.any(String),
						},
						id: expect.any(String),
						overrideType: "BoundingBox",
						refId: "GreenBox",
						source: {
							id: expect.any(String),
							referenceElementId: "ReferenceIdString",
							referenceType: "Segment",
							sourceType: "Reference",
						},
					},
					type: "Override",
				},
				{
					id: expect.any(String),
					override: {
						boundingBox: {
							elementReferences: [],
							id: expect.any(String),
						},
						id: expect.any(String),
						overrideType: "BoundingBox",
						refId: "YellowBox",
						source: {
							id: expect.any(String),
							referenceElementId: "ReferenceIdString",
							referenceType: "Segment",
							sourceType: "Reference",
						},
					},
					type: "Override",
				},
			]);

			expect(result[0].override?.boundingBox?.elementReferences?.[0].refId).toEqual(result[1].id);
		});

		it("should create OverrideElement from BoundingBox", () => {
			const templateBoundingBoxElements2: PartialBoundingBox[] = [
				{
					id: "ExampleBox",
					type: ElementType.BoundingBox,
					boundingBox: {
						id: "ID_468ffedb-c4ac-4953-80df-718ee90f2024G",
						dimensions: {
							id: "ID_86449fd4-ab1e-4a28-ba7c-50fb02930620BG",
							width: {
								id: "ID_1ec2f013-3cf0-4a25-8d7c-b936812ca780",
								value: 43,
								unit: MeasureUnit.Millimeter,
							},
							height: {
								id: "ID_9d165d06-5e7a-405b-a0e2-fdd4688c747b",
								value: 35,
								unit: MeasureUnit.Millimeter,
							},
						},
						elementReferences: [],
					},
					borderProperties: {
						id: "ID_8366d6ca-3e26-4451-a1eb-049961fb1109G",
						borderWidth: 0.75,
						borderStyle: BorderStyle.Solid,
						borderColor: "#1CE86E",
					},
				},
			];

			const elements = getBoundingOverrideElements(
				"segId",
				{
					segmentId: "0",
					segmentTitle: "Title",
					printModelId: "ModelId",
					pageOrientation: PageOrientation.Landscape,
				},
				"ReferenceIdString",
				false
			);
			const result = runSagaSteps(elements, [templateBoundingBoxElements2, currentOverrideElements]);

			expect(result).toEqual([
				{
					id: expect.any(String),
					type: "Override",
					override: {
						boundingBox: {
							elementReferences: [],
							id: expect.any(String),
						},
						id: expect.any(String),
						overrideType: "BoundingBox",
						refId: "ExampleBox",
						source: {
							id: expect.any(String),
							referenceElementId: "ReferenceIdString",
							referenceType: "Segment",
							sourceType: "Reference",
						},
					},
				},
			]);
		});

		it("should not change anything on empty boundingBoxElements", () => {
			const templateBoundingBoxElements2: PartialBoundingBox[] = [];

			const elements = getBoundingOverrideElements(
				"segId",
				{
					segmentId: "0",
					segmentTitle: "Title",
					printModelId: "ModelId",
					pageOrientation: PageOrientation.Landscape,
				},
				"ReferenceIdString",
				false
			);

			const result = runSagaSteps(elements, [templateBoundingBoxElements2, currentOverrideElements]);

			expect(result).toEqual([]);
		});
	});
});
