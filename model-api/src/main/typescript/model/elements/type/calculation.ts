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
import type { PartialAnyPrintModelElement } from "../../partial.js";

import type { ComputationAlternative, DisplayOptions, PrintModelEntity } from "../base.js";
import type { PrintModelElement } from "../print-model-element.js";
import { ElementType } from "../print-model-element.js";

export interface Calculation extends PrintModelElement {
	readonly type: ElementType.Calculation;
	readonly calculation: CalculationProperties;
}

export interface CalculationProperties extends PrintModelEntity {
	readonly name: string;
	readonly model: string;
	readonly fieldType?: FieldType;
	readonly computationAlternatives?: ReadonlyArray<ComputationAlternative>;
	readonly displayOptions?: DisplayOptions;
}

export interface FieldType extends PrintModelEntity {
	readonly fieldType: FieldTypeDefinition;
	readonly typeDefinition?: PrintModelEntity;
}

export enum FieldTypeDefinition {
	Boolean = "Boolean",
	Number = "Number",
	String = "String",
	TypeDefinition = "TypeDefinition",
}

export namespace Calculation {
	export function isInstance(element: PartialAnyPrintModelElement): element is Calculation {
		return element.type === ElementType.Calculation && typeof element.calculation?.name === "string";
	}
}
