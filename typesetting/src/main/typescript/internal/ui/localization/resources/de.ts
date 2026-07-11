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

export const de: typeof RESOURCE_KEYS = {
	editorTitle: "Textsatz-Editor",
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
	preventLineBreakRules: {
		header: {
			section: "Zeilenumbruch-Verhinderungsregel",
		},
		characterSequence: {
			header: "Zeichenfolgen-Regeln",
			description:
				"Verhindert den Umbruch eines bestimmten Wortes. Zum Beispiel sorgt die Einstellung von 'T-Shirt' dafür, dass das Wort immer zusammen in einer Zeile bleibt.",
			column: {
				characterSequence: "Zeichenfolge",
			},
		},
		numberUnit: {
			header: "Zahlen-Einheiten-Regeln",
			description: `Verhindert den Zeilenumbruch zwischen Zahlen und ihren Einheiten. Zum Beispiel bleiben "12 Km" immer zusammen in einer Zeile.`,
			column: {
				unit: "Einheit",
			},
		},
		specialPattern: {
			header: "Spezielle Muster-Regeln",
			description: `Verhindert Zeilenumbrüche in komplexen, gemusterten Texten. Zum Beispiel sorgt die Einstellung von "Nummer(a)(Nummer)" dafür, dass "219(a)(1)" zusammenbleibt.`,
			column: {
				pattern: "Muster",
			},
		},
	},
	orphansWidowsSettings: {
		header: "Waisen & Witwen Einstellungen",
		orphans: {
			label: "Waisen",
			hint: "Die Waisen Eigenschaft legt die minimale Anzahl von Zeilen fest, die bei einem Seitenumbruch, am unteren Rand einer Seite verbleiben müssen.",
		},
		widows: {
			label: "Witwen",
			hint: "Die Witwen Eigenschaft legt die minimale Anzahl von Zeilen in fest, die bei einem Seitenumbruch, am oberen Rand einer Seite verbleiben müssen.",
		},
	},
	button: {
		add: "Hinzufügen",
		delete: "Löschen",
		save: "Speichern",
		cancel: "Stornieren",
	},
	modal: {
		confirmDeletion: {
			title: "Zeile löschen",
			message:
				"Das Löschen dieser Zeile kann nicht rückgängig gemacht werden. Sind Sie sicher, dass Sie es löschen möchten?",
		},
	},
};
