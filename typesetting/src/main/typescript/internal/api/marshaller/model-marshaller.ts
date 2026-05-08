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
} from "@com.mgmtp.a12.print/print-model-api-utils/lib/internal/validation/print-validator.js";
import { Serializer, Marshaller, Deserializer, MarshallerResult } from "@com.mgmtp.a12.print/print-model-api-utils";
import { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";
import { DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/errors";
import { PartialPrintModel } from "@com.mgmtp.a12.print/print-model-api/model";
import { Subtype } from "@com.mgmtp.a12.print/print-model-api/utils";

import { TypesettingModelDTO } from "../generated/dto/TypesettingModelDTO.js";
import { TypesettingModel } from "../model/index.js";
import { TypesettingModelValidator } from "../validation/index.js";

import { TypesettingModelDeserializer } from "./deserializer/index.js";
import { TypesettingModelSerializer } from "./serializer/index.js";

/**
 * Transforms the API-representation of a TypesettingModel into its JSON-representation and vice versa.
 * Validation is performed on the serialized JSON-representation.
 */
export class TypesettingModelMarshaller extends Marshaller<TypesettingModelDTO, TypesettingModel> {
	public serialize<T extends Subtype<TypesettingModel> = TypesettingModel>(
		apiObject: T
	): MarshallerResult<T, TypesettingModelDTO> {
		return super.serialize(apiObject, []);
	}

	public deserialize<T extends Subtype<TypesettingModel> = TypesettingModel>(
		validatorInput: PrintValidator.Input
	): MarshallerResult<T, T> {
		return super.deserialize(validatorInput, []);
	}

	protected executeValidation(validatorInput: PrintValidator.Input) {
		return TypesettingModelValidator.getInstance().validate(validatorInput);
	}

	protected initializeDeserializer(): Deserializer<TypesettingModelDTO, TypesettingModel> {
		return new TypesettingModelDeserializer([]);
	}

	protected initializeSerializer(): Serializer<TypesettingModel, TypesettingModelDTO> {
		return new TypesettingModelSerializer();
	}

	/* eslint-disable @typescript-eslint/no-unused-vars */
	protected executeReferenceValidation(
		_printModel: PartialPrintModel,
		_documentModels: readonly DocumentModel[],
		_mode: PrintValidationMode
	): DeepPartialErrorMap<TypesettingModel> {
		return DeepPartialErrorMap.getEmptyMap();
	}
	/* eslint-enable @typescript-eslint/no-unused-vars */
}
