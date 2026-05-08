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
import { DocumentServiceFactory } from "@com.mgmtp.a12.kernel/kernel-md-facade/lib/main/js/facade.js";
import { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

const documentModelMarshaller = new DocumentServiceFactory().getDocumentModelSerializer();

export function generateAPI(documentModelString: string, apiName: string) {
	const suffix = "DTO";
	const interfaces: Map<string, APIInterface> = new Map();
	const enums: Map<string, APIEnum> = new Map();

	let documentModel: DocumentModel | undefined;
	try {
		documentModel = documentModelMarshaller.deserialize(documentModelString);
	} catch {
		return {
			error: "JSON parse error",
		};
	}

	const { exampleValue } = collectInterfacesAndEnums(
		interfaces,
		enums,
		{ ...documentModel.content.modelRoot, name: apiName },
		suffix
	);

	return {
		result: {
			name: `${apiName}${suffix}`,
			interfaces,
			enums,
			exampleValue,
		},
	};
}

/**
 * Reads a DocumentModel group and extracts potential APIInterfaces and APIEnums
 * @param interfaces Map of found Interfaces
 * @param enums Map of found Enums
 * @param group DocumentModel group to be read
 * @returns APIInterface for the read group
 */
function collectInterfacesAndEnums(
	interfaces: Map<string, APIInterface>,
	enums: Map<string, APIEnum>,
	group: DocumentModel.Group,
	suffix: string
) {
	const members: APIMember[] = [];
	const rootExampleValue: ExampleValueMap = {};
	group.elements.forEach(child => {
		if (child.type === "Group") {
			const childData = collectInterfacesAndEnums(interfaces, enums, child, suffix);
			const isArray = child.repeatability > 1;
			members.push({
				name: child.name,
				type: childData.childInterface.name,
				required: false,
				isArray,
			});

			rootExampleValue[child.name] = isArray ? [childData.exampleValue] : childData.exampleValue;
		} else {
			let type: string;
			let exampleValue: ExampleValue;
			if (child.fieldType.type === "EnumerationType") {
				const enumName = `Enumeration_${capitalize(group.name)}_${capitalize(child.name)}${suffix}`;
				const enumType: APIEnum = {
					name: capitalize(enumName),
					type: "Enum",
					labels: child.fieldType.values.map(enumValue => {
						return {
							key: enumValue.value,
							values: enumValue.label ? enumValue.label : [],
						};
					}),
				};
				type = putIfUnique(enums, enumType, 0);
				exampleValue = enumType.labels[0].key;
			} else {
				type = toPrimitive(child.fieldType);
				exampleValue = primitiveToExampleValue(type);
			}

			members.push({
				name: child.name,
				type,
				required: child.requirednessConfig !== undefined,
				isArray: false,
			});

			rootExampleValue[child.name] = exampleValue;
		}
	});
	let interfaceName = `${group.name === "text" ? "TextElement" : capitalize(group.name)}${suffix}`;
	const groupInterface: APIInterface = {
		name: interfaceName,
		type: "Interface",
		members,
	};

	interfaceName =
		putInputGroupInterfaceIfNotExist(interfaces, group, groupInterface, suffix) ||
		putIfUnique(interfaces, groupInterface, 0);

	return {
		childInterface: {
			...groupInterface,
			name: interfaceName,
		},
		exampleValue: rootExampleValue,
	};
}

/**
 * Capitalizes the first letter of a given string
 * @param string String to be capitalized
 * @returns Capitalized string
 */
function capitalize(string: string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Returns the primitive Typescript type corresponding to the given A12 FieldType
 * @param fieldType A12 Field type
 * @returns primitive Typescript type
 */
function toPrimitive(fieldType: DocumentModel.FieldType): string {
	switch (fieldType.type) {
		case "BooleanType":
		case "ConfirmType":
			return "boolean";
		case "NumberType":
			return "number";
		case "StringType":
			return "string";
		case "CustomFieldType": {
			if (fieldType.name === "PrintDateTimeFormat") {
				return "string";
			}
			throw new Error(`Found unsupported CustomFieldType ${fieldType.name}.`);
		}
		default:
			throw new Error(`Found unsupported fieldType ${fieldType.type}.`);
	}
}

/**
 * Returns an example value for primitive type
 * @param string primitive type
 * @returns example value
 */
function primitiveToExampleValue(type: string): ExampleValue {
	switch (type) {
		case "boolean":
			return true;
		case "number":
			return 0;
		case "string":
			return "string";
		default:
			throw new Error(`Found unsupported primitive type ${type}.`);
	}
}

/**
 * Adds the element to the map if it is not already contained. If there already is a different element
 * with the same name present in the map, the element name gets appended with an incrementing index
 * @param map Map where the element is to be inserted
 * @param element APIElement to be inserted into the map
 * @param increment Current increment index
 * @returns Name of the inserted type, potentially containing the incremented index
 */
function putIfUnique(map: Map<string, APIElement>, element: APIElement, increment: number): string {
	const name = increment > 0 ? `${element.name}_${increment}` : element.name;
	const alreadySaved = map.get(name);
	if (alreadySaved) {
		if (element.type === "Interface" && alreadySaved.type === "Interface") {
			if (isEqualInterface(element, alreadySaved)) {
				return alreadySaved.name;
			}
		} else if (element.type === "Enum" && alreadySaved.type === "Enum") {
			if (isEqualEnum(element, alreadySaved)) {
				return alreadySaved.name;
			}
		}
		return putIfUnique(map, element, increment + 1);
	} else {
		map.set(name, { ...element, name });
		return name;
	}
}

/**
 * Checks if two APIEnum elements are equal
 * @param element1 first element
 * @param element2 second element
 * @returns true if equal, false if not
 */
function isEqualEnum(element1: APIEnum, element2: APIEnum) {
	if (element1.labels.length === element2.labels.length) {
		for (const v1 of element1.labels) {
			if (element2.labels.find(v2 => v2.key === v1.key) === undefined) {
				return false;
			}
		}
		return true;
	}
	return false;
}

/**
 * Checks if two APIInterface elements are equal
 * @param element1 first element
 * @param element2 second element
 * @returns true if equal, false if not
 */
function isEqualInterface(element1: APIInterface, element2: APIInterface): boolean {
	if (element1.members.length === element2.members.length) {
		for (const m1 of element1.members) {
			if (element2.members.find(m2 => isEqualMember(m1, m2)) === undefined) {
				return false;
			}
		}
		return true;
	}
	return false;
}

/**
 * Checks if two APIMember elements are equal
 * @param element1 first element
 * @param element2 second element
 * @returns true if equal, false if not
 */
function isEqualMember(element1: APIMember, element2: APIMember): boolean {
	return (
		element1.name === element2.name && element1.required === element2.required && element1.type === element2.type
	);
}

/**
 * Adds the element to the map if it is not already contained, and it is InputSource
 * @param map Map where the element is to be inserted
 * @param group group to be checked
 * @param element APIElement to be inserted into the map
 * @returns interfaces if is input source, false if not is input source
 */
function putInputGroupInterfaceIfNotExist(
	interfaces: Map<string, APIInterface>,
	group: DocumentModel.Group,
	element: APIInterface,
	suffix?: string
): string | undefined {
	const isInputSource = isInputSourceGroup(group);
	const isMeasureInputSource = isMeasureInputSourceGroup(group);

	if (isInputSource || isMeasureInputSource) {
		const interfaceName = `${isMeasureInputSource ? "Measure" : ""}InputSource${suffix}`;
		const genericType = "T";

		if (!interfaces.has(interfaceName)) {
			const type = isMeasureInputSource ? "number" : genericType;
			const genericElement: APIInterface = {
				...element,
				members: element.members.map(e => (e.name === "value" ? { ...e, type: type } : e)),
				generics: type === genericType ? [type] : [],
			};
			interfaces.set(interfaceName, { ...genericElement, name: interfaceName });
		}

		const type = element.members.find(e => e.name === "value")!.type;
		const interfaceType = isInputSource ? `<${type}>` : "";

		return `${interfaceName}${interfaceType}`;
	}

	return undefined;
}

/**
 * Checks if group is input source
 * @param group group to be checked
 * @returns true if is input source, false if not is input source
 */
function isInputSourceGroup(group: DocumentModel.Group): boolean {
	const inputSourceGroupKeys = ["value", "path", "source", "id", "reference"];
	if (group.elements.length !== inputSourceGroupKeys.length) {
		return false;
	}

	return !group.elements.filter(e => !inputSourceGroupKeys.includes(e.name)).length;
}

/**
 * Checks if group is measure input source
 * @param group group to be checked
 * @returns true if is measure input source, false if not is input source
 */
function isMeasureInputSourceGroup(group: DocumentModel.Group): boolean {
	const inputSourceGroupKeys = ["value", "path", "source", "unit", "id"];
	if (group.elements.length !== inputSourceGroupKeys.length) {
		return false;
	}
	return !group.elements.filter(e => !inputSourceGroupKeys.includes(e.name)).length;
}

type APIElement = APIInterface | APIEnum;
export type ExampleValueMap = { [key: string]: ExampleValue };
export type ExampleValue = ExampleValue[] | ExampleValueMap | string | number | boolean;

export interface APIInterface {
	name: string;
	type: "Interface";
	members: APIMember[];
	generics?: string[];
}

export interface APIEnum {
	name: string;
	type: "Enum";
	labels: APIEnumValue[];
}

interface APIEnumValue {
	key: string;
	values: ReadonlyArray<APILocalizedText>;
}

interface APILocalizedText {
	locale: string;
	text: string;
}

interface APIMember {
	name: string;
	type: string;
	required: boolean;
	isArray: boolean;
}
