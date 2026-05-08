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
import { jest } from "@jest/globals";
import { nanoid } from "nanoid";

import {
	Margins,
	MeasureUnit,
	PrintModelEntity,
	PartialValidPlaceableReference,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { DeepPartialRecursive } from "@com.mgmtp.a12.print/print-model-api/lib/utils/type-utils.js";

import { changePartialMarginValue } from "../../../main/typescript/internal/utils/margin-utils.js";

export function createPartialValidReference(
	x: number,
	y: number,
	minHeight: number,
	minWidth: number,
	top?: number,
	bottom?: number
): PartialValidPlaceableReference {
	let margins: (DeepPartialRecursive<Margins> & PrintModelEntity) | undefined = undefined;
	if (top || bottom) {
		margins = { id: nanoid() };

		if (top) {
			margins = changePartialMarginValue(top, "top");
		}

		if (bottom) {
			margins = changePartialMarginValue(bottom, "bottom", margins);
		}
	}
	return {
		id: nanoid(),
		refId: nanoid(),
		position: {
			id: nanoid(),
			y: {
				id: nanoid(),
				value: y,
				unit: MeasureUnit.Millimeter,
			},
			x: {
				id: nanoid(),
				value: x,
				unit: MeasureUnit.Millimeter,
			},
		},
		dimensions: {
			id: nanoid(),
			minHeight: {
				id: nanoid(),
				value: minHeight,
				unit: MeasureUnit.Millimeter,
			},
			minWidth: {
				id: nanoid(),
				value: minWidth,
				unit: MeasureUnit.Millimeter,
			},
		},
		margins,
	};
}

export const expectToThrow = (func: () => unknown, error?: string | RegExp | jest.Constructable | Error): void => {
	const spy = jest.spyOn(console, "error");
	spy.mockImplementation(() => undefined);

	expect(func).toThrow(error);

	spy.mockRestore();
};

export enum TestWarningIdentifier {
	ACT_WARNING = "inside a test was not wrapped in act",
	PRINT_UNKNOWN_ELEMENT = "Unknown element type",
	WDGET_SPREAD_KEY = 'A props object containing a "key" prop is being spread into JSX:',
}
export function setupIgnoreTestWarning(warningsToIgnore: TestWarningIdentifier[]) {
	beforeEach(() => {
		jest.spyOn(console, "error").mockImplementation(msg => {
			if (typeof msg === "string" && warningsToIgnore.some(warning => msg.includes(warning))) {
				return;
			}
			console.error(msg);
		});
	});
}
/**
 * Utility to mock fixed element sizes in JSDOM instead of the default 0 dimensions.
 * Useful to prevent infinite loops in tests when components (e.g. react-rnd) rely on element size for resizing or layout calculations.
 */
export function mockElementLayoutMetrics(width: number, height: number) {
	let originalOffsetWidth: PropertyDescriptor | undefined;
	let originalOffsetHeight: PropertyDescriptor | undefined;
	let originalGetBoundingClientRect: () => DOMRect;

	beforeAll(() => {
		originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
		originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
		originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

		Object.defineProperty(HTMLElement.prototype, "offsetWidth", { configurable: true, value: width });
		Object.defineProperty(HTMLElement.prototype, "offsetHeight", { configurable: true, value: height });
		Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
			configurable: true,
			value: () => ({
				width,
				height,
				top: 0,
				left: 0,
				bottom: height,
				right: width,
			}),
		});
	});

	afterAll(() => {
		if (originalOffsetWidth) {
			Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
		}
		if (originalOffsetHeight) {
			Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
		}
		if (originalGetBoundingClientRect) {
			Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
				configurable: true,
				value: originalGetBoundingClientRect,
			});
		}
	});
}
