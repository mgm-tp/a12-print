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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout;

import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.PrintModelId;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocumentContext;
import com.mgmtp.a12.print.engine.runtime.internal.engine.pdfBox.PDSegmentObject;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.AttachmentToAppend;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.MarkupCollectorDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.metadata.AccessibilityMetadataDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.renderer.HtmlDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.renderer.HtmlTemplateParametersWithMarkups;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.segment.SegmentHtmlTemplateParameters;
import com.mgmtp.a12.print.engine.runtime.internal.engine.rendering.MarkupCollectorKey;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfPrintEngineRuntime;
import com.mgmtp.a12.print.model.api.model.container.TopLevelReferenceContainer;
import com.mgmtp.a12.print.model.api.model.section.ModelSection;
import com.mgmtp.a12.print.model.api.model.watermark.Watermark;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NonNull;
import lombok.Value;
import org.apache.commons.lang3.tuple.ImmutablePair;

import java.util.*;

import static com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.SectionSpreadExpression.SectionType.FOOTER;
import static com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.SectionSpreadExpression.SectionType.HEADER;

@Value
@EqualsAndHashCode(callSuper = true)
public class SegmentSpreadExpression extends ContainerSpreadExpression {

	private static final String SECTION_TEMPLATE = "section/section.ftlx";

	@NonNull TopLevelReferenceContainer container;

	MatchingSections matchingSections;

	public SegmentSpreadExpression(
		@NonNull String id,
		@NonNull TopLevelReferenceContainer container,
		@NonNull String[] childSpreadExpressionIds,
		@NonNull PrintModelId printModelId,
		MatchingSections matchingSections
	){
		super(id, container, childSpreadExpressionIds, printModelId);
		this.container = container;
		this.matchingSections = matchingSections;
	}

	public Optional<MatchingSections> getMatchingSections() {
		return Optional.ofNullable(matchingSections);
	}

	@Override
	public ValueFactory<SpreadExpressionResult> produce(SpreadExpressionDependency dependency, PrintJob job, PrintEngine<?> engine, InternalPdfPrintEngineRuntime runtime) {
		final var printDocumentContext = dependency.getPrintDocumentContext();
		final var evaluatedHeightOffset = dependency.getEvaluatedHeightOffset();
		final var totalPageCount = dependency.getTotalPageCount();
		final var repeatableSegmentIndex = dependency.getRepeatableSegmentIndex();

		final var sortablePDDocuments = new ArrayList<SortablePDDocument>();
		final var spreadExpressionResults = new ArrayList<SpreadExpressionResult>();
		final LinkedHashMap<String, AttachmentToAppend> attachmentsToAppend = new LinkedHashMap<>();
		final Map<String, String> pageNumberGlobalStyles = new HashMap<>();

		final var segmentHeight = runtime.streamSpreadExpressionManagerDependency(Arrays.stream(this.getChildSpreadExpressionIds()).map(
			childSpreadExpressionId -> new SpreadExpressionManagerDependency(
				childSpreadExpressionId,
				printDocumentContext,
				evaluatedHeightOffset,
				repeatableSegmentIndex
			)
		)).map(spreadExpressionResult -> {
			spreadExpressionResults.add(spreadExpressionResult);
			sortablePDDocuments.add(spreadExpressionResult.getSortablePDDocument());
			attachmentsToAppend.putAll(spreadExpressionResult.getAttachmentsToAppend());
			pageNumberGlobalStyles.putAll(spreadExpressionResult.getPageNumberGlobalStyles());

			return spreadExpressionResult.getSpread();
		}).max(Integer::compare).orElse(0);

		final var headerMarkupResults = new HashMap<String, String>();
		final var footerMarkupResults = new HashMap<String, String>();

		if (getMatchingSections().isPresent()) {
			if (matchingSections.getFirstPageSection() != null && (repeatableSegmentIndex == null || repeatableSegmentIndex == 0)) {
				final var firstPageSection = matchingSections.getFirstPageSection();
				final var keys = getSectionMarkupKeys(firstPageSection);
				final var id = firstPageSection.getId();
				headerMarkupResults.put(id, getSectionMarkup(engine, runtime, id, printDocumentContext, keys.getLeft(), HEADER));
				footerMarkupResults.put(id, getSectionMarkup(engine, runtime, id, printDocumentContext, keys.getRight(), FOOTER));
			}
			if (matchingSections.getRemainingPageSection() != null) {
				final var remainingPageSection = matchingSections.getRemainingPageSection();
				final var keys = getSectionMarkupKeys(remainingPageSection);
				final var id = remainingPageSection.getId();
				headerMarkupResults.put(id, getSectionMarkup(engine, runtime, id, printDocumentContext, keys.getLeft(), HEADER));
				footerMarkupResults.put(id, getSectionMarkup(engine, runtime, id, printDocumentContext, keys.getRight(), FOOTER));
			}
		}

		final var sections = MatchingSections.awareOfSegmentIndex(matchingSections, repeatableSegmentIndex);

		final var accessibilityMetadata = runtime.provide(new AccessibilityMetadataDependency(
			this.getPrintModelId(),
			printDocumentContext
		)).get();

		final var markupCollector = runtime.provide(new MarkupCollectorDependency()).get();
		final var htmlDependency = new HtmlDependency(
			engine.getConfig().getSegmentEntryTemplateName(),
			SegmentHtmlTemplateParameters
				.builder()
				.accessibilityMetadata(accessibilityMetadata)
				.containerId(getId())
				.pageOrientation(this.getContainer().getPageOrientation())
				.evaluatedSegmentHeight(segmentHeight)
				.overflowHidden(this.container instanceof Watermark)
				.childElements(MarkupCollectorKey.ofSpreadExpressionResults(
					markupCollector.isPresent(),
					spreadExpressionResults,
					printDocumentContext
				))
				.headerMarkups(headerMarkupResults.values().stream().toList())
				.footerMarkups(footerMarkupResults.values().stream().toList())
				.sections(sections)
				.totalPageCount(totalPageCount)
				.pageNumberGlobalStyles(pageNumberGlobalStyles)
				.build()
		);

		final var html = runtime.provide(htmlDependency).get();

		markupCollector.ifPresent(col -> col.add(
			new MarkupCollectorKey(getId(), printDocumentContext),
			html
		));

		final var spreadExpressionResult = new SegmentSpreadExpressionResult(
			dependency.getSpreadExpressionId(),
			html,
			new SortablePDDocument(new PDSegmentObject(sortablePDDocuments, sections)),
			segmentHeight,
			0,
			0,
			attachmentsToAppend,
			pageNumberGlobalStyles
		);

		return () -> spreadExpressionResult;
	}

	private String getSectionMarkup(
		PrintEngine<?> engine,
		InternalPdfPrintEngineRuntime runtime,
		String id,
		PrintDocumentContext printDocumentContext,
		List<MarkupCollectorKey> markupCollectorKeys,
		SectionSpreadExpression.SectionType sectionType
	) {
		final var markupCollector = runtime.provide(new MarkupCollectorDependency()).get();
		final var html = runtime.provide(new HtmlDependency(SECTION_TEMPLATE, new SectionHtmlTemplateParameters(
			id,
			markupCollector.isPresent() ? markupCollectorKeys : List.of(),
			sectionType
		))).get();
		markupCollector.ifPresent(col -> col.add(
			new MarkupCollectorKey(getId(), printDocumentContext),
			html
		));
		return html;
	}

	private ImmutablePair<List<MarkupCollectorKey>, List<MarkupCollectorKey>> getSectionMarkupKeys(ModelSection section) {
		final var headerKeys = new ArrayList<MarkupCollectorKey>();
		final var footerKeys = new ArrayList<MarkupCollectorKey>();
		section.getReferences().forEach(reference -> {
			if (SectionUtils.isInSection(section, reference, true)) {
				headerKeys.add(new MarkupCollectorKey(reference.getRefId()));
			} else if (SectionUtils.isInSection(section, reference, false)) {
				footerKeys.add(new MarkupCollectorKey(reference.getRefId()));
			}
		});

		return new ImmutablePair<>(headerKeys, footerKeys);
	}

	@Data
	public static class SectionHtmlTemplateParameters implements HtmlTemplateParametersWithMarkups {
		private final String sectionId;
		private final List<MarkupCollectorKey> childElements;
		private final SectionSpreadExpression.SectionType sectionType;

		public String type() {
			return sectionType.name().toLowerCase();
		}
	}
}
