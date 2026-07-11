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
import type { PropsWithChildren } from "react";
import React from "react";

import type { Orientation } from "@com.mgmtp.a12.widgets/widgets-core";

import { useClickOutside } from "../../hooks/index.js";

import { StyledPopupContainer } from "./layout.styled.js";

interface PopupProps {
	position?: {
		clientX: number;
		clientY: number;
	};
	onClose?: () => void;
}

export const Popup: React.FunctionComponent<PropsWithChildren<PopupProps>> = ({ position, onClose, children }) => {
	const [orientation, setOrientation] = React.useState<Orientation>("top-start");
	const containerRef = React.useRef<HTMLElement>(null);

	useClickOutside(containerRef, () => {
		onClose?.();
	});

	React.useLayoutEffect(() => {
		if (!containerRef?.current || !position) {
			return;
		}

		const { height, width } = containerRef.current.getBoundingClientRect();

		const y = position.clientY + height >= document.documentElement.clientHeight ? "bottom" : "top";
		const x = position.clientX + width >= document.documentElement.clientWidth ? "end" : "start";

		setOrientation(`${y}-${x}`);

		return () => setOrientation("top-start");
	}, [containerRef, position]);

	if (!position || !containerRef) {
		return null;
	}

	const { clientX, clientY } = position;

	return (
		<StyledPopupContainer
			wrapperRef={ref => {
				containerRef.current = ref;
			}}
			clientX={clientX}
			clientY={clientY}
			orientation={orientation}
			data-testid="context-menu-popup"
		>
			{children}
		</StyledPopupContainer>
	);
};
