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
import cloneDeep from "lodash/cloneDeep.js";

import type { PrintModelDTO } from "@com.mgmtp.a12.print/print-model-api/generated/a12internal";

import printModelDTO from "../../../../../test/resources/print-models/PrintModel-with-text.json" with { type: "json" };

import { PrintPreviewValidator } from "../print-preview-validator.js";

type SegmentsDTO = NonNullable<PrintModelDTO["content"]["segments"]>;

const fragmentReference: NonNullable<SegmentsDTO["fragmentReferences"]>[number] = {
	id: "fragmentSegmentReference",
	refId: "segmentInFragment",
	model: "fragmentPrintModel",
};

const segmentReference: NonNullable<SegmentsDTO["references"]>[number] = {
	id: "dinTemplateReference",
	purpose: "DINTemplate",
	direction: "OutgoingReference",
	referenceModel: "DINTemplatePrintModel",
	refIds: [{ id: "dinTemplateRefId", refId: "Template1" }],
};

function validateWithSegments(segments: SegmentsDTO | undefined): PrintPreviewValidator.PrintPreviewValidationResult {
	const model = cloneDeep(printModelDTO) as PrintModelDTO;
	model.content.segments = segments;
	return PrintPreviewValidator.validate(model);
}

function emptySegments(): SegmentsDTO {
	return { id: "segmentsContainer", definitions: [], references: [] };
}

describe("PrintPreviewValidator — NO_SEGMENT rule", () => {
	it("reports no error when the model has segment definitions", () => {
		const result = PrintPreviewValidator.validate(cloneDeep(printModelDTO) as PrintModelDTO);

		expect(result.noErrorOccurred).toBe(true);
		expect(result.errors).toEqual([]);
	});

	it("reports NO_SEGMENT when definitions, references and fragment references are all empty", () => {
		const result = validateWithSegments({ ...emptySegments(), fragmentReferences: [] });

		expect(result.noErrorOccurred).toBe(false);
		expect(result.errors).toEqual([
			{ errorCode: PrintPreviewValidator.PreviewRuleCode.NO_SEGMENTS, severity: "ERROR" },
		]);
	});

	it("reports NO_SEGMENT when definitions and references are empty and fragment references are absent", () => {
		const result = validateWithSegments(emptySegments());

		expect(result.noErrorOccurred).toBe(false);
		expect(result.errors?.[0]?.errorCode).toBe(PrintPreviewValidator.PreviewRuleCode.NO_SEGMENTS);
	});

	it("reports no error when the only segments come from a fragment reference", () => {
		const result = validateWithSegments({ ...emptySegments(), fragmentReferences: [fragmentReference] });

		expect(result.noErrorOccurred).toBe(true);
		expect(result.errors).toEqual([]);
	});

	// A DIN template reference is not a printable segment: it is only pointed at by a segment
	// definition via its `dinTemplate.referenceId`, so on its own it renders nothing.
	it("reports NO_SEGMENT when only a DIN template reference is left", () => {
		const result = validateWithSegments({ ...emptySegments(), references: [segmentReference] });

		expect(result.noErrorOccurred).toBe(false);
		expect(result.errors?.[0]?.errorCode).toBe(PrintPreviewValidator.PreviewRuleCode.NO_SEGMENTS);
	});

	it("reports no error when a fragment reference exists next to a DIN template reference", () => {
		const result = validateWithSegments({
			...emptySegments(),
			references: [segmentReference],
			fragmentReferences: [fragmentReference],
		});

		expect(result.noErrorOccurred).toBe(true);
		expect(result.errors).toEqual([]);
	});

	// The segments container itself is mandatory in the meta model, so a model without it never
	// reaches the rule — it is already rejected by the deserializer.
	it("rejects a model without a segments container before the rule is evaluated", () => {
		expect(() => validateWithSegments(undefined)).toThrow();
	});
});
