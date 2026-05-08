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

export const de: typeof RESOURCE_KEYS = {
	editorTitle: "Druckeinstellungseditor",
	roleSettings: {
		header: {
			section: "Rollen",
		},
		columns: {
			roleName: "Rolle*",
		},
		autocompleteHint: "{count} von {total} Optionen",
		placeholderContent: "Es gibt noch keine Einträge",
	},
	fontSettings: {
		fallback: "Zurückgreifen",
		header: {
			section: "Schriftarteinstellungen",
			customs: "Anpassungen",
			defaults: "Standardeinstellungen",
		},
		placeholderContent: "Keine benutzerdefinierte Einstellung, es werden die Standardeinstellungen angewendet",
		confirmDeletion: {
			title: "Zeile löschen",
			message:
				"Das Löschen dieser Zeile kann nicht rückgängig gemacht werden. Sind Sie sicher, dass Sie es löschen möchten?",
		},
		columns: {
			fallback: "Ersatzschriftart",
			fontName: "Schriftartenname*",
			fontValue: "Schriftartwert*",
		},
		messages: {
			defaultFallbackFont: "Die Standardschriftart",
			fallbackFont: "Diese Schriftart dient als Ersatz, wenn die angegebene Schriftart nicht verfügbar ist",
			overwriteFont: "Die Schriftart wird durch eine benutzerdefinierte Schriftart überschrieben",
		},
		type: {
			path: "Weg",
			attachment: "Anhang",
		},
	},
	button: {
		add: "Hinzufügen",
		delete: "Löschen",
		save: "Speichern",
		cancel: "Stornieren",
	},
};
