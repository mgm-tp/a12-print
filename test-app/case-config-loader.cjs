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
const fs = require("fs").promises;
const Path = require("path");

const caseConfigSchema = {
	id: {
		required: true,
	},
	resource: {
		required: true,
		validation: val => typeof val === "object",
		errMsg: "need to be an object.",
	},
};

const caseConfigResourceSchema = {
	printModel: {
		required: true,
		validation: val => typeof val === "string" && val.endsWith(".json"),
		errMsg: "need to be a path to a json file.",
	},
	printSettingModel: {
		validation: val => typeof val === "string" && val.endsWith(".json"),
		errMsg: "need to be a path to a json file.",
	},
	documentModel: {
		validation: val => typeof val === "string",
		errMsg: "need to be a path.",
	},
	templatePrintModels: {
		validation: val => typeof val === "string",
		errMsg: "need to be a path.",
	},
	typesettingModels: {
		validation: val => typeof val === "string",
		errMsg: "need to be a path.",
	},
	documents: {
		validation: val => typeof val === "string",
		errMsg: "need to be a path.",
	},
	walFile: {
		validation: val => typeof val === "string" && val.endsWith(".wal"),
		errMsg: "need to be a path to a wal file.",
	},
	store: {
		validation: val => typeof val === "string" && val.endsWith(".json"),
		errMsg: "need to be a path to a json file.",
	},
};

function assertValidatedConfig(caseConfigPath, config, schema) {
	const allowedKeys = Object.keys(schema);
	for (const key of Object.keys(config)) {
		if (!allowedKeys.includes(key)) {
			throw new Error(`${caseConfigPath}: Key '${key}' not allowed in CaseConfig`);
		}
	}
	for (const [key, rule] of Object.entries(schema)) {
		if (rule.required && !(key in config)) {
			throw new Error(`${caseConfigPath}: Key '${key}' missing in CaseConfig`);
		}

		const value = config[key];
		if (value && rule.validation && !rule.validation(value)) {
			throw new Error(`${caseConfigPath}: Key '${key}' ${rule.errMsg}`);
		}
	}
}

module.exports = async function (source) {
	const callback = this.async();

	try {
		const resourceFile = JSON.parse(source);
		const configPath = resourceFile.sourceConfig;

		const configData = await fs.readFile(configPath, "utf-8");
		const config = JSON.parse(configData);
		assertValidatedConfig(configPath, config, caseConfigSchema);
		const { resource } = config;
		assertValidatedConfig(configPath, resource, caseConfigResourceSchema);

		const {
			printModel,
			documentModel,
			printSettingModel,
			templatePrintModels,
			typesettingModels,
			store,
			documents,
		} = resource;

		const printModelPath = Path.join(__dirname, "use-cases", printModel);

		const printModelContent = await fs.readFile(printModelPath, "utf-8");
		let documentModelContents = [];
		let templatePrintModelContents = [];
		let typesettingModelsContents = [];
		let documentNames = [];
		let printSettingModelContent;
		let storeContent;

		if (documentModel) {
			documentModelContents = await readModels(documentModel);
		}
		const documentModels = documentModelContents.length ? parseDocumentModels(documentModelContents) : [];

		if (documents) {
			documentNames = await getDocumentNames(documents, documentModels);
		}

		if (printSettingModel) {
			printSettingModelContent = await fs.readFile(Path.join(__dirname, "use-cases", printSettingModel), "utf-8");
		}

		if (templatePrintModels) {
			templatePrintModelContents = await readModels(templatePrintModels);
		}

		if (typesettingModels) {
			typesettingModelsContents = await readModels(typesettingModels);
		}

		if (store) {
			storeContent = await fs.readFile(Path.join(__dirname, "use-cases", store), "utf-8");
		}

		callback(
			null,
			JSON.stringify({
				printModel: JSON.parse(printModelContent),
				documentModels,
				documentNames,
				templatePrintModels: templatePrintModelContents.length
					? parseDocumentModels(templatePrintModelContents)
					: [],
				printSettingModel: printSettingModelContent ? JSON.parse(printSettingModelContent) : undefined,
				typesettingModels: typesettingModelsContents.length
					? parseDocumentModels(typesettingModelsContents)
					: undefined,
				store: storeContent ? JSON.parse(storeContent) : undefined,
			})
		);
	} catch (error) {
		callback(error);
	}
};

function parseDocumentModels(documentModelContents) {
	return Array.isArray(documentModelContents)
		? documentModelContents.map(JSON.parse)
		: [JSON.parse(documentModelContents)];
}

async function readModels(modelPath) {
	const filePath = Path.join(__dirname, "use-cases", modelPath);

	const stats = await fs.stat(filePath);
	const promises = [];

	if (stats.isDirectory()) {
		const files = await readDirRecursive(filePath);
		promises.push(
			...files.filter(file => file.endsWith(".json")).map(file => fs.readFile(Path.join(filePath, file), "utf-8"))
		);
	} else if (filePath.endsWith(".json")) {
		promises.push(fs.readFile(filePath, "utf-8"));
	}

	return await Promise.all(promises);
}

async function getDocumentNames(modelPath, documentModels) {
	const documentModelIds = documentModels.map(element => element.header.id);
	const MATCHES_DOCUMENT_MODEL = new RegExp(`^(${documentModelIds.join("|")})-\\d+\\.json$`);

	const filePath = Path.join(__dirname, "use-cases", modelPath);

	const results = [];
	const stats = await fs.stat(filePath);
	if (stats.isDirectory()) {
		const files = await readDirRecursive(filePath);
		results.push(
			...files
				.filter(file => {
					const fileName = Path.basename(file);
					return MATCHES_DOCUMENT_MODEL.test(fileName);
				})
				.map(file => Path.basename(file))
		);
	} else if (MATCHES_DOCUMENT_MODEL.test(Path.basename(filePath))) {
		results.push(Path.basename(filePath));
	}

	return results;
}

async function readDirRecursive(dir) {
	const files = await fs.readdir(dir);
	const result = [];

	for (const file of files) {
		const filePath = Path.join(dir, file);
		const stat = await fs.stat(filePath);

		if (stat.isDirectory()) {
			const subFiles = await readDirRecursive(filePath);
			result.push(...subFiles.map(subFile => Path.join(file, subFile)));
		} else {
			result.push(file);
		}
	}

	return result;
}
