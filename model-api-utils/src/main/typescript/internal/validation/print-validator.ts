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
import { Document, EntityInstancePath } from "@com.mgmtp.a12.kernel/kernel-md-facade/lib/main/js/api.js";
import { Localizable } from "@com.mgmtp.a12.utils/utils-localization/lib/main/index.js";
import {
	DeepPartialErrorMap,
	ErrorOrigin,
	ErrorSeverity,
	ExtendedEntityInstancePath,
} from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";

import { InternalLocalizableError } from "./internal-localizable-error.js";
import { PrintCustomConditionRegistry } from "./print-custom-condition/print-custom-condition-registry.js";

export enum PrintValidationMode {
	FULL,
	SKIP_REFERENCES,
}

export const FAILED_INTEGRITY_REPORT: PrintValidator.IntegrityReport<object> = {
	errorMap: {
		[ErrorSeverity.ERROR]: [
			{
				jsonPath: [],
				errorCode: "jsonParse",
				severity: "ERROR",
				parameters: {
					messageKey: InternalLocalizableError.parseError.key,
				},
				errorMessage: [InternalLocalizableError.parseError],
				origin: ErrorOrigin.VALIDATOR,
			},
		],
		[ErrorSeverity.WARNING]: [],
		[ErrorSeverity.INFO]: [],
	},
	document: {},
	noErrorOccurred: false,
};

export abstract class PrintValidator {
	private customConditionRegistry = PrintCustomConditionRegistry.getInstance();

	public transformValidatorInput(validatorInput: PrintValidator.Input): Document | undefined {
		let document;
		if (typeof validatorInput === "string") {
			try {
				document = JSON.parse(validatorInput);
			} catch {
				return undefined;
			}
		} else {
			document = validatorInput;
		}

		return document;
	}

	public abstract validate<T>(
		validatorInput: PrintValidator.Input,
		relevantPaths?: EntityInstancePath[]
	): PrintValidator.IntegrityReport<T>;

	protected shouldValidateReferences(mode: PrintValidationMode) {
		switch (mode) {
			case PrintValidationMode.FULL:
				return true;
			case PrintValidationMode.SKIP_REFERENCES:
				return false;
			default:
				throw new Error(`PrintValidationMode ${mode} does not exist.`);
		}
	}

	public getCustomConditionRegistry() {
		return this.customConditionRegistry;
	}
}

export namespace PrintValidator {
	export type Input = string | Record<string, unknown>;
	export interface IntegrityMessage {
		/** A key to identify the kind of message, e.g. for localization */
		readonly key: string;

		/** A localizable message. */
		readonly text?: Localizable[];

		/** The (main) element in the document to which the message is associated. */
		readonly element: ExtendedEntityInstancePath;

		/** All fields in the document that are related to the message. */
		readonly referencedFields: ReadonlyArray<ExtendedEntityInstancePath>;
		readonly code: string;

		readonly severity: "ERROR" | "INFO" | "HINT";
	}

	export interface IntegrityReport<T> {
		/** whether or not validation errors were found.
		 * Hints are not considered. */
		readonly noErrorOccurred: boolean;

		/** all errors */
		readonly errorMap: DeepPartialErrorMap<T>;

		/** all messages */
		readonly document: Record<string, unknown>;
	}
}
