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
import { call, getContext, put, type SagaGenerator, select, takeEvery } from "typed-redux-saga";
import { nanoid } from "nanoid";

import {
	type Image as PrintImage,
	type PrintModelElement,
	ImageSrcType,
	MeasureUnit,
	type Measure,
} from "@com.mgmtp.a12.print/print-model-api/model";
import type { DeepPartial } from "@com.mgmtp.a12.print/print-model-api/utils";

import {
	InteractionLogActions,
	RequestApiActions,
	TransactionLogStateActions,
	type UpdateElementsTransactionLogAction,
} from "../../redux/index.js";
import { RequestApiSelectors } from "../../redux/request-api/selectors.js";
import type { RequestApi } from "../../api/request-api.js";
import { PrintEngineSelectors } from "../../store/selectors.js";
import { RESOURCE_KEYS } from "../../localization/index.js";
import { createMmMeasureFromPx } from "../../utils/measure-utils.js";

export function* selectResourceSaga(): SagaGenerator<void> {
	yield* takeEvery(RequestApiActions.selectResource.match, handleSelectResource);
}

function* handleSelectResource(action: ReturnType<typeof RequestApiActions.selectResource>): SagaGenerator<void> {
	const { elementId, resourceName } = action.payload;

	let resource = yield* select(state => RequestApiSelectors.resourceByName(state, resourceName));
	if (!resource) {
		const requestApi: RequestApi = yield* getContext("requestApi");
		const data = yield* call(requestApi.loadStaticImage, resourceName);
		if (!data) return;
		yield* put(RequestApiActions.setResource(data));
		resource = data;
	}

	if (!resource.content) return;

	const dimensions = yield* call(loadImageDimensions, resource.content);
	if (!dimensions) return;

	const { naturalHeight, naturalWidth } = dimensions;
	const originalHeight = createMmMeasureFromPx(naturalHeight);
	const originalWidth = createMmMeasureFromPx(naturalWidth);

	const elements = yield* select(state => PrintEngineSelectors.multiplePrintModelElements(state, [elementId]));
	const el = elements[0] as (PrintModelElement & DeepPartial<PrintImage>) | undefined;
	if (!el) return;

	const transactionLogActions: UpdateElementsTransactionLogAction[] = [
		TransactionLogStateActions.updatePrintModelElements({
			data: [
				{
					...el,
					image: {
						...el.image,
						resourceSource: { id: nanoid(), resourceName },
						dimensions: {
							...el.image?.dimensions,
							id: nanoid(),
							originalHeight,
							originalWidth,
						},
					},
				} as PrintModelElement & DeepPartial<PrintImage>,
			],
		}),
	];

	const elementReferences = yield* select(PrintEngineSelectors.elementReferences);
	if (elementReferences) {
		transactionLogActions.push(
			TransactionLogStateActions.updateReferenceElements({
				data: elementReferences.map(ref => {
					if (ref.refId === el.id) {
						return {
							...ref,
							dimensions: {
								...ref.dimensions,
								minHeight: computeMinHeight(el, originalHeight, originalWidth),
								minWidth: (el.image?.dimensions?.width as Measure) ?? originalWidth,
							},
						};
					}
					return ref;
				}),
			})
		);
	}

	yield* put(
		InteractionLogActions.start({
			description: RESOURCE_KEYS.interaction.form.imageFormContainer.sourceTypeAttachment.updateImgAttachment,
			region: "form",
			transactionLogActions,
			affectedItems: [{ type: "printModelElement", id: el.id }],
		})
	);
}

function computeMinHeight(
	el: PrintModelElement & DeepPartial<PrintImage>,
	originalHeight: Measure,
	originalWidth: Measure
): Measure {
	const widthValue = el.image?.dimensions?.width?.value;
	const shouldScaleToAspectRatio =
		el.image?.imageSrcType === ImageSrcType.Static && widthValue && !el.image?.dimensions?.height?.value;

	if (shouldScaleToAspectRatio && originalWidth.value) {
		const aspectRatio = originalWidth.value / originalHeight.value;
		const scaledHeight = widthValue / aspectRatio;
		return {
			id: nanoid(),
			unit: MeasureUnit.Millimeter,
			value: Math.round(scaledHeight),
		};
	}

	return (el.image?.dimensions?.height as Measure) ?? originalHeight;
}

function loadImageDimensions(src: string): Promise<{ naturalHeight: number; naturalWidth: number } | null> {
	return new Promise(resolve => {
		const img = new Image();
		img.onload = () => resolve({ naturalHeight: img.naturalHeight, naturalWidth: img.naturalWidth });
		img.onerror = () => resolve(null);
		img.src = src;
	});
}
