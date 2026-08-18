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
import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";

import { EditorConst } from "../../../constant/editor.js";
import { PrintEngineSelectors } from "../../../store/selectors.js";

const { PX_TO_MM } = EditorConst;

/**
 * Measures the height of a DOM element in mm, normalized by the current zoom factor.
 * Uses a stable ref callback for initial measurement and a ResizeObserver to track
 * subsequent size changes (e.g. border width changes, content updates).
 *
 * @param initialHeightMm - Initial height value in mm (typically from the model)
 * @returns `ref` callback to attach to a div, and `heightMm` — the measured height in mm
 */
export const useMeasuredHeight = (initialHeightMm: number) => {
	const zoomFactor = useSelector(PrintEngineSelectors.zoomFactor);

	const [heightMm, setHeightMm] = useState(initialHeightMm);
	const elementRef = useRef<HTMLDivElement | null>(null);

	const ref = useCallback(
		(node: HTMLDivElement | null) => {
			elementRef.current = node;
			if (node) {
				setHeightMm(PX_TO_MM(Math.round(node.getBoundingClientRect().height / zoomFactor)));
			}
		},
		[zoomFactor]
	);

	useEffect(() => {
		const element = elementRef.current;
		if (!element) return;

		const observer = new ResizeObserver(() => {
			setHeightMm(PX_TO_MM(Math.round(element.getBoundingClientRect().height / zoomFactor)));
		});
		observer.observe(element);
		return () => observer.disconnect();
	}, [zoomFactor]);

	return { ref, heightMm };
};
