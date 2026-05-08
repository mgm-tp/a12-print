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
/**
 * same as Boolean.compare(boolean a, boolean b) from Java
 *
 * @param a
 * @param b
 *
 * @returns
 * 0 if a is equal to b,
 * a negative value if a is false and b is true,
 * a positive value if a is true and b is false.
 */
export const compareBoolean = (a: boolean, b: boolean): number => {
	return a == b ? 0 : a ? 1 : -1;
};

/**
 * analogous to String.compareTo(String string) from Java
 * @param a
 * @param b
 * @returns
 * A negative number if referenceStr occurs before compareString; positive if the referenceStr occurs after compareString; 0 if they are equivalent.
 * In implementations with Intl. Collator, this is equivalent to new Intl. Collator(locales, options).compare(referenceStr, compareString).
 */
export const compareString = (a: string, b: string): number => {
	return a.localeCompare(b);
};

/**
 * same as Integer.compare from Java
 *
 * @param a
 * @param b
 *
 * @returns
 * the value 0 if x == y; a value less than 0 if x < y; and a value greater than 0 if x > y
 */
export const compareNumber = (a: number, b: number): number => {
	return a < b ? -1 : a == b ? 0 : 1;
};

export interface BiFunction<T, U, R> {
	(t: T, u: U): R;
}

export namespace Util {
	export interface Function<T, R> {
		(t: T): R;
	}
}

export interface BiConsumer<T, R> {
	(t: T, r: R): void;
}

export interface Consumer<T> {
	(value: T): void;
}

export interface Supplier<T> {
	(): T;
}

export interface IntPredicate {
	(i: number): boolean;
}

export class Stack<T> {
	private storage: T[] = [];

	push(item: T): void {
		this.storage.push(item);
	}

	pop(): T | undefined {
		return this.storage.pop();
	}

	peek(): T | undefined {
		return this.storage[this.size() - 1];
	}

	size(): number {
		return this.storage.length;
	}

	isEmpty(): boolean {
		return this.storage.length === 0;
	}
}
