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
import type { ElementMapEntry } from "../../types/index.js";
import type { DataContextEntry } from "../../types/data-context.js";

import { ElementMapUtils } from "../element-map-utils.js";

describe("element map utils", () => {
	const elementMap: ElementMapEntry[] = [
		{
			elementPath: "path/to/element/1",
			isGroup: false,
			isSubOfRepeatable: false,
			element: {
				type: "Field",
				fieldType: {
					type: "BooleanType",
				},
				id: "0",
				name: "element",
			},
		},
	];
	const elementMapRepeatable: ElementMapEntry[] = [
		{
			elementPath: "path/to/element/1",
			isGroup: false,
			isSubOfRepeatable: false,
			repeatability: 2,
			element: {
				type: "Field",
				fieldType: {
					type: "BooleanType",
				},
				id: "0",
				name: "element",
			},
		},
	];

	const elementMapRepeatable1: ElementMapEntry[] = [
		{
			elementPath: "path/to/element/1",
			isGroup: false,
			isSubOfRepeatable: false,
			repeatability: 1,
			element: {
				type: "Field",
				fieldType: {
					type: "BooleanType",
				},
				id: "0",
				name: "element",
			},
		},
	];

	const elementMapRepeatable1Instance: ElementMapEntry[] = [
		{
			elementPath: "path/to/element/1",
			isGroup: false,
			isSubOfRepeatable: false,
			repeatability: 1,
			treeOptions: {
				isInstance: true,
			},
			element: {
				type: "Field",
				fieldType: {
					type: "BooleanType",
				},
				id: "0",
				name: "element",
			},
		},
	];

	const elementMapRepeatableGroup: ElementMapEntry[] = [
		{
			elementPath: "path/to/element/1",
			isGroup: false,
			isSubOfRepeatable: false,
			repeatability: 2,
			element: {
				type: "Group",
				repeatability: 2,
				id: "0",
				name: "element",
				elements: [],
			},
		},
	];

	let dataContext: DataContextEntry[] = [
		{
			group: "path/to/element/1",
			isInstance: false,
		},
	];

	const dataContextParent: DataContextEntry[] = [
		{
			group: "path/to/element/1/more",
			isInstance: false,
		},
	];

	const dataContext2: DataContextEntry[] = [
		{
			group: "path/to/element/2",
			isInstance: false,
		},
	];

	const dataContextInstance: DataContextEntry[] = [
		{
			group: "path/to/element/1",
			isInstance: true,
		},
	];

	const dataContext2Instance: DataContextEntry[] = [
		{
			group: "path/to/element/2",
			isInstance: true,
		},
	];

	const dataContextChild: DataContextEntry[] = [
		{
			group: "path/to/element/1/child",
			isInstance: false,
		},
	];

	describe("createEntriesFromDataContext", () => {
		it("should not change if path matches and not is instance", () => {
			const result = ElementMapUtils.createEntriesFromDataContext(elementMap, dataContext);
			expect(result).toEqual(elementMap);
		});

		it("should return nothing if path dont matches and not is instance", () => {
			const result = ElementMapUtils.createEntriesFromDataContext(elementMap, dataContext2);
			expect(result).toEqual([]);
		});

		it("should add treeOptions to child", () => {
			const result = ElementMapUtils.createEntriesFromDataContext(elementMap, dataContextChild);

			const elementWithTreeOptions = elementMap[0];
			elementWithTreeOptions.treeOptions = { disabled: true };
			expect(result).toEqual([elementWithTreeOptions]);
		});

		it("should remove if is instance and not subpath", () => {
			const result = ElementMapUtils.createEntriesFromDataContext(elementMap, dataContext2Instance);
			expect(result).toEqual([]);
		});

		it("should add instance if repeatability >= 2", () => {
			const result: ElementMapEntry[] = ElementMapUtils.createEntriesFromDataContext(
				elementMapRepeatable,
				dataContextInstance
			);
			expect(result.length).toEqual(1);
			expect(result[0].repeatability).toEqual(1);
			expect(result[0].treeOptions?.isInstance).toEqual(true);
			expect(result[0].element).toEqual({
				type: "Field",
				fieldType: { type: "BooleanType" },
				id: "0",
				name: "element",
			});
		});

		it("should return elementMap if instance and repeatability < 2", () => {
			const result: ElementMapEntry[] = ElementMapUtils.createEntriesFromDataContext(
				elementMapRepeatable1,
				dataContextInstance
			);
			expect(result).toEqual(elementMapRepeatable1);
		});

		it("should return elementMap with no repeatibility, if type is group and instance and repeatability >= 2", () => {
			const result: ElementMapEntry[] = ElementMapUtils.createEntriesFromDataContext(
				elementMapRepeatableGroup,
				dataContextInstance
			);
			expect(result.length).toEqual(1);
			expect(result[0].repeatability).toEqual(1);
			expect(result[0].treeOptions?.isInstance).toEqual(true);
			expect(result[0].element).toEqual({
				elements: [],
				id: "0",
				name: "element",
				repeatability: 1,
				type: "Group",
			});
		});

		it("should override if same path", () => {
			const result: ElementMapEntry[] = ElementMapUtils.createEntriesFromDataContext(
				[...elementMapRepeatable1, ...elementMapRepeatable],
				dataContextInstance
			);
			expect(result.length).toEqual(1);
			expect(result[0].repeatability).toEqual(1);
			expect(result[0].treeOptions?.isInstance).toEqual(true);
		});

		it("should disable if same path and parent context", () => {
			const result: ElementMapEntry[] = ElementMapUtils.createEntriesFromDataContext(
				[...elementMapRepeatable1, ...elementMapRepeatable],
				dataContextParent
			);
			expect(result.length).toEqual(1);
			expect(result[0].treeOptions?.disabled).toEqual(true);
			expect(result[0].element).toEqual(elementMapRepeatable1[0].element);
			expect(result[0].repeatability).toEqual(elementMapRepeatable1[0].repeatability);
		});

		it("should ignore if same path", () => {
			const result: ElementMapEntry[] = ElementMapUtils.createEntriesFromDataContext(
				[...elementMapRepeatable1, ...elementMapRepeatable],
				dataContext
			);
			expect(result.length).toEqual(1);
			expect(result).toEqual(elementMapRepeatable1);
		});

		it("should add both if instance and same path", () => {
			const result: ElementMapEntry[] = ElementMapUtils.createEntriesFromDataContext(
				[...elementMapRepeatable1Instance, ...elementMapRepeatable],
				dataContext
			);
			expect(result.length).toEqual(2);
			expect(result).toEqual([...elementMapRepeatable1Instance, ...elementMapRepeatable]);
		});
	});

	describe("getAvailableDataContexts", () => {
		it("should ignore if context isInstance", () => {
			const dataContextInstance: DataContextEntry[] = [
				{
					group: "path/to/element/1",
					isInstance: true,
				},
			];

			expect(ElementMapUtils.getAvailableDataContexts(elementMap, dataContextInstance)).toEqual(elementMap);
		});

		it("should ignore same path", () => {
			expect(
				ElementMapUtils.getAvailableDataContexts(
					[
						...elementMap,
						{
							elementPath: "path/to/element/2",
							isGroup: false,
							isSubOfRepeatable: false,
							element: {
								type: "Field",
								fieldType: {
									type: "BooleanType",
								},
								id: "0",
								name: "element",
							},
						},
					],
					dataContext
				)
			).toEqual([
				{
					elementPath: "path/to/element/2",
					isGroup: false,
					isSubOfRepeatable: false,
					element: {
						type: "Field",
						fieldType: {
							type: "BooleanType",
						},
						id: "0",
						name: "element",
					},
				},
			]);
		});

		it("should add treeOptions to parent path", () => {
			dataContext = [
				{
					group: "path/to/element/2/test",
					isInstance: false,
				},
			];

			expect(
				ElementMapUtils.getAvailableDataContexts(
					[
						...elementMap,
						{
							elementPath: "path/to/element/2",
							isGroup: false,
							isSubOfRepeatable: false,
							element: {
								type: "Field",
								fieldType: {
									type: "BooleanType",
								},
								id: "0",
								name: "element",
							},
						},
					],
					dataContext
				)
			).toEqual([
				...elementMap,
				{
					elementPath: "path/to/element/2",
					isGroup: false,
					isSubOfRepeatable: false,
					treeOptions: {
						disabled: true,
					},
					element: {
						type: "Field",
						fieldType: {
							type: "BooleanType",
						},
						id: "0",
						name: "element",
					},
				},
			]);
		});

		it("should not change on different path", () => {
			dataContext = [
				{
					group: "different/path",
					isInstance: false,
				},
			];

			expect(
				ElementMapUtils.getAvailableDataContexts(
					[
						...elementMap,
						{
							elementPath: "path/to/element/2",
							isGroup: false,
							isSubOfRepeatable: false,
							element: {
								type: "Field",
								fieldType: {
									type: "BooleanType",
								},
								id: "0",
								name: "element",
							},
						},
					],
					dataContext
				)
			).toEqual([
				...elementMap,
				{
					elementPath: "path/to/element/2",
					isGroup: false,
					isSubOfRepeatable: false,
					element: {
						type: "Field",
						fieldType: {
							type: "BooleanType",
						},
						id: "0",
						name: "element",
					},
				},
			]);
		});

		it("should not change when no context is provided", () => {
			expect(ElementMapUtils.getAvailableDataContexts(elementMap, [])).toEqual(elementMap);
		});
	});

	describe("setInstance", () => {
		it("should not change if no instance is provided", () => {
			expect(ElementMapUtils.setInstance(elementMap)).toEqual(elementMap);
		});

		it("should not change if element is not a repeatable", () => {
			expect(ElementMapUtils.setInstance(elementMap, "path/to/element/1")).toEqual(elementMap);
		});

		it("should add isInstance and change repeatability on repeatable element", () => {
			expect(
				ElementMapUtils.setInstance(
					[
						{
							elementPath: "path/to/element/1",
							isGroup: false,
							isSubOfRepeatable: false,
							repeatability: 2,
							element: {
								type: "Field",
								fieldType: {
									type: "BooleanType",
								},
								id: "0",
								name: "element",
							},
						},
					],
					"path/to/element/1"
				)
			).toEqual([
				{
					elementPath: "path/to/element/1",
					isGroup: false,
					isSubOfRepeatable: false,
					repeatability: 1,
					treeOptions: {
						isInstance: true,
					},
					element: {
						type: "Field",
						fieldType: {
							type: "BooleanType",
						},
						id: "0",
						name: "element",
					},
				},
			]);
		});

		it("should add isInstance and change repeatability on repeatable group element", () => {
			expect(
				ElementMapUtils.setInstance(
					[
						{
							elementPath: "path/to/element/1",
							isGroup: false,
							isSubOfRepeatable: false,
							repeatability: 2,
							element: {
								type: "Group",
								repeatability: 2,
								id: "0",
								name: "element",
								elements: [],
							},
						},
					],
					"path/to/element/1"
				)
			).toEqual([
				{
					elementPath: "path/to/element/1",
					isGroup: false,
					isSubOfRepeatable: false,
					repeatability: 1,
					treeOptions: {
						isInstance: true,
					},
					element: {
						type: "Group",
						id: "0",
						name: "element",
						repeatability: 1,
						elements: [],
					},
				},
			]);
		});

		it("should not change if path is not matching", () => {
			expect(ElementMapUtils.setInstance(elementMapRepeatable, "path/to/element/more")).toEqual(
				elementMapRepeatable
			);
		});

		it("should not change if repeatability < 2", () => {
			expect(ElementMapUtils.setInstance(elementMapRepeatable1, "path/to/element")).toEqual(
				elementMapRepeatable1
			);
		});
	});

	describe("createSubElementMapEntries", () => {
		const expectedResultDisabled = {
			elementPath: "path/to/element/1",
			isGroup: false,
			isSubOfRepeatable: false,
			repeatability: 1,
			treeOptions: {
				disabled: true,
			},
			element: {
				type: "Field",
				fieldType: {
					type: "BooleanType",
				},
				id: "0",
				name: "element",
			},
		};

		const expectedResultIsInstance = {
			elementPath: "path/to/element/1",
			isGroup: false,
			isSubOfRepeatable: false,
			repeatability: 1,
			treeOptions: {
				isInstance: true,
			},
			element: {
				type: "Field",
				fieldType: {
					type: "BooleanType",
				},
				id: "0",
				name: "element",
			},
		};

		it("should not change if the new path is parent path", () => {
			expect(ElementMapUtils.createSubElementMapEntries(Object.values(elementMap), "path/to", true)).toEqual(
				elementMap
			);
		});

		it("should set isInstance if same path", () => {
			expect(
				ElementMapUtils.createSubElementMapEntries(Object.values(elementMap), "path/to/element/1", true)
			).toEqual([expectedResultIsInstance]);
		});

		it("should set isInstance if same path and update repeatability if group", () => {
			expect(
				ElementMapUtils.createSubElementMapEntries(
					Object.values(elementMapRepeatableGroup),
					"path/to/element/1",
					true
				)
			).toEqual([
				{
					elementPath: "path/to/element/1",
					isGroup: false,
					isSubOfRepeatable: false,
					repeatability: 1,
					treeOptions: {
						isInstance: true,
					},
					element: {
						type: "Group",
						repeatability: 1,
						id: "0",
						name: "element",
						elements: [],
					},
				},
			]);
		});

		it("should disable path if new path is child path", () => {
			expect(
				ElementMapUtils.createSubElementMapEntries(
					Object.values(elementMap),
					"path/to/element/1/with/some/extra/steps",
					true
				)
			).toEqual([expectedResultDisabled]);
		});

		it("should remove element if paths dont match at all", () => {
			expect(
				ElementMapUtils.createSubElementMapEntries(Object.values(elementMap), "different/path", true)
			).toEqual([]);
		});
	});
});
