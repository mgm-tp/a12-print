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
import { createSlice } from "@reduxjs/toolkit";

import type { Variant } from "@com.mgmtp.a12.widgets/widgets-core";

import type { RootState } from "./types";

export interface PrintEngineNotification {
	readonly id: string;
	readonly title?: string;
	readonly message?: string;
	readonly severity?: Variant;
	readonly duration?: number;
	readonly icon?: string;
}

export interface PrintEngineNotificationStore {
	notifications: PrintEngineNotification[];
}

const initialState: PrintEngineNotificationStore = {
	notifications: [],
};

type AddNotification = Pick<PrintEngineNotification, "title" | "message" | "duration" | "severity">;

export const notificationSlice: Slice<
	PrintEngineNotificationStore,
	{
		add(state: PrintEngineNotificationStore, { payload }: PayloadAction<AddNotification>): void;
		remove(state: PrintEngineNotificationStore, { payload }: PayloadAction<string>): void;
	},
	"Notification"
> = createSlice({
	name: "Notification",
	initialState,
	reducers: {
		add(state, { payload }: PayloadAction<AddNotification>) {
			state.notifications.push({ ...payload, id: Date.now().toString() });
		},
		remove(state, { payload }: PayloadAction<string>) {
			state.notifications = state.notifications.filter(notification => notification.id !== payload);
		},
	},
});

export const NotificationActions = notificationSlice.actions;

export const NotificationSelector = {
	selectNotifications: (state: RootState) => state.notification.notifications,
};
