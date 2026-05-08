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
	PrintError,
	ErrorSeverity,
	ErrorOrigin,
} from "@com.mgmtp.a12.print/print-model-api/lib/errors/deep-partial-error-map.js";
import { Subtype } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";
import { ExtendedEntityInstancePath } from "@com.mgmtp.a12.print/print-model-api/lib/errors/extended-entity-instance-path.js";
import { PartialPrintModel } from "@com.mgmtp.a12.print/print-model-api/lib/model/partial.js";
import { DocumentModel, EntityInstancePath } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { PrintValidationMode, PrintValidator } from "../internal/validation/index.js";
import { InternalLocalizableError } from "../internal/validation/internal-localizable-error.js";

import { Deserializer, DeserializerResult } from "./deserializer/deserializer.js";
import { Serializer, SerializerResult } from "./serializer/serializer.js";

export abstract class Marshaller<DTOType extends object, APIType> {
	/**
	 * Transforms the API representation into its JSON-representation and validates it afterwards.
	 * @param apiObject API-representation
	 * @param documentModels Reference document models
	 * @param mode Validation model
	 * @param relevantPaths specific paths to validate
	 * @returns JSON-representation and any generated Messages
	 */
	public serialize<T extends Subtype<APIType> = APIType>(
		apiObject: T,
		documentModels: readonly DocumentModel[],
		mode: PrintValidationMode = PrintValidationMode.FULL,
		relevantPaths: EntityInstancePath[] = []
	): MarshallerResult<T, DTOType> {
		const serializer = this.initializeSerializer();
		const serializerResult = this.executeSerializer(serializer, apiObject as unknown as APIType);

		const errorMap = serializerResult.errorMap || DeepPartialErrorMap.getEmptyMap<T>();
		if (serializerResult.result) {
			const report = this.validate(serializerResult.result as Record<string, unknown>, relevantPaths);
			DeepPartialErrorMap.mergeErrorMaps(errorMap, report.errorMap);

			const referenceErrorMap = this.executeReferenceValidation(apiObject, documentModels, mode);
			DeepPartialErrorMap.mergeErrorMaps(errorMap, referenceErrorMap);

			DeepPartialErrorMap.extendErrorMapWithId(errorMap as DeepPartialErrorMap<T>, apiObject);
			return {
				result: report.noErrorOccurred ? serializerResult.result : undefined,
				report: {
					noErrorOccurred:
						report.noErrorOccurred && serializerResult.errorMap[ErrorSeverity.ERROR].length === 0,
					errorMap: errorMap as DeepPartialErrorMap<T>,
					relevantPaths,
				},
			};
		} else {
			return {
				report: {
					noErrorOccurred: false,
					errorMap: errorMap as DeepPartialErrorMap<T>,
					relevantPaths,
				},
			};
		}
	}

	/**
	 * Validates the serialized JSON-representation and transforms it into its API-representation.
	 * @param validatorInput string or object representation of the Model
	 * @returns API-representation and any generated Messages
	 */
	public deserialize<T extends Subtype<APIType> = APIType>(
		validatorInput: PrintValidator.Input,
		documentModels: readonly DocumentModel[],
		mode: PrintValidationMode = PrintValidationMode.FULL,
		relevantPaths: EntityInstancePath[] = []
	): MarshallerResult<T, T> {
		const deserializer = this.initializeDeserializer();
		const report = this.validate(validatorInput, relevantPaths);
		if (report.noErrorOccurred) {
			const deserializerResult = this.executeDeserializer(deserializer, report.document as DTOType);

			const deserializerNoErrorOccurred = deserializerResult.errorMap[ErrorSeverity.ERROR].length === 0;
			const errorMap = deserializerResult.errorMap || DeepPartialErrorMap.getEmptyMap();
			DeepPartialErrorMap.mergeErrorMaps(errorMap, report.errorMap);

			if (deserializerResult.result && deserializerNoErrorOccurred) {
				const referenceErrorMap = this.executeReferenceValidation(
					deserializerResult.result,
					documentModels,
					mode
				);
				DeepPartialErrorMap.mergeErrorMaps(errorMap, referenceErrorMap);

				DeepPartialErrorMap.extendErrorMapWithId(errorMap, deserializerResult.result);
				return {
					result: deserializerResult.result as unknown as T,
					report: {
						noErrorOccurred: true,
						errorMap: errorMap as DeepPartialErrorMap<T>,
						relevantPaths,
					},
				};
			}
			return {
				report: {
					noErrorOccurred: false,
					errorMap: errorMap as DeepPartialErrorMap<T>,
					relevantPaths,
				},
			};
		}
		return {
			report: {
				noErrorOccurred: false,
				errorMap: report.errorMap as DeepPartialErrorMap<T>,
				relevantPaths,
			},
		};
	}

	private validate(
		validatorInput: PrintValidator.Input,
		relevantPaths?: EntityInstancePath[]
	): PrintValidator.IntegrityReport<APIType> {
		try {
			return this.executeValidation(validatorInput, relevantPaths);
		} catch (e) {
			return {
				noErrorOccurred: false,
				document: {},
				errorMap: {
					[ErrorSeverity.ERROR]: [
						{
							severity: "ERROR",
							errorCode: String(e),
							jsonPath: [] as ExtendedEntityInstancePath,
							origin: ErrorOrigin.VALIDATOR,
							errorMessage: [InternalLocalizableError.validationError],
						},
					] as PrintError[],
					[ErrorSeverity.WARNING]: [] as PrintError[],
					[ErrorSeverity.INFO]: [] as PrintError[],
				} as DeepPartialErrorMap<APIType>,
			};
		}
	}

	protected executeDeserializer(
		deserializer: Deserializer<DTOType, APIType>,
		dtoObject: DTOType
	): DeserializerResult<APIType> {
		return deserializer.deserialize(dtoObject);
	}

	protected executeSerializer(
		serializer: Serializer<APIType, DTOType>,
		apiObject: APIType
	): SerializerResult<APIType, DTOType> {
		return serializer.serialize(apiObject);
	}

	protected abstract initializeDeserializer(): Deserializer<DTOType, APIType>;
	protected abstract initializeSerializer(): Serializer<APIType, DTOType>;

	protected abstract executeValidation(
		validatorInput: PrintValidator.Input,
		relevantPaths?: EntityInstancePath[]
	): PrintValidator.IntegrityReport<APIType>;
	protected abstract executeReferenceValidation(
		printModel: PartialPrintModel,
		documentModels: readonly DocumentModel[],
		mode: PrintValidationMode
	): DeepPartialErrorMap<APIType>;
}

export interface MarshallerResult<APIType, TargetType> {
	result?: TargetType;
	report: PrintModelMarshallerReport<APIType>;
}

export interface MarshallerMessage {
	message: string;
	severity: keyof typeof ErrorSeverity;
}

export interface PrintModelMarshallerReport<T> {
	/** whether validation or marshaller errors were found.*/
	readonly noErrorOccurred: boolean;

	/** all messages */
	readonly errorMap: DeepPartialErrorMap<T>;

	/** paths are used to validate the document. */
	readonly relevantPaths: EntityInstancePath[];
}
