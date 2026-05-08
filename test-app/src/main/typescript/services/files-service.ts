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
import { Model } from "@com.mgmtp.a12.base/base-model-api/lib/main/model";

export namespace FileService {
	export async function writeWalFile(walFilePath: string, content: string) {
		if (process.env.test) {
			return undefined;
		}
		try {
			const res = await fetch("/api/wal", {
				method: "POST",
				body: JSON.stringify({ walFilePath, content }),
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
			});

			if (res.ok) {
				return await res.json();
			}
			return undefined;
		} catch {
			return undefined;
		}
	}

	export async function fetchWalFile(walFilePath: string) {
		if (process.env.test) {
			return undefined;
		}
		try {
			const res = await fetch(`/api/wal?walFilePath=${walFilePath}`);
			if (res.status === 200) {
				return res.json();
			}
			return undefined;
		} catch {
			return undefined;
		}
	}

	export async function commitPrintModel(
		printModelPath: string,
		printModel: Model,
		walFilePath: string,
		logs?: string
	) {
		try {
			const res = await fetch("/api/commit", {
				method: "POST",
				body: JSON.stringify({ printModelPath, printModel, walFilePath, logs }),
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
			});

			if (res.ok) {
				return await res.json();
			}
			return undefined;
		} catch {
			return undefined;
		}
	}

	export async function discardChanges(walFilePath: string) {
		try {
			const res = await fetch(`/api/discard-changes?walFilePath=${walFilePath}`);
			if (res.ok) {
				return true;
			}
			return false;
		} catch {
			return false;
		}
	}

	export async function writeModel(modelPath: string, content: Model) {
		try {
			const res = await fetch("/api/model", {
				method: "POST",
				body: JSON.stringify({ fileName: modelPath, content }),
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
			});

			if (res.ok) {
				return await res.json();
			}
			return undefined;
		} catch {
			return undefined;
		}
	}

	export async function printWithShell(
		printModelId: string,
		caseId: string,
		documentId: string | undefined,
		locale: string | undefined,
		timeZone: string | undefined
	) {
		try {
			const res = await fetch("/api/print", {
				method: "POST",
				body: JSON.stringify({ printModelId, caseId, documentId, locale, timeZone }),
				headers: {
					Accept: "application/pdf",
					"Content-Type": "application/json",
				},
			});

			if (res.ok) {
				return await res.blob();
			}
			return undefined;
		} catch {
			return undefined;
		}
	}

	export function isWalResponse(response: object): response is { success: boolean; content: string } {
		return response && typeof response === "object" && "success" in response && "content" in response;
	}
}
