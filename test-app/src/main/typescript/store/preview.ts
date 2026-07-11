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
import type { PayloadAction, Slice } from "@reduxjs/toolkit";
import { createAction, createSlice } from "@reduxjs/toolkit";

import type { Model } from "@com.mgmtp.a12.base/base-model-api";

import type { RootState } from "./types";

export interface PreviewState {
	previewData?: {
		blob: Blob;
		timeStamp: Date;
	};
	error?: string;
	isLoading: boolean;
}

const initialState: PreviewState = {
	isLoading: false,
};

export const previewSlice: Slice<
	PreviewState,
	{
		setPreviewLoading: (state: PreviewState) => void;
		setPreviewData: (state: PreviewState, action: PayloadAction<SetPreviewDataPayload>) => void;
		setPreviewError: (state: PreviewState, action: PayloadAction<string>) => void;
	},
	"previewSlice"
> = createSlice({
	name: "previewSlice",
	initialState,
	reducers: {
		setPreviewLoading: state => {
			state.isLoading = true;
		},
		setPreviewData: (state, action: PayloadAction<SetPreviewDataPayload>) => {
			state.previewData = {
				blob: action.payload.previewData,
				timeStamp: new Date(),
			};
			state.error = "";
			state.isLoading = false;
		},
		setPreviewError: (state, action: PayloadAction<string>) => {
			state.error = action.payload;
			state.isLoading = false;
		},
	},
});

export const PreviewSelectors = {
	previewData: (state: RootState) => state.preview.previewData,
	previewError: (state: RootState) => state.preview.error,
	isPreviewLoading: (state: RootState) => state.preview.isLoading,
};

export interface OpenPreviewPayload {
	caseId: string;
}
export interface GeneratePreviewPayload {
	caseId: string;
	printModelId: string;
	documentModel?: Model;
	documentName?: string;
	isPendingChanges?: boolean;
	locale?: string;
	timeZone?: string;
}
export interface SetPreviewDataPayload {
	previewData: Blob;
}

export const PreviewActions = {
	...previewSlice.actions,
	openPreview: createAction<OpenPreviewPayload>("OPEN_PREVIEW"),
	generatePreview: createAction<GeneratePreviewPayload>("GENERATE_PREVIEW"),
};
