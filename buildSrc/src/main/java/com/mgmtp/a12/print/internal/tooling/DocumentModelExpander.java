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
package com.mgmtp.a12.print.internal.tooling;

import com.mgmtp.a12.kernel.md.combination.a12internal.*;
import com.mgmtp.a12.kernel.md.model.api.IDocumentModel;
import com.mgmtp.a12.kernel.md.model.api.services.IDocumentModelSerializer;
import com.mgmtp.a12.kernel.md.serializer.model.internal.service.DocumentModelSerializerImpl;
import com.mgmtp.a12.kernel.mmtypings.mm_combinationmodel_1.views.MM_CombinationModel_1;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Locale;
import java.util.Optional;

public class DocumentModelExpander {
	private static final Logger LOGGER = LoggerFactory.getLogger(DocumentModelExpander.class);

	private DocumentModelExpander() {}

	public static void expand(final Path workspacePath, final String modelId, final Path outputPath) {
		if (!Files.isDirectory(workspacePath)) {
			throw new IllegalArgumentException("Not a workspace directory: " + workspacePath);
		}

		if (Files.isDirectory(outputPath)) {
			throw new IllegalArgumentException("Output path is a directory: " + outputPath);
		}

		IUnexpandedModelResolver resolver = DirectoryBasedUnexpandedModelResolver.ofDir(workspacePath.toString());
		if (!expandModel(resolver, modelId, outputPath)) {
			throw new IllegalStateException("Failed to expand model " + modelId + " to " + outputPath.toAbsolutePath());
		}
	}

	protected static boolean expandModel(
		final IUnexpandedModelResolver resolver,
		final String modelId,
		final Path outputPath
	) {
		DMLike resolvedModel;
		try {
			resolvedModel = resolver.resolve(modelId);
		} catch (CombinationException e) {
			LOGGER.error("Resolver error", e);
			return false;
		}

		CombinationModelService.CombinationModelExpandParams expandParams = CombinationModelService.CombinationModelExpandParams.builder()
			.locale(Locale.US).notificationReceiver(rankedNotification -> {
				switch (rankedNotification.getSeverity()) {
					case INFO -> LOGGER.info(rankedNotification.getMessage());
					case ERROR -> LOGGER.error(rankedNotification.getMessage());
					case WARNING -> LOGGER.warn(rankedNotification.getMessage());
				}
			})
			.build();

		Optional<IDocumentModel> expandedModel = switch (resolvedModel) {
			case DMWrapper(IDocumentModel dm) -> CombinationModelService.expand(dm, resolver, expandParams);
			case CMWrapper(MM_CombinationModel_1 cm) -> CombinationModelService.expand(cm, resolver, expandParams);
			default -> throw new IllegalStateException("Unexpected value: " + resolvedModel);
		};

		if (expandedModel.isEmpty()) {
			return false;
		}

		final Path outAbsolutePath = outputPath.toAbsolutePath();
		try {
			Files.createDirectories(outAbsolutePath.getParent());
		} catch (IOException e) {
			LOGGER.error("The path {} to the output file could not be created", outAbsolutePath.getParent(), e);
			return false;
		}

		IDocumentModel documentModel = expandedModel.get();
		try (Writer writer = Files.newBufferedWriter(outAbsolutePath, StandardCharsets.UTF_8, StandardOpenOption.TRUNCATE_EXISTING,
			StandardOpenOption.CREATE)) {
			final IDocumentModelSerializer serializer = new DocumentModelSerializerImpl();
				serializer.serialize(documentModel, writer, rankedNotification -> {
					switch (rankedNotification.getSeverity()) {
						case INFO -> LOGGER.info(rankedNotification.getMessage());
						case ERROR -> LOGGER.error(rankedNotification.getMessage());
						case WARNING -> LOGGER.warn(rankedNotification.getMessage());
					}
				});
		} catch (IOException e) {
			LOGGER.error("The file could not be written to {}", outAbsolutePath.getParent(), e);
			return false;
		}

		LOGGER.info("Successfully expanded {} to {}.", modelId, outputPath.toAbsolutePath());

		return true;
	}
}
