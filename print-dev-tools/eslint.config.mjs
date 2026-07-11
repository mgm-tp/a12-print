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
import { recommended } from "@com.mgmtp.a12.devtools/eslint-config";
import unusedImportPlugin from "eslint-plugin-unused-imports";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

const RESTRICTED_IMPORT_PATTERNS = [
	{
		group: ["@com.mgmtp.a12.*/**/internal/**"],
		message:
			"A12 Code should always be imported via the its public API. If this is not possible, please disable the rule inline and add a comment.",
	},
	{
		group: ["@com.mgmtp.a12.*/**/src/**"],
		message:
			"Importing A12 Code directly from source is most likely a mistake. Import from `lib` instead.",
	},
	{
		group: ["**/test/**"],
		message: "Importing A12 Code from the /test directory is not allowed.",
	},
	{
		regex: "@com\\.mgmtp\\.a12\\.widgets/widgets-core/.*/index\\.js$",
		message:
			"Widgets barrel imports may pull in unwanted dependencies and increase bundle size & compile time. Use the specific subpackage instead.",
	},
	{
		regex: "node:assert$",
		message: "Use 'node:assert/strict' instead.",
	},
	{
		regex: "node:*",
		importNames: ["*", "default"],
		message: "Use the specific named exports instead.",
	},
	{
		group: ["redux-saga"],
		importNames: ["SagaIterator"],
		message: "Use 'SagaGenerator' from 'typed-redux-saga' instead.",
	},
];

export default [
	...recommended,
	eslintPluginPrettierRecommended,
	{
		name: "print-engine/general",
		plugins: {
			"unused-imports": unusedImportPlugin,
		},
		rules: {
			"no-empty": "warn",
			"no-multiple-empty-lines": ["warn", { max: 2 }],
			"no-unused-vars": "off",
			"no-extra-boolean-cast": "warn",
			"unused-imports/no-unused-imports": "error",
			"no-restricted-imports": [
				"error",
				{
					patterns: RESTRICTED_IMPORT_PATTERNS,
				},
			],
			"@typescript-eslint/no-namespace": "off",
			"@typescript-eslint/no-empty-interface": "warn",
			"@typescript-eslint/no-empty-object-type": "warn",
			"@typescript-eslint/no-unsafe-function-type": "warn",
			"@typescript-eslint/no-wrapper-object-types": "warn",
			"@typescript-eslint/naming-convention": [
				"error",
				{ selector: "interface", format: ["PascalCase"] },
			],
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{ ignoreRestSiblings: true, varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
			],
			"@typescript-eslint/no-inferrable-types": [
				"error",
				{ ignoreParameters: true, ignoreProperties: true },
			],
			semi: ["error", "always"],
			eqeqeq: "warn",
			"@typescript-eslint/consistent-type-imports": [
				"error",
				{ prefer: "type-imports", fixStyle: "separate-type-imports" },
			],
			"@typescript-eslint/no-unused-expressions": [
				"error",
				{ allowShortCircuit: true, allowTernary: true },
			],
		},
		languageOptions: {
			parserOptions: {
				project: ["tsconfig.json"],
				tsconfigDir: import.meta.dirname,
			},
		},
	},
	{
		files: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
		rules: {
			"no-restricted-imports": "off",
		},
	},
	{
		ignores: [
			"node_modules/",
			"jest.config.cjs",
			"eslint.config.mjs",
			".prettierrc.mjs",
			"build/",
			"lib/",
			"target/",
			"webpack.*.cjs",
			"coverage",
		],
	},
];
