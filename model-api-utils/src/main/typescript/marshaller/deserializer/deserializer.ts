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
	DeepPartialErrorMap,
	ErrorOrigin,
	ErrorSeverity,
	ExtendedEntityInstancePath,
	PrintError,
} from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";
import {
	ExtractArrays,
	ExtractArrayType,
	PlainDeepPartial,
} from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";

import {
	getPlainLocalizableArgs,
	InternalLocalizableError,
} from "../../internal/validation/internal-localizable-error.js";

export interface DeserializerResult<R> {
	result?: R;
	errorMap: DeepPartialErrorMap<R>;
}

interface MappingResult<V> {
	_key: string;
	_value: V;
}

export abstract class Deserializer<DTOType extends object, APIType> {
	abstract prefix: string;

	index: number;
	isRepeatable: boolean;
	parentPath: ExtendedEntityInstancePath;
	path: ExtendedEntityInstancePath = [];
	errorMap = DeepPartialErrorMap.getEmptyMap<APIType>();
	elementBase: PlainDeepPartial<APIType> = {};
	additionalProperties: PlainDeepPartial<APIType> = {};

	constructor(parentPath: ExtendedEntityInstancePath, index: number = 1, isRepeatable: boolean = false) {
		this.parentPath = parentPath;
		this.index = index;
		this.isRepeatable = isRepeatable;
	}

	private setPath() {
		this.path = [
			...this.parentPath,
			{ elementName: `${this.prefix}`, index: this.index, isRepeatable: this.isRepeatable },
		];
	}

	public deserialize(dto: DTOType): DeserializerResult<APIType> {
		this.setPath();
		type DTOProperties = keyof DTOType;
		const properties = Object.keys(dto) as DTOProperties[];
		let apiObject: PlainDeepPartial<APIType> = this.elementBase;
		for (const key of properties) {
			try {
				const mapped = this.map(key, dto);
				if (mapped instanceof Object && "_key" in mapped && "_value" in mapped) {
					apiObject = { ...apiObject, [mapped._key]: mapped._value };
				} else {
					apiObject = { ...apiObject, [key]: mapped };
				}
			} catch (error) {
				this.errorMap = DeepPartialErrorMap.pushAtPath(
					this.errorMap,
					[{ elementName: key as string, index: 1, isRepeatable: false }],
					error as PrintError
				);
			}
		}
		return {
			errorMap: { ...this.errorMap },
			result: { ...this.additionalProperties, ...apiObject } as APIType,
		};
	}

	abstract map(property: keyof DTOType, dto: DTOType): APIType[keyof APIType] | MappingResult<APIType[keyof APIType]>;

	unknownProperty(property: never): void {
		throw {
			jsonPath: [...this.path, { elementName: property, index: 1 }],
			errorCode: InternalLocalizableError.unknownProperty.key,
			severity: "ERROR",
			parameters: {
				name: String(property),
			},
			origin: ErrorOrigin.DESERIALIZER,
			errorMessage: [
				{
					...InternalLocalizableError.unknownProperty,
					args: getPlainLocalizableArgs({ property }),
				},
			],
		};
	}

	getRequired<A>(field: A | undefined, name: string): A {
		const fieldPath = this.getPathAsString(name);
		if (field !== undefined) {
			const error: PrintError = {
				jsonPath: this.getPathOfMember(name),
				errorCode: InternalLocalizableError.unsafeRequiredFieldInfo.key,
				severity: "INFO",
				parameters: {
					path: fieldPath,
				},
				errorMessage: [
					{
						...InternalLocalizableError.unsafeRequiredFieldInfo,
						args: getPlainLocalizableArgs({ path: fieldPath }),
					},
				],
				origin: ErrorOrigin.DESERIALIZER,
			};
			this.errorMap = DeepPartialErrorMap.pushAtPath(
				this.errorMap,
				[{ elementName: name, index: 1, isRepeatable: false }],
				error
			);
			return field;
		}
		throw {
			jsonPath: this.getPathOfMember(name),
			errorCode: InternalLocalizableError.missingValueForRequiredFieldError.key,
			severity: "ERROR",
			origin: ErrorOrigin.DESERIALIZER,
			errorMessage: [
				{
					...InternalLocalizableError.missingValueForRequiredFieldError,
					args: getPlainLocalizableArgs({ path: fieldPath }),
				},
			],
		};
	}

	getOptional<A, B>(optional: A | undefined, callback: (f: A) => B) {
		if (optional !== undefined) {
			return callback(optional);
		}
		return undefined;
	}

	deserializeRepeatable<
		DTOPropertyType extends object,
		APIPropertyType extends ExtractArrayType<ExtractArrays<APIType>>,
	>(
		dto: DTOPropertyType[] | undefined,
		getDeserializer: (index: number) => Deserializer<DTOPropertyType, APIPropertyType>,
		key: string
	): APIPropertyType[] {
		return dto ? dto.map((value, index) => this.deserializeMember(value, getDeserializer(index), key, true)) : [];
	}

	deserializeOptional<DTOPropertyType extends object, APIPropertyType extends APIType[keyof APIType]>(
		dto: DTOPropertyType | undefined,
		deserializer: Deserializer<DTOPropertyType, APIPropertyType>,
		key: string
	): APIPropertyType | undefined {
		return this.getOptional(dto, value => this.deserializeMember(value, deserializer, key, false));
	}

	deserializeRequired<DTOPropertyType extends object, APIPropertyType extends APIType[keyof APIType]>(
		dto: DTOPropertyType | undefined,
		property: string,
		deserializer: Deserializer<DTOPropertyType, APIPropertyType>
	): APIPropertyType {
		return this.deserializeMember(this.getRequired(dto, property), deserializer, property, false);
	}

	deserializeMember<DTOPropertyType extends object, APIPropertyType extends APIType[keyof APIType]>(
		dto: DTOPropertyType,
		deserializer: Deserializer<DTOPropertyType, APIPropertyType>,
		key: string,
		isRepeatable: boolean = false
	): APIPropertyType {
		const report = deserializer.deserialize(dto);
		if (isRepeatable) {
			const errorMapRecord = this.errorMap as Record<string, unknown[]>;
			const childMaps = errorMapRecord[key] && errorMapRecord[key] instanceof Array ? errorMapRecord[key] : [];
			this.errorMap = { ...this.errorMap, [key]: [...childMaps, report.errorMap] };
		} else {
			this.errorMap = { ...this.errorMap, [key]: report.errorMap };
		}
		Object.values(ErrorSeverity).map(severity => this.errorMap[severity].push(...report.errorMap[severity]));
		if (report.result) {
			return report.result;
		}
		throw {
			jsonPath: this.getPathOfMember(key),
			errorCode: InternalLocalizableError.deserializeError.key,
			severity: "ERROR",
			origin: ErrorOrigin.DESERIALIZER,
			errorMessage: [
				{
					...InternalLocalizableError.deserializeError,
					args: getPlainLocalizableArgs({ path: this.getPathAsString(key) }),
				},
			],
		};
	}

	getPathOfMember(name: string, index?: number, isRepeatable?: boolean) {
		return [
			...this.path,
			{
				elementName: name,
				index: index || 1,
				isRepeatable: isRepeatable || false,
			},
		];
	}

	getPathAsString(name: string) {
		return this.path
			.map(el => {
				return `${el.elementName}[${el.index}]`;
			})
			.concat(name)
			.join(".");
	}

	addAdditionalProperty<K extends keyof APIType>(key: K, value: APIType[K]) {
		this.additionalProperties = { ...this.additionalProperties, [key]: value };
	}
}
