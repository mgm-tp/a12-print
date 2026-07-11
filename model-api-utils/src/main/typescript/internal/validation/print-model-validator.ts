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
	DocumentRtServiceFactory,
	DocumentServiceFactory,
	GeneratedCodeAccessorFactory,
} from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { PrintMetaModelValidationScript } from "@com.mgmtp.a12.print/print-model-api/generated/a12internal";
import type { PrintModelDTO } from "@com.mgmtp.a12.print/print-model-api/generated/a12internal";
import documentModelJson from "@com.mgmtp.a12.print/print-model-api/generated/a12internal/model/DomainPrintMetaModel.json" with { type: "json" };

import { FAILED_INTEGRITY_REPORT, PrintValidator } from "../../a12internal/validation/print-validator.js";
import { fullValidation } from "../../a12internal/validation/full-validation.js";

export class PrintModelValidator extends PrintValidator<PrintModelDTO> {
	private static readonly instance: PrintModelValidator = new PrintModelValidator();

	private readonly documentModelMarshaller = new DocumentServiceFactory().getDocumentModelSerializer();
	private readonly documentModel = this.documentModelMarshaller.deserialize(JSON.stringify(documentModelJson));
	private readonly documentRtService = DocumentRtServiceFactory.createDocumentRtService(
		new GeneratedCodeAccessorFactory().createScriptAccessor(PrintMetaModelValidationScript),
		{
			customConditionFactory: this.getCustomConditionFactory(),
			customFieldTypeFactory: this.getCustomFieldTypeFactory(),
		}
	);

	public validate<T>(
		validatorInput: PrintValidator.Input<PrintModelDTO>,
		options?: PrintValidator.Options
	): PrintValidator.IntegrityReport<T> {
		const transformedInput = this.transformValidatorInput(validatorInput);
		if (!transformedInput) {
			return FAILED_INTEGRITY_REPORT;
		}

		const relevantPaths = options?.partial?.relevantPaths ?? [];
		return fullValidation<T>(transformedInput, this.documentRtService, this.documentModel, relevantPaths);
	}

	public static getInstance(): PrintModelValidator {
		return this.instance;
	}
}
