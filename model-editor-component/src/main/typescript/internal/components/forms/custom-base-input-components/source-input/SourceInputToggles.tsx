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
import { useMemo } from "react";

import { Icon } from "@com.mgmtp.a12.widgets/widgets-core";
import { PossibleInputSource } from "@com.mgmtp.a12.print/print-model-api/lib/input-source/index.js";

import { PrintLocalizer } from "../../../../localization/index.js";

import { InputSourceMetadataMap } from "./input-source-metadata-map.js";
import { StyledCustomToggle, StyledCustomToggleItem } from "./SourceInputToggles.styled.js";

import useLocalizer = PrintLocalizer.useLocalizer;

export interface SourceInputTogglesProps {
	possibleInputSources: PossibleInputSource[] | undefined;
	source?: string;
	onValueChanged: (newValue: string, oldValue?: string) => void;
	showOnlySelectedOption?: boolean;
}

export const SourceInputToggles = (props: SourceInputTogglesProps) => {
	const { possibleInputSources, source, onValueChanged, showOnlySelectedOption } = props;
	const localizer = useLocalizer();

	const inputSources = useMemo(() => {
		if (!possibleInputSources) {
			return null;
		}

		return possibleInputSources
			.map(possibleInputSource => {
				return {
					possibleInputSource,
					metadata: InputSourceMetadataMap[possibleInputSource],
				};
			})
			.sort((source1, source2) => {
				return source1.metadata.order - source2.metadata.order;
			})
			.map(source => {
				const { metadata, possibleInputSource } = source;
				const { icon, title } = metadata;
				return (
					<StyledCustomToggleItem
						id={possibleInputSource.toString()}
						title={localizer(title)}
						key={possibleInputSource}
						value={possibleInputSource.toString()}
					>
						<Icon style={{ margin: 0 }}>{icon}</Icon>
					</StyledCustomToggleItem>
				);
			});
	}, [possibleInputSources, localizer]);

	return (
		<StyledCustomToggle
			showOnlySelectedOption={showOnlySelectedOption}
			value={source}
			onValueChanged={onValueChanged}
		>
			{inputSources}
		</StyledCustomToggle>
	);
};
