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
import { nanoid } from "nanoid";

import type { BaseColumnType, TableRenderPropsType } from "@com.mgmtp.a12.widgets/widgets-core";
import { DefaultTableComponentRenderers, Table, generateUid } from "@com.mgmtp.a12.widgets/widgets-core";
import type { DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/errors";
import type { GroupPropertyComputations } from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";
import { ListingRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../../../localization/index.js";
import { ValidationCounter } from "../../../../../redux/index.js";
import { FormContainerHeadline } from "../../../shared-components/FormContainerHeadline.js";
import { AddButtonGroup } from "../../../shared-components/AddButtonGroup.js";
import { ActionColumnButtonGroup } from "../../../shared-components/ActionColumnButtonGroup.js";
import { BadgeGroup } from "../../../../badge/BadgeGroup.js";
import { useGroupPropertyItems } from "../../constants/properties.js";
import { useListingPropertiesTableHandler } from "../../hooks/use-listing-properties-table-handler.js";

enum PropertyComputationKey {
	groupPath = "groupPath",
	property = "property",
	action = "action",
}

interface GroupTablePropertyComputationProps {
	elementId: string;
	propertyComputations: DeepPartial<GroupPropertyComputations>[];
	handleDeleteRow: (rowIndex: number) => void;
	updatePropertyComputations: (newComputations: DeepPartial<GroupPropertyComputations>[]) => void;
	propertyComputationErrorMap?: DeepPartialErrorMap<GroupPropertyComputations>[];
}

export function GroupTablePropertyComputation({
	elementId,
	propertyComputations,
	handleDeleteRow,
	updatePropertyComputations,
	propertyComputationErrorMap,
}: Readonly<GroupTablePropertyComputationProps>) {
	const localizer = PrintLocalizer.useLocalizer();
	const propertyItems = useGroupPropertyItems();
	const columns = useColumns();

	const { labeledPropertyComputations, openPropertyComputationForm } =
		useListingPropertiesTableHandler<GroupPropertyComputations>(
			elementId,
			propertyComputations,
			propertyItems,
			ListingRegion.GROUP_PROPERTY_COMPUTATION_FORM,
			"Main"
		);

	const onAddPropertyComputation = React.useCallback(() => {
		const propertyCompId = nanoid();
		updatePropertyComputations([
			...propertyComputations,
			{ id: propertyCompId } as DeepPartial<GroupPropertyComputations>,
		]);
		openPropertyComputationForm(propertyComputations.length, propertyCompId);
	}, [updatePropertyComputations, propertyComputations, openPropertyComputationForm]);

	const onClickEditPropertyComputation = React.useCallback(
		(rowIndex: number, propertyCompId: string) => {
			openPropertyComputationForm(rowIndex, propertyCompId);
		},
		[openPropertyComputationForm]
	);

	const componentRenderers = React.useMemo(() => {
		const bodyContentRenderer = (
			props: TableRenderPropsType.BodyContentProps<DeepPartial<GroupPropertyComputations>>
		) => {
			if (props.column.dataKey === PropertyComputationKey.action) {
				return (
					<ActionColumnButtonGroup
						key={generateUid()}
						onEdit={() => onClickEditPropertyComputation(props.rowIndex, props.row.id)}
						onDelete={() => handleDeleteRow(props.rowIndex)}
					/>
				);
			}

			if (props.column.dataKey === PropertyComputationKey.groupPath) {
				return props.row.groupPath ? <GroupPathColumn groupPath={props.row.groupPath} /> : null;
			}
			return DefaultTableComponentRenderers.bodyContentRenderer(props);
		};

		const bodyRowRenderer = (props: TableRenderPropsType.BodyRowProps<DeepPartial<GroupPropertyComputations>>) => {
			return (
				<React.Fragment key={props.rowIndex}>
					<BadgeGroup
						validationCounter={ValidationCounter.from(propertyComputationErrorMap?.[props.rowIndex])}
						standalone
					/>
					{DefaultTableComponentRenderers.bodyRowRenderer(props)}
				</React.Fragment>
			);
		};

		return { bodyContentRenderer, bodyRowRenderer };
	}, [onClickEditPropertyComputation, handleDeleteRow, propertyComputationErrorMap]);

	return (
		<>
			<FormContainerHeadline
				label={localizer(RESOURCE_KEYS.elementForm.listing.groupPropertyComputation.headline)}
			/>
			<div>
				<Table<DeepPartial<GroupPropertyComputations>>
					data={labeledPropertyComputations}
					columns={columns}
					componentRenderers={componentRenderers}
				/>
			</div>
			<AddButtonGroup onClick={onAddPropertyComputation} className="-u-margin-b-lg" />
		</>
	);
}

const GroupPathColumn = ({ groupPath }: { groupPath: string }) => {
	const paths = groupPath.split("/").filter(Boolean);

	if (paths.length <= 2) {
		return <>{groupPath}</>;
	}

	const lastPaths = paths.splice(-2);

	return <p title={groupPath}>.../{lastPaths.join("/")}</p>;
};

function useColumns(): BaseColumnType[] {
	const localizer = PrintLocalizer.useLocalizer();

	return React.useMemo(
		() => [
			{
				label: localizer(RESOURCE_KEYS.elementForm.listing.groupPropertyComputation.groupPath),
				dataKey: PropertyComputationKey.groupPath,
			},
			{
				label: localizer(RESOURCE_KEYS.elementForm.listing.groupPropertyComputation.property),
				dataKey: PropertyComputationKey.property,
			},
			{
				label: "",
				dataKey: PropertyComputationKey.action,
				pinning: "right",
				actionColumn: true,
				horizontalAlignment: "center",
			},
		],
		[localizer]
	);
}
