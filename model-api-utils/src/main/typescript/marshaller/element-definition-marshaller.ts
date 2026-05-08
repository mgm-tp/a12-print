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
import { ElementDefinitionsDTO } from "@com.mgmtp.a12.print/print-model-api/lib/generated/internal/dto/PrintModelDTO.js";
import { UnionToType } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";
import { AnyPrintModelElement, PartialPrintModel } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/lib/errors/deep-partial-error-map.js";

import { PrintElementValidator, PrintValidator } from "../internal/validation/index.js";

import { Marshaller } from "./marshaller.js";
import { ElementDefinitionDeserializer } from "./deserializer/element-deserializer.js";
import { ElementDefinitionSerializer } from "./serializer/element-definition-serializer.js";
import { Serializer } from "./serializer/serializer.js";
import { Deserializer } from "./deserializer/deserializer.js";

/**
 * @deprecated since 3.2.3
 * Transforms the API-representation of a ElementDefinition into its JSON-representation and vice versa.
 * Validation is performed on the serialized JSON-representation.
 */
export class ElementDefinitionMarshaller extends Marshaller<ElementDefinitionsDTO, UnionToType<AnyPrintModelElement>> {
	protected executeValidation(validatorInput: PrintValidator.Input) {
		return PrintElementValidator.getInstance().validate(validatorInput);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected executeReferenceValidation(validatorInput: PartialPrintModel) {
		return DeepPartialErrorMap.getEmptyMap();
	}

	protected initializeDeserializer(): Deserializer<ElementDefinitionsDTO, UnionToType<AnyPrintModelElement>> {
		return new ElementDefinitionDeserializer([]);
	}

	protected initializeSerializer(): Serializer<UnionToType<AnyPrintModelElement>, ElementDefinitionsDTO> {
		return new ElementDefinitionSerializer();
	}
}
