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

import type { ElementMap } from "../../types/index.js";

import { getShortcutText, downloadFile, getItemsFromElementMap } from "../utils.js";

import { elementMap } from "./__testdata__/elementMap.js";

describe("utils", () => {
	describe("getItemsFromElementMap", () => {
		const groups = ["/general", "/general/phone", "nonExistentGroup"];
		groups.forEach(group => {
			it(`should return correct items for given group ${group}`, () => {
				const resultsString = JSON.stringify(getItemsFromElementMap(group, elementMap as ElementMap));
				expect(resultsString).toMatchSnapshot();
			});
		});
	});

	describe("downloadFile", () => {
		it("should create an anchor and triggers download with the specified source and file name", () => {
			const source = "http://example.com/image.png";
			const fileName = "testImage.png";
			const createElementSpy = jest
				.spyOn(document, "createElement")
				.mockImplementation(() => ({ click: jest.fn() }) as unknown as HTMLAnchorElement);

			downloadFile(source, fileName);

			const mockAnchor = createElementSpy.mock.results[0].value;
			expect(createElementSpy).toHaveBeenCalledWith("a");
			expect(mockAnchor.href).toBe(source);
			expect(mockAnchor.download).toBe(fileName);
			expect(mockAnchor.target).toBe("_blank");
			expect(mockAnchor.click).toHaveBeenCalled();

			createElementSpy.mockRestore();
		});

		it("should create an anchor and triggers download with the specified source and default file name", () => {
			const source = "http://example.com/image.png";
			const createElementSpy = jest
				.spyOn(document, "createElement")
				.mockImplementation(() => ({ click: jest.fn() }) as unknown as HTMLAnchorElement);

			downloadFile(source);

			const mockAnchor = createElementSpy.mock.results[0].value;
			expect(createElementSpy).toHaveBeenCalledWith("a");
			expect(mockAnchor.href).toBe(source);
			expect(mockAnchor.download).toBe("image");
			expect(mockAnchor.target).toBe("_blank");
			expect(mockAnchor.click).toHaveBeenCalled();

			createElementSpy.mockRestore();
		});
	});

	describe("getShortcutText", () => {
		it("should return the key when no modifiers are provided", () => {
			expect(getShortcutText("A")).toBe("A");
			expect(getShortcutText(" A ")).toBe("A");
		});

		it("should use modifiers keys", () => {
			expect(getShortcutText("A", { withCtrl: true })).toBe("Ctrl + A");
			expect(getShortcutText("A", { withAlt: true })).toBe("Alt + A");
			expect(getShortcutText("A", { withShift: true })).toBe("Shift + A");
			expect(getShortcutText("A", { withAlt: true, withCtrl: true, withShift: true })).toBe(
				"Ctrl + Alt + Shift + A"
			);
		});

		it("should return empty string for an empty key", () => {
			expect(getShortcutText("")).toBe("");
			expect(getShortcutText("", { withAlt: true })).toBe("");
		});
	});
});
