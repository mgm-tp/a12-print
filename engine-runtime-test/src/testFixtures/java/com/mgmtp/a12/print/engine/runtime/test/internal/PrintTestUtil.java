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
package com.mgmtp.a12.print.engine.runtime.test.internal;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import com.mgmtp.a12.kernel.md.document.apiV2.immutable.DocumentV2;
import com.mgmtp.a12.kernel.md.model.a12internal.services.DocumentModelService;
import com.mgmtp.a12.kernel.md.model.api.IDocumentModel;
import com.mgmtp.a12.kernel.md.serializer.MDSerializerFactory;
import com.mgmtp.a12.print.engine.api.PdfPrintResult;
import com.mgmtp.a12.print.model.api.model.internal.dto.PrintModelDto;
import com.mgmtp.a12.print.model.api.utils.serialization.ObjectMapperFactory;
import lombok.NonNull;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.Objects;
import java.util.concurrent.AbstractExecutorService;
import java.util.concurrent.ForkJoinPool;
import java.util.concurrent.ForkJoinWorkerThread;


public class PrintTestUtil {
	private static final ObjectMapper OBJECT_MAPPER = ObjectMapperFactory.createPrintModelMapper();

	private static final Path outputDir;

	static {
		outputDir = Path.of("build/test-results").toAbsolutePath();
	}

	public static String loadFromAbsPath(final String path) {
		File file = new File(path);

        try {
            try (var fis = new FileInputStream(file)) {
				return IOUtils.toString(fis, StandardCharsets.UTF_8);
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

    }

	public static String loadFromResources(final String name) {
		try (final InputStream inputStream = PrintTestUtil.class.getResourceAsStream(name)) {
			final InputStream requiredInputStream = Objects.requireNonNull(inputStream, "Resource not found: " + name);
			return IOUtils.toString(requiredInputStream, StandardCharsets.UTF_8);
		} catch (final IOException e) {
			throw new UncheckedIOException(e);
		}
	}

	public static ByteArrayInputStream loadStreamFromResources(final String name) {
		try (final InputStream inputStream = PrintTestUtil.class.getResourceAsStream(name)) {
			final InputStream requiredInputStream = Objects.requireNonNull(inputStream, "Resource not found: " + name);
			return new ByteArrayInputStream(requiredInputStream.readAllBytes());
		} catch (final IOException e) {
			throw new UncheckedIOException(e);
		}
	}

	public static File resolveFile(final String path) {
		final var filePath = outputDir.resolve(path).toFile();
		final File parent = filePath.getParentFile();
		if (parent != null && !parent.exists() && !parent.mkdirs()) {
			throw new IllegalStateException("Couldn't create dir: " + parent);
		}
		return filePath;
	}

	public static File writeResultFiles(final PdfPrintResult result, final String baseName) throws IOException {
		final File pdfFile = PrintTestUtil.resolveFile(baseName + ".pdf").toPath().toFile();
		try (var output = FileUtils.openOutputStream(pdfFile)) {
			result.copyTo(output);
		}
		return pdfFile;
	}

	public static AbstractExecutorService getPrintPool() {
		// tag::ExecutorService[]
		return new ForkJoinPool( // <1>
			Runtime.getRuntime().availableProcessors(),
			p -> {
				final ForkJoinWorkerThread worker = ForkJoinPool.defaultForkJoinWorkerThreadFactory.newThread(p);
				worker.setName("print-pool-" + worker.getPoolIndex());
				return worker;
			},
			null,
			true
		);
		// end::ExecutorService[]
	}

	public static DocumentV2 getDocumentV2ToPrint(
		@NonNull String documentModelId,
		@NonNull String document,
		@NonNull String documentModel
	) {
		return new DocumentV2Deserializer().provide(
			documentModelId,
			document,
			new DocumentModelResolver(documentModel)
		);
	}

	public static IDocumentModel loadDocumentModel(
		@NonNull String documentModel,
		@NonNull String documentModelId
	) {
		try {
			final var documentModelService = new DocumentModelService();
			final var internDocumentModel = documentModelService.convertFromExternal(
				new MDSerializerFactory()
					.createDocumentModelSerializer()
					.deserialize(new StringReader(documentModel))
			);
			internDocumentModel.getContent().getTypeDefinitions()
				.forEach(iFieldTypeDefinition ->
					iFieldTypeDefinition.setName(
						String.format("%s_%s", documentModelId, iFieldTypeDefinition.getName())
					)
				);
			return documentModelService.convertToExternal(internDocumentModel);
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}

	public static PrintModelDto deserializePrintModel(String printModelContent) {
		try {
			return OBJECT_MAPPER.readValue(printModelContent, PrintModelDto.class);
		} catch (JacksonException exception) {
			throw new RuntimeException(exception);
		}
	}

	public static String serializePrintModel(PrintModelDto printModel) {
		try {
			return OBJECT_MAPPER.writeValueAsString(printModel);
		} catch (JacksonException exception) {
			throw new RuntimeException(exception);
		}
	}
}
