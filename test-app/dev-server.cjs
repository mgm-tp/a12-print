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
const Path = require("path");
const { promises: fs } = require("fs");
const { spawn } = require("child_process");
const packageJson = require("./package.json");
const context = Path.join(__dirname);

const printShellName = `print-shell-${packageJson.version}.jar`;
const printShellPath = Path.resolve(__dirname, "../print-shell/build/libs/", printShellName);

async function runPrintShell({ printModelId, caseId, documentId, locale, timeZone }) {
	const workspacePath = Path.resolve(__dirname, "use-cases", caseId);
	return new Promise((resolve, reject) => {
		const shellCommand = "java";
		const shellArgs = ["-jar", printShellPath, "print", "-p", printModelId];
		if (documentId) {
			shellArgs.push("-d");
			shellArgs.push(documentId);
		}
		if (locale) {
			shellArgs.push("--locale");
			shellArgs.push(locale);
		}
		if (timeZone) {
			shellArgs.push("-t");
			shellArgs.push(timeZone);
		}

		console.log("start print-shell", caseId, shellArgs.join(" "));
		const child = spawn(shellCommand, shellArgs, { stdio: "inherit", cwd: workspacePath });

		child.on("exit", code => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`print-shell exited with code ${code}`));
			}
		});
		child.on("error", err => {
			reject(err);
		});
	});
}

function setupMiddlewares(middlewares, devServer) {
	if (!devServer) {
		throw new Error("webpack-dev-server is not defined");
	}

	const express = require("express");

	devServer.app.use(express.json({ limit: "50mb" }));
	devServer.app.use(express.urlencoded({ limit: "50mb", extended: true }));

	devServer.app.use(require("body-parser").json());

	devServer.app.post("/api/model", async (req, res) => {
		try {
			const { fileName, content } = req.body;
			const filePath = getUseCaseDirectory(fileName);

			await fs.writeFile(filePath, JSON.stringify(content, null, 2));

			res.json({ success: true });
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	});

	devServer.app.post("/api/wal", async (req, res) => {
		try {
			const { walFilePath, content } = req.body;
			const filePath = getUseCaseDirectory(walFilePath);

			await fs.appendFile(filePath, content);
			const logs = await fs.readFile(filePath);

			res.json({ success: true, content: logs.toString() });
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	});

	devServer.app.get("/api/wal", async (req, res) => {
		try {
			const { walFilePath } = req.query;

			const filePath = getUseCaseDirectory(walFilePath);
			const logs = await fs.readFile(filePath, "utf8");

			res.json({ success: true, content: logs });
		} catch (error) {
			if (error.code === "ENOENT") {
				res.status(204).send();
			} else {
				res.status(500).json({ error: error.message });
			}
		}
	});

	devServer.app.post("/api/commit", async (req, res) => {
		try {
			const { printModelPath, printModel, logs, walFilePath } = req.body;

			const printModelFile = getUseCaseDirectory(printModelPath);
			const walFile = getUseCaseDirectory(walFilePath);

			await fs.writeFile(printModelFile, JSON.stringify(printModel, null, 2));

			if (!logs) {
				await removeFile(walFile);
			} else {
				await fs.writeFile(walFile, logs);
			}

			res.json({ success: true });
		} catch (error) {
			res.status(500).json({ error: error.message });
		}
	});

	devServer.app.get("/api/discard-changes", async (req, res) => {
		try {
			const { walFilePath } = req.query;
			const walFile = getUseCaseDirectory(walFilePath);

			await removeFile(walFile);

			res.json({ success: true });
		} catch (error) {
			if (error.code === "ENOENT") {
				res.status(404).json({ error: "File not found" });
			} else {
				res.status(500).json({ error: error.message });
			}
		}
	});

	devServer.app.post("/api/print", async (req, res) => {
		const { printModelId, caseId, documentId, locale, timeZone } = req.body;
		const resultPath = Path.resolve(
			__dirname,
			"use-cases",
			caseId,
			"result",
			`${printModelId}${documentId ? "-" : ""}${documentId}.pdf`
		);
		try {
			await removeFile(resultPath);
			await runPrintShell({ printModelId, caseId, documentId, locale, timeZone });
			await fs.access(resultPath);

			res.sendFile(resultPath);
		} catch (error) {
			if (error.code === "ENOENT") {
				res.status(404).json({ error: "File " + resultPath + " not found" });
			} else {
				res.status(500).json({ error: error.message });
			}
		}
		console.log("end print shell");
	});

	devServer.app.get("/api/resources", async (req, res) => {
		const { caseId } = req.query;
		const dir = getUseCaseDirectory(Path.join(caseId, "resources"));
		await fs.mkdir(dir, { recursive: true });
		const files = await fs.readdir(dir);
		res.json(files);
	});

	devServer.app.get("/api/resource", async (req, res) => {
		const { caseId, resourceName } = req.query;
		const filePath = getUseCaseDirectory(Path.join(caseId, "resources", resourceName));
		const buf = await fs.readFile(filePath);
		const mime = getMimeType(resourceName);
		res.json({
			name: resourceName,
			internal_filename: resourceName,
			size: buf.length,
			mime_type: mime,
			content: `data:${mime};base64,${buf.toString("base64")}`,
		});
	});

	devServer.app.post("/api/resource", async (req, res) => {
		const { caseId, resourceName, content } = req.body;
		const dir = getUseCaseDirectory(Path.join(caseId, "resources"));
		await fs.mkdir(dir, { recursive: true });
		const buf = Buffer.from(content.split(",")[1], "base64");
		const dotIdx = resourceName.lastIndexOf(".");
		const ext = dotIdx >= 0 ? resourceName.slice(dotIdx) : "";
		const base = dotIdx >= 0 ? resourceName.slice(0, dotIdx) : resourceName;
		const assignedName = `${base}-${buf.length.toString(36)}${ext}`;
		const filePath = Path.join(dir, assignedName);
		const exists = await fs
			.access(filePath)
			.then(() => true)
			.catch(() => false);
		if (!exists) {
			await fs.writeFile(filePath, buf);
		}
		res.json({ success: true, name: assignedName });
	});

	return middlewares;
}

function getUseCaseDirectory(filePath) {
	return Path.join(context, "use-cases", filePath);
}

function getMimeType(fileName) {
	const extensionMap = {
		".png": "image/png",
		".jpg": "image/jpeg",
		".jpeg": "image/jpeg",
		".gif": "image/gif",
		".bmp": "image/bmp",
	};
	const ext = Path.extname(fileName).toLowerCase();
	return extensionMap[ext] || "application/octet-stream";
}

async function removeFile(filePath) {
	try {
		await fs.rm(filePath);
	} catch (rmError) {
		if (rmError.code !== "ENOENT") {
			throw rmError;
		}
	}
}

module.exports = {
	port: 9012,
	historyApiFallback: true,
	static: [
		{
			directory: Path.join(context, "public"),
		},
		{
			directory: Path.join(context, "use-cases"),
			watch: false,
			staticOptions: {
				extensions: ["ttf", "otf", "woff", "woff2"],
			},
		},
	],
	setupMiddlewares,
	devMiddleware: {
		writeToDisk: true,
	},
	client: {
		logging: "info",
	},
};
