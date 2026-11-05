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
import React from "react";

import { Icon, Toggle, type DropDownItem } from "@com.mgmtp.a12.widgets/widgets-core";
import { PageOrientation } from "@com.mgmtp.a12.print/print-model-api/model";

import { PrintLocalizer, RESOURCE_KEYS } from "../../localization/index.js";

export const PageOrientationToggle = ({
	pageOrientation,
	setPageOrientation,
	setSelectedTemplateSegment,
}: {
	pageOrientation: PageOrientation;
	setPageOrientation: (orientation: PageOrientation) => void;
	setSelectedTemplateSegment?: (segment: DropDownItem | undefined) => void;
}) => {
	const localizer = PrintLocalizer.useLocalizer();
	const pageOrientations = usePageOrientation();

	const onPageOrientationChanged = React.useCallback(
		(value: string) => {
			const newPageOrientation = value as PageOrientation;
			if (pageOrientation !== newPageOrientation) {
				setPageOrientation(newPageOrientation);
				setSelectedTemplateSegment?.(undefined);
			}
		},
		[pageOrientation, setPageOrientation, setSelectedTemplateSegment]
	);

	return (
		<Toggle value={pageOrientation} onValueChanged={onPageOrientationChanged}>
			{pageOrientations.map(item => (
				<Toggle.Item
					key={item.value}
					style={{ ...item.styles }}
					value={item.value}
					data-testid={`toggle-${item.value}`}
				>
					<Icon title={localizer(item.title)}>{item.icon}</Icon>
				</Toggle.Item>
			))}
		</Toggle>
	);
};

const usePageOrientation = (): {
	icon: string;
	title: string;
	value: PageOrientation;
	styles: React.CSSProperties;
}[] => {
	const localizer = PrintLocalizer.useLocalizer();

	return [
		{
			icon: "description",
			title: localizer(RESOURCE_KEYS.editor.pageOrientation.portrait),
			value: PageOrientation.Portrait,
			styles: { borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
		},
		{
			icon: "topic",
			title: localizer(RESOURCE_KEYS.editor.pageOrientation.landscape),
			value: PageOrientation.Landscape,
			styles: { borderTopRightRadius: 4, borderBottomRightRadius: 4 },
		},
	];
};
