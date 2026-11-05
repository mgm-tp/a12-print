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
import { useSelector } from "react-redux";

import { type TreeNodeModel, type SelectableTreeNodeModel, Icon } from "@com.mgmtp.a12.widgets/widgets-core";
import {
	type ElementType,
	type PrintModelEntity,
	type Section,
	type Watermark,
	type Segment,
	PrintModelElement,
	PageOrientation,
	type AnyPrintModelElement,
	type FragmentType,
	type FragmentEntity,
} from "@com.mgmtp.a12.print/print-model-api/model";

import type { PrintEngineState } from "../../../../a12internal/api/PrintEngineState.js";
import { ValidationSelectors } from "../../../redux/validation/selectors.js";
import { ValidationCounter } from "../../../redux/validation/state.js";
import { BadgeGroup } from "../../badge/BadgeGroup.js";
import { CollapsibleWatermarkSetting } from "../../watermarks/WatermarkCard.js";
import { CollapsibleSegmentSetting } from "../../segments/SegmentCard.js";
import { ElementTypes } from "../../../constant/elements.js";

import { CollapsibleSectionSettings, CollapsibleElementSettings } from "./settings/index.js";

const FragmentNodeBadge = ({ fragmentType, id }: { fragmentType: FragmentType; id: string }) => {
	const validationCounter = useSelector((state: PrintEngineState) => {
		switch (fragmentType) {
			case "segment":
				return ValidationSelectors.segmentValidationCounter(state, id);
			case "section":
				return ValidationSelectors.sectionValidationCounter(state, id);
			case "watermark":
				return ValidationSelectors.watermarkValidationCounter(state, id);
			case "element":
				return ValidationSelectors.elementValidationCounterById(state, id);
			default:
				// Text styles are managed in their own sidebar area and have no fragment node counter.
				return ValidationCounter.EMPTY_VALIDATION_COUNTER;
		}
	});
	return <BadgeGroup validationCounter={validationCounter} standalone />;
};

export interface FragmentNode extends SelectableTreeNodeModel {
	icon: React.ReactNode;
	fragmentType: FragmentType;
	fragment: FragmentEntity;
	settings?: React.ReactNode;
}

const resolveLabelForFragmentTypeNode = (type: FragmentType, entity: PrintModelEntity): string => {
	switch (type) {
		case "section":
			return (entity as Section).title || "New Section";
		case "watermark":
			return (entity as Watermark).title || "New Watermark";
		case "segment":
			return (entity as Segment).title || "New Segment";
		case "element":
			return (entity as PrintModelElement).name || `New ${(entity as PrintModelElement).type}`;
		default:
			return `Unknown Fragment Type - ${entity.id}`;
	}
};

const PAGE_ORIENTATION_ICON_NAME: Record<PageOrientation, string> = {
	[PageOrientation.Portrait]: "description",
	[PageOrientation.Landscape]: "topic",
};

const resolvePageOrientationForFragment = (
	type: FragmentType,
	entity: PrintModelEntity
): PageOrientation | undefined => {
	switch (type) {
		case "section":
			return (entity as Section).pageOrientation;
		case "watermark":
			return (entity as Watermark).pageOrientation;
		case "segment":
			return (entity as Segment).defaultSegment?.pageOrientation;
		default:
			return undefined;
	}
};

const resolveIconForFragmentType = (type: FragmentType, entity: PrintModelEntity): React.ReactNode => {
	switch (type) {
		case "section":
		case "watermark":
		case "segment": {
			const pageOrientation = resolvePageOrientationForFragment(type, entity) ?? PageOrientation.Portrait;
			return <Icon>{PAGE_ORIENTATION_ICON_NAME[pageOrientation]}</Icon>;
		}
		case "element":
			if (PrintModelElement.isInstance(entity)) {
				return <Icon>{ElementTypes[entity.type]?.iconName}</Icon>;
			}
			return <Icon>category</Icon>;
		default:
			return <Icon>browse</Icon>;
	}
};

const resolveIconForFragment = (type: FragmentType, entity: PrintModelEntity): React.ReactNode => (
	<>
		{resolveIconForFragmentType(type, entity)}
		<FragmentNodeBadge fragmentType={type} id={entity.id} />
	</>
);

const resolveSettingsForFragment = (type: FragmentType, entity: PrintModelEntity): React.ReactNode => {
	switch (type) {
		case "section":
			return <CollapsibleSectionSettings section={entity} />;
		case "watermark":
			return <CollapsibleWatermarkSetting watermark={entity} includeTitleInSetting />;
		case "segment":
			return <CollapsibleSegmentSetting segment={entity} />;
		case "element":
			return <CollapsibleElementSettings element={entity as AnyPrintModelElement} />;
		default:
			return null;
	}
};

export namespace FragmentNode {
	export const isFragmentNode = (node: TreeNodeModel): node is FragmentNode => {
		return "fragment" in node && "icon" in node;
	};

	export function createFragmentNode(type: FragmentType, entity: PrintModelEntity | undefined): FragmentNode {
		if (!entity) {
			throw new Error("Could not resolve element");
		}
		const label = resolveLabelForFragmentTypeNode(type, entity);
		const icon = resolveIconForFragment(type, entity);
		const settings = resolveSettingsForFragment(type, entity);
		return {
			id: entity.id,
			fragmentType: type,
			label,
			icon,
			settings,
			fragment: entity as FragmentEntity,
		};
	}
}

export interface ElementFragmentNode extends FragmentNode {
	elementType: ElementType;
}
