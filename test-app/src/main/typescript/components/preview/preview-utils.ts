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
import moment from "moment-timezone";

import type { DropDownItem } from "@com.mgmtp.a12.widgets/widgets-core";

const MINUTES_PER_HOUR = 60;
const TIMEZONE_PREFIX = "UTC";

export function getDefaultTimeZone() {
	const defaultTimeZone = moment.tz.guess();
	const offset = moment.tz(defaultTimeZone).utcOffset();

	return { formattedOffset: formatTimeZoneOffset(offset), name: defaultTimeZone };
}

export function getAllTimeZones() {
	const timeZones = moment.tz.names();

	return timeZones
		.map(tz => {
			const offset = moment.tz(tz).utcOffset();
			return { offset, formattedOffset: formatTimeZoneOffset(offset), name: tz };
		})
		.sort((a, b) => a.offset - b.offset);
}

export function formatTimeZoneLabel(formattedOffset: string, timeZoneName: string) {
	return `(${formattedOffset}) ${timeZoneName}`;
}

export function getTimeZoneOption(timeZoneName: string): DropDownItem {
	const offset = moment.tz(timeZoneName).utcOffset();
	return {
		value: timeZoneName,
		label: formatTimeZoneLabel(formatTimeZoneOffset(offset), timeZoneName),
	};
}

export function fromNameToOffset(timeZoneName: string) {
	return formatTimeZoneOffset(moment.tz(timeZoneName).utcOffset()).replace(TIMEZONE_PREFIX, "");
}

function formatTimeZoneOffset(timeZoneOffset: number) {
	const offsetHours = Math.floor(Math.abs(timeZoneOffset) / MINUTES_PER_HOUR);
	const offsetMinutesPart = Math.abs(timeZoneOffset) % MINUTES_PER_HOUR;
	const sign = timeZoneOffset >= 0 ? "+" : "-";
	return `${TIMEZONE_PREFIX}${sign}${String(offsetHours).padStart(2, "0")}:${String(offsetMinutesPart).padStart(2, "0")}`;
}

export function filterDropDownItemRecursively(filterText: string, items: DropDownItem[]) {
	const result: DropDownItem[] = [];

	for (const item of items) {
		const checkText = item.label.toLocaleLowerCase();

		if (item.children && item.children.length > 0) {
			const childResult = filterDropDownItemRecursively(filterText, item.children);

			const newItem = JSON.parse(JSON.stringify(item));

			if (childResult.length > 0) {
				newItem.children = childResult;

				result.push(newItem);
			}
		} else if (checkText.startsWith(filterText)) {
			result.push(item);
		} else if (checkText.includes(filterText)) {
			result.push(item);
		}
	}

	return result;
}
