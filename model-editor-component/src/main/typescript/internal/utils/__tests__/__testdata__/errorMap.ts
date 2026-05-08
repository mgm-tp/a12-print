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
export const errorMap = {
	"@error": [
		{
			jsonPath: [
				{
					elementName: "content",
					index: 1,
					isRepeatable: false,
				},
				{
					elementName: "elementDefinitions",
					index: 1,
					isRepeatable: true,
				},
				{
					elementName: "borderProperties",
					index: 1,
					isRepeatable: false,
				},
				{
					elementName: "borderWidth",
					index: 1,
					isRepeatable: false,
				},
			],
			errorCode: "zahlZuKlein",
			severity: "ERROR",
			errorMessage: [
				{
					key: "kernel.formalErrors.ZAHL_ZU_KLEIN",
					args: {
						decimalSeparator: {
							type: "dataFormat",
							value: ".",
							properties: {
								type: "decimalSeparator",
							},
						},
						minValue: {
							value: "0",
							type: "formattable",
							properties: {
								modelId: "DomainPrintMetaModel",
								elementPath: [
									{
										elementName: "content",
									},
									{
										elementName: "elementDefinitions",
									},
									{
										elementName: "borderProperties",
									},
									{
										elementName: "borderWidth",
									},
								],
								value: "0",
							},
						},
						maxValue: {
							value: "",
							type: "formattable",
							properties: {
								modelId: "DomainPrintMetaModel",
								elementPath: [
									{
										elementName: "content",
									},
									{
										elementName: "elementDefinitions",
									},
									{
										elementName: "borderProperties",
									},
									{
										elementName: "borderWidth",
									},
								],
								value: "",
							},
						},
						zeros: {
							type: "plain",
							value: "",
						},
						numberOfDecimalPlaces: {
							type: "plain",
							value: "0",
						},
						maxNumberOfDecimalPlaces: {
							type: "plain",
							value: "2",
						},
						numberOfDigitsBeforeDecimalPoint: {
							type: "plain",
							value: "-1",
						},
						minLength: {
							type: "plain",
							value: "-1",
						},
						maxLength: {
							type: "plain",
							value: "-1",
						},
						fieldName: {
							type: "localizable",
							properties: [
								{
									key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.borderProperties.borderWidth",
								},
							],
						},
					},
					defaults: {
						de: "Es sind nur Werte erlaubt, die größer oder gleich $minValue$ sind.",
						fr: "Seules les valeurs supérieures ou égales à $minValue$ sont autorisées.",
						nl: "Gelieve een waarde groter dan of gelijk aan $minValue$ invullen.",
						en: "Only values greater or equal to $minValue$ are allowed.",
					},
				},
			],
			parameters: {
				ruleName: "formalePruefung",
				type: "1",
				messageKey: "kernel.formalErrors.ZAHL_ZU_KLEIN",
			},
			origin: "VALIDATOR",
		},
		{
			jsonPath: [
				{
					elementName: "content",
					index: 1,
					isRepeatable: false,
				},
				{
					elementName: "elementDefinitions",
					index: 1,
					isRepeatable: true,
				},
				{
					elementName: "textProperties",
					index: 1,
					isRepeatable: false,
				},
				{
					elementName: "alignment",
					index: 1,
					isRepeatable: false,
				},
			],
			errorCode: "stringFalschesMuster",
			severity: "ERROR",
			errorMessage: [
				{
					key: "documentModel.fieldErrorMessage.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
					args: {
						Feld: {
							type: "localizable",
							properties: [
								{
									key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
								},
							],
						},
						field: {
							type: "localizable",
							properties: [
								{
									key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
								},
							],
						},
						"Feld.Wert": {
							type: "plain",
							value: "xxx",
						},
						"field.value": {
							type: "plain",
							value: "xxx",
						},
						fieldName: {
							type: "localizable",
							properties: [
								{
									key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
								},
							],
						},
					},
					defaults: {},
				},
				{
					key: "kernel.formalErrors.ENUMERATION_DEFAULT_ERROR",
					args: {
						Feld: {
							type: "localizable",
							properties: [
								{
									key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
								},
							],
						},
						field: {
							type: "localizable",
							properties: [
								{
									key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
								},
							],
						},
						"Feld.Wert": {
							type: "plain",
							value: "xxx",
						},
						"field.value": {
							type: "plain",
							value: "xxx",
						},
						fieldName: {
							type: "localizable",
							properties: [
								{
									key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
								},
							],
						},
					},
					defaults: {
						de: "Der Wert ist nicht in der Aufzählung enthalten.",
						fr: "La valeur n'est pas incluse dans la liste.",
						nl: "De waarde staat niet in de lijst.",
						en: "The value is not allowed for the enumeration.",
					},
				},
			],
			parameters: {
				ruleName: "formalePruefung",
				type: "1",
				messageKey:
					"documentModel.fieldErrorMessage.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
			},
			origin: "VALIDATOR",
		},
		{
			jsonPath: [
				{
					elementName: "content",
					index: 1,
					isRepeatable: false,
				},
				{
					elementName: "elementDefinitions",
					index: 1,
					isRepeatable: true,
				},
				{
					elementName: "text",
					index: 1,
					isRepeatable: false,
				},
				{
					elementName: "text",
					index: 1,
					isRepeatable: false,
				},
			],
			errorCode: "Error rule_c6f5a",
			severity: "ERROR",
			errorMessage: [
				{
					key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.text.textFilled",
					args: {},
					defaults: {
						de: "Bitte gib einen Text an.",
						en: "Please specifiy a text.",
					},
				},
			],
			parameters: {
				ruleName: "/content/elementDefinitions/text/textFilled",
				type: "0",
				messageKey:
					"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.text.textFilled",
			},
			origin: "VALIDATOR",
		},
	],
	"@warning": [],
	"@info": [],
	content: {
		"@error": [
			{
				jsonPath: [
					{
						elementName: "content",
						index: 1,
						isRepeatable: false,
					},
					{
						elementName: "elementDefinitions",
						index: 1,
						isRepeatable: true,
					},
					{
						elementName: "borderProperties",
						index: 1,
						isRepeatable: false,
					},
					{
						elementName: "borderWidth",
						index: 1,
						isRepeatable: false,
					},
				],
				errorCode: "zahlZuKlein",
				severity: "ERROR",
				errorMessage: [
					{
						key: "kernel.formalErrors.ZAHL_ZU_KLEIN",
						args: {
							decimalSeparator: {
								type: "dataFormat",
								value: ".",
								properties: {
									type: "decimalSeparator",
								},
							},
							minValue: {
								value: "0",
								type: "formattable",
								properties: {
									modelId: "DomainPrintMetaModel",
									elementPath: [
										{
											elementName: "content",
										},
										{
											elementName: "elementDefinitions",
										},
										{
											elementName: "borderProperties",
										},
										{
											elementName: "borderWidth",
										},
									],
									value: "0",
								},
							},
							maxValue: {
								value: "",
								type: "formattable",
								properties: {
									modelId: "DomainPrintMetaModel",
									elementPath: [
										{
											elementName: "content",
										},
										{
											elementName: "elementDefinitions",
										},
										{
											elementName: "borderProperties",
										},
										{
											elementName: "borderWidth",
										},
									],
									value: "",
								},
							},
							zeros: {
								type: "plain",
								value: "",
							},
							numberOfDecimalPlaces: {
								type: "plain",
								value: "0",
							},
							maxNumberOfDecimalPlaces: {
								type: "plain",
								value: "2",
							},
							numberOfDigitsBeforeDecimalPoint: {
								type: "plain",
								value: "-1",
							},
							minLength: {
								type: "plain",
								value: "-1",
							},
							maxLength: {
								type: "plain",
								value: "-1",
							},
							fieldName: {
								type: "localizable",
								properties: [
									{
										key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.borderProperties.borderWidth",
									},
								],
							},
						},
						defaults: {
							de: "Es sind nur Werte erlaubt, die größer oder gleich $minValue$ sind.",
							fr: "Seules les valeurs supérieures ou égales à $minValue$ sont autorisées.",
							nl: "Gelieve een waarde groter dan of gelijk aan $minValue$ invullen.",
							en: "Only values greater or equal to $minValue$ are allowed.",
						},
					},
				],
				parameters: {
					ruleName: "formalePruefung",
					type: "1",
					messageKey: "kernel.formalErrors.ZAHL_ZU_KLEIN",
				},
				origin: "VALIDATOR",
			},
			{
				jsonPath: [
					{
						elementName: "content",
						index: 1,
						isRepeatable: false,
					},
					{
						elementName: "elementDefinitions",
						index: 1,
						isRepeatable: true,
					},
					{
						elementName: "textProperties",
						index: 1,
						isRepeatable: false,
					},
					{
						elementName: "alignment",
						index: 1,
						isRepeatable: false,
					},
				],
				errorCode: "stringFalschesMuster",
				severity: "ERROR",
				errorMessage: [
					{
						key: "documentModel.fieldErrorMessage.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
						args: {
							Feld: {
								type: "localizable",
								properties: [
									{
										key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
									},
								],
							},
							field: {
								type: "localizable",
								properties: [
									{
										key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
									},
								],
							},
							"Feld.Wert": {
								type: "plain",
								value: "xxx",
							},
							"field.value": {
								type: "plain",
								value: "xxx",
							},
							fieldName: {
								type: "localizable",
								properties: [
									{
										key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
									},
								],
							},
						},
						defaults: {},
					},
					{
						key: "kernel.formalErrors.ENUMERATION_DEFAULT_ERROR",
						args: {
							Feld: {
								type: "localizable",
								properties: [
									{
										key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
									},
								],
							},
							field: {
								type: "localizable",
								properties: [
									{
										key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
									},
								],
							},
							"Feld.Wert": {
								type: "plain",
								value: "xxx",
							},
							"field.value": {
								type: "plain",
								value: "xxx",
							},
							fieldName: {
								type: "localizable",
								properties: [
									{
										key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
									},
								],
							},
						},
						defaults: {
							de: "Der Wert ist nicht in der Aufzählung enthalten.",
							fr: "La valeur n'est pas incluse dans la liste.",
							nl: "De waarde staat niet in de lijst.",
							en: "The value is not allowed for the enumeration.",
						},
					},
				],
				parameters: {
					ruleName: "formalePruefung",
					type: "1",
					messageKey:
						"documentModel.fieldErrorMessage.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
				},
				origin: "VALIDATOR",
			},
			{
				jsonPath: [
					{
						elementName: "content",
						index: 1,
						isRepeatable: false,
					},
					{
						elementName: "elementDefinitions",
						index: 1,
						isRepeatable: true,
					},
					{
						elementName: "text",
						index: 1,
						isRepeatable: false,
					},
					{
						elementName: "text",
						index: 1,
						isRepeatable: false,
					},
				],
				errorCode: "Error rule_c6f5a",
				severity: "ERROR",
				errorMessage: [
					{
						key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.text.textFilled",
						args: {},
						defaults: {
							de: "Bitte gib einen Text an.",
							en: "Please specifiy a text.",
						},
					},
				],
				parameters: {
					ruleName: "/content/elementDefinitions/text/textFilled",
					type: "0",
					messageKey:
						"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.text.textFilled",
				},
				origin: "VALIDATOR",
			},
		],
		"@warning": [],
		"@info": [],
		elementDefinitions: [
			{
				"@error": [
					{
						jsonPath: [
							{
								elementName: "content",
								index: 1,
								isRepeatable: false,
							},
							{
								elementName: "elementDefinitions",
								index: 1,
								isRepeatable: true,
							},
							{
								elementName: "borderProperties",
								index: 1,
								isRepeatable: false,
							},
							{
								elementName: "borderWidth",
								index: 1,
								isRepeatable: false,
							},
						],
						errorCode: "zahlZuKlein",
						severity: "ERROR",
						errorMessage: [
							{
								key: "kernel.formalErrors.ZAHL_ZU_KLEIN",
								args: {
									decimalSeparator: {
										type: "dataFormat",
										value: ".",
										properties: {
											type: "decimalSeparator",
										},
									},
									minValue: {
										value: "0",
										type: "formattable",
										properties: {
											modelId: "DomainPrintMetaModel",
											elementPath: [
												{
													elementName: "content",
												},
												{
													elementName: "elementDefinitions",
												},
												{
													elementName: "borderProperties",
												},
												{
													elementName: "borderWidth",
												},
											],
											value: "0",
										},
									},
									maxValue: {
										value: "",
										type: "formattable",
										properties: {
											modelId: "DomainPrintMetaModel",
											elementPath: [
												{
													elementName: "content",
												},
												{
													elementName: "elementDefinitions",
												},
												{
													elementName: "borderProperties",
												},
												{
													elementName: "borderWidth",
												},
											],
											value: "",
										},
									},
									zeros: {
										type: "plain",
										value: "",
									},
									numberOfDecimalPlaces: {
										type: "plain",
										value: "0",
									},
									maxNumberOfDecimalPlaces: {
										type: "plain",
										value: "2",
									},
									numberOfDigitsBeforeDecimalPoint: {
										type: "plain",
										value: "-1",
									},
									minLength: {
										type: "plain",
										value: "-1",
									},
									maxLength: {
										type: "plain",
										value: "-1",
									},
									fieldName: {
										type: "localizable",
										properties: [
											{
												key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.borderProperties.borderWidth",
											},
										],
									},
								},
								defaults: {
									de: "Es sind nur Werte erlaubt, die größer oder gleich $minValue$ sind.",
									fr: "Seules les valeurs supérieures ou égales à $minValue$ sont autorisées.",
									nl: "Gelieve een waarde groter dan of gelijk aan $minValue$ invullen.",
									en: "Only values greater or equal to $minValue$ are allowed.",
								},
							},
						],
						parameters: {
							ruleName: "formalePruefung",
							type: "1",
							messageKey: "kernel.formalErrors.ZAHL_ZU_KLEIN",
						},
						origin: "VALIDATOR",
					},
					{
						jsonPath: [
							{
								elementName: "content",
								index: 1,
								isRepeatable: false,
							},
							{
								elementName: "elementDefinitions",
								index: 1,
								isRepeatable: true,
							},
							{
								elementName: "textProperties",
								index: 1,
								isRepeatable: false,
							},
							{
								elementName: "alignment",
								index: 1,
								isRepeatable: false,
							},
						],
						errorCode: "stringFalschesMuster",
						severity: "ERROR",
						errorMessage: [
							{
								key: "documentModel.fieldErrorMessage.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
								args: {
									Feld: {
										type: "localizable",
										properties: [
											{
												key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
											},
										],
									},
									field: {
										type: "localizable",
										properties: [
											{
												key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
											},
										],
									},
									"Feld.Wert": {
										type: "plain",
										value: "xxx",
									},
									"field.value": {
										type: "plain",
										value: "xxx",
									},
									fieldName: {
										type: "localizable",
										properties: [
											{
												key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
											},
										],
									},
								},
								defaults: {},
							},
							{
								key: "kernel.formalErrors.ENUMERATION_DEFAULT_ERROR",
								args: {
									Feld: {
										type: "localizable",
										properties: [
											{
												key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
											},
										],
									},
									field: {
										type: "localizable",
										properties: [
											{
												key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
											},
										],
									},
									"Feld.Wert": {
										type: "plain",
										value: "xxx",
									},
									"field.value": {
										type: "plain",
										value: "xxx",
									},
									fieldName: {
										type: "localizable",
										properties: [
											{
												key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
											},
										],
									},
								},
								defaults: {
									de: "Der Wert ist nicht in der Aufzählung enthalten.",
									fr: "La valeur n'est pas incluse dans la liste.",
									nl: "De waarde staat niet in de lijst.",
									en: "The value is not allowed for the enumeration.",
								},
							},
						],
						parameters: {
							ruleName: "formalePruefung",
							type: "1",
							messageKey:
								"documentModel.fieldErrorMessage.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
						},
						origin: "VALIDATOR",
					},
					{
						jsonPath: [
							{
								elementName: "content",
								index: 1,
								isRepeatable: false,
							},
							{
								elementName: "elementDefinitions",
								index: 1,
								isRepeatable: true,
							},
							{
								elementName: "text",
								index: 1,
								isRepeatable: false,
							},
							{
								elementName: "text",
								index: 1,
								isRepeatable: false,
							},
						],
						errorCode: "Error rule_c6f5a",
						severity: "ERROR",
						errorMessage: [
							{
								key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.text.textFilled",
								args: {},
								defaults: {
									de: "Bitte gib einen Text an.",
									en: "Please specifiy a text.",
								},
							},
						],
						parameters: {
							ruleName: "/content/elementDefinitions/text/textFilled",
							type: "0",
							messageKey:
								"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.text.textFilled",
						},
						origin: "VALIDATOR",
					},
				],
				"@warning": [],
				"@info": [],
				borderProperties: {
					"@error": [
						{
							jsonPath: [
								{
									elementName: "content",
									index: 1,
									isRepeatable: false,
								},
								{
									elementName: "elementDefinitions",
									index: 1,
									isRepeatable: true,
								},
								{
									elementName: "borderProperties",
									index: 1,
									isRepeatable: false,
								},
								{
									elementName: "borderWidth",
									index: 1,
									isRepeatable: false,
								},
							],
							errorCode: "zahlZuKlein",
							severity: "ERROR",
							errorMessage: [
								{
									key: "kernel.formalErrors.ZAHL_ZU_KLEIN",
									args: {
										decimalSeparator: {
											type: "dataFormat",
											value: ".",
											properties: {
												type: "decimalSeparator",
											},
										},
										minValue: {
											value: "0",
											type: "formattable",
											properties: {
												modelId: "DomainPrintMetaModel",
												elementPath: [
													{
														elementName: "content",
													},
													{
														elementName: "elementDefinitions",
													},
													{
														elementName: "borderProperties",
													},
													{
														elementName: "borderWidth",
													},
												],
												value: "0",
											},
										},
										maxValue: {
											value: "",
											type: "formattable",
											properties: {
												modelId: "DomainPrintMetaModel",
												elementPath: [
													{
														elementName: "content",
													},
													{
														elementName: "elementDefinitions",
													},
													{
														elementName: "borderProperties",
													},
													{
														elementName: "borderWidth",
													},
												],
												value: "",
											},
										},
										zeros: {
											type: "plain",
											value: "",
										},
										numberOfDecimalPlaces: {
											type: "plain",
											value: "0",
										},
										maxNumberOfDecimalPlaces: {
											type: "plain",
											value: "2",
										},
										numberOfDigitsBeforeDecimalPoint: {
											type: "plain",
											value: "-1",
										},
										minLength: {
											type: "plain",
											value: "-1",
										},
										maxLength: {
											type: "plain",
											value: "-1",
										},
										fieldName: {
											type: "localizable",
											properties: [
												{
													key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.borderProperties.borderWidth",
												},
											],
										},
									},
									defaults: {
										de: "Es sind nur Werte erlaubt, die größer oder gleich $minValue$ sind.",
										fr: "Seules les valeurs supérieures ou égales à $minValue$ sont autorisées.",
										nl: "Gelieve een waarde groter dan of gelijk aan $minValue$ invullen.",
										en: "Only values greater or equal to $minValue$ are allowed.",
									},
								},
							],
							parameters: {
								ruleName: "formalePruefung",
								type: "1",
								messageKey: "kernel.formalErrors.ZAHL_ZU_KLEIN",
							},
							origin: "VALIDATOR",
						},
					],
					"@warning": [],
					"@info": [],
					borderWidth: {
						"@error": [
							{
								jsonPath: [
									{
										elementName: "content",
										index: 1,
										isRepeatable: false,
									},
									{
										elementName: "elementDefinitions",
										index: 1,
										isRepeatable: true,
									},
									{
										elementName: "borderProperties",
										index: 1,
										isRepeatable: false,
									},
									{
										elementName: "borderWidth",
										index: 1,
										isRepeatable: false,
									},
								],
								errorCode: "zahlZuKlein",
								severity: "ERROR",
								errorMessage: [
									{
										key: "kernel.formalErrors.ZAHL_ZU_KLEIN",
										args: {
											decimalSeparator: {
												type: "dataFormat",
												value: ".",
												properties: {
													type: "decimalSeparator",
												},
											},
											minValue: {
												value: "0",
												type: "formattable",
												properties: {
													modelId: "DomainPrintMetaModel",
													elementPath: [
														{
															elementName: "content",
														},
														{
															elementName: "elementDefinitions",
														},
														{
															elementName: "borderProperties",
														},
														{
															elementName: "borderWidth",
														},
													],
													value: "0",
												},
											},
											maxValue: {
												value: "",
												type: "formattable",
												properties: {
													modelId: "DomainPrintMetaModel",
													elementPath: [
														{
															elementName: "content",
														},
														{
															elementName: "elementDefinitions",
														},
														{
															elementName: "borderProperties",
														},
														{
															elementName: "borderWidth",
														},
													],
													value: "",
												},
											},
											zeros: {
												type: "plain",
												value: "",
											},
											numberOfDecimalPlaces: {
												type: "plain",
												value: "0",
											},
											maxNumberOfDecimalPlaces: {
												type: "plain",
												value: "2",
											},
											numberOfDigitsBeforeDecimalPoint: {
												type: "plain",
												value: "-1",
											},
											minLength: {
												type: "plain",
												value: "-1",
											},
											maxLength: {
												type: "plain",
												value: "-1",
											},
											fieldName: {
												type: "localizable",
												properties: [
													{
														key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.borderProperties.borderWidth",
													},
												],
											},
										},
										defaults: {
											de: "Es sind nur Werte erlaubt, die größer oder gleich $minValue$ sind.",
											fr: "Seules les valeurs supérieures ou égales à $minValue$ sont autorisées.",
											nl: "Gelieve een waarde groter dan of gelijk aan $minValue$ invullen.",
											en: "Only values greater or equal to $minValue$ are allowed.",
										},
									},
								],
								parameters: {
									ruleName: "formalePruefung",
									type: "1",
									messageKey: "kernel.formalErrors.ZAHL_ZU_KLEIN",
								},
								origin: "VALIDATOR",
							},
						],
						"@warning": [],
						"@info": [],
					},
					"@id": "KunIAIv2tGz1Ui7_Aqv9f",
				},
				textProperties: {
					"@error": [
						{
							jsonPath: [
								{
									elementName: "content",
									index: 1,
									isRepeatable: false,
								},
								{
									elementName: "elementDefinitions",
									index: 1,
									isRepeatable: true,
								},
								{
									elementName: "textProperties",
									index: 1,
									isRepeatable: false,
								},
								{
									elementName: "alignment",
									index: 1,
									isRepeatable: false,
								},
							],
							errorCode: "stringFalschesMuster",
							severity: "ERROR",
							errorMessage: [
								{
									key: "documentModel.fieldErrorMessage.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
									args: {
										Feld: {
											type: "localizable",
											properties: [
												{
													key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
												},
											],
										},
										field: {
											type: "localizable",
											properties: [
												{
													key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
												},
											],
										},
										"Feld.Wert": {
											type: "plain",
											value: "xxx",
										},
										"field.value": {
											type: "plain",
											value: "xxx",
										},
										fieldName: {
											type: "localizable",
											properties: [
												{
													key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
												},
											],
										},
									},
									defaults: {},
								},
								{
									key: "kernel.formalErrors.ENUMERATION_DEFAULT_ERROR",
									args: {
										Feld: {
											type: "localizable",
											properties: [
												{
													key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
												},
											],
										},
										field: {
											type: "localizable",
											properties: [
												{
													key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
												},
											],
										},
										"Feld.Wert": {
											type: "plain",
											value: "xxx",
										},
										"field.value": {
											type: "plain",
											value: "xxx",
										},
										fieldName: {
											type: "localizable",
											properties: [
												{
													key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
												},
											],
										},
									},
									defaults: {
										de: "Der Wert ist nicht in der Aufzählung enthalten.",
										fr: "La valeur n'est pas incluse dans la liste.",
										nl: "De waarde staat niet in de lijst.",
										en: "The value is not allowed for the enumeration.",
									},
								},
							],
							parameters: {
								ruleName: "formalePruefung",
								type: "1",
								messageKey:
									"documentModel.fieldErrorMessage.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
							},
							origin: "VALIDATOR",
						},
					],
					"@warning": [],
					"@info": [],
					alignment: {
						"@error": [
							{
								jsonPath: [
									{
										elementName: "content",
										index: 1,
										isRepeatable: false,
									},
									{
										elementName: "elementDefinitions",
										index: 1,
										isRepeatable: true,
									},
									{
										elementName: "textProperties",
										index: 1,
										isRepeatable: false,
									},
									{
										elementName: "alignment",
										index: 1,
										isRepeatable: false,
									},
								],
								errorCode: "stringFalschesMuster",
								severity: "ERROR",
								errorMessage: [
									{
										key: "documentModel.fieldErrorMessage.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
										args: {
											Feld: {
												type: "localizable",
												properties: [
													{
														key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
													},
												],
											},
											field: {
												type: "localizable",
												properties: [
													{
														key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
													},
												],
											},
											"Feld.Wert": {
												type: "plain",
												value: "xxx",
											},
											"field.value": {
												type: "plain",
												value: "xxx",
											},
											fieldName: {
												type: "localizable",
												properties: [
													{
														key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
													},
												],
											},
										},
										defaults: {},
									},
									{
										key: "kernel.formalErrors.ENUMERATION_DEFAULT_ERROR",
										args: {
											Feld: {
												type: "localizable",
												properties: [
													{
														key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
													},
												],
											},
											field: {
												type: "localizable",
												properties: [
													{
														key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
													},
												],
											},
											"Feld.Wert": {
												type: "plain",
												value: "xxx",
											},
											"field.value": {
												type: "plain",
												value: "xxx",
											},
											fieldName: {
												type: "localizable",
												properties: [
													{
														key: "documentModel.label.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
													},
												],
											},
										},
										defaults: {
											de: "Der Wert ist nicht in der Aufzählung enthalten.",
											fr: "La valeur n'est pas incluse dans la liste.",
											nl: "De waarde staat niet in de lijst.",
											en: "The value is not allowed for the enumeration.",
										},
									},
								],
								parameters: {
									ruleName: "formalePruefung",
									type: "1",
									messageKey:
										"documentModel.fieldErrorMessage.DomainPrintMetaModel.content.elementDefinitions.textProperties.alignment",
								},
								origin: "VALIDATOR",
							},
						],
						"@warning": [],
						"@info": [],
					},
					"@id": "al-0tmhdyO9pmSk6n1K0k",
				},
				text: {
					"@error": [
						{
							jsonPath: [
								{
									elementName: "content",
									index: 1,
									isRepeatable: false,
								},
								{
									elementName: "elementDefinitions",
									index: 1,
									isRepeatable: true,
								},
								{
									elementName: "text",
									index: 1,
									isRepeatable: false,
								},
								{
									elementName: "text",
									index: 1,
									isRepeatable: false,
								},
							],
							errorCode: "Error rule_c6f5a",
							severity: "ERROR",
							errorMessage: [
								{
									key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.text.textFilled",
									args: {},
									defaults: {
										de: "Bitte gib einen Text an.",
										en: "Please specifiy a text.",
									},
								},
							],
							parameters: {
								ruleName: "/content/elementDefinitions/text/textFilled",
								type: "0",
								messageKey:
									"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.text.textFilled",
							},
							origin: "VALIDATOR",
						},
					],
					"@warning": [],
					"@info": [],
					text: {
						"@error": [
							{
								jsonPath: [
									{
										elementName: "content",
										index: 1,
										isRepeatable: false,
									},
									{
										elementName: "elementDefinitions",
										index: 1,
										isRepeatable: true,
									},
									{
										elementName: "text",
										index: 1,
										isRepeatable: false,
									},
									{
										elementName: "text",
										index: 1,
										isRepeatable: false,
									},
								],
								errorCode: "Error rule_c6f5a",
								severity: "ERROR",
								errorMessage: [
									{
										key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.text.textFilled",
										args: {},
										defaults: {
											de: "Bitte gib einen Text an.",
											en: "Please specifiy a text.",
										},
									},
								],
								parameters: {
									ruleName: "/content/elementDefinitions/text/textFilled",
									type: "0",
									messageKey:
										"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.text.textFilled",
								},
								origin: "VALIDATOR",
							},
						],
						"@warning": [],
						"@info": [],
					},
				},
				"@id": "1kzGG-tOzD8a4taPZJZt6",
				"@type": "Text",
			},
		],
		"@id": "PRINT_MODEL_CONTENT",
	},
};
export const largeErrorMap = {
	"@error": [
		{
			jsonPath: [
				{
					elementName: "content",
					index: 1,
					isRepeatable: false,
				},
				{
					elementName: "general",
					index: 1,
					isRepeatable: false,
				},
				{
					elementName: "description",
					index: 1,
					isRepeatable: false,
				},
			],
			errorCode: "nachfolgendesBlank",
			severity: "ERROR",
			errorMessage: [
				{
					key: "kernel.formalErrors.FEHLER_NACHFOLGENDES_BLANK_FM_TEXT",
					args: {
						fieldName: {
							type: "localizable",
							properties: [
								{
									key: "documentModel.label.DomainPrintMetaModel.content.general.description",
								},
							],
						},
					},
					defaults: {
						de: "Es sind nur Werte erlaubt, die nicht mit einem Leerzeichen enden.",
						fr: "Seules les valeurs non suivies d'espaces sont autorisées.",
						nl: "Alleen waardes zonder spaties zijn toegestaan.",
						en: "Only values without trailing spaces are allowed.",
					},
				},
			],
			parameters: {
				ruleName: "formalePruefung",
				type: "1",
				messageKey: "kernel.formalErrors.FEHLER_NACHFOLGENDES_BLANK_FM_TEXT",
			},
			origin: "VALIDATOR",
		},
		{
			jsonPath: [
				{
					elementName: "content",
					index: 1,
					isRepeatable: false,
				},
				{
					elementName: "segments",
					index: 1,
					isRepeatable: false,
				},
				{
					elementName: "definitions",
					index: 2,
					isRepeatable: true,
				},
				{
					elementName: "title",
					index: 1,
					isRepeatable: false,
				},
			],
			errorCode: "nachfolgendesBlank",
			severity: "ERROR",
			errorMessage: [
				{
					key: "kernel.formalErrors.FEHLER_NACHFOLGENDES_BLANK_FM_TEXT",
					args: {
						fieldName: {
							type: "localizable",
							properties: [
								{
									key: "documentModel.label.DomainPrintMetaModel.content.segments.definitions.title",
								},
							],
						},
					},
					defaults: {
						de: "Es sind nur Werte erlaubt, die nicht mit einem Leerzeichen enden.",
						fr: "Seules les valeurs non suivies d'espaces sont autorisées.",
						nl: "Alleen waardes zonder spaties zijn toegestaan.",
						en: "Only values without trailing spaces are allowed.",
					},
				},
			],
			parameters: {
				ruleName: "formalePruefung",
				type: "1",
				messageKey: "kernel.formalErrors.FEHLER_NACHFOLGENDES_BLANK_FM_TEXT",
			},
			origin: "VALIDATOR",
		},
		{
			jsonPath: [
				{
					elementName: "content",
					index: 1,
					isRepeatable: false,
				},
				{
					elementName: "elementDefinitions",
					index: 3,
					isRepeatable: true,
				},
				{
					elementName: "listing",
					index: 1,
					isRepeatable: false,
				},
				{
					elementName: "columns",
					index: 1,
					isRepeatable: true,
				},
				{
					elementName: "label",
					index: 1,
					isRepeatable: false,
				},
			],
			errorCode: "Error rule_4c2ba",
			severity: "ERROR",
			errorMessage: [
				{
					key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.columnCountGreaterThanZero",
					args: {},
					defaults: {
						de: "Bitte definiere mindestens eine Spalte.",
						en: "Please define at least one column.",
					},
				},
			],
			parameters: {
				ruleName: "/content/elementDefinitions/listing/columnCountGreaterThanZero",
				type: "0",
				messageKey:
					"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.columnCountGreaterThanZero",
			},
			origin: "VALIDATOR",
		},
		{
			jsonPath: [
				{
					elementName: "content",
					index: 1,
					isRepeatable: false,
				},
				{
					elementName: "elementDefinitions",
					index: 4,
					isRepeatable: true,
				},
				{
					elementName: "text",
					index: 1,
					isRepeatable: false,
				},
				{
					elementName: "text",
					index: 1,
					isRepeatable: false,
				},
			],
			errorCode: "Error rule_c6f5a",
			severity: "ERROR",
			errorMessage: [
				{
					key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.text.textFilled",
					args: {},
					defaults: {
						de: "Bitte gib einen Text an.",
						en: "Please specifiy a text.",
					},
				},
			],
			parameters: {
				ruleName: "/content/elementDefinitions/text/textFilled",
				type: "0",
				messageKey:
					"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.text.textFilled",
			},
			origin: "VALIDATOR",
		},
		{
			jsonPath: [
				{
					elementName: "content",
					index: 1,
					isRepeatable: false,
				},
				{
					elementName: "elementDefinitions",
					index: 3,
					isRepeatable: true,
				},
				{
					elementName: "listing",
					index: 1,
					isRepeatable: false,
				},
				{
					elementName: "model",
					index: 1,
					isRepeatable: false,
				},
			],
			errorCode: "Error rule_6f793",
			severity: "ERROR",
			errorMessage: [
				{
					key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.modelFilled",
					args: {},
					defaults: {
						de: "Bitte wähle ein Modell aus.",
						en: "Please select a model.",
					},
				},
			],
			parameters: {
				ruleName: "/content/elementDefinitions/listing/modelFilled",
				type: "0",
				messageKey:
					"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.modelFilled",
			},
			origin: "VALIDATOR",
		},
		{
			jsonPath: [
				{
					elementName: "content",
					index: 1,
					isRepeatable: false,
				},
				{
					elementName: "elementDefinitions",
					index: 3,
					isRepeatable: true,
				},
				{
					elementName: "listing",
					index: 1,
					isRepeatable: false,
				},
				{
					elementName: "basePath",
					index: 1,
					isRepeatable: false,
				},
			],
			errorCode: "Error rule_53583",
			severity: "ERROR",
			errorMessage: [
				{
					key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.basePathFilled",
					args: {},
					defaults: {
						de: "Bitte wähle einen Basispfad.",
						en: "Please select a basePath.",
					},
				},
			],
			parameters: {
				ruleName: "/content/elementDefinitions/listing/basePathFilled",
				type: "0",
				messageKey:
					"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.basePathFilled",
			},
			origin: "VALIDATOR",
		},
	],
	"@warning": [
		{
			jsonPath: [
				{
					elementName: "content",
					index: 1,
					isRepeatable: false,
				},
				{
					elementName: "segments",
					index: 1,
					isRepeatable: false,
				},
				{
					elementName: "definitions",
					index: 1,
					isRepeatable: true,
				},
				{
					elementName: "elementReferences",
					index: 1,
					isRepeatable: true,
				},
				{
					elementName: "position",
					index: 1,
					isRepeatable: false,
				},
				{
					elementName: "y",
					index: 1,
					isRepeatable: false,
				},
				{
					elementName: "value",
					index: 1,
					isRepeatable: false,
				},
			],
			errorCode: "Error rule_b1fd7",
			severity: "WARNING",
			errorMessage: [
				{
					key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
					args: {},
					defaults: {
						de: "Das Element überschneidet sich mit anderen",
						en: "The element overlaps with others",
					},
				},
			],
			parameters: {
				ruleName: "/content/segments/definitions/elementNotOverlap",
				type: "0",
				messageKey:
					"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
			},
			origin: "VALIDATOR",
		},
		{
			jsonPath: [
				{
					elementName: "content",
					index: 1,
					isRepeatable: false,
				},
				{
					elementName: "segments",
					index: 1,
					isRepeatable: false,
				},
				{
					elementName: "definitions",
					index: 1,
					isRepeatable: true,
				},
				{
					elementName: "elementReferences",
					index: 2,
					isRepeatable: true,
				},
				{
					elementName: "position",
					index: 1,
					isRepeatable: false,
				},
				{
					elementName: "y",
					index: 1,
					isRepeatable: false,
				},
				{
					elementName: "value",
					index: 1,
					isRepeatable: false,
				},
			],
			errorCode: "Error rule_b1fd7",
			severity: "WARNING",
			errorMessage: [
				{
					key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
					args: {},
					defaults: {
						de: "Das Element überschneidet sich mit anderen",
						en: "The element overlaps with others",
					},
				},
			],
			parameters: {
				ruleName: "/content/segments/definitions/elementNotOverlap",
				type: "0",
				messageKey:
					"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
			},
			origin: "VALIDATOR",
		},
	],
	"@info": [],
	content: {
		"@error": [
			{
				jsonPath: [
					{
						elementName: "content",
						index: 1,
						isRepeatable: false,
					},
					{
						elementName: "general",
						index: 1,
						isRepeatable: false,
					},
					{
						elementName: "description",
						index: 1,
						isRepeatable: false,
					},
				],
				errorCode: "nachfolgendesBlank",
				severity: "ERROR",
				errorMessage: [
					{
						key: "kernel.formalErrors.FEHLER_NACHFOLGENDES_BLANK_FM_TEXT",
						args: {
							fieldName: {
								type: "localizable",
								properties: [
									{
										key: "documentModel.label.DomainPrintMetaModel.content.general.description",
									},
								],
							},
						},
						defaults: {
							de: "Es sind nur Werte erlaubt, die nicht mit einem Leerzeichen enden.",
							fr: "Seules les valeurs non suivies d'espaces sont autorisées.",
							nl: "Alleen waardes zonder spaties zijn toegestaan.",
							en: "Only values without trailing spaces are allowed.",
						},
					},
				],
				parameters: {
					ruleName: "formalePruefung",
					type: "1",
					messageKey: "kernel.formalErrors.FEHLER_NACHFOLGENDES_BLANK_FM_TEXT",
				},
				origin: "VALIDATOR",
			},
			{
				jsonPath: [
					{
						elementName: "content",
						index: 1,
						isRepeatable: false,
					},
					{
						elementName: "segments",
						index: 1,
						isRepeatable: false,
					},
					{
						elementName: "definitions",
						index: 2,
						isRepeatable: true,
					},
					{
						elementName: "title",
						index: 1,
						isRepeatable: false,
					},
				],
				errorCode: "nachfolgendesBlank",
				severity: "ERROR",
				errorMessage: [
					{
						key: "kernel.formalErrors.FEHLER_NACHFOLGENDES_BLANK_FM_TEXT",
						args: {
							fieldName: {
								type: "localizable",
								properties: [
									{
										key: "documentModel.label.DomainPrintMetaModel.content.segments.definitions.title",
									},
								],
							},
						},
						defaults: {
							de: "Es sind nur Werte erlaubt, die nicht mit einem Leerzeichen enden.",
							fr: "Seules les valeurs non suivies d'espaces sont autorisées.",
							nl: "Alleen waardes zonder spaties zijn toegestaan.",
							en: "Only values without trailing spaces are allowed.",
						},
					},
				],
				parameters: {
					ruleName: "formalePruefung",
					type: "1",
					messageKey: "kernel.formalErrors.FEHLER_NACHFOLGENDES_BLANK_FM_TEXT",
				},
				origin: "VALIDATOR",
			},
			{
				jsonPath: [
					{
						elementName: "content",
						index: 1,
						isRepeatable: false,
					},
					{
						elementName: "elementDefinitions",
						index: 3,
						isRepeatable: true,
					},
					{
						elementName: "listing",
						index: 1,
						isRepeatable: false,
					},
					{
						elementName: "columns",
						index: 1,
						isRepeatable: true,
					},
					{
						elementName: "label",
						index: 1,
						isRepeatable: false,
					},
				],
				errorCode: "Error rule_4c2ba",
				severity: "ERROR",
				errorMessage: [
					{
						key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.columnCountGreaterThanZero",
						args: {},
						defaults: {
							de: "Bitte definiere mindestens eine Spalte.",
							en: "Please define at least one column.",
						},
					},
				],
				parameters: {
					ruleName: "/content/elementDefinitions/listing/columnCountGreaterThanZero",
					type: "0",
					messageKey:
						"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.columnCountGreaterThanZero",
				},
				origin: "VALIDATOR",
			},
			{
				jsonPath: [
					{
						elementName: "content",
						index: 1,
						isRepeatable: false,
					},
					{
						elementName: "elementDefinitions",
						index: 4,
						isRepeatable: true,
					},
					{
						elementName: "text",
						index: 1,
						isRepeatable: false,
					},
					{
						elementName: "text",
						index: 1,
						isRepeatable: false,
					},
				],
				errorCode: "Error rule_c6f5a",
				severity: "ERROR",
				errorMessage: [
					{
						key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.text.textFilled",
						args: {},
						defaults: {
							de: "Bitte gib einen Text an.",
							en: "Please specifiy a text.",
						},
					},
				],
				parameters: {
					ruleName: "/content/elementDefinitions/text/textFilled",
					type: "0",
					messageKey:
						"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.text.textFilled",
				},
				origin: "VALIDATOR",
			},
			{
				jsonPath: [
					{
						elementName: "content",
						index: 1,
						isRepeatable: false,
					},
					{
						elementName: "elementDefinitions",
						index: 3,
						isRepeatable: true,
					},
					{
						elementName: "listing",
						index: 1,
						isRepeatable: false,
					},
					{
						elementName: "model",
						index: 1,
						isRepeatable: false,
					},
				],
				errorCode: "Error rule_6f793",
				severity: "ERROR",
				errorMessage: [
					{
						key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.modelFilled",
						args: {},
						defaults: {
							de: "Bitte wähle ein Modell aus.",
							en: "Please select a model.",
						},
					},
				],
				parameters: {
					ruleName: "/content/elementDefinitions/listing/modelFilled",
					type: "0",
					messageKey:
						"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.modelFilled",
				},
				origin: "VALIDATOR",
			},
			{
				jsonPath: [
					{
						elementName: "content",
						index: 1,
						isRepeatable: false,
					},
					{
						elementName: "elementDefinitions",
						index: 3,
						isRepeatable: true,
					},
					{
						elementName: "listing",
						index: 1,
						isRepeatable: false,
					},
					{
						elementName: "basePath",
						index: 1,
						isRepeatable: false,
					},
				],
				errorCode: "Error rule_53583",
				severity: "ERROR",
				errorMessage: [
					{
						key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.basePathFilled",
						args: {},
						defaults: {
							de: "Bitte wähle einen Basispfad.",
							en: "Please select a basePath.",
						},
					},
				],
				parameters: {
					ruleName: "/content/elementDefinitions/listing/basePathFilled",
					type: "0",
					messageKey:
						"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.basePathFilled",
				},
				origin: "VALIDATOR",
			},
		],
		"@warning": [
			{
				jsonPath: [
					{
						elementName: "content",
						index: 1,
						isRepeatable: false,
					},
					{
						elementName: "segments",
						index: 1,
						isRepeatable: false,
					},
					{
						elementName: "definitions",
						index: 1,
						isRepeatable: true,
					},
					{
						elementName: "elementReferences",
						index: 1,
						isRepeatable: true,
					},
					{
						elementName: "position",
						index: 1,
						isRepeatable: false,
					},
					{
						elementName: "y",
						index: 1,
						isRepeatable: false,
					},
					{
						elementName: "value",
						index: 1,
						isRepeatable: false,
					},
				],
				errorCode: "Error rule_b1fd7",
				severity: "WARNING",
				errorMessage: [
					{
						key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
						args: {},
						defaults: {
							de: "Das Element überschneidet sich mit anderen",
							en: "The element overlaps with others",
						},
					},
				],
				parameters: {
					ruleName: "/content/segments/definitions/elementNotOverlap",
					type: "0",
					messageKey:
						"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
				},
				origin: "VALIDATOR",
			},
			{
				jsonPath: [
					{
						elementName: "content",
						index: 1,
						isRepeatable: false,
					},
					{
						elementName: "segments",
						index: 1,
						isRepeatable: false,
					},
					{
						elementName: "definitions",
						index: 1,
						isRepeatable: true,
					},
					{
						elementName: "elementReferences",
						index: 2,
						isRepeatable: true,
					},
					{
						elementName: "position",
						index: 1,
						isRepeatable: false,
					},
					{
						elementName: "y",
						index: 1,
						isRepeatable: false,
					},
					{
						elementName: "value",
						index: 1,
						isRepeatable: false,
					},
				],
				errorCode: "Error rule_b1fd7",
				severity: "WARNING",
				errorMessage: [
					{
						key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
						args: {},
						defaults: {
							de: "Das Element überschneidet sich mit anderen",
							en: "The element overlaps with others",
						},
					},
				],
				parameters: {
					ruleName: "/content/segments/definitions/elementNotOverlap",
					type: "0",
					messageKey:
						"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
				},
				origin: "VALIDATOR",
			},
		],
		"@info": [],
		general: {
			"@error": [
				{
					jsonPath: [
						{
							elementName: "content",
							index: 1,
							isRepeatable: false,
						},
						{
							elementName: "general",
							index: 1,
							isRepeatable: false,
						},
						{
							elementName: "description",
							index: 1,
							isRepeatable: false,
						},
					],
					errorCode: "nachfolgendesBlank",
					severity: "ERROR",
					errorMessage: [
						{
							key: "kernel.formalErrors.FEHLER_NACHFOLGENDES_BLANK_FM_TEXT",
							args: {
								fieldName: {
									type: "localizable",
									properties: [
										{
											key: "documentModel.label.DomainPrintMetaModel.content.general.description",
										},
									],
								},
							},
							defaults: {
								de: "Es sind nur Werte erlaubt, die nicht mit einem Leerzeichen enden.",
								fr: "Seules les valeurs non suivies d'espaces sont autorisées.",
								nl: "Alleen waardes zonder spaties zijn toegestaan.",
								en: "Only values without trailing spaces are allowed.",
							},
						},
					],
					parameters: {
						ruleName: "formalePruefung",
						type: "1",
						messageKey: "kernel.formalErrors.FEHLER_NACHFOLGENDES_BLANK_FM_TEXT",
					},
					origin: "VALIDATOR",
				},
			],
			"@warning": [],
			"@info": [],
			description: {
				"@error": [
					{
						jsonPath: [
							{
								elementName: "content",
								index: 1,
								isRepeatable: false,
							},
							{
								elementName: "general",
								index: 1,
								isRepeatable: false,
							},
							{
								elementName: "description",
								index: 1,
								isRepeatable: false,
							},
						],
						errorCode: "nachfolgendesBlank",
						severity: "ERROR",
						errorMessage: [
							{
								key: "kernel.formalErrors.FEHLER_NACHFOLGENDES_BLANK_FM_TEXT",
								args: {
									fieldName: {
										type: "localizable",
										properties: [
											{
												key: "documentModel.label.DomainPrintMetaModel.content.general.description",
											},
										],
									},
								},
								defaults: {
									de: "Es sind nur Werte erlaubt, die nicht mit einem Leerzeichen enden.",
									fr: "Seules les valeurs non suivies d'espaces sont autorisées.",
									nl: "Alleen waardes zonder spaties zijn toegestaan.",
									en: "Only values without trailing spaces are allowed.",
								},
							},
						],
						parameters: {
							ruleName: "formalePruefung",
							type: "1",
							messageKey: "kernel.formalErrors.FEHLER_NACHFOLGENDES_BLANK_FM_TEXT",
						},
						origin: "VALIDATOR",
					},
				],
				"@warning": [],
				"@info": [],
			},
			"@id": "PRINT_MODEL_CONTENT_GENERAL",
		},
		segments: {
			"@error": [
				{
					jsonPath: [
						{
							elementName: "content",
							index: 1,
							isRepeatable: false,
						},
						{
							elementName: "segments",
							index: 1,
							isRepeatable: false,
						},
						{
							elementName: "definitions",
							index: 2,
							isRepeatable: true,
						},
						{
							elementName: "title",
							index: 1,
							isRepeatable: false,
						},
					],
					errorCode: "nachfolgendesBlank",
					severity: "ERROR",
					errorMessage: [
						{
							key: "kernel.formalErrors.FEHLER_NACHFOLGENDES_BLANK_FM_TEXT",
							args: {
								fieldName: {
									type: "localizable",
									properties: [
										{
											key: "documentModel.label.DomainPrintMetaModel.content.segments.definitions.title",
										},
									],
								},
							},
							defaults: {
								de: "Es sind nur Werte erlaubt, die nicht mit einem Leerzeichen enden.",
								fr: "Seules les valeurs non suivies d'espaces sont autorisées.",
								nl: "Alleen waardes zonder spaties zijn toegestaan.",
								en: "Only values without trailing spaces are allowed.",
							},
						},
					],
					parameters: {
						ruleName: "formalePruefung",
						type: "1",
						messageKey: "kernel.formalErrors.FEHLER_NACHFOLGENDES_BLANK_FM_TEXT",
					},
					origin: "VALIDATOR",
				},
			],
			"@warning": [
				{
					jsonPath: [
						{
							elementName: "content",
							index: 1,
							isRepeatable: false,
						},
						{
							elementName: "segments",
							index: 1,
							isRepeatable: false,
						},
						{
							elementName: "definitions",
							index: 1,
							isRepeatable: true,
						},
						{
							elementName: "elementReferences",
							index: 1,
							isRepeatable: true,
						},
						{
							elementName: "position",
							index: 1,
							isRepeatable: false,
						},
						{
							elementName: "y",
							index: 1,
							isRepeatable: false,
						},
						{
							elementName: "value",
							index: 1,
							isRepeatable: false,
						},
					],
					errorCode: "Error rule_b1fd7",
					severity: "WARNING",
					errorMessage: [
						{
							key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
							args: {},
							defaults: {
								de: "Das Element überschneidet sich mit anderen",
								en: "The element overlaps with others",
							},
						},
					],
					parameters: {
						ruleName: "/content/segments/definitions/elementNotOverlap",
						type: "0",
						messageKey:
							"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
					},
					origin: "VALIDATOR",
				},
				{
					jsonPath: [
						{
							elementName: "content",
							index: 1,
							isRepeatable: false,
						},
						{
							elementName: "segments",
							index: 1,
							isRepeatable: false,
						},
						{
							elementName: "definitions",
							index: 1,
							isRepeatable: true,
						},
						{
							elementName: "elementReferences",
							index: 2,
							isRepeatable: true,
						},
						{
							elementName: "position",
							index: 1,
							isRepeatable: false,
						},
						{
							elementName: "y",
							index: 1,
							isRepeatable: false,
						},
						{
							elementName: "value",
							index: 1,
							isRepeatable: false,
						},
					],
					errorCode: "Error rule_b1fd7",
					severity: "WARNING",
					errorMessage: [
						{
							key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
							args: {},
							defaults: {
								de: "Das Element überschneidet sich mit anderen",
								en: "The element overlaps with others",
							},
						},
					],
					parameters: {
						ruleName: "/content/segments/definitions/elementNotOverlap",
						type: "0",
						messageKey:
							"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
					},
					origin: "VALIDATOR",
				},
			],
			"@info": [],
			definitions: [
				{
					"@error": [],
					"@warning": [
						{
							jsonPath: [
								{
									elementName: "content",
									index: 1,
									isRepeatable: false,
								},
								{
									elementName: "segments",
									index: 1,
									isRepeatable: false,
								},
								{
									elementName: "definitions",
									index: 1,
									isRepeatable: true,
								},
								{
									elementName: "elementReferences",
									index: 1,
									isRepeatable: true,
								},
								{
									elementName: "position",
									index: 1,
									isRepeatable: false,
								},
								{
									elementName: "y",
									index: 1,
									isRepeatable: false,
								},
								{
									elementName: "value",
									index: 1,
									isRepeatable: false,
								},
							],
							errorCode: "Error rule_b1fd7",
							severity: "WARNING",
							errorMessage: [
								{
									key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
									args: {},
									defaults: {
										de: "Das Element überschneidet sich mit anderen",
										en: "The element overlaps with others",
									},
								},
							],
							parameters: {
								ruleName: "/content/segments/definitions/elementNotOverlap",
								type: "0",
								messageKey:
									"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
							},
							origin: "VALIDATOR",
						},
						{
							jsonPath: [
								{
									elementName: "content",
									index: 1,
									isRepeatable: false,
								},
								{
									elementName: "segments",
									index: 1,
									isRepeatable: false,
								},
								{
									elementName: "definitions",
									index: 1,
									isRepeatable: true,
								},
								{
									elementName: "elementReferences",
									index: 2,
									isRepeatable: true,
								},
								{
									elementName: "position",
									index: 1,
									isRepeatable: false,
								},
								{
									elementName: "y",
									index: 1,
									isRepeatable: false,
								},
								{
									elementName: "value",
									index: 1,
									isRepeatable: false,
								},
							],
							errorCode: "Error rule_b1fd7",
							severity: "WARNING",
							errorMessage: [
								{
									key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
									args: {},
									defaults: {
										de: "Das Element überschneidet sich mit anderen",
										en: "The element overlaps with others",
									},
								},
							],
							parameters: {
								ruleName: "/content/segments/definitions/elementNotOverlap",
								type: "0",
								messageKey:
									"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
							},
							origin: "VALIDATOR",
						},
					],
					"@info": [],
					elementReferences: [
						{
							"@error": [],
							"@warning": [
								{
									jsonPath: [
										{
											elementName: "content",
											index: 1,
											isRepeatable: false,
										},
										{
											elementName: "segments",
											index: 1,
											isRepeatable: false,
										},
										{
											elementName: "definitions",
											index: 1,
											isRepeatable: true,
										},
										{
											elementName: "elementReferences",
											index: 1,
											isRepeatable: true,
										},
										{
											elementName: "position",
											index: 1,
											isRepeatable: false,
										},
										{
											elementName: "y",
											index: 1,
											isRepeatable: false,
										},
										{
											elementName: "value",
											index: 1,
											isRepeatable: false,
										},
									],
									errorCode: "Error rule_b1fd7",
									severity: "WARNING",
									errorMessage: [
										{
											key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
											args: {},
											defaults: {
												de: "Das Element überschneidet sich mit anderen",
												en: "The element overlaps with others",
											},
										},
									],
									parameters: {
										ruleName: "/content/segments/definitions/elementNotOverlap",
										type: "0",
										messageKey:
											"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
									},
									origin: "VALIDATOR",
								},
							],
							"@info": [],
							position: {
								"@error": [],
								"@warning": [
									{
										jsonPath: [
											{
												elementName: "content",
												index: 1,
												isRepeatable: false,
											},
											{
												elementName: "segments",
												index: 1,
												isRepeatable: false,
											},
											{
												elementName: "definitions",
												index: 1,
												isRepeatable: true,
											},
											{
												elementName: "elementReferences",
												index: 1,
												isRepeatable: true,
											},
											{
												elementName: "position",
												index: 1,
												isRepeatable: false,
											},
											{
												elementName: "y",
												index: 1,
												isRepeatable: false,
											},
											{
												elementName: "value",
												index: 1,
												isRepeatable: false,
											},
										],
										errorCode: "Error rule_b1fd7",
										severity: "WARNING",
										errorMessage: [
											{
												key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
												args: {},
												defaults: {
													de: "Das Element überschneidet sich mit anderen",
													en: "The element overlaps with others",
												},
											},
										],
										parameters: {
											ruleName: "/content/segments/definitions/elementNotOverlap",
											type: "0",
											messageKey:
												"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
										},
										origin: "VALIDATOR",
									},
								],
								"@info": [],
								y: {
									"@error": [],
									"@warning": [
										{
											jsonPath: [
												{
													elementName: "content",
													index: 1,
													isRepeatable: false,
												},
												{
													elementName: "segments",
													index: 1,
													isRepeatable: false,
												},
												{
													elementName: "definitions",
													index: 1,
													isRepeatable: true,
												},
												{
													elementName: "elementReferences",
													index: 1,
													isRepeatable: true,
												},
												{
													elementName: "position",
													index: 1,
													isRepeatable: false,
												},
												{
													elementName: "y",
													index: 1,
													isRepeatable: false,
												},
												{
													elementName: "value",
													index: 1,
													isRepeatable: false,
												},
											],
											errorCode: "Error rule_b1fd7",
											severity: "WARNING",
											errorMessage: [
												{
													key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
													args: {},
													defaults: {
														de: "Das Element überschneidet sich mit anderen",
														en: "The element overlaps with others",
													},
												},
											],
											parameters: {
												ruleName: "/content/segments/definitions/elementNotOverlap",
												type: "0",
												messageKey:
													"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
											},
											origin: "VALIDATOR",
										},
									],
									"@info": [],
									value: {
										"@error": [],
										"@warning": [
											{
												jsonPath: [
													{
														elementName: "content",
														index: 1,
														isRepeatable: false,
													},
													{
														elementName: "segments",
														index: 1,
														isRepeatable: false,
													},
													{
														elementName: "definitions",
														index: 1,
														isRepeatable: true,
													},
													{
														elementName: "elementReferences",
														index: 1,
														isRepeatable: true,
													},
													{
														elementName: "position",
														index: 1,
														isRepeatable: false,
													},
													{
														elementName: "y",
														index: 1,
														isRepeatable: false,
													},
													{
														elementName: "value",
														index: 1,
														isRepeatable: false,
													},
												],
												errorCode: "Error rule_b1fd7",
												severity: "WARNING",
												errorMessage: [
													{
														key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
														args: {},
														defaults: {
															de: "Das Element überschneidet sich mit anderen",
															en: "The element overlaps with others",
														},
													},
												],
												parameters: {
													ruleName: "/content/segments/definitions/elementNotOverlap",
													type: "0",
													messageKey:
														"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
												},
												origin: "VALIDATOR",
											},
										],
										"@info": [],
									},
									"@id": "HV4yCNw50eV-oJFd-lvk7",
								},
								"@id": "xFuG552xK7e-Uq5iqVKPO",
							},
							"@id": "JOQn6wuUcIVuH36buInyX",
						},
						{
							"@error": [],
							"@warning": [
								{
									jsonPath: [
										{
											elementName: "content",
											index: 1,
											isRepeatable: false,
										},
										{
											elementName: "segments",
											index: 1,
											isRepeatable: false,
										},
										{
											elementName: "definitions",
											index: 1,
											isRepeatable: true,
										},
										{
											elementName: "elementReferences",
											index: 2,
											isRepeatable: true,
										},
										{
											elementName: "position",
											index: 1,
											isRepeatable: false,
										},
										{
											elementName: "y",
											index: 1,
											isRepeatable: false,
										},
										{
											elementName: "value",
											index: 1,
											isRepeatable: false,
										},
									],
									errorCode: "Error rule_b1fd7",
									severity: "WARNING",
									errorMessage: [
										{
											key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
											args: {},
											defaults: {
												de: "Das Element überschneidet sich mit anderen",
												en: "The element overlaps with others",
											},
										},
									],
									parameters: {
										ruleName: "/content/segments/definitions/elementNotOverlap",
										type: "0",
										messageKey:
											"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
									},
									origin: "VALIDATOR",
								},
							],
							"@info": [],
							position: {
								"@error": [],
								"@warning": [
									{
										jsonPath: [
											{
												elementName: "content",
												index: 1,
												isRepeatable: false,
											},
											{
												elementName: "segments",
												index: 1,
												isRepeatable: false,
											},
											{
												elementName: "definitions",
												index: 1,
												isRepeatable: true,
											},
											{
												elementName: "elementReferences",
												index: 2,
												isRepeatable: true,
											},
											{
												elementName: "position",
												index: 1,
												isRepeatable: false,
											},
											{
												elementName: "y",
												index: 1,
												isRepeatable: false,
											},
											{
												elementName: "value",
												index: 1,
												isRepeatable: false,
											},
										],
										errorCode: "Error rule_b1fd7",
										severity: "WARNING",
										errorMessage: [
											{
												key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
												args: {},
												defaults: {
													de: "Das Element überschneidet sich mit anderen",
													en: "The element overlaps with others",
												},
											},
										],
										parameters: {
											ruleName: "/content/segments/definitions/elementNotOverlap",
											type: "0",
											messageKey:
												"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
										},
										origin: "VALIDATOR",
									},
								],
								"@info": [],
								y: {
									"@error": [],
									"@warning": [
										{
											jsonPath: [
												{
													elementName: "content",
													index: 1,
													isRepeatable: false,
												},
												{
													elementName: "segments",
													index: 1,
													isRepeatable: false,
												},
												{
													elementName: "definitions",
													index: 1,
													isRepeatable: true,
												},
												{
													elementName: "elementReferences",
													index: 2,
													isRepeatable: true,
												},
												{
													elementName: "position",
													index: 1,
													isRepeatable: false,
												},
												{
													elementName: "y",
													index: 1,
													isRepeatable: false,
												},
												{
													elementName: "value",
													index: 1,
													isRepeatable: false,
												},
											],
											errorCode: "Error rule_b1fd7",
											severity: "WARNING",
											errorMessage: [
												{
													key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
													args: {},
													defaults: {
														de: "Das Element überschneidet sich mit anderen",
														en: "The element overlaps with others",
													},
												},
											],
											parameters: {
												ruleName: "/content/segments/definitions/elementNotOverlap",
												type: "0",
												messageKey:
													"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
											},
											origin: "VALIDATOR",
										},
									],
									"@info": [],
									value: {
										"@error": [],
										"@warning": [
											{
												jsonPath: [
													{
														elementName: "content",
														index: 1,
														isRepeatable: false,
													},
													{
														elementName: "segments",
														index: 1,
														isRepeatable: false,
													},
													{
														elementName: "definitions",
														index: 1,
														isRepeatable: true,
													},
													{
														elementName: "elementReferences",
														index: 2,
														isRepeatable: true,
													},
													{
														elementName: "position",
														index: 1,
														isRepeatable: false,
													},
													{
														elementName: "y",
														index: 1,
														isRepeatable: false,
													},
													{
														elementName: "value",
														index: 1,
														isRepeatable: false,
													},
												],
												errorCode: "Error rule_b1fd7",
												severity: "WARNING",
												errorMessage: [
													{
														key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
														args: {},
														defaults: {
															de: "Das Element überschneidet sich mit anderen",
															en: "The element overlaps with others",
														},
													},
												],
												parameters: {
													ruleName: "/content/segments/definitions/elementNotOverlap",
													type: "0",
													messageKey:
														"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.segments.definitions.elementNotOverlap",
												},
												origin: "VALIDATOR",
											},
										],
										"@info": [],
									},
									"@id": "UHUYPQCs0_U2ur0waR8zl",
								},
								"@id": "qrBJXulITMmhDTTDBapDs",
							},
							"@id": "RWKPNPhYFRFen-UjPQZCX",
						},
					],
					"@id": "fHXGHgGC9F-DTKNj4Z5EK",
					"@type": "Default",
				},
				{
					"@error": [
						{
							jsonPath: [
								{
									elementName: "content",
									index: 1,
									isRepeatable: false,
								},
								{
									elementName: "segments",
									index: 1,
									isRepeatable: false,
								},
								{
									elementName: "definitions",
									index: 2,
									isRepeatable: true,
								},
								{
									elementName: "title",
									index: 1,
									isRepeatable: false,
								},
							],
							errorCode: "nachfolgendesBlank",
							severity: "ERROR",
							errorMessage: [
								{
									key: "kernel.formalErrors.FEHLER_NACHFOLGENDES_BLANK_FM_TEXT",
									args: {
										fieldName: {
											type: "localizable",
											properties: [
												{
													key: "documentModel.label.DomainPrintMetaModel.content.segments.definitions.title",
												},
											],
										},
									},
									defaults: {
										de: "Es sind nur Werte erlaubt, die nicht mit einem Leerzeichen enden.",
										fr: "Seules les valeurs non suivies d'espaces sont autorisées.",
										nl: "Alleen waardes zonder spaties zijn toegestaan.",
										en: "Only values without trailing spaces are allowed.",
									},
								},
							],
							parameters: {
								ruleName: "formalePruefung",
								type: "1",
								messageKey: "kernel.formalErrors.FEHLER_NACHFOLGENDES_BLANK_FM_TEXT",
							},
							origin: "VALIDATOR",
						},
					],
					"@warning": [],
					"@info": [],
					title: {
						"@error": [
							{
								jsonPath: [
									{
										elementName: "content",
										index: 1,
										isRepeatable: false,
									},
									{
										elementName: "segments",
										index: 1,
										isRepeatable: false,
									},
									{
										elementName: "definitions",
										index: 2,
										isRepeatable: true,
									},
									{
										elementName: "title",
										index: 1,
										isRepeatable: false,
									},
								],
								errorCode: "nachfolgendesBlank",
								severity: "ERROR",
								errorMessage: [
									{
										key: "kernel.formalErrors.FEHLER_NACHFOLGENDES_BLANK_FM_TEXT",
										args: {
											fieldName: {
												type: "localizable",
												properties: [
													{
														key: "documentModel.label.DomainPrintMetaModel.content.segments.definitions.title",
													},
												],
											},
										},
										defaults: {
											de: "Es sind nur Werte erlaubt, die nicht mit einem Leerzeichen enden.",
											fr: "Seules les valeurs non suivies d'espaces sont autorisées.",
											nl: "Alleen waardes zonder spaties zijn toegestaan.",
											en: "Only values without trailing spaces are allowed.",
										},
									},
								],
								parameters: {
									ruleName: "formalePruefung",
									type: "1",
									messageKey: "kernel.formalErrors.FEHLER_NACHFOLGENDES_BLANK_FM_TEXT",
								},
								origin: "VALIDATOR",
							},
						],
						"@warning": [],
						"@info": [],
					},
					"@id": "gX7yofRauVF-pk7bNomZp",
					"@type": "Default",
				},
			],
			"@id": "bfdd6828",
		},
		elementDefinitions: [
			{
				"@error": [],
				"@warning": [],
				"@info": [],
				"@id": "_jaQ97dTZPZU4zjC5Cnfv",
				"@type": "Area",
			},
			{
				"@error": [],
				"@warning": [],
				"@info": [],
				"@id": "ZhmNoVO-9B-mYJ5bmZNT_",
				"@type": "BoundingBox",
			},
			{
				"@error": [
					{
						jsonPath: [
							{
								elementName: "content",
								index: 1,
								isRepeatable: false,
							},
							{
								elementName: "elementDefinitions",
								index: 3,
								isRepeatable: true,
							},
							{
								elementName: "listing",
								index: 1,
								isRepeatable: false,
							},
							{
								elementName: "columns",
								index: 1,
								isRepeatable: true,
							},
							{
								elementName: "label",
								index: 1,
								isRepeatable: false,
							},
						],
						errorCode: "Error rule_4c2ba",
						severity: "ERROR",
						errorMessage: [
							{
								key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.columnCountGreaterThanZero",
								args: {},
								defaults: {
									de: "Bitte definiere mindestens eine Spalte.",
									en: "Please define at least one column.",
								},
							},
						],
						parameters: {
							ruleName: "/content/elementDefinitions/listing/columnCountGreaterThanZero",
							type: "0",
							messageKey:
								"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.columnCountGreaterThanZero",
						},
						origin: "VALIDATOR",
					},
					{
						jsonPath: [
							{
								elementName: "content",
								index: 1,
								isRepeatable: false,
							},
							{
								elementName: "elementDefinitions",
								index: 3,
								isRepeatable: true,
							},
							{
								elementName: "listing",
								index: 1,
								isRepeatable: false,
							},
							{
								elementName: "model",
								index: 1,
								isRepeatable: false,
							},
						],
						errorCode: "Error rule_6f793",
						severity: "ERROR",
						errorMessage: [
							{
								key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.modelFilled",
								args: {},
								defaults: {
									de: "Bitte wähle ein Modell aus.",
									en: "Please select a model.",
								},
							},
						],
						parameters: {
							ruleName: "/content/elementDefinitions/listing/modelFilled",
							type: "0",
							messageKey:
								"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.modelFilled",
						},
						origin: "VALIDATOR",
					},
					{
						jsonPath: [
							{
								elementName: "content",
								index: 1,
								isRepeatable: false,
							},
							{
								elementName: "elementDefinitions",
								index: 3,
								isRepeatable: true,
							},
							{
								elementName: "listing",
								index: 1,
								isRepeatable: false,
							},
							{
								elementName: "basePath",
								index: 1,
								isRepeatable: false,
							},
						],
						errorCode: "Error rule_53583",
						severity: "ERROR",
						errorMessage: [
							{
								key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.basePathFilled",
								args: {},
								defaults: {
									de: "Bitte wähle einen Basispfad.",
									en: "Please select a basePath.",
								},
							},
						],
						parameters: {
							ruleName: "/content/elementDefinitions/listing/basePathFilled",
							type: "0",
							messageKey:
								"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.basePathFilled",
						},
						origin: "VALIDATOR",
					},
				],
				"@warning": [],
				"@info": [],
				listing: {
					"@error": [
						{
							jsonPath: [
								{
									elementName: "content",
									index: 1,
									isRepeatable: false,
								},
								{
									elementName: "elementDefinitions",
									index: 3,
									isRepeatable: true,
								},
								{
									elementName: "listing",
									index: 1,
									isRepeatable: false,
								},
								{
									elementName: "columns",
									index: 1,
									isRepeatable: true,
								},
								{
									elementName: "label",
									index: 1,
									isRepeatable: false,
								},
							],
							errorCode: "Error rule_4c2ba",
							severity: "ERROR",
							errorMessage: [
								{
									key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.columnCountGreaterThanZero",
									args: {},
									defaults: {
										de: "Bitte definiere mindestens eine Spalte.",
										en: "Please define at least one column.",
									},
								},
							],
							parameters: {
								ruleName: "/content/elementDefinitions/listing/columnCountGreaterThanZero",
								type: "0",
								messageKey:
									"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.columnCountGreaterThanZero",
							},
							origin: "VALIDATOR",
						},
						{
							jsonPath: [
								{
									elementName: "content",
									index: 1,
									isRepeatable: false,
								},
								{
									elementName: "elementDefinitions",
									index: 3,
									isRepeatable: true,
								},
								{
									elementName: "listing",
									index: 1,
									isRepeatable: false,
								},
								{
									elementName: "model",
									index: 1,
									isRepeatable: false,
								},
							],
							errorCode: "Error rule_6f793",
							severity: "ERROR",
							errorMessage: [
								{
									key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.modelFilled",
									args: {},
									defaults: {
										de: "Bitte wähle ein Modell aus.",
										en: "Please select a model.",
									},
								},
							],
							parameters: {
								ruleName: "/content/elementDefinitions/listing/modelFilled",
								type: "0",
								messageKey:
									"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.modelFilled",
							},
							origin: "VALIDATOR",
						},
						{
							jsonPath: [
								{
									elementName: "content",
									index: 1,
									isRepeatable: false,
								},
								{
									elementName: "elementDefinitions",
									index: 3,
									isRepeatable: true,
								},
								{
									elementName: "listing",
									index: 1,
									isRepeatable: false,
								},
								{
									elementName: "basePath",
									index: 1,
									isRepeatable: false,
								},
							],
							errorCode: "Error rule_53583",
							severity: "ERROR",
							errorMessage: [
								{
									key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.basePathFilled",
									args: {},
									defaults: {
										de: "Bitte wähle einen Basispfad.",
										en: "Please select a basePath.",
									},
								},
							],
							parameters: {
								ruleName: "/content/elementDefinitions/listing/basePathFilled",
								type: "0",
								messageKey:
									"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.basePathFilled",
							},
							origin: "VALIDATOR",
						},
					],
					"@warning": [],
					"@info": [],
					columns: [
						{
							"@error": [
								{
									jsonPath: [
										{
											elementName: "content",
											index: 1,
											isRepeatable: false,
										},
										{
											elementName: "elementDefinitions",
											index: 3,
											isRepeatable: true,
										},
										{
											elementName: "listing",
											index: 1,
											isRepeatable: false,
										},
										{
											elementName: "columns",
											index: 1,
											isRepeatable: true,
										},
										{
											elementName: "label",
											index: 1,
											isRepeatable: false,
										},
									],
									errorCode: "Error rule_4c2ba",
									severity: "ERROR",
									errorMessage: [
										{
											key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.columnCountGreaterThanZero",
											args: {},
											defaults: {
												de: "Bitte definiere mindestens eine Spalte.",
												en: "Please define at least one column.",
											},
										},
									],
									parameters: {
										ruleName: "/content/elementDefinitions/listing/columnCountGreaterThanZero",
										type: "0",
										messageKey:
											"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.columnCountGreaterThanZero",
									},
									origin: "VALIDATOR",
								},
							],
							"@warning": [],
							"@info": [],
							label: {
								"@error": [
									{
										jsonPath: [
											{
												elementName: "content",
												index: 1,
												isRepeatable: false,
											},
											{
												elementName: "elementDefinitions",
												index: 3,
												isRepeatable: true,
											},
											{
												elementName: "listing",
												index: 1,
												isRepeatable: false,
											},
											{
												elementName: "columns",
												index: 1,
												isRepeatable: true,
											},
											{
												elementName: "label",
												index: 1,
												isRepeatable: false,
											},
										],
										errorCode: "Error rule_4c2ba",
										severity: "ERROR",
										errorMessage: [
											{
												key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.columnCountGreaterThanZero",
												args: {},
												defaults: {
													de: "Bitte definiere mindestens eine Spalte.",
													en: "Please define at least one column.",
												},
											},
										],
										parameters: {
											ruleName: "/content/elementDefinitions/listing/columnCountGreaterThanZero",
											type: "0",
											messageKey:
												"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.columnCountGreaterThanZero",
										},
										origin: "VALIDATOR",
									},
								],
								"@warning": [],
								"@info": [],
							},
						},
					],
					model: {
						"@error": [
							{
								jsonPath: [
									{
										elementName: "content",
										index: 1,
										isRepeatable: false,
									},
									{
										elementName: "elementDefinitions",
										index: 3,
										isRepeatable: true,
									},
									{
										elementName: "listing",
										index: 1,
										isRepeatable: false,
									},
									{
										elementName: "model",
										index: 1,
										isRepeatable: false,
									},
								],
								errorCode: "Error rule_6f793",
								severity: "ERROR",
								errorMessage: [
									{
										key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.modelFilled",
										args: {},
										defaults: {
											de: "Bitte wähle ein Modell aus.",
											en: "Please select a model.",
										},
									},
								],
								parameters: {
									ruleName: "/content/elementDefinitions/listing/modelFilled",
									type: "0",
									messageKey:
										"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.modelFilled",
								},
								origin: "VALIDATOR",
							},
						],
						"@warning": [],
						"@info": [],
					},
					basePath: {
						"@error": [
							{
								jsonPath: [
									{
										elementName: "content",
										index: 1,
										isRepeatable: false,
									},
									{
										elementName: "elementDefinitions",
										index: 3,
										isRepeatable: true,
									},
									{
										elementName: "listing",
										index: 1,
										isRepeatable: false,
									},
									{
										elementName: "basePath",
										index: 1,
										isRepeatable: false,
									},
								],
								errorCode: "Error rule_53583",
								severity: "ERROR",
								errorMessage: [
									{
										key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.basePathFilled",
										args: {},
										defaults: {
											de: "Bitte wähle einen Basispfad.",
											en: "Please select a basePath.",
										},
									},
								],
								parameters: {
									ruleName: "/content/elementDefinitions/listing/basePathFilled",
									type: "0",
									messageKey:
										"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.listing.basePathFilled",
								},
								origin: "VALIDATOR",
							},
						],
						"@warning": [],
						"@info": [],
					},
				},
				"@id": "q_4anwzw6k9hsXY8GMJ_Y",
				"@type": "Listing",
			},
			{
				"@error": [
					{
						jsonPath: [
							{
								elementName: "content",
								index: 1,
								isRepeatable: false,
							},
							{
								elementName: "elementDefinitions",
								index: 4,
								isRepeatable: true,
							},
							{
								elementName: "text",
								index: 1,
								isRepeatable: false,
							},
							{
								elementName: "text",
								index: 1,
								isRepeatable: false,
							},
						],
						errorCode: "Error rule_c6f5a",
						severity: "ERROR",
						errorMessage: [
							{
								key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.text.textFilled",
								args: {},
								defaults: {
									de: "Bitte gib einen Text an.",
									en: "Please specifiy a text.",
								},
							},
						],
						parameters: {
							ruleName: "/content/elementDefinitions/text/textFilled",
							type: "0",
							messageKey:
								"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.text.textFilled",
						},
						origin: "VALIDATOR",
					},
				],
				"@warning": [],
				"@info": [],
				text: {
					"@error": [
						{
							jsonPath: [
								{
									elementName: "content",
									index: 1,
									isRepeatable: false,
								},
								{
									elementName: "elementDefinitions",
									index: 4,
									isRepeatable: true,
								},
								{
									elementName: "text",
									index: 1,
									isRepeatable: false,
								},
								{
									elementName: "text",
									index: 1,
									isRepeatable: false,
								},
							],
							errorCode: "Error rule_c6f5a",
							severity: "ERROR",
							errorMessage: [
								{
									key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.text.textFilled",
									args: {},
									defaults: {
										de: "Bitte gib einen Text an.",
										en: "Please specifiy a text.",
									},
								},
							],
							parameters: {
								ruleName: "/content/elementDefinitions/text/textFilled",
								type: "0",
								messageKey:
									"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.text.textFilled",
							},
							origin: "VALIDATOR",
						},
					],
					"@warning": [],
					"@info": [],
					text: {
						"@error": [
							{
								jsonPath: [
									{
										elementName: "content",
										index: 1,
										isRepeatable: false,
									},
									{
										elementName: "elementDefinitions",
										index: 4,
										isRepeatable: true,
									},
									{
										elementName: "text",
										index: 1,
										isRepeatable: false,
									},
									{
										elementName: "text",
										index: 1,
										isRepeatable: false,
									},
								],
								errorCode: "Error rule_c6f5a",
								severity: "ERROR",
								errorMessage: [
									{
										key: "documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.text.textFilled",
										args: {},
										defaults: {
											de: "Bitte gib einen Text an.",
											en: "Please specifiy a text.",
										},
									},
								],
								parameters: {
									ruleName: "/content/elementDefinitions/text/textFilled",
									type: "0",
									messageKey:
										"documentModel.ruleErrorMessage.DomainPrintMetaModel.content.elementDefinitions.text.textFilled",
								},
								origin: "VALIDATOR",
							},
						],
						"@warning": [],
						"@info": [],
					},
				},
				"@id": "JdiAc6GIevRragzxLGvwH",
				"@type": "Text",
			},
		],
		"@id": "PRINT_MODEL_CONTENT",
	},
};
