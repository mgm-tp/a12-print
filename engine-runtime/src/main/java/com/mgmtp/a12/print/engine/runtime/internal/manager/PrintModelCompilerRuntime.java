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
package com.mgmtp.a12.print.engine.runtime.internal.manager;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
import com.mgmtp.a12.kernel.md.facade.DocumentModelServiceFactory;
import com.mgmtp.a12.model.header.ModelReference;
import com.mgmtp.a12.print.engine.api.PrintJobConfig;
import com.mgmtp.a12.print.engine.api.PrintModelId;
import com.mgmtp.a12.print.engine.api.exception.PrintCompilerException;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.PrintJobManager;
import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.PrintModelCompilationContext;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.PrintModelCompilationUpdate;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.PrintModelCompiler;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.types.A12TypeComparisonMapping;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.DocumentModelIndex;
import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.model.internal.dto.PrintModelDto;
import com.mgmtp.a12.print.model.api.utils.serialization.ObjectMapperFactory;
import com.mgmtp.a12.print.model.api.validation.IPrintModelValidator;
import com.mgmtp.a12.print.model.api.validation.PrintModelValidator;
import lombok.Getter;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;

@Slf4j
public class PrintModelCompilerRuntime implements com.mgmtp.a12.print.engine.runtime.internal.manager.PrintModelCompiler {


	private static final ObjectMapper objectMapper = ObjectMapperFactory.createPrintModelMapper();
	private static final ObjectMapper yamlMapper = new ObjectMapper(new YAMLFactory());
	@Getter
	private final ExecutorService executorService;
	@Getter
	private final PrintJobManager.PrintJobManagerApi managerApi;
	@Getter
	private final A12TypeComparisonMapping a12TypeComparisonMapping;
	private final IPrintModelValidator printModelValidator = new PrintModelValidator();
	private final ConcurrentHashMap<PrintModelId, Future<PrintModelCompilationContext>> cache = new ConcurrentHashMap<>();
	private final boolean usePdfBoxPrintProcess;

	public PrintModelCompilerRuntime(
		@NonNull ExecutorService executorService,
		@NonNull PrintJobManager.PrintJobManagerApi managerApi,
		@NonNull PrintJobConfig printJobConfig
	) {
		this.managerApi = managerApi;
		this.executorService = executorService;
		this.a12TypeComparisonMapping = getA12TypeComparisonMapping(printJobConfig);
		this.usePdfBoxPrintProcess = false;
	}

	public PrintModelCompilerRuntime(
		@NonNull ExecutorService executorService,
		@NonNull PrintJobManager.PrintJobManagerApi managerApi,
		@NonNull PrintJobConfig printJobConfig,
		boolean usePdfBoxPrintProcess
	) {
		this.managerApi = managerApi;
		this.executorService = executorService;
		this.a12TypeComparisonMapping = getA12TypeComparisonMapping(printJobConfig);
		this.usePdfBoxPrintProcess = usePdfBoxPrintProcess;
	}

	private static <T> T await(Future<T> f) throws PrintCompilerException {
		try {
			return f.get();
		} catch (PrintCompilerException e) {
			throw e;
		} catch (Exception e) {
			throw new PrintCompilerException("Unable to compile model", e);
		}
	}

	private static A12TypeComparisonMapping getA12TypeComparisonMapping(PrintJobConfig printJobConfig) {
		var classLoader = PrintModelCompilerRuntime.class.getClassLoader();
		var inputStream = classLoader.getResourceAsStream(
			printJobConfig.getA12TypeComparisonMappingFile()
		);
		try {
			return yamlMapper.readValue(inputStream, A12TypeComparisonMapping.class);
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}

	public Optional<PrintModelCompilationContext> get(PrintModelId id) {
		return PrintModelCompilerRuntime.await(
			executorService.submit(
				() -> {
					final var context = cache.getOrDefault(id, null);
					return Optional.ofNullable(
						context != null ? PrintModelCompilerRuntime.await(context) : null
					);
				}
			)
		);
	}

	public Future<PrintModelCompilationContext> compileAsync(String printModel) throws PrintCompilerException {
		return PrintModelCompilerRuntime.await(executorService.submit(() -> {
			var dto = await(executorService.submit(() -> validateAndMarshallDto(printModel)));
			final var referencedModels = await(executorService.submit(() -> findAllReferencedPrintModels(dto)));

			if(referencedModels.containsKey(dto.getHeader().getId())){
				throw new PrintCompilerException(
					"Circular Dependency of PrintModels in PrintModel {}: {}",
					dto.getHeader().getId(),
					String.join(" -> ", referencedModels.keySet())
				);
			}

			for(var dependency: referencedModels.entrySet()) {
				await(updateCache(dependency.getValue()));
			}

			return updateCache(dto);
		}));
	}

	private Future<PrintModelCompilationContext> updateCache(PrintModel dto) {
		var id = PrintModelId.fromString(dto.getHeader().getId());
		log.debug("starting compile for {}", id.getModelHeaderId());
		return cache.compute(id, (key, value) -> {
			if (value == null) {
				return executorService.submit(() -> initialize(id, dto));
			} else {
				return executorService.submit(() -> update(id, dto, value));
			}
		});
	}

	private Map<String, PrintModel> findAllReferencedPrintModels(PrintModel printModel) {
		final var dependencyTopology = new LinkedHashMap<String, PrintModel>();
		appendReferencedPrintModels(printModel, dependencyTopology);
		return dependencyTopology;
	}

	private void appendReferencedPrintModels(PrintModel printModel, LinkedHashMap<String, PrintModel> models) {
		for (var printModelReference : printModel.getHeader().getModelReferences()) {
			if(Constants.PRINT_MODEL_TYPE.equals(printModelReference.getModelType())) {
				final var printModelReferenceId = printModelReference.getReference();
				if(models.containsKey(printModelReferenceId)) {
					continue;
				}
				models.put(printModelReferenceId, null);
				final var referencedPrintModelLiteral = managerApi.loadPrintModel(printModelReference.getReference());
				final var referencedPrintModelDto = validateAndMarshallDto(referencedPrintModelLiteral);
				appendReferencedPrintModels(referencedPrintModelDto, models);
				models.put(printModelReferenceId, referencedPrintModelDto);
			}
		}
	}

	@Override
	public PrintModelCompilationContext compile(String printModel) throws PrintCompilerException {
		return await(compileAsync(printModel));
	}

	private PrintModelCompilationContext initialize(PrintModelId id, PrintModel dto) {
		log.debug("initialize for {}", id.getModelHeaderId());
		var model = PrintModelCompilationContext.builder()
												.id(id)
												.model(dto)
												.compiler(
													new PrintModelCompiler(this)
												)
												.pdfBoxPrintProcess(usePdfBoxPrintProcess)
												.build();

		for (var modelReference : dto.getHeader().getModelReferences()) {
			if (modelReference.getModelType().equals(Constants.DOCUMENT_MODEL_TYPE)) {
				model.provideDocumentModelReference(modelReference, loadAndExpand(modelReference));
			}
		}
		model.asyncCompile();
		log.debug("initialize completed for {}", id.getModelHeaderId());
		return model;
	}

	private DocumentModelIndex loadAndExpand(ModelReference modelReference) {
		final var service = new DocumentModelServiceFactory().createDocumentModelService();
		final var documentModel = managerApi.loadDocumentModel(modelReference.getReference());

		service.expand(documentModel, managerApi::loadDocumentModel);
		return DocumentModelIndex.load(documentModel);
	}

	private PrintModelCompilationContext update(PrintModelId id, PrintModel dto, Future<PrintModelCompilationContext> printModelCompilationContext) {
		log.debug("recompile for {}", id.getModelHeaderId());
		final var result = new PrintModelCompilationUpdate(
			dto, await(printModelCompilationContext)
		).run(() -> initialize(id, dto));
		log.debug("recompile completed for {}", id.getModelHeaderId());
		return result;
	}

	private PrintModelDto validateAndMarshallDto(String printModel) {
		try {
			var validation = printModelValidator.validate(printModel, Locale.ENGLISH);
			if (!validation.noErrorOccurred()) {
				throw new PrintException("PrintModel is not valid.", validation);
			}
			return objectMapper.readValue(printModel, PrintModelDto.class);

		} catch (JsonProcessingException e) {
			throw new PrintException("Unable to load printModel", e);
		}
	}

}
