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
import { useDispatch, useSelector } from "react-redux";
import { memo } from "react";

import { ApplicationFrame, ApplicationHeader } from "@com.mgmtp.a12.widgets/widgets-core";
import { Button } from "@com.mgmtp.a12.widgets/widgets-core";

import { TestAppSelector } from "../../store/app";
import { EditorActions, EditorSelector } from "../../store/editor";

import { AppSubContent } from "../sub-content/AppSubContent";
import { AppContent } from "../main-content/AppContent";

export const AppLayout = memo(function AppLayout() {
	const isSidebarContentOpen = useSelector(TestAppSelector.selectIsSidebarContentOpen);
	const isBasicEditorPossible = useSelector(EditorSelector.selectIsBasicEditorPossible);
	const isBasicEditor = useSelector(EditorSelector.selectIsBasicEditor);

	const dispatch = useDispatch();

	return (
		<ApplicationFrame
			content={<AppContent />}
			main={
				<ApplicationHeader
					leftSlots={<span>Test App</span>}
					rightSlots={
						<Button
							disabled={!isBasicEditorPossible}
							onClick={event => {
								event.stopPropagation();
								dispatch(EditorActions.toggleIsBasicEditor());
							}}
						>
							{isBasicEditor ? "Light Editor" : "Full Editor"}
						</Button>
					}
				/>
			}
			sub={<AppSubContent />}
			disableCollapsingSub
			closeSubOnClickOutside
			subExpanded={isSidebarContentOpen}
			subExpandedState="minimized"
			subResizableOptions={{ minWidth: 300, maxWidth: 800 }}
		/>
	);
});
