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
import { type PrintModel } from "@com.mgmtp.a12.print/print-model-api/model";

import { PrintModelMarshaller } from "../../../../main/typescript/marshaller/model-marshaller.js";

const SANITIZED = "<sanitized>";

/** Fields a copy is free to change: identity, what it points at, and text carrying embedded entity ids. */
const SANITIZED_KEYS = new Set(["id", "refId", "reference", "text"]);

/** Fields that may hold an entity id but just as well an ordinary value, such as a color or an alignment. */
const MAYBE_REFERENCE_KEYS = new Set(["value"]);

const marshaller = new PrintModelMarshaller();

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === "object" && !Array.isArray(value);
}

function collectIds(value: unknown, ids: Set<string>): void {
	if (Array.isArray(value)) {
		value.forEach(entry => collectIds(entry, ids));
		return;
	}
	if (!isPlainObject(value)) {
		return;
	}
	for (const [key, entry] of Object.entries(value)) {
		if (key === "id" && typeof entry === "string") {
			ids.add(entry);
		}
		collectIds(entry, ids);
	}
}

/** An empty list, or an entity that carries nothing but its own id - a copy fills in containers freely. */
function isEmptyContainer(value: unknown): boolean {
	if (Array.isArray(value)) {
		return value.length === 0;
	}
	if (!isPlainObject(value)) {
		return false;
	}
	return Object.entries(value).every(([key, entry]) => key === "id" || isEmptyContainer(entry));
}

function sanitize(value: unknown, ids: ReadonlySet<string>): unknown {
	if (Array.isArray(value)) {
		// a copy rebuilds the lists in its own order, and the ids that told the entries apart are gone by now
		return value
			.map(entry => sanitize(entry, ids))
			.map(entry => ({ entry, key: JSON.stringify(entry) }))
			.sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
			.map(({ entry }) => entry);
	}
	if (!isPlainObject(value)) {
		return value;
	}
	return Object.fromEntries(
		Object.keys(value)
			.sort()
			.filter(key => !isEmptyContainer(value[key]))
			.map(key => {
				const entry = value[key];
				const sanitizeIt =
					typeof entry === "string" &&
					(SANITIZED_KEYS.has(key) || (MAYBE_REFERENCE_KEYS.has(key) && ids.has(entry)));
				return [key, sanitizeIt ? SANITIZED : sanitize(entry, ids)];
			})
	);
}

/**
 * Brings a model into the form two copies of it can be compared in: serialized, so both sides go through the
 * same normalization, with every id, reference and text blanked out and every list in a fixed order. What
 * remains is the shape and the plain values - a copy has to keep those, everything else it may renumber.
 */
export function sanitizeModel(printModel: PrintModel): unknown {
	const serialized = marshaller.serialize(printModel).result;
	if (!serialized) {
		throw new Error(`Cannot serialize print model ${printModel.header.id}`);
	}

	const ids = new Set<string>();
	collectIds(serialized, ids);

	return sanitize(serialized, ids);
}
