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
import type { ColumnPropertyComputations } from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";
import { ListingRegion } from "@com.mgmtp.a12.print/print-model-api-utils/a12internal";

import { PrintLocalizer, RESOURCE_KEYS } from "../../../../localization/index.js";
import type { PropertyComputationField } from "../../../../redux/index.js";
import { ValidationCounter } from "../../../../redux/index.js";
import { FormContainerHeadline } from "../../shared-components/FormContainerHeadline.js";
import { AddButtonGroup } from "../../shared-components/AddButtonGroup.js";
import { ActionColumnButtonGroup } from "../../shared-components/ActionColumnButtonGroup.js";
import { BadgeGroup } from "../../../badge/BadgeGroup.js";

import { useColumnPropertyItems } from "../constants/properties.js";
import { useListingPropertiesTableHandler } from "../hooks/use-listing-properties-table-handler.js";

enum PropertyComputationKey {
	property = "property",
	action = "action",
}

interface ColumnTablePropertyComputationProps {
	elementId: string;
	propertyComputations: DeepPartial<ColumnPropertyComputations>[];
	handleDeleteRow: (rowIndex: number) => void;
	updatePropertyComputations: (newComputations: DeepPartial<ColumnPropertyComputations>[]) => void;
	fieldKey?: PropertyComputationField;
	propertyComputationErrorMap?: DeepPartialErrorMap<ColumnPropertyComputations>[];
	formType: "Main" | "Column" | "Field";
}

export function ColumnTablePropertyComputation({
	elementId,
	propertyComputations,
	handleDeleteRow,
	updatePropertyComputations,
	fieldKey,
	propertyComputationErrorMap,
	formType,
}: Readonly<ColumnTablePropertyComputationProps>) {
	const localizer = PrintLocalizer.useLocalizer();
	const propertyItems = useColumnPropertyItems();
	const headline = localizer(RESOURCE_KEYS.elementForm.listing.propertyComputations.headline);
	const columns = useColumns();

	const { labeledPropertyComputations, openPropertyComputationForm } =
		useListingPropertiesTableHandler<ColumnPropertyComputations>(
			elementId,
			propertyComputations,
			propertyItems,
			ListingRegion.PROPERTY_COMPUTATION_FORM,
			formType,
			fieldKey
		);

	const onAddPropertyComputation = React.useCallback(() => {
		const propertyCompId = nanoid();
		updatePropertyComputations([
			...propertyComputations,
			{ id: propertyCompId } as DeepPartial<ColumnPropertyComputations>,
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
			props: TableRenderPropsType.BodyContentProps<DeepPartial<ColumnPropertyComputations>>
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
			return DefaultTableComponentRenderers.bodyContentRenderer(props);
		};

		const bodyRowRenderer = (props: TableRenderPropsType.BodyRowProps<DeepPartial<ColumnPropertyComputations>>) => {
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
			<FormContainerHeadline label={headline} />
			<div>
				<Table<DeepPartial<ColumnPropertyComputations>>
					data={labeledPropertyComputations}
					columns={columns}
					componentRenderers={componentRenderers}
				/>
			</div>
			<AddButtonGroup onClick={onAddPropertyComputation} />
		</>
	);
}

function useColumns(): BaseColumnType[] {
	const localizer = PrintLocalizer.useLocalizer();

	return React.useMemo(
		() => [
			{
				label: localizer(RESOURCE_KEYS.elementForm.listing.propertyComputations.property),
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
