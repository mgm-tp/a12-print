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
	GeneratedCodeAccessorFactory,
	DocumentServiceFactory,
	DocumentRtServiceFactory,
} from "@com.mgmtp.a12.kernel/kernel-md-facade/lib/main/js/facade.js";
import { PrintMetaModelValidationScript } from "@com.mgmtp.a12.print/print-model-api/lib/generated/internal/validation/print-meta-model-validation-script.js";
import documentModelJson from "@com.mgmtp.a12.print/print-model-api/lib/generated/internal/model/DomainPrintMetaModel.json" with { type: "json" };
import { PartialPrintModel } from "@com.mgmtp.a12.print/print-model-api/lib/model/partial.js";
import { DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/lib/errors/deep-partial-error-map.js";
import type { DocumentModel, EntityInstancePath } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import { FAILED_INTEGRITY_REPORT, PrintValidationMode, PrintValidator } from "./print-validator.js";
import { fullValidation } from "./full-validation.js";
import { ReferencePathValidation } from "./reference-path-validation/reference-path-validation.js";

export class PrintModelValidator extends PrintValidator {
	private static instance: PrintModelValidator = new PrintModelValidator();

	private documentModelMarshaller = new DocumentServiceFactory().getDocumentModelSerializer();
	private documentModel = this.documentModelMarshaller.deserialize(JSON.stringify(documentModelJson));
	private documentRtService = DocumentRtServiceFactory.createDocumentRtService(
		new GeneratedCodeAccessorFactory().createScriptAccessor(PrintMetaModelValidationScript)
	);

	public validate<T>(
		validatorInput: PrintValidator.Input,
		relevantPaths: EntityInstancePath[] = []
	): PrintValidator.IntegrityReport<T> {
		const transformedInput = this.transformValidatorInput(validatorInput);
		if (transformedInput) {
			const result = relevantPaths
				? fullValidation(transformedInput, this.documentRtService, this.documentModel, relevantPaths)
				: fullValidation(transformedInput, this.documentRtService, this.documentModel, []);
			return result;
		}

		return FAILED_INTEGRITY_REPORT;
	}

	public validateReferences(
		printModel: PartialPrintModel,
		documentModels: readonly DocumentModel[],
		mode: PrintValidationMode
	) {
		if (!this.shouldValidateReferences(mode)) {
			return DeepPartialErrorMap.getEmptyMap();
		}
		return ReferencePathValidation.validateDocumentModelReferences(printModel, documentModels);
	}

	public static getInstance(): PrintModelValidator {
		return this.instance;
	}
}
