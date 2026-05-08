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
import { nanoid } from "nanoid";
import get from "lodash/get.js";

import {
	InputSource,
	MeasureInputSource,
	MeasureUnit,
	PartialPrintModelElement,
	PrintModelEntity,
} from "../model/index.js";
import { DeepPartialRecursive } from "../utils/type-utils.js";
import { PRINT_MODEL_METADATA_MAP } from "../generated/print-model-metadata-map.js";

import { findPropertyPathsInObject } from "./utils.js";
import { PossibleInputSource } from "./input-source.js";
import { InputValueSourceResolver } from "./input-source-resolver.js";

export class InputSourceGenerator {
	public static generateInputSource<T extends PartialPrintModelElement>(path: string, ignoreGroups?: string[]) {
		const elementProperties = get(PRINT_MODEL_METADATA_MAP.RootGroup.content.elementDefinitions, path);
		let inputSourcePaths = findPropertyPathsInObject(elementProperties, "source");
		inputSourcePaths = inputSourcePaths.map(element => `${path}.${element}`);
		if (ignoreGroups?.length) {
			inputSourcePaths = inputSourcePaths.filter(
				inputSource => !ignoreGroups?.some(element => inputSource.includes(element))
			);
		}
		return this.generateInputSourcesForGroup<T>(inputSourcePaths);
	}

	public static createInputSourceForElement<T>(
		property: string
	): DeepPartialRecursive<InputSource<T>> & PrintModelEntity {
		return {
			id: nanoid(),
			source: InputValueSourceResolver.hasValueForInputSourceDefault(property)
				? PossibleInputSource.DEFAULT
				: PossibleInputSource.UNSET,
			path: `/content/elementDefinitions/${property.replace(/\./g, "/")}/value/`,
		};
	}

	public static generateInputSourcesForGroup<T extends PrintModelEntity>(inputSourcePaths: string[]): T {
		// eslint-disable-next-line  @typescript-eslint/no-explicit-any
		const inputSourceMap: Record<string, any> = { id: nanoid() };
		for (const propertyPath in inputSourcePaths) {
			const paths = inputSourcePaths[propertyPath].split(".");
			let current = inputSourceMap;
			for (let i = 0; i < paths.length - 1; i++) {
				const key = paths[i];
				if (!current[key]) {
					current[key] = { id: nanoid() };
				}
				current = current[key];
			}
			// createInputSourceForElement for last part of the path
			const lastKey = paths.at(-1)!;
			current[lastKey] = this.createInputSourceForElement<unknown>(inputSourcePaths[propertyPath]);
		}
		return inputSourceMap as T;
	}

	public static upgradeToMeasureInputSource(
		inputSource: DeepPartialRecursive<InputSource<number>> & PrintModelEntity,
		unit: MeasureUnit
	): DeepPartialRecursive<MeasureInputSource> & PrintModelEntity {
		return {
			...inputSource,
			unit,
		};
	}
}
