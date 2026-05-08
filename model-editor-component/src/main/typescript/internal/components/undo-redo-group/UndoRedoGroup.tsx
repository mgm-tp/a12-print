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
import { useDispatch, useSelector } from "react-redux";

import { Button } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/index.js";
import { ButtonGroup } from "@com.mgmtp.a12.widgets/widgets-core/lib/button-group/index.js";
import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/index.js";

import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { InteractionLogActions } from "../../redux/index.js";

export const UndoRedoGroup = () => {
	const dispatch = useDispatch();
	const localizer = PrintLocalizer.useLocalizer();
	const { isUndoDisabled, isRedoDisabled } = useSelector(PrintEngineSelectors.undoRedoButtonState);

	const onUndoClick = React.useCallback(() => {
		dispatch(InteractionLogActions.undo());
	}, [dispatch]);

	const onRedoClick = React.useCallback(() => {
		dispatch(InteractionLogActions.redo());
	}, [dispatch]);

	const undoTitle = localizer(RESOURCE_KEYS.button.undo);
	const redoTitle = localizer(RESOURCE_KEYS.button.redo);
	return (
		<ButtonGroup>
			<Button title={undoTitle} onClick={onUndoClick} disabled={isUndoDisabled} icon={<Icon>undo</Icon>} />
			<Button title={redoTitle} onClick={onRedoClick} disabled={isRedoDisabled} icon={<Icon>redo</Icon>} />
		</ButtonGroup>
	);
};
