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

import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";
import { PartialValidPlaceableReference } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { PrintEngineSelectors } from "../../../store/selectors.js";
import { ElementsUtils } from "../../../utils/index.js";
import { PrintEngineState } from "../../../store/root-reducer.js";
import { EditorConst } from "../../../constant/editor.js";
import { EditorContext } from "../../editor-stage/editor-context.js";
import { DefaultElementBadgeWrapper } from "../../element-container/DefaultElementBadgeWrapper.js";
import { BasePreviewProps } from "../../../types/index.js";
import { DefaultElementContainer } from "../../element-container/DefaultElementContainer.js";
import { ReadOnlyMarginWrapper } from "../../margin/ReadOnlyMarginWrapper.js";

import { NewElementPreview } from "./NewElementPreview.js";
import { StyleDragPreviewElement } from "./DragElementLayerWrapper.styled.js";

const log = LoggerFactory.getLogger("PreviewElementContainer");

const { MM_TO_PX } = EditorConst;

interface PreviewElementContainerProps extends BasePreviewProps {
	selected: string[];
}

export const PreviewElementContainer = (props: PreviewElementContainerProps) => {
	const { mainTarget, zoomFactor, selected, newPos, snapOffset, newType } = props;

	if (newType) {
		return (
			<NewElementPreview
				newType={newType}
				newPos={newPos}
				snapOffset={snapOffset}
				zoomFactor={zoomFactor}
			></NewElementPreview>
		);
	}

	return selected.includes(mainTarget.refId) && selected.length > 1 ? (
		<GroupElementPreview {...props} />
	) : (
		<SingleElementPreview mainTarget={mainTarget} newPos={newPos} snapOffset={snapOffset} zoomFactor={zoomFactor} />
	);
};

interface GroupElementPreviewProps extends BasePreviewProps {
	selected: string[];
}

const GroupElementPreview = ({ mainTarget, zoomFactor, selected, newPos, snapOffset }: GroupElementPreviewProps) => {
	const printModelElements = useSelector((state: PrintEngineState) =>
		PrintEngineSelectors.multiplePrintModelElements(state, selected)
	);
	const isMarginVisible = useSelector(PrintEngineSelectors.isMarginVisible);

	const { elementReferences } = React.useContext(EditorContext);

	function getPreviewStyle(mainEl: PartialValidPlaceableReference, groupEl: PartialValidPlaceableReference) {
		const anyPMElement = printModelElements.find(el => el.id === groupEl.refId);
		if (!anyPMElement) {
			log.error(`PrintModelElement with id ${groupEl.refId} does not exist`);
			return { width: 0, height: 0, left: 0, top: 0, zoomFactor };
		}
		const height = MM_TO_PX(
			ElementsUtils.getFixedElementHeight(anyPMElement, mainEl) || groupEl.dimensions.minHeight.value
		);
		return {
			width: MM_TO_PX(groupEl.dimensions.minWidth.value),
			height,
			left:
				MM_TO_PX(newPos.x.value - mainEl.position.x.value + groupEl.position.x.value + snapOffset.x.value) *
				zoomFactor,
			top:
				MM_TO_PX(newPos.y.value - mainEl.position.y.value + groupEl.position.y.value + snapOffset.y.value) *
				zoomFactor,
		};
	}

	return (
		<>
			{elementReferences
				.filter(el => selected.includes(el.refId))
				.map(el => (
					<StyleDragPreviewElement
						style={getPreviewStyle(mainTarget, el)}
						zoomFactor={zoomFactor}
						key={el.refId}
					>
						<ReadOnlyMarginWrapper margins={el.margins} hideMargins={!isMarginVisible} highlight>
							<DefaultElementBadgeWrapper placeableRef={el}>
								<DefaultElementContainer reference={el} />
							</DefaultElementBadgeWrapper>
						</ReadOnlyMarginWrapper>
					</StyleDragPreviewElement>
				))}
		</>
	);
};

type SingleElementPreviewProps = BasePreviewProps;

const SingleElementPreview = ({ mainTarget, zoomFactor, newPos, snapOffset }: SingleElementPreviewProps) => {
	const printModelElement = useSelector((state: PrintEngineState) =>
		PrintEngineSelectors.printModelElement(state, mainTarget.refId)
	);
	const isMarginVisible = useSelector(PrintEngineSelectors.isMarginVisible);

	const style = {
		width: MM_TO_PX(mainTarget.dimensions.minWidth.value),
		height: MM_TO_PX(
			ElementsUtils.getFixedElementHeight(printModelElement, mainTarget) || mainTarget.dimensions.minHeight.value
		),
		left: MM_TO_PX(newPos.x.value + snapOffset.x.value) * zoomFactor,
		top: MM_TO_PX(newPos.y.value + snapOffset.y.value) * zoomFactor,
	};

	return (
		<StyleDragPreviewElement zoomFactor={zoomFactor} style={style}>
			<ReadOnlyMarginWrapper margins={mainTarget.margins} hideMargins={!isMarginVisible} highlight>
				<DefaultElementBadgeWrapper placeableRef={mainTarget}>
					<DefaultElementContainer reference={mainTarget} />
				</DefaultElementBadgeWrapper>
			</ReadOnlyMarginWrapper>
		</StyleDragPreviewElement>
	);
};
