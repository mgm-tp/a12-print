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
import fs from "node:fs";
import * as path from "node:path";

import { LoggerFactory } from "@com.mgmtp.a12.utils/utils-logging";

import { APIEnum, APIInterface, ExampleValueMap, generateAPI } from "./model-dto-generator.js";

const logger = LoggerFactory.getLogger("validation");

export function generateAndSaveDtoFiles(inputFile: string, outputPath: string, name: string) {
	const documentModelString = fs.readFileSync(inputFile, "utf-8");
	const dtoPath = outputPath + "/dto";

	const { result, error } = generateAPI(documentModelString, name);
	if (result) {
		if (!fs.existsSync(dtoPath)) {
			fs.mkdirSync(dtoPath, { recursive: true });
		}

		const apiFile = `${dtoPath}/${result.name}.ts`;
		const exampleDataFile = `${dtoPath}/${result.name}Impl.ts`;
		const modelName = path.basename(inputFile);
		const fileHeader = `// Automatically generated from ${modelName} on ${new Date().toLocaleString()}.\n`;

		writeDeclarationFile(apiFile, fileHeader, result.interfaces, result.enums);
		writeTestDataFile(exampleDataFile, fileHeader, result.name, result.exampleValue);
	} else if (error) {
		logger.error(error);
	}
}

/**
 * Creates the .ts file for the API and appends the interface and enum contents
 * @param outputFile target file
 * @param fileHeader header of file
 * @param interfaces Map of interfaces
 * @param enums Map of enums
 */
function writeDeclarationFile(
	outputFile: string,
	fileHeader: string,
	interfaces: Map<string, APIInterface>,
	enums: Map<string, APIEnum>
) {
	fs.writeFileSync(outputFile, fileHeader);

	interfaces.forEach((value, key) => {
		const memberText = value.members
			.map(member => {
				// temporary fix to allow PrintModelDTO corresponds to the interface Model
				const isRequired =
					member.required ||
					(key === "PrintModelDTO" && (member.name === "header" || member.name === "content"));
				return `\t${member.name}${isRequired ? "" : "?"}: ${member.type}${member.isArray ? "[]" : ""};`;
			})
			.join("\n");
		const generics = value.generics?.length ? `<${value.generics?.join(", ")}>` : "";
		const interfaceText = `\nexport interface ${key}${generics} {\n${memberText}\n}\n`;
		fs.appendFileSync(outputFile, interfaceText);
	});
	enums.forEach((value, key) => {
		const keysText = value.labels
			.map(label => {
				return `"${label.key}"`;
			})
			.join("\n\t| ");
		const enumText = `\nexport type ${key} = ${keysText};\n`;
		fs.appendFileSync(outputFile, enumText);
	});
}

/**
 * Creates the .ts file with the example value of the DTO API
 * @param outputFile target file
 * @param fileHeader header of file
 * @param apiName name of the DTO APi
 * @param exampleValue example value for the API
 */
function writeTestDataFile(outputFile: string, fileHeader: string, apiName: string, exampleValue: ExampleValueMap) {
	fs.writeFileSync(outputFile, fileHeader);

	const importDtoTypeLine = `import { ${apiName} } from "./${apiName}.js"\n\n`;
	fs.appendFileSync(outputFile, importDtoTypeLine);

	const allRequiredType = "type DeepRequired<T> = { [K in keyof T]: Required<DeepRequired<T[K]>> };\n\n";
	fs.appendFileSync(outputFile, allRequiredType);

	const exampleValueLine = `export const ${apiName}Impl: DeepRequired<${apiName}> = ${JSON.stringify(
		exampleValue,
		null,
		2
	)}`;
	fs.appendFileSync(outputFile, exampleValueLine);
}
