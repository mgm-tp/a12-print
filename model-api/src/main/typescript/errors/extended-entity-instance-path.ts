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
import type { ModelPath } from "@com.mgmtp.a12.base/base-model-api";
import type { EntityInstancePath, DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

export type ExtendedEntityInstancePath = {
	readonly elementName: string;
	readonly index: number;
	readonly isRepeatable: boolean;
}[];

export namespace ExtendedEntityInstancePath {
	export function extendEntityInstancePath(path: EntityInstancePath, documentModel: DocumentModel) {
		let currentGroup = documentModel.content.modelRoot as DocumentModel.Group;
		const extendedPath: ExtendedEntityInstancePath = [];

		for (let i = 0; i < path.length; i++) {
			const pathElement = path[i];
			const nextElement = currentGroup.elements.find(e => e.name === pathElement.elementName);
			if (nextElement === undefined || (nextElement.type === "Field" && i !== path.length - 1)) {
				throw `could not resolve ${path.map(p => p.elementName).join(".")} in the DocumentModel`;
			}
			extendedPath.push({
				elementName: pathElement.elementName,
				index: pathElement.index,
				isRepeatable: nextElement.type === "Group" && nextElement.repeatability > 1,
			});
			currentGroup = nextElement as DocumentModel.Group;
		}
		return extendedPath;
	}
}

export class ExtendedEntityInstancePathBuilder {
	public static ROOT_PATH: ExtendedEntityInstancePathBuilder = new ExtendedEntityInstancePathBuilder();

	private segments: ExtendedEntityInstancePath;

	constructor(initial?: ExtendedEntityInstancePath) {
		this.segments = initial ? [...initial] : [];
	}

	public with(elementName: string, index?: number): ExtendedEntityInstancePathBuilder {
		return new ExtendedEntityInstancePathBuilder([
			...this.segments,
			ExtendedEntityInstancePathBuilder.createPathElement(elementName, index),
		]);
	}

	public append(elementName: string, index?: number): this {
		this.segments.push(ExtendedEntityInstancePathBuilder.createPathElement(elementName, index));
		return this;
	}

	public toArray(): ExtendedEntityInstancePath {
		return [...this.segments];
	}

	public toString(): string {
		return this.segments.map(seg => `${seg.elementName}[${seg.index}]`).join(".");
	}

	public toModelPath(): ModelPath {
		return this.segments.map(({ elementName }) => ({ elementName }));
	}

	public toEntityInstancePath(): EntityInstancePath {
		return this.segments.map(({ elementName, index }) => ({ elementName, index }));
	}

	public clone(): ExtendedEntityInstancePathBuilder {
		return new ExtendedEntityInstancePathBuilder(this.toArray());
	}

	public static fromArray(segments: ExtendedEntityInstancePath): ExtendedEntityInstancePathBuilder {
		return new ExtendedEntityInstancePathBuilder(segments);
	}

	public static createPathElement(elementName: string, index?: number): ExtendedEntityInstancePath[number] {
		return {
			elementName,
			index: (index || 0) + 1,
			isRepeatable: index !== undefined,
		};
	}
}
