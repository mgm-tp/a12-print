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
import unionWith from "lodash/unionWith.js";

import { EntityInstancePath } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import {
	Localizable,
	LocalizableArgs,
	resolvePlaceholders,
} from "@com.mgmtp.a12.utils/utils-localization/lib/main/index.js";

import { ExtendedEntityInstancePath } from "./extended-entity-instance-path.js";

export interface PrintError {
	jsonPath: EntityInstancePath;
	errorCode: string;
	severity: keyof typeof ErrorSeverity;
	parameters?: {
		[key: string]: string | undefined;
	};
	errorMessage: Localizable[];
	origin: keyof typeof ErrorOrigin;
	refId?: string;
}

export namespace PrintError {
	export function isInstance(instance: object | unknown): instance is PrintError {
		if (
			typeof instance === "object" &&
			instance !== null &&
			"jsonPath" in instance &&
			"errorCode" in instance &&
			"severity" in instance &&
			"errorMessage" in instance &&
			"origin" in instance
		) {
			return true;
		}
		return false;
	}

	export function isEqual(a: PrintError, b: PrintError) {
		if (
			EntityInstancePath.equals(a.jsonPath, b.jsonPath) &&
			a.errorCode === b.errorCode &&
			a.severity === b.severity &&
			a.refId === b.refId
		) {
			return true;
		}
		return false;
	}
}

export enum ErrorOrigin {
	DESERIALIZER = "DESERIALIZER",
	SERIALIZER = "SERIALIZER",
	VALIDATOR = "VALIDATOR",
}

export enum ErrorSeverity {
	ERROR = "@error",
	WARNING = "@warning",
	INFO = "@info",
}
export type PrintErrorMap = Record<ErrorSeverity, PrintError[]>;

export type DeepPartialErrorMap<T> = {
	-readonly [K in keyof T]?: T[K] extends DeepPartialErrorMap<unknown>
		? T[K]
		: T[K] extends ReadonlyArray<infer U>
			? Array<DeepPartialErrorMap<U>>
			: T[K] extends ReadonlyArray<infer U> | undefined
				? Array<DeepPartialErrorMap<U>> | undefined
				: DeepPartialErrorMap<T[K]>;
} & PrintErrorMap & {
		["@id"]?: string;
		["@type"]?: string;
	};

export namespace DeepPartialErrorMap {
	export function isInstance<T>(instance: object | unknown): instance is DeepPartialErrorMap<T> {
		if (
			typeof instance === "object" &&
			instance !== null &&
			Object.values(ErrorSeverity).every(severity => Object.keys(instance).includes(severity))
		) {
			return true;
		}
		return false;
	}

	export function isPropertyKey(keyString: string): boolean {
		return [...Object.values(ErrorSeverity), "@id", "@type"].includes(keyString);
	}

	export function getErrorsAtPath<T, B>(
		map: DeepPartialErrorMap<T>,
		path: ExtendedEntityInstancePath,
		severity: keyof typeof ErrorSeverity
	): PrintError[] {
		if (path.length > 0) {
			const nextElement = path[0];
			const key = nextElement.elementName as keyof T;

			if (map[key]) {
				return getErrorsAtPath(
					nextElement.isRepeatable
						? (map[key] as DeepPartialErrorMap<B>[])[nextElement.index]
						: (map[key] as DeepPartialErrorMap<B>),
					path.slice(1),
					severity
				);
			} else {
				return [];
			}
		}

		return map[ErrorSeverity[severity]];
	}

	/**
	 * Merges every error, warning or info from errorMapB into errorMapA
	 *
	 * @param errorMapA ErrorMap to merge into
	 * @param errorMapB ErrorMap to merge from
	 */
	export function mergeErrorMaps<T, B>(errorMapA: DeepPartialErrorMap<T>, errorMapB: DeepPartialErrorMap<T>) {
		for (const severity of Object.values(ErrorSeverity)) {
			errorMapA[severity].push(...errorMapB[severity]);
		}

		for (const keyString of Object.keys(errorMapB)) {
			const key = keyString as keyof T;
			if (!isPropertyKey(keyString)) {
				if (errorMapA[key] && Array.isArray(errorMapA[key]) && Array.isArray(errorMapB[key])) {
					const errorArrayA = errorMapA[key] as DeepPartialErrorMap<B>[];
					const errorArrayB = errorMapB[key] as DeepPartialErrorMap<B>[];

					for (let i = 0; i < Math.min(errorArrayA.length, errorArrayB.length); i++) {
						mergeErrorMaps(errorArrayA[i], errorArrayB[i]);
					}
					if (errorArrayB.length <= errorArrayA.length) {
						continue;
					}
					for (let i = errorArrayA.length; i < errorArrayB.length; i++) {
						errorArrayA.push(errorArrayB[i]);
					}
				} else if (errorMapA[key]) {
					mergeErrorMaps(errorMapA[key] as DeepPartialErrorMap<B>, errorMapB[key] as DeepPartialErrorMap<B>);
				} else {
					errorMapA[key] = errorMapB[key];
				}
			}
		}
	}

	export function getEmptyMap<T>() {
		return {
			[ErrorSeverity.ERROR]: [] as PrintError[],
			[ErrorSeverity.WARNING]: [] as PrintError[],
			[ErrorSeverity.INFO]: [] as PrintError[],
		} as DeepPartialErrorMap<T>;
	}

	export function pushAtPath<T, B>(map: DeepPartialErrorMap<T>, path: ExtendedEntityInstancePath, error: PrintError) {
		let copy = { ...map };
		copy[ErrorSeverity[error.severity]]?.push(error);
		if (path.length < 1) {
			return copy;
		}
		const key = path[0].elementName as keyof T;
		const isRepeatable = path[0].isRepeatable;
		const index = path[0].index;

		if (!isRepeatable && copy[key] === undefined) {
			copy = { ...copy, [key]: getEmptyMap<B>() };
		}

		if (isRepeatable) {
			if (copy[key] === undefined) {
				const emptyRepeatable: DeepPartialErrorMap<B>[] = [];
				for (let i = 0; i < index; i++) {
					emptyRepeatable.push(getEmptyMap<B>());
				}
				copy = { ...copy, [key]: emptyRepeatable };
			} else if ((copy[key] as DeepPartialErrorMap<B>[]).length < index) {
				const repeatable = copy[key] as DeepPartialErrorMap<B>[];
				const delta = index - repeatable.length;
				for (let i = 0; i < delta; i++) {
					repeatable.push(getEmptyMap<B>());
				}
			}
		}

		if (isRepeatable && path.length >= 1) {
			const repeatCopy = [...(copy[key] as DeepPartialErrorMap<B>[])];
			repeatCopy[index - 1] = pushAtPath(repeatCopy[index - 1], path.slice(1), error);
			copy = { ...copy, [key]: repeatCopy };
		} else {
			copy = { ...copy, [key]: pushAtPath(copy[key] as DeepPartialErrorMap<B>, path.slice(1), error) };
		}
		return copy;
	}

	export function extendErrorMapWithId<T, B>(errorMap: DeepPartialErrorMap<T>, apiObject: T) {
		const apiObjectRecord = apiObject as Record<string, unknown>;
		if ("id" in apiObjectRecord && typeof apiObjectRecord["id"] === "string") {
			errorMap["@id"] = apiObjectRecord["id"];
		}
		if ("type" in apiObjectRecord && typeof apiObjectRecord["type"] === "string") {
			errorMap["@type"] = apiObjectRecord["type"];
		}
		for (const key in apiObject) {
			if (isValidErrorMapKey(apiObject, key, errorMap)) {
				if (isArrayErrorMapObject(apiObject, key, errorMap)) {
					const errorMapArray = errorMap[key] as DeepPartialErrorMap<B>[];
					const apiObjectArray = apiObject[key] as unknown as B[];
					for (let i = 0; i < Math.min(errorMapArray.length, apiObjectArray.length); i++) {
						extendErrorMapWithId(errorMapArray[i], apiObjectArray[i]);
					}
				} else {
					extendErrorMapWithId(errorMap[key] as DeepPartialErrorMap<B>, apiObject[key] as unknown as B);
				}
			}
		}
	}

	function isArrayErrorMapObject<T>(
		apiObject: T,
		key: Extract<keyof T, string>,
		errorMap: DeepPartialErrorMap<T>
	): boolean {
		return Array.isArray(errorMap[key]) && Array.isArray(apiObject[key]);
	}
	function isValidErrorMapKey<T>(
		apiObject: T,
		key: Extract<keyof T, string>,
		errorMap: DeepPartialErrorMap<T>
	): boolean {
		return key in errorMap && typeof apiObject[key] === "object";
	}

	/**
	 * Converts an error map into a reduced better readable structure with formatted messages while keeping the original tree structure.
	 * This is useful for debugging or generating readable test snapshots.
	 *
	 * @param errorMap The DeepPartialErrorMap to convert.
	 * @param options Options to control severity levels and error depth.
	 * @returns A readable version of the error map for display or snapshot testing.
	 */
	export function getReadableErrorMap<T>(
		errorMap: DeepPartialErrorMap<T>,
		options: {
			includeSeverity?: ErrorSeverity[];
			onlyDeepestMessages?: boolean;
		} = {
			includeSeverity: [ErrorSeverity.ERROR, ErrorSeverity.WARNING, ErrorSeverity.INFO],
			onlyDeepestMessages: true,
		}
	): Record<string, unknown> {
		function extractArgs(args: LocalizableArgs | undefined): { [key: string]: string | undefined } {
			if (!args) {
				return {};
			}
			const result: Record<string, string | undefined> = {};
			for (const [key, val] of Object.entries(args)) {
				result[key] = String(val.value);
			}
			return result;
		}
		function formatMessage(msg: Localizable): string {
			const template = msg.defaults?.en || msg.defaults?.de || "";
			return resolvePlaceholders(template, extractArgs(msg.args));
		}

		function reduce(map: Record<string, unknown>): Record<string, unknown> {
			const result: Record<string, unknown> = {};
			let childHasMessages = false;

			// handle child properties first
			for (const key of Object.keys(map)) {
				if (isPropertyKey(key)) {
					continue;
				}
				const value = map[key];
				if (Array.isArray(value)) {
					const reduced = value.map(item =>
						typeof item === "object" && item !== null ? reduce(item) : item
					);
					if (reduced.some(item => item && typeof item === "object" && Object.keys(item).length > 0)) {
						result[key] = reduced;
						childHasMessages = true;
					}
				} else if (typeof value === "object" && value !== null) {
					const reduced = reduce(value as Record<string, unknown>);
					if (reduced && Object.keys(reduced).length > 0) {
						result[key] = reduced;
						childHasMessages = true;
					}
				}
			}

			// (optional) skip messages if child properties contained messages
			if (options.onlyDeepestMessages && childHasMessages) {
				return result;
			}

			for (const severity of options.includeSeverity || []) {
				const entries = map[severity];
				if (Array.isArray(entries) && entries.length > 0) {
					result[severity] = entries.map((e: PrintError) => formatMessage(e.errorMessage?.[0]));
				}
			}

			return result;
		}

		return reduce(errorMap);
	}

	/**
	 * Appends content from one errorMap to another through mutation. This is different from merging as it doesn't
	 * overwrite entries and is index-order independent by utilizing Ids. It is intended to use when other validations
	 * (e.g. serialization/deserialization) want to add their errors to the global/partial validation errorMap without
	 * overwriting existing entries.
	 *
	 * @param errorMapA The DeepPartialErrorMap that is appended to.
	 * @param errorMapB The DeepPartialErrorMap that is appending.
	 */
	export function appendErrorMap<T>(errorMapA: DeepPartialErrorMap<T>, errorMapB: DeepPartialErrorMap<T>) {
		for (const key of Object.keys(errorMapB)) {
			if (key === "@info") {
				continue;
			}

			const valueA = errorMapA[key as keyof T];
			const valueB = errorMapB[key as keyof T];

			if (!valueA) {
				// Key doesn't exist in A, so directly append from B
				errorMapA[key as keyof T] = valueB;
				continue;
			}

			if (Array.isArray(valueA) && Array.isArray(valueB)) {
				(errorMapA[key as keyof T] as unknown[]) = handleArrayMerge<T>(valueA, valueB);
			} else if (DeepPartialErrorMap.isInstance(valueA) && DeepPartialErrorMap.isInstance(valueB)) {
				// Recurse into nested error maps
				DeepPartialErrorMap.appendErrorMap(valueA, valueB);
			}
		}
	}

	/**
	 * Removes errors throughout an error map based on a list of Ids. This requires that the error map was previously
	 * extended with Ids. It also cleans up orphaned/widowed errors and empty error maps that don't have any valid
	 * references within the error map anymore.
	 *
	 * @param self The DeepPartialErrorMap to remove errors from.
	 * @param ids A list of ids that are to be removed from the DeepPartialErrorMap.
	 * @returns The mutated error map without the errors specified by the id.
	 */
	export function removeErrorsByIds<T>(self: DeepPartialErrorMap<T>, ids: string[]) {
		const idSet = new Set(ids);

		function deleteErrorsByIds<T>(map: DeepPartialErrorMap<T>) {
			for (const key of Object.keys(map)) {
				const value = map[key as keyof T];

				if (Array.isArray(value)) {
					value.forEach((entry, index) => {
						if (typeof entry === "object" && entry !== null && DeepPartialErrorMap.isInstance(entry)) {
							if (entry["@id"] && idSet.has(entry["@id"])) {
								value[index] = getEmptyMap<T>();
							} else {
								deleteErrorsByIds(entry);
							}
						}
					});
				} else if (typeof value === "object" && value !== null && DeepPartialErrorMap.isInstance(value)) {
					if (value["@id"] && idSet.has(value["@id"])) {
						delete map[key as keyof T];
					} else {
						deleteErrorsByIds(value);
					}
				}
			}
		}
		deleteErrorsByIds(self);
		const indexedMap = indexErrorMapById(self);
		deleteOrphanedErrors(self, indexedMap);

		return self;
	}
}

function deleteOrphanedErrors<T>(
	errorMap: DeepPartialErrorMap<T>,
	indexedMap: Map<string, PrintError[]>,
	collectedOrphans: PrintError[] = []
) {
	Object.values(ErrorSeverity)
		.filter(severity => severity !== ErrorSeverity.INFO)
		.forEach(severity => {
			errorMap[severity] = errorMap[severity].filter(error => {
				const hasReferences = error.refId ? indexedMap.get(error.refId)?.length : false;
				if (!collectedOrphans.includes(error) && hasReferences) {
					return true;
				}
				collectedOrphans.push(error);
				return false;
			});
		});

	Object.values(errorMap).forEach(value => {
		if (Array.isArray(value)) {
			value
				.filter(entry => entry && DeepPartialErrorMap.isInstance(entry))
				.forEach(entry => deleteOrphanedErrors(entry, indexedMap, collectedOrphans));
		} else if (value && DeepPartialErrorMap.isInstance(value)) {
			deleteOrphanedErrors(value, indexedMap, collectedOrphans);
		}
	});
}

function indexErrorMapById<T>(
	errorMap: DeepPartialErrorMap<T>,
	map = new Map<string, PrintError[]>()
): Map<string, PrintError[]> {
	const collectedErrors = Object.values(ErrorSeverity)
		.filter(severity => severity !== ErrorSeverity.INFO)
		.flatMap(severity => errorMap[severity]);

	const id = errorMap["@id"];

	if (id) {
		if (!map.has(id)) {
			map.set(id, []);
		}
		const filteredErrors = collectedErrors.filter(error => error.refId === id);
		map.set(id, unionWith(map.get(id), filteredErrors, PrintError.isEqual));
	}

	Object.values(errorMap).forEach(value => {
		if (Array.isArray(value)) {
			value.forEach(entry => (DeepPartialErrorMap.isInstance(entry) ? indexErrorMapById(entry, map) : []));
		} else if (DeepPartialErrorMap.isInstance(value)) {
			indexErrorMapById(value, map);
		}
	});
	return map;
}

function handleArrayMerge<T>(
	arrayA: PrintError[] | DeepPartialErrorMap<T>[],
	arrayB: PrintError[] | DeepPartialErrorMap<T>[]
): PrintError[] | DeepPartialErrorMap<T>[] {
	const valuesFromB = Object.values(arrayB);

	if (valuesFromB.every(PrintError.isInstance)) {
		return unionWith(arrayA as PrintError[], arrayB as PrintError[], PrintError.isEqual);
	} else if (valuesFromB.every(DeepPartialErrorMap.isInstance<T>)) {
		const indexedMapFromA = new Map<string, number>();
		(arrayA as DeepPartialErrorMap<T>[]).forEach(
			(item, index) => item["@id"] && indexedMapFromA.set(item["@id"], index)
		);

		const missingEntries: DeepPartialErrorMap<T>[] = [];
		valuesFromB.forEach(entry => {
			const id = entry["@id"];
			const indexInA = id ? indexedMapFromA.get(id) : undefined;

			if (indexInA === undefined) {
				missingEntries.push(entry);
			} else {
				DeepPartialErrorMap.appendErrorMap(arrayA[indexInA] as DeepPartialErrorMap<T>, entry);
			}
		});

		(arrayA as DeepPartialErrorMap<T>[]).push(...missingEntries);
		return arrayA;
	} else {
		throw new Error("Error Maps are missaligned - validation couldn't be processed correctly.");
	}
}
