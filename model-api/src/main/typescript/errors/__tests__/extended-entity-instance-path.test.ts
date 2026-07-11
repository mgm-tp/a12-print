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
import { DocumentServiceFactory, type EntityInstancePath } from "@com.mgmtp.a12.kernel/kernel-md-facade";

import testDocumentModelJson from "../../../../test/resources/document-models/simpleDM.json" with { type: "json" };

import { ExtendedEntityInstancePath, ExtendedEntityInstancePathBuilder } from "../index.js";

describe("ExtendedEntityInstancePath", () => {
	test("extendEntityInstancePath should correctly extend an EntityInstancePath", () => {
		const testDocumentModel = new DocumentServiceFactory()
			.getDocumentModelSerializer()
			.deserialize(JSON.stringify(testDocumentModelJson));

		const entityInstancePath = [
			{ elementName: "root", index: 0 },
			{ elementName: "field", index: 0 },
		] as EntityInstancePath;

		const extendedPath = ExtendedEntityInstancePath.extendEntityInstancePath(entityInstancePath, testDocumentModel);
		expect(extendedPath).toEqual([
			{ elementName: "root", index: 0, isRepeatable: true },
			{ elementName: "field", index: 0, isRepeatable: false },
		]);
	});
});

describe("ExtendedEntityInstancePathBuilder", () => {
	test("with should create a new builder with the given element", () => {
		const builder = new ExtendedEntityInstancePathBuilder();
		const newBuilder = builder.with("element", 0);
		expect(newBuilder).not.toBe(builder);
		expect(newBuilder.toArray()).toEqual([{ elementName: "element", index: 1, isRepeatable: true }]);
	});

	test("append should add an element to the existing builder", () => {
		const builder = new ExtendedEntityInstancePathBuilder().with("element1", 0);
		builder.append("element2", 1);
		expect(builder.toArray()).toEqual([
			{ elementName: "element1", index: 1, isRepeatable: true },
			{ elementName: "element2", index: 2, isRepeatable: true },
		]);
	});

	test("toArray should return the extended path as an array", () => {
		const builder = new ExtendedEntityInstancePathBuilder().with("element1", 0).with("element2", 1);
		expect(builder.toArray()).toEqual([
			{ elementName: "element1", index: 1, isRepeatable: true },
			{ elementName: "element2", index: 2, isRepeatable: true },
		]);
	});

	test("toString should return the extended path as a string", () => {
		const builder = new ExtendedEntityInstancePathBuilder().with("element1", 0).with("element2", 1);
		expect(builder.toString()).toBe("element1[1].element2[2]");
	});

	test("toModelPath should convert the extended path to a ModelPath", () => {
		const extendedPath: ExtendedEntityInstancePath = [
			{ elementName: "element1", index: 0, isRepeatable: true },
			{ elementName: "element2", index: 1, isRepeatable: false },
		];
		const builder = new ExtendedEntityInstancePathBuilder(extendedPath);
		expect(builder.toModelPath()).toEqual([{ elementName: "element1" }, { elementName: "element2" }]);
	});

	test("toEntityInstancePath should convert the extended path to an EntityInstancePath", () => {
		const extendedPath: ExtendedEntityInstancePath = [
			{ elementName: "element1", index: 0, isRepeatable: true },
			{ elementName: "element2", index: 1, isRepeatable: false },
		];
		const builder = new ExtendedEntityInstancePathBuilder(extendedPath);
		expect(builder.toEntityInstancePath()).toEqual([
			{ elementName: "element1", index: 0 },
			{ elementName: "element2", index: 1 },
		]);
	});

	test("clone should create a new builder with the same path", () => {
		const builder = new ExtendedEntityInstancePathBuilder().with("element1", 0).with("element2", 1);
		const clonedBuilder = builder.clone();
		expect(clonedBuilder).not.toBe(builder);
		expect(clonedBuilder.toArray()).toEqual(builder.toArray());
	});

	test("fromArray should create a builder from an array", () => {
		const extendedPath: ExtendedEntityInstancePath = [
			{ elementName: "element1", index: 0, isRepeatable: true },
			{ elementName: "element2", index: 1, isRepeatable: false },
		];
		const builder = ExtendedEntityInstancePathBuilder.fromArray(extendedPath);
		expect(builder.toArray()).toEqual(extendedPath);
	});

	test("createPathElement should create a new path element", () => {
		const pathElement = ExtendedEntityInstancePathBuilder.createPathElement("element", 0);
		expect(pathElement).toEqual({ elementName: "element", index: 1, isRepeatable: true });
	});
});
