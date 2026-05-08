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
import { AnnotationEntity } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

export interface PrintSettingModel {
	readonly header?: PrintSettingHeader;
	readonly content?: PrintSettingContent;
}

export interface PrintSettingHeader {
	readonly id: string;
	readonly modelType: string;
	readonly modelVersion: string;
	readonly annotations?: AnnotationEntity[];
}

export interface PrintSettingContent {
	readonly settings?: Settings;
	readonly defaults?: Defaults;
}

export interface Settings {
	readonly fonts?: Font[];
}

export interface Defaults {
	readonly fonts?: Font_1[];
}

export interface Font {
	readonly name: string;
	readonly type: FontSettingType;
	readonly fallback?: boolean;
	readonly fontAttachment?: FontAttachment;
	readonly path?: string;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface Font_1 {
	readonly name: string;
	readonly fallback?: boolean;
}

export type FontSettingType = "path" | "attachment";

export interface FontAttachment {
	readonly internal_filename?: string;
	readonly mime_type?: string;
	readonly content?: string;
	readonly size?: number;
	readonly original_filename?: string;
	readonly category?: string;
	readonly description?: string;
	readonly attachment_id?: string;
}
