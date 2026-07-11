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
	application: {
		title: "Print Model Editor",
	},
	sidebar: {
		general: {
			name: "Allgemein",
			modelName: "Modellname*",
			description: "Beschreibung",
			annotations: {
				headline: "Anmerkungen",
				name: "Name",
				value: "Wert",
			},
			message: {
				fieldRequired: "Dieses Feld ist erforderlich.",
				modelNameValidation:
					"Verwenden Sie nur Buchstaben, Ziffern, Bindestriche, Unterstriche und Punkte. Außerdem darf der Name nur mit einem Buchstaben oder Unterstrich beginnen, nicht aber mit 'xml'.",
				annotationNameDuplicate: "Der Name der Annotation muss einzigartig sein",
			},
			roleSettings: {
				header: {
					section: "Rollen",
				},
				columns: {
					roleName: "Rolle*",
				},
				autocompleteHint: "{count} von {total} Optionen",
				placeholderContent: "Es gibt noch keine Einträge",
				confirmDeletion: {
					title: "Zeile löschen",
					message:
						"Das Löschen dieser Zeile kann nicht rückgängig gemacht werden. Sind Sie sicher, dass Sie es löschen möchten?",
				},
			},
			metadata: {
				headline: "PDF Metadaten",
				title: "Titel",
				description: "Beschreibung",
				author: "Autor",
				language: "Sprache",
			},
		},
		schema: {
			name: "Schema",
			aliasLabel: "Alias",
			tab: {
				documentModelReferenced: "Dokumentmodellreferenzen",
				printModelReferenced: "Modellreferenzen drucken",
				typesettingModelReferenced: "Referenzen zum Silbentrennungsmodell",
			},
			tooltips: {
				defaultTypesettingModel: "Standard-Silbentrennungsmodell",
				printModelReferenceWithoutSegments: "Das ausgewählte Print Model besitzt keine DINTemplate-Segmente",
			},
		},
		content: "Inhalt",
		textStyles: "Textstile",
		segment: {
			name: "Segmente",
			repeatable: "Wiederholbar",
			button: {
				menuSetting: "Menü öffnen",
			},
			setting: {
				name: "Name",
				namePlaceholder: "Segmenttitel",
				reference: "Referenz",
				segmentTemplate: "Segmentvorlage",
			},
			toolbar: {
				namePlaceholder: "Neue Segmentierung",
				dinTemplate: {
					selectPlaceHolder: "Wählen Sie DINTemplate-Segment aus",
				},
			},
		},
		section: {
			name: "Abschnitt",
			titlePlaceholder: "Abschnittsüberschrift",
			type: {
				first: "Zuerst",
				remaining: "Verbleibend",
			},
		},
		watermark: {
			name: "Wasserzeichen",
			titlePlaceholder: "Wasserzeichen Überschrift",
			setting: {
				opacity: "Deckkraft",
				conditions: "Bedingungen",
				description:
					"Folgend können A12 Regeln definiert werden, unter welchen das aktuelle Wasserzeichen angezeigt wird. Trifft mindestens eine der Bedingungen zu, wird das Wasserzeichen gedruckt. Dies gilt auch wenn keine Bedingung angegeben ist.",
			},
		},
		commitChanges: {
			title: "Änderungen Speichern",
			columns: {
				status: "Status",
				descriptions: "Beschreibung",
				propertyName: "Eigenschaft Name",
				propertyValue: "Eigenschaft Wert",
				timestamp: "Datum",
			},
			status: {
				commit: "gesetzt",
				pending: "ausstehend",
				overwritten: "überschrieben",
			},
			emptyDescription: "Keine Beschreibung",
			commit: "Änderungen endgültig in das Modell schreiben und Historie verändern",
			discard: "Alle Änderungen verwerfen",
			error: {
				commitChangesFailed: "Die ausstehenden Änderungen konnten nicht in das Druckmodell geschrieben werden.",
			},
		},
	},
	editor: {
		mode: {
			default: "Standard",
			layout: "Layout",
			readingOrder: "Lesereihenfolge",
		},
		topMenu: {
			elementLibrary: {
				title: "Elementbibliothek öffnen/schließen",
				headline: "Element hinzufügen",
				floatLibrary: "Wechseln Sie zur schwebenden Elementbibliothek",
				popupLibrary: "Wechseln Sie zur Popup-Elementbibliothek",
				incomingDinTemplate:
					"Dieses Modell wird derzeit als DINTemplate verwendet, daher kann nur BoundingBox hinzugefügt werden.",
				dinTemplateSegmentEditor:
					"Dies ist ein DINTemplate-Segment, daher dürfen keine Elemente hinzugefügt werden.",
			},
			layout: "Layout",
			tabOrder: "Lesereihenfolge",
			hideFrames: "Hilfslinien verstecken",
			showFrames: "Hilfslinien zeigen",
			hideMargins: "Ränder verstecken",
			showMargins: "Ränder zeigen",
			textStyles: "Text-Stile",
			deleteElement: "Ausgewählte Elemente löschen",
			copyElement: "Ausgewählte Elemente kopieren",
			groupElement: "Ausgewählte Elemente in einen Bereich gruppieren",
			openElement: "Bearbeitung öffnen",
			quickEditBar: {
				x: {
					placeholder: "Links",
					label: "Stellung links",
				},
				y: {
					placeholder: "Spitze",
					label: "Stellung oben",
				},
				width: {
					placeholder: "Breite",
					label: "Breite",
				},
				height: {
					placeholder: "Höhe",
					label: "Höhe",
				},
			},
		},
		contextMenu: {
			copy: "Kopieren",
			paste: "Einfügen",
			delete: "Löschen",
			groupElement: "In Bereich gruppieren",
			hideConditions: "Ausblendungsregeln",
		},

		pageOrientation: {
			portrait: "Porträt",
			landscape: "Landschaft",
		},
		type: {
			default: "Nicht wiederholbar",
		},
		element: {
			Text: "Text",
			Line: "Horizontale Linie",
			Table: "Tabelle",
			Listing: "Auflistung",
			Expression: "Expression",
			Image: "Bild",
			TableLayout: "Tabellenlayout",
			LineChart: "Liniendiagramm",
			BarChart: "Balkendiagramm",
			PieChart: "Kreisdiagramm",
			Field: "Feld",
			Calculation: "Berechnung",
			BoundingBox: "Rahmen",
			PageNumber: "Seitenzahl",
			PageNumberTotal: "Seitenzahl Insgesamt",
			Override: "Überschreiben",
			Area: "Bereich",
			Switch: "Switch",
		},
		page: "Buchseite",
		pageTotal: "Seitengesamt",
		pageOnTotal: "Buchseite $page$/$total$",
		richTextEditor: {
			toolbarButton: {
				removeStyles: "Entfernen Sie Alle Stile",
			},
		},
	},
	layoutEditor: {
		topMenu: {
			topMargin: "Oberer Rand",
			bottomMargin: "Unterer Rand",
		},
	},
	input: {
		selectPlaceholder: "Bitte wähle...",
		inputSource: {
			possibleSource: {
				default: "Standardwert",
				input: "Benutzereingabe eingeben",
				unset: "Wert ist nicht festgelegt",
				inherited: "Vom übergeordneten Element übernommen",
			},
			unsetPlaceholder: "Wert nicht definiert",
		},
		repeatableSettings: {
			headline: "Wiederholbarkeitseinstellungen",
		},
	},
	button: {
		add: "Hinzufügen",
		apply: "Anwenden",
		discardChanges: "Änderungen verwerfen",
		save: "Speichern",
		cancel: "Abbrechen",
		edit: "Bearbeiten",
		delete: "Löschen",
		close: "Schließen",
		open: "Offen",
		back: "Zurück",
		duplicate: "Duplikat",
		openSetting: "Öffnen Sie die Einstellung",
		closeSetting: "Einstellung schließen",
		openEditor: "Editor öffnen",
		maximized: "Maximiert",
		minimized: "Minimiert",
		up: "Hoch",
		down: "Runter",
		undo: "Rückgängig",
		redo: "Wiederholen",
		openMenu: "Menü öffnen",
	},
	indicator: {
		repeatable: "Wiederholbar",
		pageBreakAvoid: "Seitenumbruch vermeiden",
	},
	elements: {
		tableLayout: {
			selectContentType: "Wählen Sie den Inhaltstyp aus",
			editCell: "Zelle bearbeiten",
			deleteCell: "Zelle löschen",
		},
		table: {
			emptyHeader: "Kein Label",
		},
	},
	elementForm: {
		switch: {
			name: "Name",
			precondition: "Vorbedingung",
			elements: "Elemente",
			emptyMessage: "Es gibt keine Fälle",
		},
		dataContextSelection: {
			repeatableGroup: "Wiederholbare Gruppe",
			repeatableInstance: "Instanz einer wiederholbaren Gruppe",
			group: "Gruppe",
			field: "Feld",
			noTreeData: "Es existieren keine validen Felder oder Gruppen zum auswählen",
			hintMessage: {
				fieldType:
					"Nur für Felder innerhalb nicht wiederholbarer Gruppen oder der ausgewählten Instanz verfügbar",
				nonRepeatableGroup: "Nur für nicht wiederholbare Gruppen verfügbar",
				repeatableGroup: "Nur für wiederholbare Gruppen verfügbar",
				anyGroup: "Nur für Gruppen verfügbar",
				instanceFieldType: "Nur für Felder der ausgewählten Instanz verfügbar",
				instanceNonRepeatableGroup: "Nur für nicht wiederholbare Gruppen der ausgewählten Instanz verfügbar",
				instanceRepeatableGroup: "Nur für wiederholbare Gruppen der ausgewählten Instanz verfügbar",
				instanceAnyGroup: "Nur für Gruppen verfügbar",
			},
		},
		hideConditions: {
			headline: "Ausblendungsregeln",
			description:
				"Folgend können A12 Regeln definiert werden, unter welchen das aktuelle Seitenelement ausgeblendet wird. Trifft mindestens eine der Bedingungen zu, wird das Seitenelement nicht gedruckt und die nachfolgenden Seitenelemente rücken nach um den leeren Raum zu füllen.",
		},
		layoutConfig: {
			headline: "Layout Configs",
			pageBreakBehavior: {
				headline: "Seitenumbruch-Einstellungen",
				input: "Seitenumbruch-Verhalten",
				avoidInfoMessage: {
					containerElement:
						"Wenn dieser Containerbereich (einschließlich der Abstände zwischen verschachtelten Elementen sowie verschachtelter Elemente, die ebenfalls auf ‚Vermeiden‘ gesetzt sind) auf einem Seitenumbruch liegt, wird der gesamte Bereich auf die nächste Seite verschoben, selbst wenn er dort nicht vollständig Platz findet",
					standaloneElement:
						"Wenn ein Element auf einem Seitenumbruch liegt, wird es auf die nächste Seite verschoben, um ein Aufteilen zu vermeiden. Würde es nicht vollständig auf die nächste Seite passen, bleibt es an seiner aktuellen Position",
				},
			},
		},
		headline: "Seiten Element",
		textProperties: {
			headline: "Text Eigenschaften",
			bold: "Fett",
			italic: "Kursiv",
			underline: "Unterstrichen",
			color: "Farbe",
			backgroundColor: "Hintergrundfarbe",
			alignment: "Ausrichtung",
			clearButton: "Texteigenschaften zurücksetzen",
			legacyWarning:
				"Dieses Element hat Texteigenschaften aus einer früheren Editor-Version. Diese können die PDF-Ausgabe beeinflussen. Entfernen Sie sie, wenn sie nicht benötigt werden.",
		},
		borderProperties: {
			headline: "Randeigenschaften",
			borderWidth: "Randbreite",
			borderStyle: "Randstil",
			borderColor: "Randfarbe",
		},
		model: {
			documentModel: "Dokumentenmodell",
			field: "Feld",
			group: "Gruppe",
			deleteDocumentModelButton: "Dokumentenmodell entfernen",
		},
		field: {
			fieldType: "Feldtyp",
			checkboxUnchecked: "Checkbox-Icon (nicht angekreuzt)",
			checkboxChecked: "Checkbox-Icon (angekreuzt)",
			dateFormat: "Datumsformat",
			dateRangeFormatStart: "Datumsformat (Beginn)",
			dateRangeFormatEnd: "Datumsformat (Ende)",
			dateRangeDelimiter: "Datumstrennzeichen",
			dateFormatHint:
				"Das Datumsformat basiert auf Java DateTimeFormatter. Klicken Sie für weitere Informationen",
			suffix: "Suffix",
		},
		computation: {
			condition: "Bedingung",
			precondition: "Vorbedingung",
			operation: "Operation",
		},
		text: {
			text: "Text",
		},
		line: {
			linePropertiesHeadline: "Linien Eigenschaften",
		},
		textFlow: {
			hideIfEmpty: "Verstecke dieses Element, falls alle verschachtelten Entitäten leer sind",
			field: {
				saveButton: "Feld speichern",
			},
			computation: {
				name: "Name",
				formattingType: "Formatierungstyp",
				typeDefinition: "TypeDefinition vom Dokumentenmodell",
				saveButton: "Computaiton speichern",
			},
		},
		image: {
			imageSrc: "Bildquelle",
			imageSrcType: {
				static: "Statisch",
				dynamic: "Dynamisch",
			},
			field: "Feld",
			attachment: "Anhang",
			alt: "Alternativer Text",
			height: "Höhe",
			width: "Breite",
			action: {
				replace: "Ersetzen",
				download: "Herunterladen",
				upload: "Hochladen",
			},
			resource: {
				selector: "Ressource",
				internalFilename: "Interner Dateiname",
				size: "Größe",
				mimeType: "MIME-Typ",
			},
		},
		expression: {
			expressionText: "Inhalt",
			generalPropertiesHeadline: "Allgemeine Eigenschaften",
			hideIfEmpty: "Verstecke dieses Element, falls alle verschachtelten Entitäten leer sind",
		},
		listing: {
			columns: {
				title: "Auflistungsspalte",
				headline: "Spalten",
				label: "Spaltenbeschriftung",
				width: "Spaltenbreite",
				isSortingIndex: "Sortierindex",
				isSortingIndexFormLabel: "Sortiere Gruppeninhalte basierend auf dieser Spalte",
				hasCustomTextProperties: "Spalte hat spezifische Texteigenschaften",
				hasCustomBorderProperties: "Spalte hat spezifische Randeigenschaften",
			},
			rowPropertiesComputations: {
				headline: "Zeileneigenschaftsberechnung",
			},
			defaultComputations: {
				headline: "Allgemeine Berechnungen",
				description: `Diese Berechnungen werden für alle Zeilen der Auflistung ausgeführt. Ihre Ergebnisse dienen als Standardwert,
				 welcher von den dazugehörigen Ergebnissen der Gruppen- oder Feldberechnungen überschrieben werden.`,
			},
			groupComputations: {
				headline: "Gruppenberechnungen",
				description: "Diese Berechnungen werden nur auf den Gruppenzeilen der Auflistung ausgeführt.",
			},
			fieldComputations: {
				title: "Listenfeldberechnung",
				headline: "Feldberechnungen",
				documentFieldType: "Dokumentenfeldtyp",
				documentFieldTypeDescription: `Wähle einen Eingabefeldtyp aus. Diese Berechnungen werden nur auf Zeilen ausgeführt,
				 welche auf Felder des gewählten Feldtypen zeigen.`,
				resultFieldType: "Ergebnistyp der Berechnung",
				resultFieldTypeDescription: "Wähle den Ergebnisfeldtypen der Wertberechnungen.",
				fieldTypeSerialized: "Eingabetyp der Berechnung",
				fieldTypeSerializedOutput: "Ausgabetyp der Berechnung",
			},
			valueComputations: {
				headline: "Wertberechnung",
			},
			propertyComputations: {
				headline: "Eigenschaftsberechnung",
				property: "Zieleigenschaft*",
			},
			groupPropertyComputation: {
				headline: "Gruppen-Eigenschaftsberechnungen",
				groupPath: "Gruppenpfad",
				property: "Zieleigenschaft*",
				preconditionHint:
					"Die Vorbedingung darf nur für Felder und Gruppen ausgewertet werden, die sich innerhalb des ausgewählten Gruppenpfads befinden",
				basePathRequiredMessage:
					"Um einen Gruppenpfad auszuwählen, wählen Sie bitte zuerst eine Gruppe im Listenformular aus",
			},
			headerProperties: {
				headline: "Kopfzeileneigenschaften",
				hideHeader: "Kopfzeile verstecken",
			},
			bodyProperties: {
				headline: "Rumpfeigenschaften",
			},
		},
		table: {
			column: {
				title: "Tabellenspalte",
				type: "Elementtyp",
				label: "Label",
				headerLabelHidden: "Label verstecken?",
				width: "Breite",
				button: {
					back: "Zurück",
				},
				field: {
					text: "Feld",
					sumColumn: "Summenspalte",
				},
			},
			generalPropertiesHeadline: "Allgemeine Eigenschaften",
			maxRowCount: "Maximale Zeilenanzahl",
			sumLabel: "Summenzeilen-Label",
			filteringHeadline: "Filterung",
			filterExpression: "Filter Expression",
			headerPropertiesHeadline: "Kopfzeilen Eigenschaften",
			hideHeader: "Kopfzeile verstecken?",
			bodyPropertiesHeadline: "Zeileneigenschaften",
		},
		tableLayout: {
			rowCount: "Anzahl der Zeilen",
			columnCount: "Anzahl der Spalten",
			rowProperties: {
				headline: "Zeilenoptionen",
				index: "Index",
				minHeight: "Mindesthöhe",
			},
			columnProperties: {
				headline: "Spaltenoptionen",
				index: "Index",
				width: "Breite",
				verticalAlignment: {
					label: "Vertikale Ausrichtung",
					top: "Oben",
					middle: "Mitte",
					bottom: "Unten",
				},
			},
		},
		chart: {
			title: "Titel",
			height: "Höhe",
			width: "Breite",
			labelX: "Label X-Axe",
			labelY: "Label Y-Axe",
			orientation: {
				label: "Orientierung",
				vertical: "Vertikal",
				horizontal: "Horizontal",
			},
			data: {
				valueField: "Feld mit Werten",
				keyField: "Feld mit Labels",
				seriesName: "Name der Serie",
				labelIsNumeration: "Aufzählung als Label nutzen",
			},
		},
		override: {
			boundingBox: {
				notAllowedToEdit: "Das Element „Bounding Box Override“ darf nicht bearbeitet werden",
			},
		},
	},
	elementOptions: {
		fieldTypes: {
			string: "String",
			number: "Number",
			bool: "Boolean",
			typeDefinition: "TypeDefinition",
		},
		formattingItems: {
			date: "Datum",
			dateRange: "Datumsbereich",
			html: "HTML",
			checkbox: "Checkbox",
		},
		tableColumnType: {
			field: "Feld",
			expression: "Expression",
		},
		pathColumnTypes: {
			path: "Pfad",
			label: "Feld Label",
		},
		alignment: {
			left: "Links",
			right: "Rechts",
			center: "Zentriert",
			justify: "Blocksatz",
		},
		borderStyles: {
			none: "ohne Rand",
			solid: "Linie",
			dotted: "Gepunktete Linie",
			dashed: "Gestrichelte Linie",
		},
		propertyItems: {
			bold: "Fett",
			italic: "Kursiv",
			underline: "Unterstrichen",
			font: "Schriftart",
			fontSize: "Schriftgröße",
			lineHeight: "Zeilenhöhe",
			horizontalAlignment: "Horizontale Ausrichtung",
			verticalAlignment: "Vertikale Ausrichtung",
			color: "Schriftfarbe",
			backgroundColor: "Hintergrundfarbe",
			borderStyle: "Randart",
			borderWidth: "Randgröße",
			borderColor: "Randfarbe",
			columnSpan: "Spaltenspanne",
			isHidden: "Zelle ausblenden",
			isContentHidden: "Wert ausblenden",
			isHiddenRow: "Zeile ausblenden",
			paddingTop: "Innenabstand oben",
			paddingBottom: "Innenabstand unten",
			paddingLeft: "Innenabstand links",
			paddingRight: "Innenabstand rechts",
		},
		groupPropertyItem: {
			isHidden: "Gruppe ausblenden",
		},
		pageBreakBehavior: {
			allow: "Erlauben",
			avoid: "Vermeiden",
		},
	},
	ruleCodeEditor: {
		warningMessage: "Fehler bei der Editor-Initialisierung",
	},
	validation: {
		title: {
			toolbar: {
				error: "Es gibt $count$-Fehler in der aktuellen Ansicht",
				warning: "Es gibt $count$-Warnungen in der aktuellen Ansicht",
			},
			element: {
				error: "Es liegen $count$-Fehler für das Element vor",
				warning: "Es liegen $count$-Warnungen für das Element vor",
			},
			segment: {
				error: "Es liegen $count$-Fehler im Segment vor",
				warning: "Es liegen $count$-Warnungen für das Segment vor",
			},
			form: {
				error: "Das Formular enthält $count$-Fehler",
				warning: "Das Formular enthält $count$-Warnungen",
			},
			contextMenu: {
				hideConditions: "Es liegen $count$ Fehler bei den Ausblendbedingungen vor",
			},
		},
		error: {
			internalError: "Interner Fehler",
			setPrintModel: "Das Druckmodel konnte nicht gesetzt werden",
			uploadStaticImage: "Das Bild konnte nicht hochgeladen werden",
			loadStaticImage: "Das Bild konnte nicht geladen werden",
		},
		errorTree: {
			heading: "Validierungsfehler",
			elements: "Elemente",
			messageBox: {
				noValidationErrors: "Keine Validierungsfehler",
				debugMode:
					"Sie befinden dich derzeit im Debug-Modus. Der Fehlerbaum spiegelt die zugrunde liegende JSON-Struktur des Druckmodells wider.",
				missingErrors: "Es werden nicht alle Fehler angezeigt. Bitte wechseln sie in den debug-Modus.",
			},
			buttons: {
				debugMode: "debug",
				viewErrorLocation: "Fehlerort anzeigen",
			},
		},
		attachment: {
			upload: {
				title: "Diese Datei kann nicht hochgeladen werden",
				supportedExtensions: "Es werden nur $extensions$ unterstützt.",
			},
		},
	},
	precompile: {
		messages: {
			heading: "Vorkompilierungsfehler",
			copy: "Stacktrace kopieren",
		},
	},
	textStyles: {
		label: "Textstil",
		button: {
			addNewTextStyle: "Neuen Textstil hinzufügen",
		},
		headline: {
			textStyleSetting: "Texstil-Einstellungen",
			typographySetting: "Typografie-Einstellungen",
		},
		properties: {
			name: "Name",
			semantic: "Semantik",
			font: "Schriftart",
			fontSize: "Schriftgröße",
			lineHeight: "Zeilenhöhe",
			typesettingModel: "Silbentrennungmodell",
			hyphenator: "Statische Silbentrennung",
		},
		semantic: {
			P: "Absatz",
			H1: "Überschrift 1",
			H2: "Überschrift 2",
			H3: "Überschrift 3",
			H4: "Überschrift 4",
			H5: "Überschrift 5",
			H6: "Überschrift 6",
		},
		errorMessage: {
			name: {
				required: "Name ist erforderlich",
			},
		},
		warningMessage: {
			fontIsNotConfigured:
				"Diese Schriftart existiert nicht in den Workspace-Ressourcen. Elemente mit diesem Textstil werden mit der Standardschriftart gedruckt.",
			typesettingModeNotFound: "Dieses Silbentrennungsmodell wurde im Arbeitsbereich nicht gefunden",
		},
		notification: {
			preventDelete: {
				title: "Der Textstil kann nicht gelöscht werden",
				description: "Der Textstil kann nicht gelöscht werden, da er von einigen Elementen verwendet wurde",
			},
			preventUndo: {
				title: "Diese Aktion kann nicht rückgängig gemacht werden",
				description:
					"Die Aktion zum Erstellen des Textstils, die von einigen Elementen verwendet wurde, kann nicht rückgängig gemacht werden",
			},
			cannotLoadFont: {
				title: "Schriftart kann nicht geladen werden",
				description: "Die in der Print Engine konfigurierte Schriftart $font$ kann nicht geladen werden",
			},
			useUnconfiguredFont: {
				title: `Textstil "$textStyle$" verwendet eine nicht existierende Schriftart`,
				description: `"$font$" existiert nicht in den Workspace-Ressourcen. Prüfen Sie, ob der Ressource-Dateiname dem Namen der ausgewählten Schrift entspricht.`,
			},
			cannotLoadTypesetting: {
				title: "Satz konnte nicht geladen werden",
				description: "Der Satz $typesetting$ konnte nicht geladen werden",
			},
		},
		tooltips: {
			defaultConfigurationFont: "Standardkonfigurationsschriftart",
			fontSizeLineHeightNote:
				"Bitte beachten Sie, dass der empfohlene Zeilenabstand 1,5-mal größer als die Schriftgröße sein sollte. Zum Beispiel: Wenn Sie mit einer Schriftgröße von 12 arbeiten, beträgt der empfohlene Zeilenabstand 18",
		},
		annotation: {
			default: "Standard",
		},
		newTextStyleName: "Neuer Textstil",
	},
	confirmationDialog: {
		cannotBeUndone: {
			title: "WARNUNG: Aktion kann nicht rückgängig gemacht werden!",
			text: "Wollen Sie diese Aktion wirklich durchführen? Bitte beachten Sie, dass diese Aktion nicht rückgängig gemacht werden kann!",
		},
		delete: {
			title: "Löschen",
			text: "Wollen Sie diesen Eintrag wirklich löschen?",
		},
		discardChanges: {
			title: "WARNUNG: Alle Änderungen verwerfen",
			text: "Alle ausstehenden Änderungen werden verworfen und können nicht wiederhergestellt werden. Was möchten Sie tun?",
		},
	},
	interaction: {
		other: {
			fixInvalidElementHeights:
				"WARNUNG: Invalide Höhen von Elementen im PrintModel wurden automatisch gefixt. In dem PrintModel scheinen fehlerhafte Daten drin zu sein",
		},
		editor: {
			createNewElement: "Neues Element erstellt",
			deleteElementsOnStage: "Gelöschte Elemente auf der Bühne",
			groupElementsOnStage: "Elemente auf der Arbeitsfläche in einen Bereich gruppiert",
			moveElementByArrowKey: "Bewegte Elemente auf der Bühne",
		},
		relativeLayout: {
			changeMargin: "Geänderte Ränder von Elementen auf der Bühne",
			changePageBreakBehavior: "Seitenumbruch-Verhalten geändert",
		},
		useCopyPaste: {
			pasteElements: "Kopierte Elemente einfügen",
		},
		tableLayout: {
			selectCellElement: "Ein Zellenelement des Tabellenlayoutelements ausgewählt",
			removeCell: "Ein Zellenelement des Tabellenlayoutelements wurde gelöscht",
		},
		form: {
			hideConditions: {
				changeHideConditions: "Ausblendungsregeln geändert",
			},
			barChartFormContainer: {
				changeBasePath: "Basispfad des Balkendiagrammelements geändert",
				changeGeneralDiagramProps: "Allgemeine Diagrammeigenschaften des Balkendiagrammelements geändert",
				changeDocumentModel: "Geändertes Dokumentmodell des Balkendiagrammelements",
				changeDiagramTableData: "Geänderte Diagrammtabellendaten des Balkendiagrammelements",
			},
			expressionFormContainer: {
				changeDocumentModel: "Geändertes Dokumentmodell des Ausdruckselements",
				changeContent: "Geänderter Inhalt des Ausdruckselements",
				changeGeneralProperties: "Allgemeine Eigenschaften des Ausdruckselements geändert",
				changeBorderProperties: "Geänderte Rahmeneigenschaften des Ausdruckselements",
				changeTextProperties: "Geänderte Texteigenschaften des Ausdruckselements",
			},
			lineChartFormContainer: {
				changeBasePath: "Basispfad des Liniendiagrammelements geändert",
				changeGeneralDiagramProps: "Allgemeine Diagrammeigenschaften des Liniendiagrammelements geändert",
				changeDocumentModel: "Geändertes Dokumentmodell des Liniendiagrammelements",
				changeDiagramTableData: "Geänderte Diagrammtabellendaten des Liniendiagrammelements",
			},
			lineFormContainer: {
				changeBorderProperties: "Geänderte Rahmeneigenschaften des Linienelements",
			},
			pieChartFormContainer: {
				changeBasePath: "Basispfad des Kreisdiagrammelements geändert",
				changeGeneralDiagramProps: "Allgemeine Diagrammeigenschaften des Kreisdiagrammelements geändert",
				changeDocumentModel: "Geändertes Dokumentmodell des Kreisdiagrammelements",
				changeAxisProps: "Geänderte Achseneigenschaften des Kreisdiagrammelements",
				toggleUseNumerationAsLabel:
					"Ein-/Ausgeschaltet: Numerierung als Beschriftung des Kreisdiagramm-Elements verwenden",
			},
			tableLayoutFormContainer: {
				changeNumberOfRow: "Geänderte Zeilenanzahl des Tabellenlayoutelements",
				changeNumberOfRowSource: "Geänderte Quelle der Zeilenanzahl des Tabellenlayoutelements",
				changeNumberOfColumn: "Geänderte Spaltenanzahl des Tabellenlayoutelements",
				changeRowOption: "Geänderte Zeilenoptionen des Tabellenlayoutelements",
				changeColumnOption: "Geänderte Spaltenoptionen des Tabellenlayoutelements",
				changeBorderProperties: "Geänderte Rahmeneigenschaften des Tabellenlayoutelements",
			},
			textFormContainer: {
				toggleHideIfEmpty:
					"Schalten Sie das Textelement ausblenden um, wenn alle verschachtelten Elemente kein Textelement enthalten",
				changeBorderProperties: "Geänderte Rahmeneigenschaften des Textelements",
				changeTextProperties: "Geänderte Texteigenschaften des Textelements",
				clearCalculationTextProperties: "Texteigenschaften der Berechnung im Textelement gelöscht",
			},
			imageFormContainer: {
				generalProperties: {
					changeAltText: "Geänderter alternativer Text des Bildelements",
					changeHeight: "Geänderte Höhe des Bildelements",
					changeWidth: "Geänderte Breite des Bildelements",
				},
				sourceType: {
					changeSourceType: "Geänderter Bildquellentyp des Bildelements",
				},
				sourceTypeAttachment: {
					updateImgAttachment: "Gelöschter Bildanhang des Bildelements",
					deleteImgAttachment: "Aktualisierter Bildanhang des Bildelements",
				},
				sourceTypeField: {
					changeBasePath: "Basispfad des Bildelements geändert",
					changeDocumentModel: "Geändertes Dokumentmodell des Bildelements",
				},
			},
			listingFormContainer: {
				form: {
					column: {
						propertyComputation: {
							changePropertyComputation: "Geänderte Spalten -> Eigenschaftsberechnung des Listenelements",
						},
						defaultComputation: {
							changeDefaultComputation: "Geänderte Spalten -> Standardberechnung des Listenelements",
						},
						groupComputation: {
							changeGroupComputation: "Geänderte Spalten -> Gruppenberechnung des Listenelements",
						},
						listingColumnForm: {
							changeColumnLabel: {
								source: "Geänderte Quelle für die Spaltenbezeichnung des Listing-Elements",
								value: "Geänderte Spaltenbezeichnung des Listing-Elements",
							},
							changeColumnWidth: {
								source: "Geänderte Quelle für die Spaltenbreite des Listing-Elements",
								value: "Geänderte Spaltenbreite des Listing-Elements",
							},
							toggleSortGroupContent:
								"Toggled Gruppieren nach Inhalt für eine Spalte des Listing-Elements sortieren",
							toggleColumnTextProperty:
								"Toggled Column hat benutzerdefinierte Texteigenschaften für eine Spalte des Listing-Elements",
							toggleColumnBorderProperty:
								"Toggle Column hat benutzerdefinierte Randeigenschaften für eine Spalte des Listing-Elements",
							changeTextProperties: "Geänderte Spaltentexteigenschaften des Listenelements",
							changeBorderProperties: "Geänderte Spaltenrandeigenschaften des Listenelements",
						},
						tableFieldComputation: {
							addColumn: "Spalte für Listing-Element hinzugefügt",
							deleteColumn: "Gelöschte Spalte für Listing-Element",
						},
					},
					fieldComputation: {
						fieldComputation: {
							changeFieldComputation: "Geänderte Feldberechnungen des Listing-Elements",
						},
						fieldPropertyComputation: {
							changeFieldPropertyComputation: "Geänderte Feldeigenschaftsberechnung des Listing-Elements",
						},
					},
					main: {
						headerProperties: {
							toggleHideHeaderRow: "Kopfzeile des Listing-Elements ausblenden",
							changeHeaderProperties: "Geänderte Header-Eigenschaften des Listing-Elements",
						},
						mainForm: {
							changeBasePath: "Basispfad des Listing-Elements geändert",
							deletePropertyComputation: "Gelöschte Eigenschaftsberechnung des Auflistungselements",
							changeBorderProperties: "Geänderte Randeigenschaften des Listing-Elements",
							changeTextProperties: "Geänderte Texteigenschaften des Listing-Elements",
							changeDocumentModel: "Geändertes Dokumentmodell des Listing-Elements",
							updatePropertyComputation: "Geänderte Eigenschaftsberechnung des Listing-Elements",
						},
						mainPropertyComputationForm: {
							changePropertyComputation: "Geänderte Eigenschaftsberechnung des Listing-Elements",
						},
						tableColumn: {
							addColumn: "Neue Spalte für Listing-Element hinzugefügt",
							moveDown: "Eine Spalte des Listing-Elements nach unten verschoben",
							moveUp: "Eine Spalte des Listing-Elements nach oben verschoben",
							toggleSortingIndex: "Toggled Sortierindex für eine Spalte des Listing-Elements",
							deleteColumn: "Eine Spalte des Listing-Elements wurde gelöscht",
						},
					},
				},
			},
			sharedComponent: {
				calculationForm: {
					changeCalculationForm: "Geändertes Berechnungsformular",
				},
				fieldForm: {
					changeFieldForm: "Geänderte Feldform",
				},
				fieldTypeConfiguration: {
					changeFieldTypeConfiguration: "Geänderte Feldtypdefinition",
				},
			},
			tableFormContainer: {
				generalProperties: {
					changeMaxRowCount: {
						value: "Geänderte maximale Zeilenanzahl des Tabellenelements",
						source: "Geänderte Quelle für die maximale Zeilenanzahl des Tabellenelements",
					},
					changeSumLabel: {
						value: "Geänderte Zeilenbeschriftung „Summe“ des Tabellenelements",
						source: "Geänderte Quelle für die Zeilenbeschriftung „Summe“ des Tabellenelements",
					},
					changeFilterExpression: "Geänderter Filterausdruck des Tabellenelements",
				},
				headerProperties: {
					toggleHideHeader: "Kopfzeile des Tabellenelements ausblenden umgeschaltet",
					changeTextProperties: "Geänderte Texteigenschaften der Kopfzeile des Tabellenelements",
				},
				tableColumn: {
					addColumn: "Neue Spalte für Tabellenelement hinzugefügt",
					deleteColumn: "Eine Spalte des Tabellenelements wurde gelöscht",
				},
				tableColumnExpression: {
					changeContent: "Geänderter Inhalt der Ausdrucksspalte des Tabellenelements",
					clearTextProperties: "Texteigenschaften des Ausdrucks in der Tabellenspalte gelöscht",
				},
				tableColumnFieldForm: {
					changeField: "Geänderte Feldspalte des Tabellenelements",
					changeFieldFormatting: "Geänderte Feldformatierung des Tabellenelements",
					clearTextProperties: "Texteigenschaften des Feldes in der Tabellenspalte gelöscht",
				},
				tableColumnForm: {
					default: "Aktualisierte Tabellenspalte des Tabellenelements",
					changeElementType: "Geänderter Elementtyp für eine Spalte des Tabellenelements",
					changeLabel: {
						value: "Geänderte Bezeichnung einer Spalte des Tabellenelements",
						source: "Geänderte Quelle für die Bezeichnung einer Spalte des Tabellenelements",
					},
					toggleHideLabel: "Umgeschaltet Beschriftung für eine Spalte des Tabellenelements ausblenden",
					changeWidth: {
						value: "Geänderte Breite einer Spalte des Tabellenelements",
						source: "Geänderte Quelle für die Breite einer Spalte des Tabellenelements",
					},
					toggleSumColumn: "Umgeschaltete Summenspalte für eine Spalte des Tabellenelements",
				},
				tableForm: {
					changeBasePath: "Geänderter Basispfad des Tabellenelements",
					changeBorderProperties: "Geänderte Rahmeneigenschaften des Tabellenelements",
					changeTextProperties: "Geänderte Texteigenschaften des Tabellenelements",
					changeDocumentModel: "Geändertes Dokumentmodell des Tabellenelements",
				},
			},
			boundingBoxFormContainer: {
				changeBorderProperties: "Ändern Sie die Randeigenschaften des Begrenzungsrahmenelements",
			},
			areaFormContainer: {
				changeBorderProperties: "Ändern Sie die Randeigenschaften des Flächenelements",
				changeDataContext: "Datenkontext des Flächenelements geändert",
			},
			switchFormContainer: {
				changeName: "Name des Switch Elements geändert",
				changeDocumentModel: "Geändertes Dokumentmodell des Switch-Elements",
				addCase: "Switch Bedingung hinzugefügt",
				removeCase: "Switch Bedingung entfernt",
				reorderCase: "Switch-Fälle neu anordnen",
				editCasePrecondition: "Switch Bedingung geändert",
			},
		},

		general: {
			changeName: "Geänderter Modellname",
			changeDescription: "Beschreibung des Modells geändert",
			changeAnnotation: "Geänderte Anmerkungen",
			changeMetadataModel: "Dokumentmodell für Metadaten geändert",
			changeMetadataTitle: "Titel-Berechnung geändert",
			changeMetadataDescription: "Beschreibungs-Berechnung geändert",
			changeMetadataAuthor: "Autor-Berechnung geändert",
			changeMetadataLanguage: "Sprach-Berechnung geändert",
		},
		quickEditBar: {
			changePosition: "Position des ausgewählten Elements ändern",
			changeDimension: "Dimension des ausgewählten Elements ändern",
		},
		resizable: {
			resizeElement: "Größe des Elements ändern",
		},
		richTextEditor: {
			changeText: "Bearbeiteter Text des Textelements",
		},
		schema: {
			schemaCard: {
				changeAlias: "Geänderter Alias für ein Dokumentmodell",
			},
			schemaToolbar: {
				addSchema: "Dokumentmodellreferenz hinzugefügt",
			},
			printModelReferences: {
				addReferenceEntry: "Referenzeintrag hinzufügen",
			},
		},
		section: {
			sectionCard: {
				addSection: "Abschnitt hinzugefügt",
				changeTitle: "Abschnittstitel geändert",
				deleteSection: "Abschnitt gelöscht",
			},
			section: {
				resizeSection: "Abschnitt in der Größe geändert",
			},
		},
		watermark: {
			watermarkCard: {
				addWatermark: "Wasserzeichen hinzufügen",
				changeTitle: "Wasserzeichen Titel geändert",
				changeOpacity: "Wasserzeichen Deckkraft geändert",
				changePreconditions: "Wasserzeichen Bedingungen geändert",
				deleteWatermark: "Wasserzeichen löschen",
			},
		},
		segment: {
			segmentCard: {
				duplicateSegment: "Ein Segment dupliziert",
				deleteSegment: "Ein Segment gelöscht",
				updateSegment: "Ein Segment aktualisiert",
				updateSegmentBasePath: "Referenz Pfad wiederholbarer Segmentierung wurde aktualisiert",
			},
			segmentContent: {
				reorderSegment: "Neu geordnetes Segment",
			},
			SegmentToolbar: {
				addSegment: "Ein Segment hinzugefügt",
				loadOverrideElements: "Geladene Override-Elemente",
				addReferenceSegment: "Referenzsegment hinzugefügt",
			},
		},
		textStyle: {
			textStyle: {
				add: "Textstil hinzugefügt",
			},
			textStyleCard: {
				removeTextStyle: "Einen Textstil entfernt",
				duplicateTextStyle: "Einen Textstil dupliziert",
			},
			textStyleEditor: {
				changeTextStyleProperties: "Eigenschaften des Textstils geändert",
			},
			textStyleContent: {
				reorderTextStyle: "Neu geordnete Textstile",
			},
		},
		utils: {
			movePrintModelElement: "Druckmodellelement verschoben",
		},
	},
};
