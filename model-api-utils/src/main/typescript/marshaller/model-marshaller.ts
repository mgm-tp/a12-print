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
import { PrintModelDTO } from "@com.mgmtp.a12.print/print-model-api/lib/generated/internal/dto/PrintModelDTO.js";
import { PrintModel } from "@com.mgmtp.a12.print/print-model-api/lib/model/print-model.js";
import { ErrorSeverity, PrintError } from "@com.mgmtp.a12.print/print-model-api/lib/errors/deep-partial-error-map.js";
import { PartialPrintModel } from "@com.mgmtp.a12.print/print-model-api/lib/model/partial.js";
import { DocumentModel, EntityInstancePath } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { PrintModelValidator, PrintValidationMode, PrintValidator } from "../internal/validation/index.js";

import { PrintModelSerializer } from "./serializer/model-serializer.js";
import { PrintModelDeserializer } from "./deserializer/model-api-deserializer.js";
import { Marshaller } from "./marshaller.js";
import { Serializer } from "./serializer/serializer.js";
import { Deserializer, DeserializerResult } from "./deserializer/deserializer.js";

/**
 * Transforms the API-representation of a PrintModel into its JSON-representation and vice versa.
 * Validation is performed on the serialized JSON-representation.
 */
export class PrintModelMarshaller extends Marshaller<PrintModelDTO, PrintModel> {
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
		} catch (message) {
			return {
				errorMap: {
					[ErrorSeverity.ERROR]: [message as PrintError],
					[ErrorSeverity.INFO]: [],
					[ErrorSeverity.WARNING]: [],
				},
			};
		}
	}

	protected executeValidation(validatorInput: PrintValidator.Input, relevantPaths: EntityInstancePath[]) {
		return PrintModelValidator.getInstance().validate(validatorInput, relevantPaths);
	}

	protected executeReferenceValidation(
		printModel: PartialPrintModel,
		documentModels: readonly DocumentModel[],
		mode: PrintValidationMode
	) {
		return PrintModelValidator.getInstance().validateReferences(printModel, documentModels, mode);
	}

	protected initializeDeserializer(): Deserializer<PrintModelDTO, PrintModel> {
		return new PrintModelDeserializer([]);
	}

	protected initializeSerializer(): Serializer<PrintModel, PrintModelDTO> {
		return new PrintModelSerializer();
	}
}
