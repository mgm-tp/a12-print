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
import { Annotation } from "@com.mgmtp.a12.base/base-model-api/lib/main/header/index.js";

import { ElementMapEntry } from "../types/document-model-data.js";

export namespace DocumentModelEnhancements {
	export function getDocumentModelEnhancements(elementMapEntry: ElementMapEntry, documentModelId: string) {
		const documentModelEnhancements: string[] = [];
		MetadataEnhancements.enhancePathWithMetadata(elementMapEntry, documentModelEnhancements);
		EnumFieldEnhancements.enhancePathWitEnumFieldInstanceInformation(
			elementMapEntry,
			documentModelId,
			documentModelEnhancements
		);
		AnnotationEnhancements.enhancePathWithAnnotations(elementMapEntry, documentModelEnhancements);

		return documentModelEnhancements;
	}
}

export namespace MetadataEnhancements {
	const generalMetadata = ["required", "externalDescription", "path"];
	const groupMetadata = ["repeatability"];
	const fieldMetadata = ["label"];
	const enumFieldMetadata = ["errorMessage"];

	export function enhancePathWithMetadata(elementMapEntry: ElementMapEntry, paths: string[]) {
		const path = elementMapEntry.elementPath;
		const staticMetadataBaseGroup = getStaticBasePath(path, "metadata");
		generalMetadata.forEach(fieldName => paths.push(getFieldPath(staticMetadataBaseGroup, fieldName)));
		if (elementMapEntry.isGroup) {
			groupMetadata.forEach(fieldName => paths.push(getFieldPath(staticMetadataBaseGroup, fieldName)));
		} else {
			fieldMetadata.forEach(fieldName => paths.push(getFieldPath(staticMetadataBaseGroup, fieldName)));

			if (
				elementMapEntry.element.type === "Field" &&
				elementMapEntry.element.fieldType.type === "EnumerationType"
			) {
				enumFieldMetadata.forEach(fieldName => paths.push(getFieldPath(staticMetadataBaseGroup, fieldName)));
			}
		}

		return paths;
	}
}

export namespace EnumFieldEnhancements {
	const enumFieldInstanceInformation = ["text"];
	export function enhancePathWitEnumFieldInstanceInformation(
		elementMapEntry: ElementMapEntry,
		documentModelId: string,
		paths: string[]
	) {
		const path = elementMapEntry.elementPath;
		if (elementMapEntry.element.type === "Field" && elementMapEntry.element.fieldType.type === "EnumerationType") {
			enumFieldInstanceInformation.forEach(fieldName => paths.push(`${documentModelId}${path}_${fieldName}`));
		}
	}
}

export namespace AnnotationEnhancements {
	export function enhancePathWithAnnotations(elementMapEntry: ElementMapEntry, paths: string[]) {
		const path = elementMapEntry.elementPath;
		const annotations: Annotation[] | undefined = elementMapEntry.element.annotations;

		if (annotations) {
			const annotationsBaseGroup = getStaticBasePath(path, "annotations");

			annotations.forEach(annotation => {
				paths.push(getFieldPath(annotationsBaseGroup, sanitize(annotation.name)));
			});
		}
	}
}

function getStaticBasePath(path: string, rootGroup: string) {
	return `${rootGroup}${path}/`;
}

function getFieldPath(baseGroup: string, fieldName: string) {
	return `${baseGroup}${fieldName}`;
}

function sanitize(id: string) {
	return id.replace(/[^_a-zA-Z0-9]/g, "_");
}
