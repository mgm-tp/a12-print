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
import { useSelector } from "react-redux";
import { fireEvent } from "@testing-library/react";

import { renderWithProviders } from "../../../../../../test/typescript/test-utils/index.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";

import { ZoomFactor } from "../toolbar-item/ZoomFactor.js";

const ZoomedComponent = () => {
	const { editorOptions } = useSelector(PrintEngineSelectors.printEditorState);
	const { zoomFactor } = editorOptions;

	return <div style={{ height: 100 * zoomFactor, width: 100 * zoomFactor }}>Zoomed</div>;
};

describe("zoomLevelSelect", () => {
	it("should change zoom level correctly", () => {
		const { getByRole, getByText } = renderWithProviders(
			<>
				<ZoomFactor />
				<ZoomedComponent />
			</>
		);

		expect(getByRole("combobox")).toHaveValue("1");
		expect(getByText("Zoomed")).toHaveStyle({ height: "100px", width: "100px" });

		fireEvent.change(getByRole("combobox"), { target: { value: "0.5" } });
		expect(getByRole("combobox")).toHaveValue("0.5");
		expect(getByText("Zoomed")).toHaveStyle({ height: "50px", width: "50px" });

		fireEvent.change(getByRole("combobox"), { target: { value: "1.5" } });
		expect(getByRole("combobox")).toHaveValue("1.5");
		expect(getByText("Zoomed")).toHaveStyle({ height: "150px", width: "150px" });
	});
});
