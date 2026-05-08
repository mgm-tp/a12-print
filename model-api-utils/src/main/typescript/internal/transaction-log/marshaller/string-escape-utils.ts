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
export class StringEscapeUtils {
	static escape(input: string): string {
		return input.replace(/[\n\t\r\f\b"\\{}]|[^\x20-\x7F]/g, char => {
			switch (char) {
				case "\n":
					return "\\n";
				case "\t":
					return "\\t";
				case "\r":
					return "\\r";
				case "\f":
					return "\\f";
				case "\b":
					return "\\b";
				case '"':
					return '\\"';
				case "\\":
					return "\\\\";
				default: {
					const hex = char.charCodeAt(0).toString(16).padStart(4, "0");
					return `\\u${hex}`;
				}
			}
		});
	}

	static unescape(input: string): string {
		return input.replace(/\\u([0-9a-fA-F]{4})|\\([ntrfb"\\])/g, (match, unicode, char) => {
			if (unicode) {
				return String.fromCharCode(parseInt(unicode, 16));
			} else if (char) {
				switch (char) {
					case "n":
						return "\n";
					case "t":
						return "\t";
					case "r":
						return "\r";
					case "f":
						return "\f";
					case "b":
						return "\b";
					case '"':
						return '"';
					case "\\":
						return "\\";
				}
			}
			return match;
		});
	}
}
