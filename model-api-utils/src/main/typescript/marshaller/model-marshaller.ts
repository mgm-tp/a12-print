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
import type { PrintModelDTO } from "@com.mgmtp.a12.print/print-model-api/generated/a12internal";
import type { PartialPrintModel, PrintModel } from "@com.mgmtp.a12.print/print-model-api/model";
import type { PrintError } from "@com.mgmtp.a12.print/print-model-api/errors";
import { DeepPartialErrorMap, ErrorSeverity } from "@com.mgmtp.a12.print/print-model-api/errors";
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { PrintModelValidator } from "../internal/validation/print-model-validator.js";
import type { PrintValidator } from "../a12internal/validation/print-validator.js";
import { collectHtmlErrors } from "../internal/validation/html/html-field-collector.js";
import { ReferencePathValidation } from "../internal/validation/reference-path-validation/reference-path-validation.js";

import { PrintModelSerializer } from "./serializer/model-serializer.js";
import { PrintModelDeserializer } from "./deserializer/model-api-deserializer.js";
import { Marshaller } from "./marshaller.js";
import type { Serializer } from "./serializer/serializer.js";
import type { Deserializer, DeserializerResult } from "./deserializer/deserializer.js";

export interface PrintModelValidatorOptions extends PrintValidator.Options {
	/** When true, HTML validation is performed on all HTML-bearing fields. Default: true. */
	html?: boolean;
	/**
	 * Reference validation configuration.
	 * When `documentModels` is provided, references in the print model are validated against them.
	 * When omitted, reference validation is skipped.
	 */
	references?: {
		documentModels?: readonly DocumentModel[];
	};
}

/**
 * Transforms the API-representation of a PrintModel into its JSON-representation and vice versa.
 * Validation is performed on the serialized JSON-representation.
 */
export class PrintModelMarshaller extends Marshaller<PrintModelDTO, PrintModel, PrintModelValidatorOptions> {
	override executeDeserializer(
		deserializer: Deserializer<PrintModelDTO, PrintModel>,
		printModelDTO: PrintModelDTO
	): DeserializerResult<PrintModel> {
		try {
			const report = deserializer.deserialize(printModelDTO);
			return {
				result: report.result,
				errorMap: report.errorMap,
			};
		} catch (error) {
			return {
				errorMap: {
					[ErrorSeverity.ERROR]: [error as PrintError],
					[ErrorSeverity.INFO]: [],
					[ErrorSeverity.WARNING]: [],
				},
			};
		}
	}

	protected executeValidation(
		validatorInput: PrintValidator.Input<PrintModelDTO>,
		options?: PrintModelValidatorOptions
	) {
		return PrintModelValidator.getInstance().validate(validatorInput, options);
	}

	protected override executePostApiValidation(
		apiObject: PrintModel,
		options?: PrintModelValidatorOptions
	): DeepPartialErrorMap<PrintModel> {
		const errorMap = DeepPartialErrorMap.getEmptyMap<PrintModel>();

		if (options?.html !== false) {
			const htmlErrorMap = collectHtmlErrors(apiObject as unknown as PartialPrintModel);
			DeepPartialErrorMap.mergeErrorMaps(errorMap, htmlErrorMap);
		}

		if (options?.references?.documentModels) {
			const refErrorMap = ReferencePathValidation.validateDocumentModelReferences(
				apiObject as unknown as PartialPrintModel,
				options.references.documentModels
			);
			DeepPartialErrorMap.mergeErrorMaps(errorMap, refErrorMap);
		}

		return errorMap;
	}

	protected initializeDeserializer(): Deserializer<PrintModelDTO, PrintModel> {
		return new PrintModelDeserializer([]);
	}

	protected initializeSerializer(): Serializer<PrintModel, PrintModelDTO> {
		return new PrintModelSerializer();
	}
}
