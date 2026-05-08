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
package com.mgmtp.a12.print.model.migration.internal;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.MapperFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.mgmtp.a12.print.model.migration.internal.exceptions.JSONElementNotFoundException;
import com.mgmtp.a12.print.model.migration.internal.exceptions.MigrationFailedException;
import com.mgmtp.a12.print.model.migration.internal.utils.Utils;
import org.apache.commons.io.FilenameUtils;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.Properties;

import static com.mgmtp.a12.print.model.migration.internal.MigrationConfig.HIGHEST_MIGRATION_VERSION;

public class Migration {
	protected static final String HEADER_KEY = "header";
	protected static final String LAST_VERSION_ANNOTATION = "lastMigratedVersion";
	protected static final String PREVIOUS_STEP_ANNOTATION = "previousMigratedStep";
	protected static final String PREVIOUS_VERSION_ANNOTATION = "previousMigratedVersion";

	private static final Logger log = LoggerFactory.getLogger("Migration");
	private static final ObjectMapper jsonMapper = JsonMapper.builder()
		.enable(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS)
		.enable(MapperFeature.SORT_PROPERTIES_ALPHABETICALLY)
		.build();
	private static final ObjectMapper objectMapper = new ObjectMapper();
	private static final String ANNOTATION_PROPERTY_NAME = "annotations";
	private static final String VALUE_PROPERTY_NAME = "value";

	public Migration() {}

	/**
	 * Migrates a model on the file path to the latest version
	 */
	public static MigrationResult migrate(List<String> referenceDocuments, Path printModelPath) throws MigrationFailedException {
		File printModelFile = new File(printModelPath.toUri());
		if (printModelFile.exists()) {

			try {
				InputStream is = new FileInputStream(printModelFile.getAbsolutePath());
				String document = IOUtils.toString(is, StandardCharsets.UTF_8);

				return processDocument(
					referenceDocuments,
					document,
					FilenameUtils.getBaseName(printModelFile.getAbsolutePath())
				);
			} catch (IOException | JSONElementNotFoundException exception) {
				throw new MigrationFailedException(exception);
			}
		} else {
			throw new MigrationFailedException("The file is not a valid print model file");
		}
	}

	/**
	 * Executes the configured Migrations on a PrintModel and applies post-processing.
	 * @param referenceDocuments list representation of a reference documents
	 * @param document string representation of a PrintModel
	 * @param fileName file name of a PrintModel, used for logging
	 * @return fully migrated & pretty-printed PrintModel
	 */
	protected static MigrationResult processDocument(
		List<String> referenceDocuments,
		String document,
		String fileName
	) throws MigrationFailedException, JsonProcessingException {
		String startVersion = getStartModelVersion(document);

		// execute migration
		MigrationResult migrationResult = executeMigrations(referenceDocuments, fileName, document, startVersion);

		// apply post-processing
		String resultDocument = migrationResult.getResultDocument();
		resultDocument = setModelVersionInHeader(resultDocument, migrationResult.getTargetVersion());
		resultDocument = handleMigrationAnnotation(resultDocument, migrationResult.getTargetStep(), migrationResult.getPreviousVersion());
		resultDocument = jsonMapper.writerWithDefaultPrettyPrinter().writeValueAsString(jsonMapper.readTree(resultDocument));
		migrationResult.setResultDocument(resultDocument);
		return migrationResult;
	}

	private static MigrationResult executeMigrations(
		List<String> referenceDocuments,
		String fileName,
		String document,
		String startVersion
	) throws JsonProcessingException, MigrationFailedException {
		MigrationResult migrationResult = new MigrationResult(document, startVersion, -1);
		Map<String, MigrationVersion> migrationVersions = MigrationConfig.getMigrationVersions();

		while (migrationVersions.get(migrationResult.getTargetVersion()) != null) {
			MigrationVersion migrationVersion = migrationVersions.get(migrationResult.getTargetVersion());
			List<MigrationStep> migrationSteps = migrationVersion.getMigrationSteps();

			if (migrationResult.getTargetStep() > migrationSteps.size()) {
				throw new MigrationFailedException("MigrationStep index out of bounds");
			}

			while (migrationSteps.size() > migrationResult.getTargetStep()+1) {
				migrationResult.incrementStepIndex();
				StringBuilder sb = new StringBuilder(String.format(
					"Migrating %s to Version %s | Step: %s/%s",
					fileName,
					migrationResult.getTargetVersion(),
					migrationResult.getTargetStep()+1,
					migrationSteps.size()
				));
				MigrationStep migrationStep = migrationSteps.get(migrationResult.getTargetStep());
				MigrationStepResult migrationStepResult = migrationStep.executeFileMigration(referenceDocuments, migrationResult.getResultDocument());
				migrationResult.setResultDocument(migrationStepResult.getPrintModel());
				List<MigrationStepMessage> messages = migrationStepResult.getMessages();
				if (messages == null || messages.isEmpty()) {
					sb.append(" without messages");
				} else {
					sb.append(" with messages:");
					messages.forEach(message -> sb.append(String.format("\nSeverity: %s | Messages: %s", message.getSeverity(), String.join(", ", message.getMessages()))));
				}
				log.info(sb.toString());
			}
			if (migrationVersions.get(migrationVersion.getTargetVersion()) != null) {
				migrationResult.resetStepIndex();
			}
			migrationResult.setPreviousVersion(migrationResult.getTargetVersion());
			migrationResult.setTargetVersion(migrationVersion.getTargetVersion());
		}

		if (!migrationResult.getTargetVersion().equals(HIGHEST_MIGRATION_VERSION)) {
			throw new MigrationFailedException(
				String.format("There is no migration step for the current version: %s", startVersion)
			);
		}

		return migrationResult;
	}

	private static String getStartModelVersion(String document) {
		try {
			JsonNode node =  Utils.getDeepElement(objectMapper.readTree(document), List.of(HEADER_KEY, "modelVersion"));
			return node != null ? node.asText() : null;
		} catch (JsonProcessingException e) {
			throw new IllegalStateException(e);
		}
	}

	private static String setModelVersionInHeader(String document, String version) throws MigrationFailedException, JsonProcessingException {
		JsonNode jsonDocument = jsonMapper.readTree(document);
		if (jsonDocument.has(HEADER_KEY)) {
			ObjectNode header = jsonDocument.withObjectProperty(HEADER_KEY);
			header.put("modelVersion", version);
			return jsonDocument.toString();
		} else {
			throw new MigrationFailedException("Header is missing in PrintModel.");
		}
	}

	private static String setMigrationAnnotation(String document, String key, String value) throws JsonProcessingException {
		JsonNode jsonDocument = jsonMapper.readTree(document);
		ArrayNode annotations = Utils.getDeepElement(jsonDocument, List.of(HEADER_KEY, ANNOTATION_PROPERTY_NAME));
		if (annotations != null) {
			boolean annotationExists = false;
			for (int i = 0; i < annotations.size(); i++) {
				JsonNode annotation = annotations.get(i);
				if (annotation.has("name") && annotation.get("name").asText().equals(key) && annotation.isObject()) {
					ObjectNode annotationObject = (ObjectNode) annotation;
					annotationObject.put(VALUE_PROPERTY_NAME, value);
					annotationExists = true;
					break;
				}
			}

			if (!annotationExists) {
				ObjectNode annotation = jsonMapper.createObjectNode();
				annotation.put("name", key);
				annotation.put(VALUE_PROPERTY_NAME, value);
				annotations.add(annotation);
			}
			return jsonDocument.toString();
		}

		ObjectNode header = jsonDocument.withObjectProperty(HEADER_KEY);
		ObjectNode annotation = jsonMapper.createObjectNode();
		annotation.put("name", key);
		annotation.put(VALUE_PROPERTY_NAME, value);
		header.set(ANNOTATION_PROPERTY_NAME, jsonMapper.createArrayNode().add(annotation));
		return jsonDocument.toString();
	}

	private static String handleMigrationAnnotation(String document, int lastStepIndex, String previousVersion) {
		String finalDocument = document;
		try {
			String version = getCurrentVersion();
			finalDocument = setMigrationAnnotation(finalDocument, LAST_VERSION_ANNOTATION, version);
			finalDocument = setMigrationAnnotation(finalDocument, PREVIOUS_STEP_ANNOTATION, String.format("%s", lastStepIndex));
			finalDocument = setMigrationAnnotation(finalDocument, PREVIOUS_VERSION_ANNOTATION, previousVersion);
		} catch (IOException ex) {
			ex.printStackTrace();
		}
		return finalDocument;
	}

	protected static String getCurrentVersion() throws IOException {
		Properties prop = new Properties();
		prop.load(Migration.class.getClassLoader().getResourceAsStream("config.properties"));
		return prop.getProperty("project.version") != null ? prop.getProperty("project.version") : "0.0.0";
	}
}
