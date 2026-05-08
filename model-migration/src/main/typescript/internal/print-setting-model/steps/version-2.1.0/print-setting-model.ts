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
// Automatically generated from DomainPrintSettingMetaModel.json on 1.11.2024, 07:00:22.

export interface HeaderDTO {
	id: string;
	modelType: string;
	modelVersion: string;
}

export interface FontAttachmentDTO {
	original_filename?: string;
	internal_filename?: string;
	content?: string;
	attachment_id?: string;
	size?: number;
	mime_type?: string;
	category?: string;
	description?: string;
}

export interface FontsDTO {
	name: string;
	path?: string;
	type: Enumeration_Fonts_TypeDTO;
	fallback?: boolean;
	fontAttachment?: FontAttachmentDTO;
}

export interface SettingsDTO {
	fonts?: FontsDTO[];
}

export interface FontsDTO_1 {
	name: string;
	fallback?: boolean;
}

export interface DefaultsDTO {
	fonts?: FontsDTO_1[];
}

export interface ContentDTO {
	settings?: SettingsDTO;
	defaults?: DefaultsDTO;
}

export interface PrintSettingModelDTO {
	header?: HeaderDTO;
	content?: ContentDTO;
}

export type Enumeration_Fonts_TypeDTO = "path" | "attachment";
