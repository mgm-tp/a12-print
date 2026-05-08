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
export const elementMap = {
	"/group_cb782/field_f4612": {
		elementPath: "/general/salutation",
		isGroup: false,
		isSubOfRepeatable: false,
		element: {
			type: "Field",
			id: "field_f4612",
			name: "salutation",
			annotations: [
				{
					name: "foo",
					value: "Value1",
				},
			],
			fieldType: {
				type: "EnumerationType",
				values: [
					{
						value: "mister",
						label: [
							{
								locale: "en",
								text: "Mister",
							},
							{
								locale: "de",
								text: "Herr",
							},
						],
					},
					{
						value: "madam",
						label: [
							{
								locale: "en",
								text: "Madam",
							},
							{
								locale: "de",
								text: "Frau",
							},
						],
					},
				],
			},
			label: [
				{
					locale: "en",
					text: "Salutation",
				},
				{
					locale: "de",
					text: "Anrede",
				},
			],
			required: true,
		},
	},
	"/group_cb782/field_db470": {
		elementPath: "/general/name",
		isGroup: false,
		isSubOfRepeatable: false,
		element: {
			type: "Field",
			id: "field_db470",
			name: "name",
			fieldType: {
				type: "StringType",
			},
			label: [
				{
					locale: "en",
					text: "Name",
				},
				{
					locale: "de",
					text: "Name",
				},
			],
			required: true,
		},
	},
	"/group_cb782/field_07351": {
		elementPath: "/general/birth_date",
		isGroup: false,
		isSubOfRepeatable: false,
		element: {
			type: "Field",
			id: "field_07351",
			name: "birth_date",
			fieldType: {
				type: "DateType",
				format: "yyyy-MM-dd",
				datePrecision: "FULL",
			},
			label: [
				{
					locale: "en",
					text: "Birth date",
				},
				{
					locale: "de",
					text: "Geburtsdatum",
				},
			],
		},
	},
	"/group_cb782/field_26663": {
		elementPath: "/general/birth_time",
		isGroup: false,
		isSubOfRepeatable: false,
		element: {
			type: "Field",
			id: "field_26663",
			name: "birth_time",
			fieldType: {
				type: "TimeType",
				format: "HH:mm:ss",
			},
			label: [
				{
					locale: "en",
					text: "Birth time",
				},
				{
					locale: "de",
					text: "Geburtszeit",
				},
			],
		},
	},
	"/group_cb782/group_7a2ce/field_bd961": {
		elementPath: "/general/phone/number",
		isGroup: false,
		isSubOfRepeatable: true,
		element: {
			type: "Field",
			id: "field_bd961",
			name: "number",
			fieldType: {
				type: "StringType",
			},
			label: [
				{
					locale: "en",
					text: "Phone Number",
				},
				{
					locale: "de",
					text: "Telefonnummer",
				},
			],
			required: true,
		},
	},
	"/group_cb782/group_7a2ce/field_0539a": {
		elementPath: "/general/phone/scope",
		isGroup: false,
		isSubOfRepeatable: true,
		element: {
			type: "Field",
			id: "field_0539a",
			name: "scope",
			annotations: [
				{
					name: "bar",
					value: "Value2",
				},
			],
			fieldType: {
				type: "StringType",
			},
			label: [
				{
					locale: "en",
					text: "Scope",
				},
				{
					locale: "de",
					text: "Bereich",
				},
			],
		},
	},
	"/group_cb782/group_7a2ce/field_e34aa": {
		elementPath: "/general/phone/amount",
		isGroup: false,
		isSubOfRepeatable: true,
		element: {
			type: "Field",
			id: "field_e34aa",
			name: "amount",
			fieldType: {
				type: "NumberType",
				minFractionalDigits: 2,
				maxFractionalDigits: 2,
				trait: "amount",
			},
			label: [
				{
					locale: "en",
					text: "Amount",
				},
				{
					locale: "de",
					text: "Betrag",
				},
			],
		},
	},
	"/group_cb782/group_7a2ce/group_78211/field_11900": {
		elementPath: "/general/phone/attachment/original_filename",
		isGroup: false,
		isSubOfRepeatable: true,
		element: {
			type: "Field",
			id: "field_11900",
			name: "original_filename",
			fieldType: {
				type: "StringType",
			},
		},
	},
	"/group_cb782/group_7a2ce/group_78211/field_052a7": {
		elementPath: "/general/phone/attachment/internal_filename",
		isGroup: false,
		isSubOfRepeatable: true,
		element: {
			type: "Field",
			id: "field_052a7",
			name: "internal_filename",
			fieldType: {
				type: "StringType",
			},
		},
	},
	"/group_cb782/group_7a2ce/group_78211/field_44ece": {
		elementPath: "/general/phone/attachment/content",
		isGroup: false,
		isSubOfRepeatable: true,
		element: {
			type: "Field",
			id: "field_44ece",
			name: "content",
			fieldType: {
				type: "StringType",
				lineBreaksPermitted: true,
				noValueValidation: true,
			},
		},
	},
	"/group_cb782/group_7a2ce/group_78211/field_af893": {
		elementPath: "/general/phone/attachment/attachment_id",
		isGroup: false,
		isSubOfRepeatable: true,
		element: {
			type: "Field",
			id: "field_af893",
			name: "attachment_id",
			fieldType: {
				type: "StringType",
			},
		},
	},
	"/group_cb782/group_7a2ce/group_78211/field_adf98": {
		elementPath: "/general/phone/attachment/size",
		isGroup: false,
		isSubOfRepeatable: true,
		element: {
			type: "Field",
			id: "field_adf98",
			name: "size",
			fieldType: {
				type: "NumberType",
			},
		},
	},
	"/group_cb782/group_7a2ce/group_78211/field_480ee": {
		elementPath: "/general/phone/attachment/mime_type",
		isGroup: false,
		isSubOfRepeatable: true,
		element: {
			type: "Field",
			id: "field_480ee",
			name: "mime_type",
			fieldType: {
				type: "StringType",
			},
		},
	},
	"/group_cb782/group_7a2ce/group_78211/field_4c47c": {
		elementPath: "/general/phone/attachment/category",
		isGroup: false,
		isSubOfRepeatable: true,
		element: {
			type: "Field",
			id: "field_4c47c",
			name: "category",
			fieldType: {
				type: "StringType",
			},
		},
	},
	"/group_cb782/group_7a2ce/group_78211/field_3be16": {
		elementPath: "/general/phone/attachment/description",
		isGroup: false,
		isSubOfRepeatable: true,
		element: {
			type: "Field",
			id: "field_3be16",
			name: "description",
			fieldType: {
				type: "StringType",
			},
		},
	},
	"/group_cb782/group_7a2ce/group_78211": {
		elementPath: "/general/phone/attachment",
		isGroup: true,
		repeatability: 1,
		isSubOfRepeatable: true,
		element: {
			type: "Group",
			id: "group_78211",
			name: "attachment",
			repeatability: 1,
			usageType: "attachment",
			elements: [
				{
					type: "Field",
					id: "field_11900",
					name: "original_filename",
					fieldType: {
						type: "StringType",
					},
				},
				{
					type: "Field",
					id: "field_052a7",
					name: "internal_filename",
					fieldType: {
						type: "StringType",
					},
				},
				{
					type: "Field",
					id: "field_44ece",
					name: "content",
					fieldType: {
						type: "StringType",
						lineBreaksPermitted: true,
						noValueValidation: true,
					},
				},
				{
					type: "Field",
					id: "field_af893",
					name: "attachment_id",
					fieldType: {
						type: "StringType",
					},
				},
				{
					type: "Field",
					id: "field_adf98",
					name: "size",
					fieldType: {
						type: "NumberType",
					},
				},
				{
					type: "Field",
					id: "field_480ee",
					name: "mime_type",
					fieldType: {
						type: "StringType",
					},
				},
				{
					type: "Field",
					id: "field_4c47c",
					name: "category",
					fieldType: {
						type: "StringType",
					},
				},
				{
					type: "Field",
					id: "field_3be16",
					name: "description",
					fieldType: {
						type: "StringType",
					},
				},
			],
		},
		hasNonRepFieldLeafs: false,
	},
	"/group_cb782/group_7a2ce": {
		elementPath: "/general/phone",
		isGroup: true,
		repeatability: 500,
		isSubOfRepeatable: false,
		element: {
			type: "Group",
			id: "group_7a2ce",
			name: "phone",
			repeatability: 500,
			elements: [
				{
					type: "Field",
					id: "field_bd961",
					name: "number",
					fieldType: {
						type: "StringType",
					},
					label: [
						{
							locale: "en",
							text: "Phone Number",
						},
						{
							locale: "de",
							text: "Telefonnummer",
						},
					],
					required: true,
				},
				{
					type: "Field",
					id: "field_0539a",
					name: "scope",
					annotations: [
						{
							name: "bar",
							value: "Value2",
						},
					],
					fieldType: {
						type: "StringType",
					},
					label: [
						{
							locale: "en",
							text: "Scope",
						},
						{
							locale: "de",
							text: "Bereich",
						},
					],
				},
				{
					type: "Field",
					id: "field_e34aa",
					name: "amount",
					fieldType: {
						type: "NumberType",
						minFractionalDigits: 2,
						maxFractionalDigits: 2,
						trait: "amount",
					},
					label: [
						{
							locale: "en",
							text: "Amount",
						},
						{
							locale: "de",
							text: "Betrag",
						},
					],
				},
				{
					type: "Group",
					id: "group_78211",
					name: "attachment",
					repeatability: 1,
					usageType: "attachment",
					elements: [
						{
							type: "Field",
							id: "field_11900",
							name: "original_filename",
							fieldType: {
								type: "StringType",
							},
						},
						{
							type: "Field",
							id: "field_052a7",
							name: "internal_filename",
							fieldType: {
								type: "StringType",
							},
						},
						{
							type: "Field",
							id: "field_44ece",
							name: "content",
							fieldType: {
								type: "StringType",
								lineBreaksPermitted: true,
								noValueValidation: true,
							},
						},
						{
							type: "Field",
							id: "field_af893",
							name: "attachment_id",
							fieldType: {
								type: "StringType",
							},
						},
						{
							type: "Field",
							id: "field_adf98",
							name: "size",
							fieldType: {
								type: "NumberType",
							},
						},
						{
							type: "Field",
							id: "field_480ee",
							name: "mime_type",
							fieldType: {
								type: "StringType",
							},
						},
						{
							type: "Field",
							id: "field_4c47c",
							name: "category",
							fieldType: {
								type: "StringType",
							},
						},
						{
							type: "Field",
							id: "field_3be16",
							name: "description",
							fieldType: {
								type: "StringType",
							},
						},
					],
				},
			],
		},
		hasNonRepFieldLeafs: false,
	},
	"/group_cb782/field_786e9": {
		elementPath: "/general/NumberField1",
		isGroup: false,
		isSubOfRepeatable: false,
		element: {
			type: "Field",
			id: "field_786e9",
			name: "NumberField1",
			fieldType: {
				type: "NumberType",
			},
			label: [
				{
					locale: "en",
					text: "Number 1",
				},
				{
					locale: "de",
					text: "Nummer 1",
				},
			],
		},
	},
	"/group_cb782/field_263a1": {
		elementPath: "/general/NumberField2",
		isGroup: false,
		isSubOfRepeatable: false,
		element: {
			type: "Field",
			id: "field_263a1",
			name: "NumberField2",
			fieldType: {
				type: "NumberType",
			},
			label: [
				{
					locale: "en",
					text: "Number 2",
				},
				{
					locale: "de",
					text: "Nummer 2",
				},
			],
		},
	},
	"/group_cb782/field_2fe05": {
		elementPath: "/general/NumberField3",
		isGroup: false,
		isSubOfRepeatable: false,
		element: {
			type: "Field",
			id: "field_2fe05",
			name: "NumberField3",
			fieldType: {
				type: "NumberType",
				minFractionalDigits: 2,
				maxFractionalDigits: 2,
				minValue: 0,
				maxValue: 4,
				trait: "amount",
			},
			label: [
				{
					locale: "en",
					text: "test",
				},
				{
					locale: "de",
					text: "test",
				},
			],
		},
	},
	"/group_cb782": {
		elementPath: "/general",
		isGroup: true,
		repeatability: 1,
		isSubOfRepeatable: false,
		element: {
			type: "Group",
			id: "group_cb782",
			name: "general",
			repeatability: 1,
			required: true,
			elements: [
				{
					type: "Field",
					id: "field_f4612",
					name: "salutation",
					annotations: [
						{
							name: "foo",
							value: "Value1",
						},
					],
					fieldType: {
						type: "EnumerationType",
						values: [
							{
								value: "mister",
								label: [
									{
										locale: "en",
										text: "Mister",
									},
									{
										locale: "de",
										text: "Herr",
									},
								],
							},
							{
								value: "madam",
								label: [
									{
										locale: "en",
										text: "Madam",
									},
									{
										locale: "de",
										text: "Frau",
									},
								],
							},
						],
					},
					label: [
						{
							locale: "en",
							text: "Salutation",
						},
						{
							locale: "de",
							text: "Anrede",
						},
					],
					required: true,
				},
				{
					type: "Field",
					id: "field_db470",
					name: "name",
					fieldType: {
						type: "StringType",
					},
					label: [
						{
							locale: "en",
							text: "Name",
						},
						{
							locale: "de",
							text: "Name",
						},
					],
					required: true,
				},
				{
					type: "Field",
					id: "field_07351",
					name: "birth_date",
					fieldType: {
						type: "DateType",
						format: "yyyy-MM-dd",
						datePrecision: "FULL",
					},
					label: [
						{
							locale: "en",
							text: "Birth date",
						},
						{
							locale: "de",
							text: "Geburtsdatum",
						},
					],
				},
				{
					type: "Field",
					id: "field_26663",
					name: "birth_time",
					fieldType: {
						type: "TimeType",
						format: "HH:mm:ss",
					},
					label: [
						{
							locale: "en",
							text: "Birth time",
						},
						{
							locale: "de",
							text: "Geburtszeit",
						},
					],
				},
				{
					type: "Group",
					id: "group_7a2ce",
					name: "phone",
					repeatability: 500,
					elements: [
						{
							type: "Field",
							id: "field_bd961",
							name: "number",
							fieldType: {
								type: "StringType",
							},
							label: [
								{
									locale: "en",
									text: "Phone Number",
								},
								{
									locale: "de",
									text: "Telefonnummer",
								},
							],
							required: true,
						},
						{
							type: "Field",
							id: "field_0539a",
							name: "scope",
							annotations: [
								{
									name: "bar",
									value: "Value2",
								},
							],
							fieldType: {
								type: "StringType",
							},
							label: [
								{
									locale: "en",
									text: "Scope",
								},
								{
									locale: "de",
									text: "Bereich",
								},
							],
						},
						{
							type: "Field",
							id: "field_e34aa",
							name: "amount",
							fieldType: {
								type: "NumberType",
								minFractionalDigits: 2,
								maxFractionalDigits: 2,
								trait: "amount",
							},
							label: [
								{
									locale: "en",
									text: "Amount",
								},
								{
									locale: "de",
									text: "Betrag",
								},
							],
						},
						{
							type: "Group",
							id: "group_78211",
							name: "attachment",
							repeatability: 1,
							usageType: "attachment",
							elements: [
								{
									type: "Field",
									id: "field_11900",
									name: "original_filename",
									fieldType: {
										type: "StringType",
									},
								},
								{
									type: "Field",
									id: "field_052a7",
									name: "internal_filename",
									fieldType: {
										type: "StringType",
									},
								},
								{
									type: "Field",
									id: "field_44ece",
									name: "content",
									fieldType: {
										type: "StringType",
										lineBreaksPermitted: true,
										noValueValidation: true,
									},
								},
								{
									type: "Field",
									id: "field_af893",
									name: "attachment_id",
									fieldType: {
										type: "StringType",
									},
								},
								{
									type: "Field",
									id: "field_adf98",
									name: "size",
									fieldType: {
										type: "NumberType",
									},
								},
								{
									type: "Field",
									id: "field_480ee",
									name: "mime_type",
									fieldType: {
										type: "StringType",
									},
								},
								{
									type: "Field",
									id: "field_4c47c",
									name: "category",
									fieldType: {
										type: "StringType",
									},
								},
								{
									type: "Field",
									id: "field_3be16",
									name: "description",
									fieldType: {
										type: "StringType",
									},
								},
							],
						},
					],
				},
				{
					type: "Field",
					id: "field_786e9",
					name: "NumberField1",
					fieldType: {
						type: "NumberType",
					},
					label: [
						{
							locale: "en",
							text: "Number 1",
						},
						{
							locale: "de",
							text: "Nummer 1",
						},
					],
				},
				{
					type: "Field",
					id: "field_263a1",
					name: "NumberField2",
					fieldType: {
						type: "NumberType",
					},
					label: [
						{
							locale: "en",
							text: "Number 2",
						},
						{
							locale: "de",
							text: "Nummer 2",
						},
					],
				},
				{
					type: "Field",
					id: "field_2fe05",
					name: "NumberField3",
					fieldType: {
						type: "NumberType",
						minFractionalDigits: 2,
						maxFractionalDigits: 2,
						minValue: 0,
						maxValue: 4,
						trait: "amount",
					},
					label: [
						{
							locale: "en",
							text: "test",
						},
						{
							locale: "de",
							text: "test",
						},
					],
				},
			],
		},
		hasNonRepFieldLeafs: true,
	},
};
