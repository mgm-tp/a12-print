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
import { ErrorLocalizationBundle } from "@com.mgmtp.a12.kernel/kernel-core-runtime-api-ts/lib/main/js/formatdef/error/bundles/ErrorLocalizationBundle.js";

import { PrintDateTimeFormatErrorEnum } from "../error-enum.js";

const bundle = new ErrorLocalizationBundle("de");
export default bundle;

const set: typeof bundle.set = bundle.set.bind(bundle);

set(
	PrintDateTimeFormatErrorEnum[PrintDateTimeFormatErrorEnum.DATE_INVALID],
	"Ungültiges Datum: Das Datumsformat ist ungültig."
);

set(
	PrintDateTimeFormatErrorEnum[PrintDateTimeFormatErrorEnum.UNTERMINATED_QUOTE],
	"Ungültiges Datum: Unterminiertes Zitat."
);

set(
	PrintDateTimeFormatErrorEnum[PrintDateTimeFormatErrorEnum.OPTIONAL_SECTION_CLOSED_UNOPENED],
	"Ungültiges Datum: Erwartetes '[' vor ']'."
);

set(
	PrintDateTimeFormatErrorEnum[PrintDateTimeFormatErrorEnum.RESERVED_CHARACTER_USED],
	"Ungültiges Datum: Reserviertes Zeichen '$characters$' verwendet."
);

set(
	PrintDateTimeFormatErrorEnum[PrintDateTimeFormatErrorEnum.CHARACTER_MAX_REPETITION_EXCEEDED],
	"Ungültiges Datum: '$characters$' zu oft wiederholt."
);

set(
	PrintDateTimeFormatErrorEnum[PrintDateTimeFormatErrorEnum.CHARACTER_REPETITION_INVALID],
	"Ungültiges Datum: Nicht unterstützte Anzahl von Wiederholungen von '$characters$'."
);

set(
	PrintDateTimeFormatErrorEnum[PrintDateTimeFormatErrorEnum.PATTERN_CHARACTER_INVALID],
	"Ungültiges Datum: Musterzeichen '$characters$' ist(sind) nicht gültig."
);
