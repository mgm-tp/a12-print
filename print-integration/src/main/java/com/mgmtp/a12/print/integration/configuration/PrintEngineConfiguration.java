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
package com.mgmtp.a12.print.integration.configuration;

import com.mgmtp.a12.dataservices.autoconfigure.DataServicesCoreAutoconfiguration;
import com.mgmtp.a12.dataservices.model.GenericModel;
import com.mgmtp.a12.dataservices.model.ModelService;
import com.mgmtp.a12.dataservices.model.persistence.IModelLoader;
import com.mgmtp.a12.kernel.md.model.api.IDocumentModel;
import com.mgmtp.a12.print.engine.api.*;
import com.mgmtp.a12.print.engine.runtime.ExecutorServiceFactory;
import com.mgmtp.a12.print.engine.runtime.PrintJobManager;
import com.mgmtp.a12.print.engine.runtime.pdfBox.PdfBoxPrintEngine;
import com.mgmtp.a12.print.integration.internal.configuration.FontResourceProvider;
import com.mgmtp.a12.print.integration.internal.configuration.StaticImageResourceProvider;
import com.mgmtp.a12.print.integration.internal.operation.PrintOperation;
import com.mgmtp.a12.print.integration.internal.service.AttachmentProviderFactory;
import com.mgmtp.a12.print.integration.internal.service.PrintModelPreloader;
import com.mgmtp.a12.print.integration.internal.service.PrintService;
import com.mgmtp.a12.print.integration.internal.service.TypesettingModelLoader;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.security.concurrent.DelegatingSecurityContextExecutorService;

import java.util.concurrent.ExecutorService;

@AutoConfiguration(after = DataServicesCoreAutoconfiguration.class)
@EnableConfigurationProperties(PrintEngineProperties.class)
@EnableAsync
@Import({
	PrintOperation.class,
	PrintService.class,
	PrintModelPreloader.class,
	TypesettingModelLoader.class,
	FontResourceProvider.class,
	StaticImageResourceProvider.class,
	AttachmentProviderFactory.class
})
public class PrintEngineConfiguration {

	@Bean(destroyMethod = "shutdown")
	@ConditionalOnMissingBean(name = "printExecutorService")
	public ExecutorService printExecutorService() {
		return new DelegatingSecurityContextExecutorService(
			ExecutorServiceFactory.getInstance(Runtime.getRuntime().availableProcessors(), "print-pool")
		);
	}

	@Bean
	@ConditionalOnMissingBean
	public PrintJobManager.PrintJobManagerApi printJobManagerApi(
		ModelService modelService,
		IModelLoader<IDocumentModel> documentModelLoader
	) {
		return new PrintJobManager.PrintJobManagerApi() {
			@Override
			public String loadPrintModel(String id) {
				GenericModel printModel = modelService.load(id);
				return printModel.getContent().getRawContent();
			}

			@Override
			public String loadPrintFragmentModel(String id) {
				GenericModel printFragmentModel = modelService.load(id);
				return printFragmentModel.getContent().getRawContent();
			}

			@Override
			public IDocumentModel loadDocumentModel(String id) {
				return documentModelLoader.loadModel(id);
			}
		};
	}

	@Bean
	@ConditionalOnMissingBean
	public PrintJobManager printJobManager(
		@Qualifier("printExecutorService") ExecutorService printExecutorService,
		PrintJobManager.PrintJobManagerApi printJobManagerApi,
		StaticImageProvider staticImageProvider
	) {
		return new PrintJobManager(
			printExecutorService,
			printJobManagerApi,
			PrintJobConfig.DEFAULT,
			staticImageProvider
		);
	}

	@Bean
	@Lazy
	@ConditionalOnMissingBean
	public PrintEngine<PdfPrintResult> pdfBoxPrintEngine(
		@Qualifier("printExecutorService") ExecutorService printExecutorService,
		FontResourceProvider fontResourceProvider
	) {
		return new PdfBoxPrintEngine(
				printExecutorService,
				PdfBoxPrintEngineConfig.builder()
						.availableFonts(fontResourceProvider.getAvailableFonts())
						.build()
		);
	}
}
