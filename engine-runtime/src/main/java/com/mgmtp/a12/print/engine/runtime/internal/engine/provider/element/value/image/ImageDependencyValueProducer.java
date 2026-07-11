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
package com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.image;

import com.google.common.base.Strings;
import com.mgmtp.a12.kernel.md.model.api.IField;
import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.CoreDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.Entity;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.attachments.AttachmentUtils;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.AttachmentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalCorePrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.ComputationParser;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.ReferenceSegment;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.Variable;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.visitor.SyntaxTreeRenderer;
import com.mgmtp.a12.print.model.api.model.element.type.image.Image;
import com.mgmtp.a12.print.model.api.model.element.type.image.ImageProperties;
import com.mgmtp.a12.print.model.api.model.element.type.image.ResourceSource;

import java.net.URLConnection;
import java.util.Optional;


public class ImageDependencyValueProducer implements CoreDependencyValueProvider<Optional<String>, ImageValueDependency> {

	@Override
	public ValueFactory<Optional<String>> produce(ImageValueDependency dependency, PrintJob job, PrintEngine<?> engine, InternalCorePrintEngineRuntime runtime) {
		final Image image = dependency.getImage();
		final PrintDocumentContext printDocumentContext = dependency.getPrintDocumentContext();
		final var staticImageMap = runtime.provide(new StaticImageMapDependency()).get();
		Optional<String> content = Optional.empty();
		if (
			image.getImageProperties().getImageSrcType().equals(ImageProperties.ImageSrcType.STATIC) &&
				image.getImageProperties().getResourceSource().isPresent()
		) {
			var filename = image.getImageProperties().getResourceSource()
				.map(ResourceSource::getResourceName)
				.filter(rsName -> !Strings.isNullOrEmpty(rsName))
				.orElseThrow(() ->  new PrintException("Static image resource source is missing resource name"));
			var preloaded = staticImageMap.get(filename);
			if (preloaded == null) {
				throw new PrintException(
					"Static image '" + filename + "' was not pre-loaded. " +
					"Ensure a StaticImageProvider is configured and the file exists in the resources folder."
				);
			}
			content = Optional.of(AttachmentUtils.attachmentToBase64(preloaded, URLConnection.guessContentTypeFromName(filename)));
		} else if (image.getImageProperties().getFieldSource().isPresent()) {
			final String path = Variable.abs(image.getImageProperties().getFieldSource().get().getPath());

			final var element = printDocumentContext.getDocumentModel().getByPath(path).orElseThrow();
			if(element instanceof IField) {
				final var elementContext = printDocumentContext.findSingleFieldInstance(path);
				content = elementContext
					.flatMap(Entity::getValue)
					.filter(String.class::isInstance)
					.map(o -> (String) o);

				if (
					element.getName().equals("attachment_id") &&
						content.isPresent() &&
						Optional.ofNullable(element.getParent()).filter(
							g -> g.getUsageType().filter(u -> u.equals("attachment")).isPresent()
						).isPresent()
				) {
					final var attachmentGroup = elementContext.get().parentGroup();

					final var mimeType = attachmentGroup
						.findSingleFieldInstance("mime_type", true)
						.flatMap(Entity::getValue);

					if (mimeType.isPresent() && mimeType.get() instanceof String mimeTypeIdentifier) {
						content = Optional.of(AttachmentUtils.attachmentToBase64(
							runtime.provide(new AttachmentDependency(content.get())).get().readAllBytes(),
							mimeTypeIdentifier
						));
					}
				}
			} else {
				content = printDocumentContext.findSingleFieldInstance(
										SyntaxTreeRenderer.getPath(
											true,
											Variable.join(
												ComputationParser.variable(path),
												Variable.builder().segments(
													new ReferenceSegment[]{
														ReferenceSegment.builder().label("content").build()
													}).build()
											).getSegments()
										)
									)
									.flatMap(Entity::getValue)
									.filter(String.class::isInstance)
									.map(o -> (String) o);
			}
		}
		final var result = content;
		return () -> result;
	}
}
