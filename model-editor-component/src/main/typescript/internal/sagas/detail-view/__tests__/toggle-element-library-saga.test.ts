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
import { SidebarItem } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";
import { ElementType } from "@com.mgmtp.a12.print/print-model-api/model";

import { EditorMode, NavigationActions } from "../../../redux/index.js";

import { handleToggleElementLibrary } from "../toggle-element-library-saga.js";

const ENTITY_ID = "segment-1";

/**
 * Steps the generator past its four selects and returns the value it yields next.
 * Select order: currentMode, currentElementContainerId, activeCanvasTab, currentForm.
 */
function runWith({ entityId, currentForm }: { entityId: string; currentForm?: { type: string } }) {
	const gen = handleToggleElementLibrary();
	gen.next(); // currentMode
	gen.next(EditorMode.Default); // currentElementContainerId
	gen.next(entityId); // activeCanvasTab
	gen.next(SidebarItem.SEGMENT); // currentForm
	return gen.next(currentForm);
}

describe("handleToggleElementLibrary", () => {
	test("opens the element library when no form is open", () => {
		const step = runWith({ entityId: ENTITY_ID });

		expect(step.done).toBe(false);
		expect(step.value).toMatchObject({
			payload: {
				action: NavigationActions.setDetailForm({
					tab: SidebarItem.SEGMENT,
					entityId: ENTITY_ID,
					mode: EditorMode.Default,
					form: { formStack: [{ type: "ElementLibrary" }] },
				}),
			},
		});
	});

	test("replaces an open element form with the element library", () => {
		const step = runWith({ entityId: ENTITY_ID, currentForm: { type: ElementType.Text, id: "element-1" } });

		expect(step.value).toMatchObject({
			payload: { action: { payload: { form: { formStack: [{ type: "ElementLibrary" }] } } } },
		});
	});

	test("closes the element library when it is already open", () => {
		const step = runWith({ entityId: ENTITY_ID, currentForm: { type: "ElementLibrary" } });

		expect(step.value).toMatchObject({ payload: { action: { payload: { form: undefined } } } });
	});

	test("does nothing while no entity is on the stage", () => {
		const gen = handleToggleElementLibrary();
		gen.next();
		gen.next(EditorMode.Default);
		gen.next(""); // no element container
		gen.next(SidebarItem.SEGMENT);
		expect(gen.next(undefined).done).toBe(true);
	});
});
