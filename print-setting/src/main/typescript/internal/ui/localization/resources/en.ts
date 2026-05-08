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
import { RESOURCE_KEYS } from "../keys.js";

export const en: typeof RESOURCE_KEYS = {
	editorTitle: "Print Setting Editor",
	roleSettings: {
		header: {
			section: "Roles",
		},
		columns: {
			roleName: "Role*",
		},
		autocompleteHint: "{count} out of {total} options",
		placeholderContent: "There are no entries yet",
	},
	fontSettings: {
		fallback: "Fallback",
		header: {
			section: "Font Setting",
			customs: "Customs",
			defaults: "Defaults",
		},
		placeholderContent: "No custom settings, the default settings are applied",
		confirmDeletion: {
			title: "Delete Row",
			message: "Deleting this Row cannot be reverted. Are you sure you want to delete it?",
		},
		columns: {
			fallback: "Fallback",
			fontName: "Font Name*",
			fontValue: "Font Value*",
		},
		messages: {
			defaultFallbackFont: "The default font",
			fallbackFont: "This font serves as a fallback when the specified font is not available",
			overwriteFont: "The font is overwritten by a custom font",
		},
		type: {
			path: "Path",
			attachment: "Attachment",
		},
	},
	button: {
		add: "Add",
		delete: "Delete",
		save: "Save",
		cancel: "Cancel",
	},
};
