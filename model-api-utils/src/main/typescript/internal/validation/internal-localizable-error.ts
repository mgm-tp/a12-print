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
import { Localizable, LocalizableArgs } from "@com.mgmtp.a12.utils/utils-localization/lib/main/index.js";

export namespace InternalLocalizableError {
	export const parseError: Localizable = {
		key: "print.parse.error",
		args: {},
		defaults: {
			en: "An error has been occurred while parsing",
			de: "Beim Parsen ist ein Fehler aufgetreten",
		},
	};

	export const validationError: Localizable = {
		key: "print.validation.error",
		args: {},
		defaults: {
			en: "An error has been occurred while validating",
			de: "Bei der Validierung ist ein Fehler aufgetreten",
		},
	};

	export const deserializeError: Localizable = {
		key: "print.deserialize.error",
		args: {},
		defaults: {
			en: "An error has been occurred while deserializing at path $path$",
			de: "Beim Deserialisieren im Pfad $path$ ist ein Fehler aufgetreten",
		},
	};

	export const serializeError: Localizable = {
		key: "print.serialize.error",
		args: {},
		defaults: {
			en: "An error has been occurred while serializing at path $path$",
			de: "Beim Serialisieren im Pfad $path$ ist ein Fehler aufgetreten",
		},
	};

	export const unknownProperty: Localizable = {
		key: "print.unknowProperty.error",
		args: {},
		defaults: {
			en: "Error: Unknown property $property$ found",
			de: "Fehler: Unbekannte Eigenschaft $property$ gefunden",
		},
	};

	export const unsafeRequiredFieldInfo: Localizable = {
		key: "print.unsafeRequiredField.info",
		args: {},
		defaults: {
			en: "Unsafe required field at path: $path$",
			de: "Unsicheres Pflichtfeld am Pfad: $path$",
		},
	};

	export const missingValueForRequiredFieldError: Localizable = {
		key: "print.missingValueForRequiredField.error",
		args: {},
		defaults: {
			en: "Error: Value of required property $path$ is missing",
			de: "Fehler: Wert der erforderlichen Eigenschaft $path$ fehlt",
		},
	};

	export const unsupportedElementType: Localizable = {
		key: "print.unsupportedElementType.error",
		args: {},
		defaults: {
			en: "Error: Element type $type$ is not supported",
			de: "Fehler: Wert der erforderlichen Eigenschaft $path$ fehlt",
		},
	};
}

export function getPlainLocalizableArgs(args: Record<string, unknown>): LocalizableArgs {
	return Object.entries(args).reduce(
		(acc, [key, value]) => ({
			...acc,
			[key]: {
				type: "plain",
				value,
			},
		}),
		{}
	);
}
