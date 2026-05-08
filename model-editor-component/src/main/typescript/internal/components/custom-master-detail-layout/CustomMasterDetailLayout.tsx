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

import {
	Animation,
	FocusLastLayout,
	Layoutable,
	LayoutResult,
	MasterDetail,
	MasterDetailLayout,
	ViewWidth,
} from "@com.mgmtp.a12.widgets/widgets-core/lib/layout/master-detail/index.js";
import { SizeDetectorProps } from "@com.mgmtp.a12.widgets/widgets-core/lib/layout/size-detector/main/size-detector.api.js";
import { PartialSwitch } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { PrintEngineSelectors } from "../../store/selectors.js";
import { EditorMode } from "../../redux/index.js";

import { FormContainer } from "../forms/index.js";
import { EditorContextWrapper } from "../editor-stage/EditorContextWrapper.js";

const MAIN_CONTAINER = "MainContainer";
const FORM_CONTAINER = "FormContainer";

interface ModelComponent extends Layoutable {
	id: string;
	name: string;
	key?: string;
}

interface IComponents {
	MainContainer: ModelComponent;
	FormContainer: ModelComponent;
}

const COMPONENTS: IComponents = {
	MainContainer: {
		id: MAIN_CONTAINER,
		key: MAIN_CONTAINER,
		name: MAIN_CONTAINER,
		preferredWidth: 8,
	},
	FormContainer: {
		id: FORM_CONTAINER,
		key: FORM_CONTAINER,
		name: FORM_CONTAINER,
		preferredWidth: 4,
	},
};

export const CustomMasterDetailLayout = () => {
	const wrapperElement = useSelector(PrintEngineSelectors.currentWrapperContainer);
	const currentDetailData = useSelector(PrintEngineSelectors.currentDetailData);
	const [layoutArrState, setLayoutArrState] = React.useState<ModelComponent[]>(Object.values(COMPONENTS));
	const [layoutPosMD, setLayoutPosMD] = React.useState<ModelComponent>(COMPONENTS.MainContainer);
	const [smallView, setSmallView] = React.useState<boolean>(false);
	const editorMode = useSelector(PrintEngineSelectors.editorMode);

	const layoutManager = new FocusLastLayout<ModelComponent>(layoutArrState);
	layoutManager.goto(layoutPosMD);
	layoutManager.columnCount =
		smallView || (wrapperElement && PartialSwitch.isInstance(wrapperElement)) || currentDetailData?.isFullScreenForm
			? 1
			: 2;
	const layout = layoutManager.layout();
	const isFormOpen = currentDetailData?.isFormOpen?.[editorMode];

	React.useEffect(() => {
		if (currentDetailData) {
			setLayoutArrState(Object.values(COMPONENTS));
			setLayoutPosMD(COMPONENTS.FormContainer);
		}
	}, [currentDetailData]);

	React.useEffect(() => {
		if (isFormOpen && [EditorMode.Default, EditorMode.Layout].includes(editorMode)) {
			setLayoutPosMD(layoutArrState[1]);
		} else {
			setLayoutPosMD(layoutArrState[0]);
		}
	}, [currentDetailData?.isFullScreenForm, isFormOpen, layoutArrState, editorMode]);

	const handleWindowSizeChanged = React.useCallback((breakPoint: SizeDetectorProps.BreakPoint): void => {
		setSmallView(breakPoint.size === "sm" || breakPoint.size === "xs");
	}, []);

	const animation: Animation = {
		enabled: true,
		animateSingleItem: smallView || (currentDetailData?.isFullScreenForm && isFormOpen) ? "rtl" : "ltr",
	};
	const visibleViews = useVisibleViews(layout);

	return <MasterDetail visibleViews={visibleViews} animation={animation} onSizeChange={handleWindowSizeChanged} />;
};

function useVisibleViews(layout: LayoutResult<ModelComponent>) {
	const visibleSlots = MasterDetailLayout.visible(layout);

	const currentDetailDataId = useSelector(PrintEngineSelectors.currentDetailDataId);

	return visibleSlots.map(v => {
		const isFormContainer =
			v.layoutable.name !== COMPONENTS.MainContainer.name || v.layoutable.name === COMPONENTS.FormContainer.name;
		return {
			width: v.width as ViewWidth,
			key: v.layoutable.key,
			element: isFormContainer ? <FormContainer key={currentDetailDataId} /> : <EditorContextWrapper />,
		};
	});
}
