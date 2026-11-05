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
package com.mgmtp.a12.print.integration.internal.service;

import com.mgmtp.a12.dataservices.configuration.DataServicesCoreProperties;
import com.mgmtp.a12.dataservices.initialization.events.DataServicesDocumentModelCachesPreloadedEvent;
import com.mgmtp.a12.dataservices.model.GenericModel;
import com.mgmtp.a12.dataservices.model.ModelService;
import com.mgmtp.a12.dataservices.model.events.AbstractModelEvent;
import com.mgmtp.a12.dataservices.model.events.ModelAfterDeleteEvent;
import com.mgmtp.a12.dataservices.model.events.ModelAfterUpdateEvent;
import com.mgmtp.a12.dataservices.model.events.ModelsAfterImportEvent;
import com.mgmtp.a12.model.header.Header;
import com.mgmtp.a12.print.engine.api.PrintModelId;
import com.mgmtp.a12.print.engine.runtime.PrintJobManager;
import com.mgmtp.a12.print.integration.configuration.PrintEngineProperties;
import com.mgmtp.a12.print.integration.events.PrintModelDeleteEvent;
import com.mgmtp.a12.print.integration.events.PrintModelUpdateEvent;
import com.mgmtp.a12.print.integration.events.PrintModelsImportEvent;
import com.mgmtp.a12.print.integration.events.PrintModelsPreloadedEvent;
import com.mgmtp.a12.uaa.authentication.backend.BackendAuthenticationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.time.StopWatch;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import com.mgmtp.a12.print.model.api.model.ModelSubTypeAccessor;

import java.util.Set;
import java.util.stream.Collectors;

import static com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants.PRINT_MODEL_TYPE;

/**
 * Warms {@link PrintJobManager}'s internal compilation cache for all Print Models on startup, so the
 * first print request for a given model does not pay for the (comparatively expensive) initial compilation.
 * <p>
 * When a Print Model is updated afterward, its cached compilation is invalidated instead of
 * being recompiled eagerly.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PrintModelPreloader {

	private final ApplicationEventPublisher eventPublisher;
	private final ModelService modelService;
	private final BackendAuthenticationService backendAuthenticationService;
	private final DataServicesCoreProperties dataServicesCoreProperties;
	private final PrintJobManager printJobManager;
	private final PrintEngineProperties printEngineProperties;

	@EventListener(DataServicesDocumentModelCachesPreloadedEvent.class)
	@Async
	public void preloadPrintModels() {
		backendAuthenticationService.executeWithBackendAuthentication(
			dataServicesCoreProperties.getAuthorization().getBackendJob().getPrincipal().getUsername(),
			() -> {
				modelService
					.findAllHeadersByType(PRINT_MODEL_TYPE)
					.stream()
					.filter(model ->
						!ModelSubTypeAccessor.isFragmentModel(model) &&
							printEngineProperties.isPreCompilationEnabledForModel(model.getId()) &&
							!printJobManager.isPrepared(PrintModelId.fromString(model.getId()))
					)
					.forEach(header -> {
						String rawPrintModel = modelService.load(header.getId()).getContent().getRawContent();
						long precompileTime = precompilePrintModel(rawPrintModel, header.getId());
						log.info("Pre-loading of {} finished in {} ms", header.getId(), precompileTime);
					});
				return null;
			}
		);
		eventPublisher.publishEvent(new PrintModelsPreloadedEvent());
	}

	@TransactionalEventListener(
		phase = TransactionPhase.AFTER_COMMIT,
		classes = { ModelAfterUpdateEvent.class, ModelAfterDeleteEvent.class }
	)
	public void invalidatePrintModel(AbstractModelEvent<GenericModel> event) {
		Header changedModelHeader = event.getModel().getHeader();
		if (!isPrintModel(changedModelHeader)) {
			return;
		}
		String printModelId = changedModelHeader.getId();
		printJobManager.invalidatePreparedPrintModel(PrintModelId.fromString(printModelId));

		if (event instanceof ModelAfterUpdateEvent) {
			log.info("Invalidated prepared Print Model {} after update", printModelId);
			eventPublisher.publishEvent(new PrintModelUpdateEvent(changedModelHeader));
		} else {
			log.info("Invalidated prepared Print Model {} after delete", printModelId);
			eventPublisher.publishEvent(new PrintModelDeleteEvent(changedModelHeader));
		}
	}

	@TransactionalEventListener(
		phase = TransactionPhase.AFTER_COMMIT,
		classes = { ModelsAfterImportEvent.class }
	)
	public void invalidatePrintModels(ModelsAfterImportEvent event) {
		Set<Header> updatedHeaders = event.getImportedModels().stream()
			.filter(this::isPrintModel)
			.collect(Collectors.toSet());
		updatedHeaders.forEach(header ->
			printJobManager.invalidatePreparedPrintModel(PrintModelId.fromString(header.getId()))
		);

		log.info("Invalidated {} prepared Print Models after import", updatedHeaders.size());
		eventPublisher.publishEvent(new PrintModelsImportEvent(updatedHeaders));
	}

	private boolean isPrintModel(Header header) {
		return header.getModelType().equals(PRINT_MODEL_TYPE) && !ModelSubTypeAccessor.isFragmentModel(header);
	}

	private long precompilePrintModel(String rawPrintModelContent, String modelId) {
		StopWatch stopWatch = StopWatch.createStarted();
		try {
			printJobManager.awaitPreparation(printJobManager.prepare(rawPrintModelContent));
		} catch (RuntimeException e) {
			log.error("Failed to pre-load Print Model {}", modelId, e);
			throw e;
		}
		stopWatch.stop();
		return stopWatch.getTime();
	}
}
