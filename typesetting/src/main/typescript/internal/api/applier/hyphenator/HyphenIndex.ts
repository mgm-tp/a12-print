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
import type { Index } from "../../../../a12internal/api/model/index.js";

export class HyphenIndex {
	constructor(inputLength?: number, indices?: Index[]) {
		if (inputLength) {
			this._indices = new Array(Math.floor(inputLength / 4));
			return;
		}

		if (indices) {
			this._indices = indices.map(index => (typeof index.v === "number" ? index.v : parseInt(index.v)));
			return;
		}

		throw new Error("Invalid parameters");
	}

	private _indices: number[];

	get indices(): number[] {
		return this._indices;
	}

	private _length = 0;

	get length(): number {
		return this._length;
	}

	public add(index: number): void {
		if (this._length === this._indices.length) {
			this.resize();
		}
		this._indices[this._length++] = index;
	}

	private resize(): void {
		this._indices = [...this._indices, 0];
	}
}
