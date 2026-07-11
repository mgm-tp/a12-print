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
import type { RESOURCE_KEYS } from "../keys.js";

export const en: typeof RESOURCE_KEYS = {
	editorTitle: "Typesetting Editor",
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
	preventLineBreakRules: {
		header: {
			section: "Prevent Line Break Rule",
		},
		characterSequence: {
			header: "Character Sequence Rules",
			description:
				"Prevents breaking a specific word. For example, setting 'T-shirt' keeps the word together on one line.",
			column: {
				characterSequence: "Character Sequence",
			},
		},
		numberUnit: {
			header: "Number Unit Rules",
			description: `Prevents breaking numbers with their units. For example, "12 Km" will always stay together on one line.`,
			column: {
				unit: "Unit",
			},
		},
		specialPattern: {
			header: "Special Pattern Rules",
			description: `Prevents line breaks in complex, patterned text. For example, setting "number(a)(number)" keeps "219(a)(1)" together.`,
			column: {
				pattern: "Pattern",
			},
		},
	},
	orphansWidowsSettings: {
		header: "Orphans & Widows Settings",
		orphans: {
			label: "Orphans",
			hint: "The orphans property sets the minimum number of lines that must be left at the bottom of a page when a page break occurs.",
		},
		widows: {
			label: "Widows",
			hint: "The widows property sets the minimum number of lines that must be left at the top of a page when a page break occurs.",
		},
	},
	button: {
		add: "Add",
		delete: "Delete",
		save: "Save",
		cancel: "Cancel",
	},
	modal: {
		confirmDeletion: {
			title: "Delete Row",
			message: "Deleting this Row cannot be reverted. Are you sure you want to delete it?",
		},
	},
};
