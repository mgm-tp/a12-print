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
	PrintValidationMode,
	PrintValidator,
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/validation/index.js";
import { Serializer } from "@com.mgmtp.a12.print/print-model-api-utils/lib/marshaller/serializer/serializer.js";
import { Deserializer } from "@com.mgmtp.a12.print/print-model-api-utils/lib/marshaller/deserializer/deserializer.js";
import { DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index";
import { Marshaller } from "@com.mgmtp.a12.print/print-model-api-utils";
import { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { PartialPrintModel } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { PrintSettingModel } from "../model/print-setting-model.js";
import { PrintSettingModelValidator } from "../validation/index.js";
import { PrintSettingModelDTO } from "../generated/dto/PrintSettingModelDTO.js";

import { PrintSettingModelDeserializer } from "./deserializer/print-setting-deserializer.js";
import { PrintSettingModelSerializer } from "./serializer/model-serializer.js";

/**
 * Transforms the API-representation of a PrintSettingModel into its JSON-representation and vice versa.
 * Validation is performed on the serialized JSON-representation.
 */
export class PrintSettingModelMarshaller extends Marshaller<PrintSettingModelDTO, PrintSettingModel> {
	protected initializeDeserializer(): Deserializer<PrintSettingModelDTO, PrintSettingModel> {
		return new PrintSettingModelDeserializer([]);
	}

	protected initializeSerializer(): Serializer<PrintSettingModel, PrintSettingModelDTO> {
		return new PrintSettingModelSerializer();
	}

	protected executeValidation(validatorInput: PrintValidator.Input) {
		return PrintSettingModelValidator.getInstance().validate(validatorInput);
	}

	/* eslint-disable @typescript-eslint/no-unused-vars */
	protected executeReferenceValidation(
		printModel: PartialPrintModel,
		documentModels: readonly DocumentModel[],
		mode: PrintValidationMode
	): DeepPartialErrorMap<PrintSettingModel> {
		return DeepPartialErrorMap.getEmptyMap<PrintSettingModel>();
	}
	/* eslint-enable @typescript-eslint/no-unused-vars */
}
