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
import { type PrintModelEntity } from "../model/index.js";

export type PlainDeepPartial<T> = {
	[K in keyof T]?: T[K] extends ReadonlyArray<infer U>
		? ReadonlyArray<PlainDeepPartial<U>>
		: T[K] extends ReadonlyArray<infer U> | undefined
			? ReadonlyArray<PlainDeepPartial<U>>
			: PlainDeepPartial<T[K]>;
};

/**
 * The difference between this and {@link PlainDeepPartial} is that this version keeps PrintModelEntity out of the recursion.
 */
export type DeepPartial<T> = T extends PrintModelEntity
	? DeepPartialRecursive<T> & PrintModelEntity
	: DeepPartialRecursive<T>;

export type DeepPartialRecursive<T> = {
	[K in keyof T]?: T[K] extends ReadonlyArray<infer U>
		? ReadonlyArray<DeepPartial<U>>
		: T[K] extends ReadonlyArray<infer U> | undefined
			? ReadonlyArray<DeepPartial<U>>
			: DeepPartial<T[K]>;
};

export type DeepMutable<T> = {
	-readonly [K in keyof T]: T[K] extends ReadonlyArray<infer U>
		? ReadonlyArray<DeepMutable<U>>
		: T[K] extends ReadonlyArray<infer U> | undefined
			? ReadonlyArray<DeepMutable<U>>
			: DeepMutable<T[K]>;
};

export type ExtractArrayType<T> = T extends readonly (infer U)[] ? U : T extends (infer V)[] ? V : T;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtractArrays<T> = Extract<T[keyof T], readonly any[] | any[]>;

export type Subtype<T> = {
	[key in keyof T]?: T[keyof T];
};

export type UnionToType<U> = {
	[K in U extends unknown ? keyof U : never]: U extends unknown ? (K extends keyof U ? U[K] : never) : never;
};

export type KeysOfUnion<T> = T extends T ? keyof T : never;

export type ArraysToSingleObject<T> = {
	[K in keyof T]: NonNullable<T[K]> extends ReadonlyArray<infer U> | Array<infer U>
		? ArraysToSingleObject<U>
		: NonNullable<T[K]> extends object
			? ArraysToSingleObject<NonNullable<T[K]>>
			: T[K];
};
