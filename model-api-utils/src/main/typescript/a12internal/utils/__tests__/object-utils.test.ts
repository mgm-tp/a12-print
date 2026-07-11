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
import { removeUndefinedProperties } from "../object-utils.js";

describe("removeUndefinedProperties", () => {
	describe("flat objects", () => {
		it("should remove undefined properties from a flat object", () => {
			const input = {
				name: "test",
				value: undefined,
				count: 42,
			};

			const result = removeUndefinedProperties(input);

			expect(result).toEqual({
				name: "test",
				count: 42,
			});
			expect("value" in result).toBe(false);
		});

		it("should handle objects with all properties undefined", () => {
			const input = {
				a: undefined,
				b: undefined,
				c: undefined,
			};

			const result = removeUndefinedProperties(input);

			expect(result).toEqual({});
			expect(Object.keys(result)).toHaveLength(0);
		});

		it("should handle objects with no undefined properties", () => {
			const input = {
				name: "test",
				count: 42,
				active: true,
			};

			const result = removeUndefinedProperties(input);

			expect(result).toEqual({
				name: "test",
				count: 42,
				active: true,
			});
		});

		it("should preserve null values", () => {
			const input = {
				name: "test",
				nullable: null,
				undefinable: undefined,
			};

			const result = removeUndefinedProperties(input);

			expect(result).toEqual({
				name: "test",
				nullable: null,
			});
			expect(result.nullable).toBeNull();
			expect("undefinable" in result).toBe(false);
		});

		it("should preserve falsy values that are not undefined", () => {
			const input = {
				zero: 0,
				emptyString: "",
				falseBool: false,
				nullValue: null,
				undefinedValue: undefined,
			};

			const result = removeUndefinedProperties(input);

			expect(result).toEqual({
				zero: 0,
				emptyString: "",
				falseBool: false,
				nullValue: null,
			});
			expect("undefinedValue" in result).toBe(false);
		});
	});

	describe("nested objects", () => {
		it("should remove undefined properties from nested objects", () => {
			const input = {
				name: "test",
				nested: {
					foo: "bar",
					baz: undefined,
					deep: {
						a: 1,
						b: undefined,
					},
				},
				value: undefined,
			};

			const result = removeUndefinedProperties(input);

			expect(result).toEqual({
				name: "test",
				nested: {
					foo: "bar",
					deep: {
						a: 1,
					},
				},
			});
			expect("value" in result).toBe(false);
			expect("baz" in result.nested).toBe(false);
			expect("b" in result.nested.deep).toBe(false);
		});

		it("should handle deeply nested objects with multiple undefined values", () => {
			const input = {
				level1: {
					a: "value",
					b: undefined,
					level2: {
						c: "value",
						d: undefined,
						level3: {
							e: "value",
							f: undefined,
							level4: {
								g: "value",
								h: undefined,
							},
						},
					},
				},
			};

			const result = removeUndefinedProperties(input);

			expect(result).toEqual({
				level1: {
					a: "value",
					level2: {
						c: "value",
						level3: {
							e: "value",
							level4: {
								g: "value",
							},
						},
					},
				},
			});
		});

		it("should preserve empty nested objects", () => {
			const input = {
				name: "test",
				emptyObject: {},
				nested: {
					foo: "bar",
					anotherEmpty: {},
				},
			};

			const result = removeUndefinedProperties(input);

			expect(result).toEqual({
				name: "test",
				emptyObject: {},
				nested: {
					foo: "bar",
					anotherEmpty: {},
				},
			});
		});
	});

	describe("arrays", () => {
		it("should handle arrays with objects containing undefined properties", () => {
			const input = {
				items: [
					{ id: 1, name: "first", optional: undefined },
					{ id: 2, name: "second", optional: "value" },
					{ id: 3, name: "third", optional: undefined },
				],
			};

			const result = removeUndefinedProperties(input);

			expect(result).toEqual({
				items: [
					{ id: 1, name: "first" },
					{ id: 2, name: "second", optional: "value" },
					{ id: 3, name: "third" },
				],
			});
		});

		it("should preserve arrays with primitive values", () => {
			const input = {
				numbers: [1, 2, 3],
				strings: ["a", "b", "c"],
				mixed: [1, "two", true, null],
			};

			const result = removeUndefinedProperties(input);

			expect(result).toEqual({
				numbers: [1, 2, 3],
				strings: ["a", "b", "c"],
				mixed: [1, "two", true, null],
			});
		});

		it("should handle empty arrays", () => {
			const input = {
				emptyArray: [],
				value: "test",
			};

			const result = removeUndefinedProperties(input);

			expect(result).toEqual({
				emptyArray: [],
				value: "test",
			});
		});

		it("should handle nested arrays with objects", () => {
			const input = {
				matrix: [
					[
						{ x: 1, y: undefined },
						{ x: 2, y: 3 },
					],
					[
						{ x: 4, y: undefined },
						{ x: 5, y: 6 },
					],
				],
			};

			const result = removeUndefinedProperties(input);

			expect(result).toEqual({
				matrix: [
					[{ x: 1 }, { x: 2, y: 3 }],
					[{ x: 4 }, { x: 5, y: 6 }],
				],
			});
		});

		it("should handle arrays as top-level value", () => {
			const input = [
				{ id: 1, name: "first", optional: undefined },
				{ id: 2, name: "second", optional: "value" },
			];

			const result = removeUndefinedProperties(input);

			expect(result).toEqual([
				{ id: 1, name: "first" },
				{ id: 2, name: "second", optional: "value" },
			]);
		});
	});

	describe("primitive values", () => {
		it("should handle primitive string value", () => {
			const input = "test string";
			const result = removeUndefinedProperties(input);
			expect(result).toBe("test string");
		});

		it("should handle primitive number value", () => {
			const input = 42;
			const result = removeUndefinedProperties(input);
			expect(result).toBe(42);
		});

		it("should handle primitive boolean value", () => {
			const input = true;
			const result = removeUndefinedProperties(input);
			expect(result).toBe(true);
		});

		it("should handle null value", () => {
			const input = null;
			const result = removeUndefinedProperties(input);
			expect(result).toBeNull();
		});

		it("should handle undefined value", () => {
			const input = undefined;
			const result = removeUndefinedProperties(input);
			expect(result).toBeUndefined();
		});
	});

	describe("real-world serializer scenarios", () => {
		it("should handle typesetting model serializer structure", () => {
			const input = {
				header: {
					id: "test-id",
					modelType: "typesetting",
					modelVersion: "1.0",
					annotations: [],
					labels: [],
					locales: [],
					modelReferences: [],
				},
				content: {
					internal: undefined,
					customHyphenationExclusions: [],
					preventLineBreakRules: [],
					orphan: 1,
					widow: 1,
				},
			};

			const result = removeUndefinedProperties(input);

			expect(result).toEqual({
				header: {
					id: "test-id",
					modelType: "typesetting",
					modelVersion: "1.0",
					annotations: [],
					labels: [],
					locales: [],
					modelReferences: [],
				},
				content: {
					customHyphenationExclusions: [],
					preventLineBreakRules: [],
					orphan: 1,
					widow: 1,
				},
			});
			expect("internal" in result.content).toBe(false);
		});

		it("should handle complex nested DTO with multiple undefined values", () => {
			const input = {
				header: {
					id: "123",
					title: undefined,
					author: {
						name: "John Doe",
						contact: undefined,
					},
				},
				content: {
					hyphenation: {
						general: {
							title: "English",
							language: {
								name: "English",
								tag: "en",
							},
							notice: undefined,
							copyright: undefined,
							version: "1.0",
							licence: undefined,
							source: undefined,
							texlive: undefined,
							hyphenmins: undefined,
							authors: [
								{
									name: "Author 1",
									contact: undefined,
								},
								{
									name: "Author 2",
									contact: "author2@example.com",
								},
							],
							checksum: undefined,
						},
						patterns: [],
						exclusions: [],
					},
				},
			};

			const result = removeUndefinedProperties(input);

			expect(result).toEqual({
				header: {
					id: "123",
					author: {
						name: "John Doe",
					},
				},
				content: {
					hyphenation: {
						general: {
							title: "English",
							language: {
								name: "English",
								tag: "en",
							},
							version: "1.0",
							authors: [
								{
									name: "Author 1",
								},
								{
									name: "Author 2",
									contact: "author2@example.com",
								},
							],
						},
						patterns: [],
						exclusions: [],
					},
				},
			});
		});

		it("should handle optional nested structures", () => {
			const input = {
				id: "test",
				optional1: undefined,
				optional2: {
					value: "exists",
					nested: undefined,
				},
				optional3: {
					all: undefined,
					properties: undefined,
					undefined: undefined,
				},
			};

			const result = removeUndefinedProperties(input);

			expect(result).toEqual({
				id: "test",
				optional2: {
					value: "exists",
				},
				optional3: {},
			});
		});
	});

	describe("edge cases", () => {
		it("should handle empty object", () => {
			const input = {};
			const result = removeUndefinedProperties(input);
			expect(result).toEqual({});
		});

		it("should handle object with only undefined properties", () => {
			const input = {
				a: undefined,
				b: undefined,
			};
			const result = removeUndefinedProperties(input);
			expect(result).toEqual({});
		});

		it("should not mutate the original object", () => {
			const input = {
				name: "test",
				value: undefined,
				nested: {
					foo: "bar",
					baz: undefined,
				},
			};

			const inputCopy = JSON.parse(JSON.stringify(input));
			removeUndefinedProperties(input);

			// Original should be unchanged
			expect(input).toEqual(inputCopy);
		});

		it("should handle objects with special characters in keys", () => {
			const input = {
				"normal-key": "value1",
				"key.with.dots": "value2",
				"key with spaces": undefined,
				"key:with:colons": "value3",
				"key/with/slashes": undefined,
			};

			const result = removeUndefinedProperties(input);

			expect(result).toEqual({
				"normal-key": "value1",
				"key.with.dots": "value2",
				"key:with:colons": "value3",
			});
		});

		it("should handle objects with numeric keys", () => {
			const input = {
				0: "zero",
				1: undefined,
				2: "two",
				100: undefined,
			};

			const result = removeUndefinedProperties(input);

			expect(result).toEqual({
				0: "zero",
				2: "two",
			});
		});
	});
});
