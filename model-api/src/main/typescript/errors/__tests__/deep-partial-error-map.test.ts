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
import { DeepPartialErrorMap, ErrorSeverity, PrintError } from "../index.js";

const sampleError: PrintError = {
	jsonPath: [{ elementName: "element", index: 0 }],
	errorCode: "ERROR_CODE",
	severity: "ERROR",
	errorMessage: [{ key: "error.message" }],
	origin: "VALIDATOR",
};

describe("PrintError", () => {
	describe("isInstance", () => {
		test("should return true for a valid PrintError object", () => {
			const validError: PrintError = {
				jsonPath: [{ elementName: "element", index: 0 }],
				errorCode: "ERROR_CODE",
				severity: "ERROR",
				errorMessage: [{ key: "error.message" }],
				origin: "VALIDATOR",
			};
			expect(PrintError.isInstance(validError)).toBe(true);
		});

		test("should return false for an invalid PrintError object", () => {
			const invalidError = {
				jsonPath: [],
				severity: "INVALID_SEVERITY",
				errorMessage: [{ key: "error.message" }],
				origin: "VALIDATOR",
			};
			expect(PrintError.isInstance(invalidError)).toBe(false);
		});
	});

	describe("isEqual", () => {
		test("should return true for two identical PrintError objects", () => {
			const error1: PrintError = {
				jsonPath: [{ elementName: "element", index: 0 }],
				errorCode: "ERROR_CODE",
				severity: "ERROR",
				errorMessage: [{ key: "error.message" }],
				origin: "VALIDATOR",
			};
			const error2: PrintError = {
				jsonPath: [{ elementName: "element", index: 0 }],
				errorCode: "ERROR_CODE",
				severity: "ERROR",
				errorMessage: [{ key: "error.message" }],
				origin: "VALIDATOR",
			};
			expect(PrintError.isEqual(error1, error2)).toBe(true);
		});

		test("should return false for two different PrintError objects", () => {
			const error1: PrintError = {
				jsonPath: [{ elementName: "element", index: 0 }],
				errorCode: "ERROR_CODE_1",
				severity: "ERROR",
				errorMessage: [{ key: "error.message" }],
				origin: "VALIDATOR",
			};
			const error2: PrintError = {
				jsonPath: [{ elementName: "element", index: 0 }],
				errorCode: "ERROR_CODE_2",
				severity: "ERROR",
				errorMessage: [{ key: "error.message" }],
				origin: "VALIDATOR",
			};
			expect(PrintError.isEqual(error1, error2)).toBe(false);
		});
	});
});

describe("DeepPartialErrorMap", () => {
	type WithElement = { element: object };

	const sampleErrorMap: DeepPartialErrorMap<WithElement> = {
		"@error": [],
		"@warning": [],
		"@info": [],
		element: {
			"@error": [sampleError],
			"@warning": [],
			"@info": [],
		},
	};

	const invalidErrorMap = {
		"@error": [
			{
				jsonPath: [],
				severity: "INVALID_SEVERITY",
				errorMessage: [{ key: "error.message" }],
				origin: "VALIDATOR",
			},
		],
	};

	describe("isInstance", () => {
		test("should return true for a valid DeepPartialErrorMap object", () => {
			expect(DeepPartialErrorMap.isInstance(sampleErrorMap)).toBe(true);
		});

		test("should return false for an invalid DeepPartialErrorMap object", () => {
			expect(DeepPartialErrorMap.isInstance(invalidErrorMap)).toBe(false);
		});
	});

	describe("isPropertyKey", () => {
		test("should return true for valid property keys", () => {
			expect(DeepPartialErrorMap.isPropertyKey("@error")).toBe(true);
			expect(DeepPartialErrorMap.isPropertyKey("@warning")).toBe(true);
			expect(DeepPartialErrorMap.isPropertyKey("@info")).toBe(true);
			expect(DeepPartialErrorMap.isPropertyKey("@id")).toBe(true);
			expect(DeepPartialErrorMap.isPropertyKey("@type")).toBe(true);
		});

		test("should return false for invalid property keys", () => {
			expect(DeepPartialErrorMap.isPropertyKey("invalidKey")).toBe(false);
			expect(DeepPartialErrorMap.isPropertyKey("@invalid")).toBe(false);
		});
	});

	describe("getErrorsAtPath", () => {
		test("should return errors at a valid path", () => {
			const entityInstancePath = [{ elementName: "element", index: 0, isRepeatable: false }];
			const errors = DeepPartialErrorMap.getErrorsAtPath(sampleErrorMap, entityInstancePath, "ERROR");
			expect(errors).toEqual([sampleError]);
		});
	});

	describe("mergeErrorMaps", () => {
		test("merges flat error arrays from mapB into mapA", () => {
			const mapA = DeepPartialErrorMap.getEmptyMap<object>();
			const mapB: DeepPartialErrorMap<object> = { "@error": [sampleError], "@warning": [], "@info": [] };
			DeepPartialErrorMap.mergeErrorMaps(mapA, mapB);
			expect(mapA["@error"]).toEqual([sampleError]);
		});

		test("recursively merges nested error maps", () => {
			const otherError: PrintError = { ...sampleError, errorCode: "OTHER_CODE" };
			const mapA: DeepPartialErrorMap<WithElement> = {
				"@error": [],
				"@warning": [],
				"@info": [],
				element: { "@error": [sampleError], "@warning": [], "@info": [] },
			};
			const mapB: DeepPartialErrorMap<WithElement> = {
				"@error": [],
				"@warning": [],
				"@info": [],
				element: { "@error": [otherError], "@warning": [], "@info": [] },
			};
			DeepPartialErrorMap.mergeErrorMaps(mapA, mapB);
			expect(mapA.element?.["@error"]).toEqual([sampleError, otherError]);
		});
	});

	describe("getEmptyErrorMap", () => {
		test("returns an empty error map", () => {
			const emptyErrorMap = DeepPartialErrorMap.getEmptyMap();
			expect(emptyErrorMap).toEqual({
				"@error": [],
				"@warning": [],
				"@info": [],
			});
		});
	});

	describe("pushAtPath", () => {
		test("pushes error at root when path is empty", () => {
			const map = DeepPartialErrorMap.getEmptyMap<object>();
			const result = DeepPartialErrorMap.pushAtPath(map, [], sampleError);
			expect(result["@error"]).toContain(sampleError);
		});

		test("pushes error at root and at the nested non-repeatable element", () => {
			const map = DeepPartialErrorMap.getEmptyMap<WithElement>();
			const path = [{ elementName: "element", index: 0, isRepeatable: false }];
			const result = DeepPartialErrorMap.pushAtPath(map, path, sampleError);
			expect(result["@error"]).toContain(sampleError);
			expect(result.element?.["@error"]).toContain(sampleError);
		});
	});

	describe("extendErrorMapWithId", () => {
		test("sets @id from the apiObject id property", () => {
			const map = DeepPartialErrorMap.getEmptyMap<{ id: string }>();
			DeepPartialErrorMap.extendErrorMapWithId(map, { id: "test-id" });
			expect(map["@id"]).toBe("test-id");
		});

		test("sets @type from the apiObject type property", () => {
			const map = DeepPartialErrorMap.getEmptyMap<{ type: string }>();
			DeepPartialErrorMap.extendErrorMapWithId(map, { type: "TestType" });
			expect(map["@type"]).toBe("TestType");
		});

		test("does not set @id when apiObject has no id property", () => {
			const map = DeepPartialErrorMap.getEmptyMap<{ name: string }>();
			DeepPartialErrorMap.extendErrorMapWithId(map, { name: "test" });
			expect(map["@id"]).toBeUndefined();
		});
	});

	describe("getReadableErrorMap", () => {
		const errorWithMessage: PrintError = {
			jsonPath: [],
			errorCode: "CODE",
			severity: "ERROR",
			errorMessage: [{ key: "test", defaults: { en: "Test error message" } }],
			origin: "VALIDATOR",
		};

		test("returns empty object for an empty error map", () => {
			const map = DeepPartialErrorMap.getEmptyMap<object>();
			expect(DeepPartialErrorMap.getReadableErrorMap(map)).toEqual({});
		});

		test("formats error messages using defaults.en", () => {
			const map: DeepPartialErrorMap<object> = {
				"@error": [errorWithMessage],
				"@warning": [],
				"@info": [],
			};
			const result = DeepPartialErrorMap.getReadableErrorMap(map, {
				includeSeverity: [ErrorSeverity.ERROR],
				onlyDeepestMessages: false,
			});
			expect(result["@error"]).toEqual(["Test error message"]);
		});

		test("omits parent messages when onlyDeepestMessages is true and a child has messages", () => {
			const childError: PrintError = { ...errorWithMessage, errorCode: "CHILD" };
			const map: DeepPartialErrorMap<WithElement> = {
				"@error": [errorWithMessage],
				"@warning": [],
				"@info": [],
				element: {
					"@error": [childError],
					"@warning": [],
					"@info": [],
				},
			};
			const result = DeepPartialErrorMap.getReadableErrorMap(map, {
				includeSeverity: [ErrorSeverity.ERROR],
				onlyDeepestMessages: true,
			});
			expect(result["@error"]).toBeUndefined();
			expect((result["element"] as Record<string, unknown>)["@error"]).toEqual(["Test error message"]);
		});
	});

	describe("appendErrorMap", () => {
		test("does not duplicate errors when appending identical errors", () => {
			const mapA: DeepPartialErrorMap<object> = { "@error": [sampleError], "@warning": [], "@info": [] };
			const mapB: DeepPartialErrorMap<object> = { "@error": [sampleError], "@warning": [], "@info": [] };
			DeepPartialErrorMap.appendErrorMap(mapA, mapB);
			expect(mapA["@error"]).toHaveLength(1);
		});

		test("does not append @info entries from mapB", () => {
			const infoError: PrintError = { ...sampleError, severity: "INFO" };
			const mapA: DeepPartialErrorMap<object> = { "@error": [], "@warning": [], "@info": [] };
			const mapB: DeepPartialErrorMap<object> = { "@error": [], "@warning": [], "@info": [infoError] };
			DeepPartialErrorMap.appendErrorMap(mapA, mapB);
			expect(mapA["@info"]).toHaveLength(0);
		});
	});

	describe("removeErrorsById", () => {
		test("replaces a nested array entry with an empty map when its @id matches", () => {
			type WithItems = { items: object[] };
			const itemId = "item-1";
			const itemMap: DeepPartialErrorMap<object> = {
				"@id": itemId,
				"@error": [],
				"@warning": [],
				"@info": [],
			};
			const errorMap: DeepPartialErrorMap<WithItems> = {
				"@error": [],
				"@warning": [],
				"@info": [],
				items: [itemMap],
			};
			DeepPartialErrorMap.removeErrorsByIds(errorMap, [itemId]);
			const items = errorMap.items;
			expect(items?.[0]["@id"]).toBeUndefined();
			expect(items?.[0]["@error"]).toEqual([]);
		});

		test("removes errors whose refId points to a deleted entity", () => {
			type WithChild = { child: object };
			const childId = "child-1";
			const refError: PrintError = { ...sampleError, refId: childId };
			const childMap: DeepPartialErrorMap<object> = {
				"@id": childId,
				"@error": [refError],
				"@warning": [],
				"@info": [],
			};
			const errorMap: DeepPartialErrorMap<WithChild> = {
				"@error": [refError],
				"@warning": [],
				"@info": [],
				child: childMap,
			};
			DeepPartialErrorMap.removeErrorsByIds(errorMap, [childId]);
			expect(errorMap["@error"]).toHaveLength(0);
		});

		test("does nothing when id is not found in the map", () => {
			const refError: PrintError = { ...sampleError, refId: "keep-me" };
			const map: DeepPartialErrorMap<object> = {
				"@id": "keep-me",
				"@error": [refError],
				"@warning": [],
				"@info": [],
			};
			DeepPartialErrorMap.removeErrorsByIds(map, ["nonexistent-id"]);
			expect(map["@error"]).toHaveLength(1);
			expect(map["@id"]).toBe("keep-me");
		});

		test("removes errors from non-array nested objects", () => {
			type WithNested = { nested: { inner: object } };
			const nestedId = "nested-1";
			const nestedMap: DeepPartialErrorMap<{ inner: object }> = {
				"@id": nestedId,
				"@error": [],
				"@warning": [],
				"@info": [],
			};
			const errorMap: DeepPartialErrorMap<WithNested> = {
				"@error": [],
				"@warning": [],
				"@info": [],
				nested: nestedMap,
			};
			DeepPartialErrorMap.removeErrorsByIds(errorMap, [nestedId]);
			expect(errorMap.nested).toBeUndefined();
		});
	});

	describe("getErrorsAtPath (edge cases)", () => {
		test("returns errors for a repeatable element path", () => {
			type WithItems = { items: object[] };
			const itemError: PrintError = { ...sampleError, errorCode: "ITEM_ERROR" };
			const itemMap: DeepPartialErrorMap<object> = {
				"@error": [itemError],
				"@warning": [],
				"@info": [],
			};
			const map: DeepPartialErrorMap<WithItems> = {
				"@error": [],
				"@warning": [],
				"@info": [],
				items: [itemMap],
			};
			const path = [{ elementName: "items", index: 0, isRepeatable: true }];
			const errors = DeepPartialErrorMap.getErrorsAtPath(map, path, "ERROR");
			expect(errors).toEqual([itemError]);
		});

		test("returns empty array when key does not exist in map", () => {
			const map = DeepPartialErrorMap.getEmptyMap<{ missing: object }>();
			const path = [{ elementName: "missing", index: 0, isRepeatable: false }];
			const errors = DeepPartialErrorMap.getErrorsAtPath(map, path, "ERROR");
			expect(errors).toEqual([]);
		});

		test("returns errors at deeply nested path", () => {
			type WithDeep = { level1: { level2: object } };
			const deepError: PrintError = { ...sampleError, errorCode: "DEEP" };
			const map: DeepPartialErrorMap<WithDeep> = {
				"@error": [],
				"@warning": [],
				"@info": [],
				level1: {
					"@error": [],
					"@warning": [],
					"@info": [],
					level2: {
						"@error": [deepError],
						"@warning": [],
						"@info": [],
					},
				},
			};
			const path = [
				{ elementName: "level1", index: 0, isRepeatable: false },
				{ elementName: "level2", index: 0, isRepeatable: false },
			];
			const errors = DeepPartialErrorMap.getErrorsAtPath(map, path, "ERROR");
			expect(errors).toEqual([deepError]);
		});
	});

	describe("mergeErrorMaps (edge cases)", () => {
		test("merges array entries element-by-element", () => {
			type WithItems = { items: object[] };
			const errorA: PrintError = { ...sampleError, errorCode: "A" };
			const errorB: PrintError = { ...sampleError, errorCode: "B" };
			const mapA: DeepPartialErrorMap<WithItems> = {
				"@error": [],
				"@warning": [],
				"@info": [],
				items: [{ "@error": [errorA], "@warning": [], "@info": [] }],
			};
			const mapB: DeepPartialErrorMap<WithItems> = {
				"@error": [],
				"@warning": [],
				"@info": [],
				items: [{ "@error": [errorB], "@warning": [], "@info": [] }],
			};
			DeepPartialErrorMap.mergeErrorMaps(mapA, mapB);
			const items = mapA.items;
			expect(items?.[0]["@error"]).toEqual([errorA, errorB]);
		});

		test("appends extra array entries from mapB when mapB is longer", () => {
			type WithItems = { items: object[] };
			const errorB: PrintError = { ...sampleError, errorCode: "B" };
			const mapA: DeepPartialErrorMap<WithItems> = {
				"@error": [],
				"@warning": [],
				"@info": [],
				items: [],
			};
			const mapB: DeepPartialErrorMap<WithItems> = {
				"@error": [],
				"@warning": [],
				"@info": [],
				items: [{ "@error": [errorB], "@warning": [], "@info": [] }],
			};
			DeepPartialErrorMap.mergeErrorMaps(mapA, mapB);
			const items = mapA.items;
			expect(items).toHaveLength(1);
			expect(items?.[0]["@error"]).toEqual([errorB]);
		});

		test("assigns key from mapB when key does not exist in mapA", () => {
			type WithChild = { child: object };
			const childError: PrintError = { ...sampleError, errorCode: "CHILD" };
			const mapA: DeepPartialErrorMap<WithChild> = {
				"@error": [],
				"@warning": [],
				"@info": [],
			};
			const mapB: DeepPartialErrorMap<WithChild> = {
				"@error": [],
				"@warning": [],
				"@info": [],
				child: { "@error": [childError], "@warning": [], "@info": [] },
			};
			DeepPartialErrorMap.mergeErrorMaps(mapA, mapB);
			expect(mapA.child?.["@error"]).toEqual([childError]);
		});
	});

	describe("pushAtPath (edge cases)", () => {
		test("pushes error at repeatable element path with index", () => {
			type WithItems = { items: object[] };
			const map = DeepPartialErrorMap.getEmptyMap<WithItems>();
			const path = [{ elementName: "items", index: 2, isRepeatable: true }];
			const result = DeepPartialErrorMap.pushAtPath(map, path, sampleError);
			const items = result.items;
			expect(items).toBeDefined();
			// index is 2, pushAtPath creates intermediate empty maps up to index-1
			expect(items?.[1]["@error"]).toContain(sampleError);
		});

		test("creates intermediate empty maps for repeatable path", () => {
			type WithItems = { items: object[] };
			const map = DeepPartialErrorMap.getEmptyMap<WithItems>();
			const path = [{ elementName: "items", index: 3, isRepeatable: true }];
			const result = DeepPartialErrorMap.pushAtPath(map, path, sampleError);
			const items = result.items;
			// Creates empty maps for indices 0 and 1, error at index 2 (index-1)
			expect(items?.length).toBeGreaterThanOrEqual(2);
		});

		test("extends existing repeatable array when index exceeds length", () => {
			type WithItems = { items: object[] };
			const existingMap: DeepPartialErrorMap<WithItems> = {
				"@error": [],
				"@warning": [],
				"@info": [],
				items: [{ "@error": [], "@warning": [], "@info": [] }],
			};
			const path = [{ elementName: "items", index: 3, isRepeatable: true }];
			const result = DeepPartialErrorMap.pushAtPath(existingMap, path, sampleError);
			const items = result.items;
			expect(items?.length).toBeGreaterThan(1);
		});
	});

	describe("extendErrorMapWithId (edge cases)", () => {
		test("recursively extends ids for nested array objects", () => {
			type WithItems = { items: { id: string }[] };
			const itemMap: DeepPartialErrorMap<{ id: string }> = {
				"@error": [],
				"@warning": [],
				"@info": [],
			};
			const errorMap: DeepPartialErrorMap<WithItems> = {
				"@error": [],
				"@warning": [],
				"@info": [],
				items: [itemMap],
			};
			const apiObject: WithItems = { items: [{ id: "item-id-1" }] };
			DeepPartialErrorMap.extendErrorMapWithId(errorMap, apiObject);
			const items = errorMap.items as DeepPartialErrorMap<{ id: string }>[];
			expect(items[0]["@id"]).toBe("item-id-1");
		});

		test("recursively extends ids for nested non-array objects", () => {
			type WithChild = { child: { id: string } };
			const childMap: DeepPartialErrorMap<{ id: string }> = {
				"@error": [],
				"@warning": [],
				"@info": [],
			};
			const errorMap: DeepPartialErrorMap<WithChild> = {
				"@error": [],
				"@warning": [],
				"@info": [],
				child: childMap,
			};
			const apiObject: WithChild = { child: { id: "child-id-1" } };
			DeepPartialErrorMap.extendErrorMapWithId(errorMap, apiObject);
			expect((errorMap.child as DeepPartialErrorMap<{ id: string }>)["@id"]).toBe("child-id-1");
		});
	});

	describe("appendErrorMap (edge cases)", () => {
		test("appends new warnings from mapB to mapA", () => {
			const warningError: PrintError = { ...sampleError, severity: "WARNING" };
			const mapA: DeepPartialErrorMap<object> = { "@error": [], "@warning": [], "@info": [] };
			const mapB: DeepPartialErrorMap<object> = { "@error": [], "@warning": [warningError], "@info": [] };
			DeepPartialErrorMap.appendErrorMap(mapA, mapB);
			expect(mapA["@warning"]).toHaveLength(1);
			expect(mapA["@warning"][0]).toEqual(warningError);
		});

		test("recursively appends nested error maps", () => {
			type WithChild = { child: object };
			const childError: PrintError = { ...sampleError, errorCode: "NESTED" };
			const mapA: DeepPartialErrorMap<WithChild> = {
				"@error": [],
				"@warning": [],
				"@info": [],
				child: { "@error": [], "@warning": [], "@info": [] },
			};
			const mapB: DeepPartialErrorMap<WithChild> = {
				"@error": [],
				"@warning": [],
				"@info": [],
				child: { "@error": [childError], "@warning": [], "@info": [] },
			};
			DeepPartialErrorMap.appendErrorMap(mapA, mapB);
			expect(mapA?.child?.["@error"]).toEqual([childError]);
		});

		test("handles array merge by id matching", () => {
			type WithItems = { items: object[] };
			const errorA: PrintError = { ...sampleError, errorCode: "A" };
			const errorB: PrintError = { ...sampleError, errorCode: "B" };
			const mapA: DeepPartialErrorMap<WithItems> = {
				"@error": [],
				"@warning": [],
				"@info": [],
				items: [{ "@id": "shared-id", "@error": [errorA], "@warning": [], "@info": [] }],
			};
			const mapB: DeepPartialErrorMap<WithItems> = {
				"@error": [],
				"@warning": [],
				"@info": [],
				items: [{ "@id": "shared-id", "@error": [errorB], "@warning": [], "@info": [] }],
			};
			DeepPartialErrorMap.appendErrorMap(mapA, mapB);
			const items = mapA.items;
			expect(items).toHaveLength(1);
			expect(items?.[0]["@error"]).toContain(errorA);
			expect(items?.[0]["@error"]).toContain(errorB);
		});

		test("appends key from mapB when it does not exist in mapA", () => {
			type WithChild = { child: object };
			const childError: PrintError = { ...sampleError, errorCode: "NEW" };
			const mapA: DeepPartialErrorMap<WithChild> = {
				"@error": [],
				"@warning": [],
				"@info": [],
			};
			const mapB: DeepPartialErrorMap<WithChild> = {
				"@error": [],
				"@warning": [],
				"@info": [],
				child: { "@error": [childError], "@warning": [], "@info": [] },
			};
			DeepPartialErrorMap.appendErrorMap(mapA, mapB);
			expect(mapA?.child?.["@error"]).toEqual([childError]);
		});
	});

	describe("getReadableErrorMap (edge cases)", () => {
		test("formats messages with argument placeholders", () => {
			const errorWithArgs: PrintError = {
				jsonPath: [],
				errorCode: "CODE",
				severity: "ERROR",
				errorMessage: [
					{
						key: "test",
						defaults: { en: "Value is 42" },
					},
				],
				origin: "VALIDATOR",
			};
			const map: DeepPartialErrorMap<object> = {
				"@error": [errorWithArgs],
				"@warning": [],
				"@info": [],
			};
			const result = DeepPartialErrorMap.getReadableErrorMap(map, {
				includeSeverity: [ErrorSeverity.ERROR],
				onlyDeepestMessages: false,
			});
			expect(result["@error"]).toEqual(["Value is 42"]);
		});

		test("includes multiple severity levels", () => {
			const errorMsg: PrintError = {
				jsonPath: [],
				errorCode: "ERR",
				severity: "ERROR",
				errorMessage: [{ key: "e", defaults: { en: "Error msg" } }],
				origin: "VALIDATOR",
			};
			const warningMsg: PrintError = {
				jsonPath: [],
				errorCode: "WARN",
				severity: "WARNING",
				errorMessage: [{ key: "w", defaults: { en: "Warning msg" } }],
				origin: "VALIDATOR",
			};
			const map: DeepPartialErrorMap<object> = {
				"@error": [errorMsg],
				"@warning": [warningMsg],
				"@info": [],
			};
			const result = DeepPartialErrorMap.getReadableErrorMap(map, {
				includeSeverity: [ErrorSeverity.ERROR, ErrorSeverity.WARNING],
				onlyDeepestMessages: false,
			});
			expect(result["@error"]).toEqual(["Error msg"]);
			expect(result["@warning"]).toEqual(["Warning msg"]);
		});

		test("handles arrays in readable map output", () => {
			type WithItems = { items: object[] };
			const itemError: PrintError = {
				jsonPath: [],
				errorCode: "ITEM",
				severity: "ERROR",
				errorMessage: [{ key: "i", defaults: { en: "Item error" } }],
				origin: "VALIDATOR",
			};
			const map: DeepPartialErrorMap<WithItems> = {
				"@error": [],
				"@warning": [],
				"@info": [],
				items: [{ "@error": [itemError], "@warning": [], "@info": [] }],
			};
			const result = DeepPartialErrorMap.getReadableErrorMap(map, {
				includeSeverity: [ErrorSeverity.ERROR],
				onlyDeepestMessages: true,
			});
			expect(result["items"]).toBeDefined();
			const items = result["items"] as Record<string, unknown>[];
			expect(items[0]["@error"]).toEqual(["Item error"]);
		});
	});
});
