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

import { Button } from "@com.mgmtp.a12.widgets/widgets-core/lib/button/main/button.view.js";
import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/main/icon.view.js";
import { addPrefix } from "@com.mgmtp.a12.widgets/widgets-core/lib/common/index.js";

export interface ReorderButtonProps {
	onUp(): void;
	onDown(): void;
	upDisabled?: boolean;
	downDisabled?: boolean;
	upButtonTitle?: string;
	downButtonTitle?: string;
}

export const ReorderButton = (props: ReorderButtonProps) => {
	const { upDisabled, upButtonTitle, onUp, downDisabled, downButtonTitle, onDown } = props;

	const onUpButtonClicked = (event: React.MouseEvent<HTMLElement, MouseEvent>): void => {
		onUp();
		event.stopPropagation();
	};

	const onDownButtonClicked = (event: React.MouseEvent<HTMLElement, MouseEvent>): void => {
		onDown();
		event.stopPropagation();
	};

	return (
		<div className={[addPrefix("button__icon--move", "h_inlineBlock", "h_middleAlign")].join(" ")} key="move">
			<Button
				disabled={upDisabled}
				icon={<Icon>keyboard_arrow_up</Icon>}
				title={upButtonTitle}
				onClick={onUpButtonClicked}
				key="up"
			/>
			<Button
				disabled={downDisabled}
				icon={<Icon>keyboard_arrow_down</Icon>}
				title={downButtonTitle}
				onClick={onDownButtonClicked}
				key="down"
			/>
		</div>
	);
};
