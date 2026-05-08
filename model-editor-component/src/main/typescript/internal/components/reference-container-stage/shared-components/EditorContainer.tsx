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
import * as React from "react";
import { useSelector } from "react-redux";

import { PrintEngineSelectors } from "../../../store/selectors.js";
import { EditorContext } from "../../editor-stage/editor-context.js";
import { BreadcrumbNavigation } from "../../breadcrumb-navigation/BreadcrumbNavigation.js";

import { StyledEditorContainer, StyledOuterEditorContainer } from "./Base.styled.js";

interface EditorContainerProps {
	numberOfPages: number;
	bodyRef?: React.MutableRefObject<HTMLDivElement | null>;
	editorRef?: React.MutableRefObject<HTMLDivElement | null>;
	renderTopSlots?: (
		bodyEl?: HTMLDivElement | null,
		editorEl?: HTMLDivElement | null,
		numberOfPages?: number
	) => React.ReactNode;
	containerId?: string;
}
export const EditorContainer = ({
	numberOfPages,
	children,
	bodyRef,
	editorRef,
	renderTopSlots,
	containerId,
}: React.PropsWithChildren<EditorContainerProps>) => {
	const { previousEditorRef } = React.useContext(EditorContext);

	const editorDimensions = useSelector(PrintEngineSelectors.editorDimensions);
	const zoomFactor = useSelector(PrintEngineSelectors.zoomFactor);

	const [bodyEl, setBodyEl] = React.useState<HTMLDivElement | null>(null);
	const [editorEl, setEditorEl] = React.useState<HTMLDivElement | null>(null);

	React.useLayoutEffect(() => {
		const container = bodyRef?.current ?? null;
		setBodyEl(container);
		setEditorEl(editorRef?.current ?? null);
		if (container) {
			container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;

			const preContainer = previousEditorRef?.current;
			container.scrollTop = containerId === preContainer?.id ? (preContainer?.scrollTop ?? 0) : 0;
		}
		return () => {
			if (container && containerId && previousEditorRef) {
				previousEditorRef.current = { id: containerId, scrollTop: container.scrollTop };
			}
		};
	}, [zoomFactor, bodyRef, editorRef, previousEditorRef, containerId]);

	return (
		<StyledOuterEditorContainer ref={bodyRef}>
			<BreadcrumbNavigation />
			{renderTopSlots?.(bodyEl, editorEl, numberOfPages)}
			<StyledEditorContainer
				numberOfPages={numberOfPages}
				zoomFactor={zoomFactor}
				editorDimensions={editorDimensions}
				ref={editorRef}
			>
				{children}
			</StyledEditorContainer>
		</StyledOuterEditorContainer>
	);
};
