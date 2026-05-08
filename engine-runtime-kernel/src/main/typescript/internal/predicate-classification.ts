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
import { SyntaxTreeElementType } from "./elements/index.js";

export class PredicateClassification {
	predicates: Map<string, PredicateClassification.PredicateSignature>;

	constructor(predicates: Map<string, PredicateClassification.PredicateSignature>) {
		this.predicates = predicates;
	}
}

export namespace PredicateClassification {
	export enum PredicateType {
		Number,
		Date,
		DateTime,
		Boolean,
		String,
		Time,
		Unknown,
	}

	export enum ParameterType {
		Number,
		Date,
		String,
		DateFragment,
		Custom,
		Time,
		DateTime,
		Boolean,
		DateRange,
		Enumeration,
		Unknown,
	}

	export class PredicateSignature {
		type: PredicateType[];
		parameters: NamedParameter[];
		parametersEither: Map<string, ParameterEither>;
		inclusion: Inclusion;
		consistence: Consistence;

		constructor(
			type: PredicateType[],
			parameters: NamedParameter[],
			parametersEither: Map<string, ParameterEither>,
			inclusion: Inclusion,
			consistence: Consistence
		) {
			this.type = type;
			this.parameters = parameters;
			this.parametersEither = parametersEither;
			this.inclusion = inclusion;
			this.consistence = consistence;
		}
	}

	export class ParameterEither {
		parameters: NamedParameter[];

		constructor(parameters: NamedParameter[]) {
			this.parameters = parameters;
		}
	}

	export class Parameter {
		type: ParameterType[];
		accepts: SyntaxTreeElementType[];

		constructor(type: ParameterType[], accepts: SyntaxTreeElementType[]) {
			this.type = type;
			this.accepts = accepts;
		}
	}

	export class NamedParameter {
		name: string;
		parameter: Parameter;

		constructor(name: string, parameter: Parameter) {
			this.name = name;
			this.parameter = parameter;
		}

		add(key: string, parameter: Parameter): void {
			if (this.name || this.parameter) {
				throw new Error();
			}
			this.name = key;
			this.parameter = parameter;
		}
	}

	export class Inclusion {
		left: NamedParameter[];
		right: NamedParameter[];

		constructor(left: NamedParameter[], right: NamedParameter[]) {
			this.left = left;
			this.right = right;
		}
	}

	export class Consistence {
		left: NamedParameter[];
		right: NamedParameter[];

		constructor(left: NamedParameter[], right: NamedParameter[]) {
			this.left = left;
			this.right = right;
		}
	}
}
