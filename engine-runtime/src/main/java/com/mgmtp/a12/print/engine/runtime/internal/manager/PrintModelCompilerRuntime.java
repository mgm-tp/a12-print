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

import com.mgmtp.a12.kernel.md.combination.a12internal.CombinationModelService;
import com.mgmtp.a12.kernel.md.combination.a12internal.DMWrapper;
import com.mgmtp.a12.kernel.md.model.a12internal.expansioninfo.ExpansionInfo;
import com.mgmtp.a12.model.header.ModelReference;
import com.mgmtp.a12.model.notification.Severity;
import com.mgmtp.a12.print.engine.api.PrintJobConfig;
import com.mgmtp.a12.print.engine.api.PrintModelId;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintCompilerException;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintDomainException;
import com.mgmtp.a12.print.engine.runtime.PrintJobManager;
import com.mgmtp.a12.print.engine.api.StaticImageProvider;
import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.PrintModelCompilationContext;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.PrintModelCompilationUpdate;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.PrintModelCompiler;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.types.A12TypeComparisonMapping;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.DocumentModelIndex;
import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.model.internal.dto.PrintModelDto;
import com.mgmtp.a12.print.model.api.utils.serialization.ObjectMapperFactory;
import com.mgmtp.a12.print.model.api.validation.IPrintModelIntegrityMessage;
import com.mgmtp.a12.print.model.api.validation.IPrintModelValidator;
import com.mgmtp.a12.print.model.api.validation.PrintModelValidator;
import lombok.Getter;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;
import tools.jackson.core.JacksonException;
import tools.jackson.core.exc.JacksonIOException;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.dataformat.yaml.YAMLMapper;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;
import java.util.stream.Collectors;

@Slf4j
public class PrintModelCompilerRuntime implements com.mgmtp.a12.print.engine.runtime.internal.manager.PrintModelCompiler {


	private static final ObjectMapper objectMapper = ObjectMapperFactory.createPrintModelMapper();
	private static final ObjectMapper yamlMapper = YAMLMapper.builder().build();
	@Getter
	private final ExecutorService executorService;
	@Getter
	private final PrintJobManager.PrintJobManagerApi managerApi;
	@Getter
	private final A12TypeComparisonMapping a12TypeComparisonMapping;
	@Getter
	private final StaticImageProvider staticImageProvider;
	private final IPrintModelValidator printModelValidator = new PrintModelValidator();
	private final ConcurrentHashMap<PrintModelId, Future<PrintModelCompilationContext>> cache = new ConcurrentHashMap<>();

	public PrintModelCompilerRuntime(
		@NonNull ExecutorService executorService,
		@NonNull PrintJobManager.PrintJobManagerApi managerApi,
		@NonNull PrintJobConfig printJobConfig
	) {
		this(executorService, managerApi, printJobConfig, internalFilename -> {
			throw new PrintCompilerException(
				"No StaticImageProvider configured; cannot resolve static image '{}'.",
				internalFilename
			);
		});
	}

	public PrintModelCompilerRuntime(
		@NonNull ExecutorService executorService,
		@NonNull PrintJobManager.PrintJobManagerApi managerApi,
		@NonNull PrintJobConfig printJobConfig,
		@NonNull StaticImageProvider staticImageProvider
	) {
		this.managerApi = managerApi;
		this.executorService = executorService;
		this.a12TypeComparisonMapping = getA12TypeComparisonMapping(printJobConfig);
		this.staticImageProvider = staticImageProvider;
	}

	private static <T> T await(Future<T> f) throws PrintCompilerException, PrintDomainException {
		try {
			return f.get();
		} catch (ExecutionException e) {
			if (e.getCause() instanceof PrintDomainException pde) {
				throw pde;
			}
			throw new PrintCompilerException("Unable to compile model", e.getCause());
		} catch (InterruptedException e) {
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
		} catch (JacksonException e) {
			throw new PrintCompilerException(e);
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
				throw new PrintDomainException(
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
												.build();

		for (var modelReference : dto.getHeader().getModelReferences()) {
			if (modelReference.getModelType().equals(Constants.DOCUMENT_MODEL_TYPE)) {
				DocumentModelIndex documentModelIndex = loadAndExpand(modelReference);
				model.provideDocumentModelReference(modelReference, documentModelIndex);
				model.publicCommonLocales(documentModelIndex);
			}
		}
		model.asyncCompile();
		log.debug("initialize completed for {}", id.getModelHeaderId());
		return model;
	}

	private DocumentModelIndex loadAndExpand(ModelReference modelReference) {
		final var documentModel = managerApi.loadDocumentModel(modelReference.getReference());
		final ExpansionInfo[] capturedExpansionInfo = { null };
		final var expandedDM = CombinationModelService.expand(
			documentModel,
			dmId -> new DMWrapper(managerApi.loadDocumentModel(dmId)),
			CombinationModelService.CombinationModelExpandParams.builder()
				.notificationReceiver(rankedNotification -> {
					if (rankedNotification.getSeverity().equals(Severity.ERROR)) {
						throw new PrintDomainException(rankedNotification.getMessage());
					} else if (rankedNotification.getSeverity().equals(Severity.WARNING)) {
						log.warn(rankedNotification.getMessage());
					} else {
						log.info(rankedNotification.getMessage());
					}
				})
				.a12Internal_expansionInfoReceiver(ei -> capturedExpansionInfo[0] = ei)
				.build()
		);

		if (expandedDM.isEmpty()) {
			throw new PrintDomainException("The expansion for the Document Model {} failed.", documentModel.getHeader().getId());
		}

		return DocumentModelIndex.load(expandedDM.get(), capturedExpansionInfo[0]);
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
				throw new PrintDomainException("The Print Model Validation finished with errors: {}",
					validation.getMessages().stream().map(IPrintModelIntegrityMessage::getText).collect(Collectors.joining("\n")));
			}
			return objectMapper.readValue(printModel, PrintModelDto.class);
		} catch (JacksonIOException e) {
			throw new PrintDomainException("The Print Model could not be loaded", e);
		}
	}

}
