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
import {
	MeasureUnit,
	type ModelReferenceEntity,
	PageOrientation,
	type PrintModel,
	type Section,
	SectionUsage,
} from "../../../model/index.js";
import {
	clonePrintModel,
	ERROR_FORBID_COPY_DIN_REFERENCE,
	ERROR_FORBID_COPY_FRAGMENT_MODEL,
	ERROR_FORBID_COPY_FRAGMENT_REFERENCE,
	ERROR_FORBID_COPY_MULTIPLE_DOCUMENT_REFERENCES,
} from "../../../utils/index.js";
import printModelFixtureRaw from "../../../../../test/resources/print-models/PrintModel-with-text.json" with { type: "json" };
import { deserializeFixture } from "../../../../../test/typescript/test-utils/walker-test-utils.js";

import { clonePrintModelAsFragment } from "../clonePrintModelAsFragment.js";

const printModel = deserializeFixture(printModelFixtureRaw);

describe("clonePrintModelAsFragment", () => {
	const makeSection = (id: string, sectionUsage: SectionUsage): Section => ({
		id,
		title: `Title of ${id}`,
		sectionUsage,
		pageOrientation: PageOrientation.Portrait,
		footerHeight: { id: `${id}-footer`, value: 10, unit: MeasureUnit.Millimeter },
		headerHeight: { id: `${id}-header`, value: 20, unit: MeasureUnit.Millimeter },
		elementReferences: [],
	});

	const withSections = (...usages: SectionUsage[]): PrintModel => {
		const sections = usages.map((usage, index) => makeSection(`sec-${index}`, usage));
		return {
			...printModel,
			content: {
				...printModel.content,
				general: {
					...printModel.content.general,
					sections: sections.map(section => section.id),
				},
				sections: {
					id: "sections-container",
					definitions: sections,
					references: [],
				},
			},
		};
	};

	test("appends the fragment sub type annotation to the existing annotations", () => {
		const fragment = clonePrintModelAsFragment(printModel);

		expect(fragment.header.annotations).toEqual([
			...(printModel.header.annotations ?? []),
			{ id: expect.any(String), name: "modelSubType", value: "fragment" },
		]);
	});

	test("adds the fragment sub type annotation when the model has none", () => {
		const withoutAnnotations: PrintModel = {
			...printModel,
			header: { ...printModel.header, annotations: undefined },
		};

		const fragment = clonePrintModelAsFragment(withoutAnnotations);

		expect(fragment.header.annotations).toEqual([
			{ id: expect.any(String), name: "modelSubType", value: "fragment" },
		]);
	});

	test("does not annotate the source model", () => {
		const annotationsBefore = printModel.header.annotations?.length;

		clonePrintModelAsFragment(printModel);

		expect(printModel.header.annotations?.length).toBe(annotationsBefore);
	});

	test("clears all metadata computations", () => {
		expect(printModel.content.general.metadata.titleComputation).not.toEqual([]);

		const fragment = clonePrintModelAsFragment(printModel);

		expect(fragment.content.general.metadata).toEqual({
			id: expect.any(String),
			titleComputation: [],
			descriptionComputation: [],
			authorComputation: [],
			languageComputation: [],
		});
		expect(fragment.content.general.metadata.id).not.toBe(printModel.content.general.metadata.id);
	});

	test("keeps the remaining general properties of the clone", () => {
		const clone = clonePrintModel(printModel, "some-id");
		const fragment = clonePrintModelAsFragment(printModel, "some-id");

		expect(fragment.content.general.segmentDefaults).toEqual({
			...clone.content.general.segmentDefaults,
			id: expect.any(String),
		});
		expect(fragment.content.general.structure.length).toBe(clone.content.general.structure.length);
		expect(fragment.content.segments.definitions.length).toBe(clone.content.segments.definitions.length);
		expect(fragment.content.textStyles?.definitions.length).toBe(clone.content.textStyles?.definitions.length);
	});

	test("sets the section usage of every section to First", () => {
		const fragment = clonePrintModelAsFragment(withSections(SectionUsage.First, SectionUsage.Remaining));

		expect(fragment.content.sections?.definitions.map(section => section.sectionUsage)).toEqual([
			SectionUsage.First,
			SectionUsage.First,
		]);
	});

	test("keeps the other section properties untouched", () => {
		const fragment = clonePrintModelAsFragment(withSections(SectionUsage.Remaining));

		expect(fragment.content.sections?.definitions[0]).toEqual(
			expect.objectContaining({
				title: "Title of sec-0",
				pageOrientation: PageOrientation.Portrait,
				sectionUsage: SectionUsage.First,
			})
		);
		expect(fragment.content.sections?.references).toEqual([]);
	});

	test("handles a model without section definitions", () => {
		const fragment = clonePrintModelAsFragment(printModel);

		expect(fragment.content.sections?.definitions).toEqual([]);
	});

	test("creates a copy with _copy suffix when no custom id is given", () => {
		const fragment = clonePrintModelAsFragment(printModel);

		expect(fragment.header.id).toBe(`${printModel.header.id}_copy`);
	});

	test("uses the provided printModelId for the fragment header", () => {
		const fragment = clonePrintModelAsFragment(printModel, "my-fragment");

		expect(fragment.header.id).toBe("my-fragment");
	});

	test("regenerates all element definition ids", () => {
		const fragment = clonePrintModelAsFragment(printModel);

		expect(fragment.content.elementDefinitions.map(element => element.id)).not.toEqual(
			printModel.content.elementDefinitions.map(element => element.id)
		);
		expect(fragment.content.elementDefinitions.length).toBe(printModel.content.elementDefinitions.length);
	});

	test("throws when the model has a DINTemplate reference", () => {
		const dinModel: PrintModel = {
			...printModel,
			header: {
				...printModel.header,
				modelReferences: [
					{
						id: "printDINRef",
						modelType: "print",
						purpose: "DINTemplate",
						reference: "someRef",
					},
				],
			},
		};

		expect(() => clonePrintModelAsFragment(dinModel)).toThrow(ERROR_FORBID_COPY_DIN_REFERENCE);
	});

	const withModelReferences = (...modelReferences: ModelReferenceEntity[]): PrintModel => ({
		...printModel,
		header: { ...printModel.header, modelReferences },
	});

	test("marks the copy as a fragment model on the header", () => {
		const fragment = clonePrintModelAsFragment(printModel);

		expect(fragment.header.modelSubType).toBe("fragment");
	});

	test("throws when the model is already a fragment model", () => {
		const fragmentModel: PrintModel = {
			...printModel,
			header: { ...printModel.header, modelSubType: "fragment" },
		};

		expect(() => clonePrintModelAsFragment(fragmentModel)).toThrow(ERROR_FORBID_COPY_FRAGMENT_MODEL);
	});

	test("throws when the model is annotated as a fragment model", () => {
		const annotatedModel: PrintModel = {
			...printModel,
			header: {
				...printModel.header,
				annotations: [{ id: "a-1", name: "modelSubType", value: "fragment" }],
			},
		};

		expect(() => clonePrintModelAsFragment(annotatedModel)).toThrow(ERROR_FORBID_COPY_FRAGMENT_MODEL);
	});

	test("throws when the model references a fragment model", () => {
		const model = withModelReferences({
			id: "fragmentRef",
			modelType: "print",
			purpose: "print-fragment",
			reference: "SomeFragmentModel",
		});

		expect(() => clonePrintModelAsFragment(model)).toThrow(ERROR_FORBID_COPY_FRAGMENT_REFERENCE);
	});

	test("throws when the model has more than one document model reference", () => {
		const model = withModelReferences(
			{ id: "docA", modelType: "document", purpose: "data binding", reference: "DomainA" },
			{ id: "docB", modelType: "document", purpose: "data binding", reference: "DomainB" }
		);

		expect(() => clonePrintModelAsFragment(model)).toThrow(ERROR_FORBID_COPY_MULTIPLE_DOCUMENT_REFERENCES);
	});

	test("allows a single document model reference", () => {
		const model = withModelReferences({
			id: "docA",
			modelType: "document",
			purpose: "data binding",
			reference: "DomainA",
		});

		expect(() => clonePrintModelAsFragment(model)).not.toThrow();
	});

	test("does not duplicate the fragment annotation of a copied fragment model", () => {
		const fragment = clonePrintModelAsFragment(printModel);

		expect(() => clonePrintModelAsFragment(fragment)).toThrow(ERROR_FORBID_COPY_FRAGMENT_MODEL);
	});
});
