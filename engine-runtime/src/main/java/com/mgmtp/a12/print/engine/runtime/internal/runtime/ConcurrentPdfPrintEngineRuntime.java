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
package com.mgmtp.a12.print.engine.runtime.internal.runtime;


import com.mgmtp.a12.kernel.md.model.api.fieldtypes.IFieldType;
import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.engine.document.PrintDocument;
import com.mgmtp.a12.print.engine.runtime.internal.engine.pdfBox.PDObjectInsertionResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.attachments.AddAttachmentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.attachments.AddAttachmentResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.ElementMarkupResultDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.ReferenceMarkupResultDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.container.area.AreaMarkupDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.container.area.AreaMarkupDependencyValueProducer;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.container.boundingBox.BoundingBoxMarkupDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.container.switchCase.SwitchMarkupDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.listing.ListingMarkupDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.table.TableMarkupDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.tableLayout.TableLayoutMarkupDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.markup.text.TextBasedElementMarkupDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.calculation.CalculationValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.chart.ChartValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.expression.ExpressionValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.expression.PreCompiledExpression;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.expression.PreCompiledExpressionDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.field.FieldValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.image.ImageValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.listing.ListingValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.listing.ListingValueResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.listing.PreCompiledListing;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.listing.PreCompiledListingDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.table.TableValueResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.table.TableValuesDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.tableLayout.TableLayoutRow;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.tableLayout.TableLayoutValuesDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.element.value.text.TextValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.expression.ExpressionEntityReplacerDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.fieldType.FieldTypeDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.fieldType.FieldTypeFromPathValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.formatter.FormattedValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.heightCalculation.EvaluatedHeightDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.heightCalculation.EvaluatedHeightResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.html.AddStylesToHtmlDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.html.HtmlReplacementDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.html.SanitizeValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.id.NewIdDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.AttachmentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.DocumentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.DocumentModelDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.PrintModelDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markdown.MarkdownToHtmlDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.AddStylesToMarkupDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.FormattingResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.MarkupCollectorDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.MarkupResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.merge.MergePDDocumentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.metadata.AccessibilityMetadataDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.overrideResolver.OverrideElementDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.pdfBox.ContentInserterDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.pdfBox.InsertPDObjectsDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.pdfBox.InsertPDObjectsResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.referenceElementResolver.PrintModelReferenceElementDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.referenceResolver.ReferenceElementDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.renderer.HtmlDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.renderer.ModelSegmentPrintResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.renderer.ModelSegmentPrintResultDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.renderer.PDDocumentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.restriction.PdfJobRestrictionContext;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.restriction.PdfJobRestrictionContextDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.sectionResolver.SectionDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.segment.EmptySegmentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.segment.SegmentMarkupResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.segment.SegmentMarkupResultDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.segmentResolver.SegmentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.textStyleResolver.TextStyleDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.watermark.AddWatermarkDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.watermark.AddWatermarkResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.watermarkResolver.WatermarkDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.rendering.MarkupCollector;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.FinalYPositionDependency;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.SpreadExpressionManagerDependency;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.SpreadExpressionResult;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.*;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.pdDocument.AccessibilityMetadata;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.DocumentModelIndex;
import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.element.type.override.OverrideElement;
import com.mgmtp.a12.print.model.api.model.reference.PrintModelReference;
import com.mgmtp.a12.print.model.api.model.section.ModelSection;
import com.mgmtp.a12.print.model.api.model.segment.ModelSegment;
import com.mgmtp.a12.print.model.api.model.textStyle.TextStyle;
import com.mgmtp.a12.print.model.api.model.watermark.Watermark;
import lombok.NonNull;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.jsoup.nodes.Element;

import java.io.ByteArrayInputStream;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutorService;
import java.util.stream.Stream;

public class ConcurrentPdfPrintEngineRuntime extends ConcurrentPrintEngineRuntime implements InternalPdfPrintEngineRuntime {

	@NonNull
	private final InternalPdfPrintEngineRuntime delegate;

	public ConcurrentPdfPrintEngineRuntime(
		@NonNull InternalPdfPrintEngineRuntime delegate,
		@NonNull ExecutorService executorService
	) {
		super(executorService);
		this.delegate = delegate;
	}

	@Override
	public ValueFactory<PrintDocument> provide(ComputeDocumentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<FormattingResult> provide(FormattedValueDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Optional<PrintModelTreeTrace<ModelSegment>>> provide(SegmentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<PDDocument> provide(MergePDDocumentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<PrintModel> provide(PrintModelDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<DocumentModelIndex> provide(DocumentModelDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<PrintDocument> provide(DocumentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<String> provide(NewIdDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<String> provide(ExpressionEntityReplacerDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<SegmentMarkupResult> provide(SegmentMarkupResultDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<PDDocument> provide(EmptySegmentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<String> provide(MarkdownToHtmlDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Element> provide(AddStylesToHtmlDependency dependency) {
		// the provider mutates elements from positionDependency and therefore should not be parallel
		return delegate.provide(dependency);
	}

	@Override
	public ValueFactory<HtmlReplacementDependency.HtmlReplacementResult> provide(HtmlReplacementDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<String> provide(SanitizeValueDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Optional<PrintModelTreeTrace<ModelSection>>> provide(SectionDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Optional<PrintModelTreeTrace<Watermark>>> provide(WatermarkDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Optional<String>> provide(ImageValueDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Optional<FormattingResult>> provide(FieldValueDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<IFieldType> provide(FieldTypeDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<ComputationExpressionEvaluation> provide(ComputationExpressionDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<LogicContainerEvaluation> provide(LogicContainerEvaluationDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<SpreadExpressionResult> provide(SpreadExpressionManagerDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Integer> provide(FinalYPositionDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Optional<FormattingResult>> provide(CalculationValueDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<TableValueResult> provide(TableValuesDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<PreCompiledExpression> provide(PreCompiledExpressionDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Optional<String>> provide(ExpressionValueDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<List<TableLayoutRow>> provide(TableLayoutValuesDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Optional<String>> provide(ChartValueDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<TextValueDependency.TextValueResult> provide(TextValueDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Optional<IFieldType>> provide(FieldTypeFromPathValueDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<ListingValueResult> provide(ListingValueDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<PreCompiledListing> provide(PreCompiledListingDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<MarkupResult> provide(TableMarkupDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<MarkupResult> provide(ReferenceMarkupResultDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<SpreadExpressionResult> provide(SwitchMarkupDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<MarkupResult> provide(ElementMarkupResultDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<MarkupResult> provide(TableLayoutMarkupDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<MarkupResult> provide(ListingMarkupDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<MarkupResult> provide(TextBasedElementMarkupDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<String> provide(AddStylesToMarkupDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Optional<MarkupCollector>> provide(MarkupCollectorDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<AreaMarkupDependencyValueProducer.AreaSpreadExpressionResult> provide(AreaMarkupDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<SpreadExpressionResult> provide(BoundingBoxMarkupDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<EvaluatedHeightResult> provide(EvaluatedHeightDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Optional<PrintModelTreeTrace<PrintModelElement>>> provide(ReferenceElementDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<String> provide(HtmlDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<ModelSegmentPrintResult> provide(ModelSegmentPrintResultDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<PDDocument> provide(PDDocumentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<TextStyle> provide(TextStyleDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<AddAttachmentResult> provide(AddAttachmentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<AddWatermarkResult> provide(AddWatermarkDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Optional<PrintModelTreeTrace<PrintModelReference>>> provide(
		PrintModelReferenceElementDependency dependency
	) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<PdfJobRestrictionContext> provide(PdfJobRestrictionContextDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Optional<PrintModelTreeTrace<OverrideElement>>> provide(OverrideElementDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<ByteArrayInputStream> provide(AttachmentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<PDObjectInsertionResult> provide(ContentInserterDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<InsertPDObjectsResult> provide(InsertPDObjectsDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<AccessibilityMetadata> provide(AccessibilityMetadataDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public Stream<PDObjectInsertionResult> streamContentInserterDependency(Stream<ContentInserterDependency> dependency) {
		try {
			return super.getExecutorService().submit(() -> delegate.streamContentInserterDependency(dependency.parallel())).get();
		} catch (PrintException e) {
			throw e;
		} catch (Exception e) {
			throw wrapPrintException(e);
		}
	}

	@Override
	public Stream<ComputationExpressionEvaluation> streamComputationExpressionDependency(Stream<ComputationExpressionDependency> dependency) {
		try {
			return super.getExecutorService().submit(() -> delegate.streamComputationExpressionDependency(dependency.parallel())).get();
		} catch (PrintException e) {
			throw e;
		} catch (Exception e) {
			throw wrapPrintException(e);
		}
	}

	@Override
	public Stream<LogicContainerEvaluation> streamLogicContainerEvaluationDependency(Stream<LogicContainerEvaluationDependency> dependency) {
		try {
			return super.getExecutorService().submit(() -> delegate.streamLogicContainerEvaluationDependency(dependency.parallel())).get();
		} catch (PrintException e) {
			throw e;
		} catch (Exception e) {
			throw wrapPrintException(e);
		}
	}

	@Override
	public Stream<Optional<PrintModelTreeTrace<PrintModelReference>>> streamPrintModelReferenceElementDependency(Stream<PrintModelReferenceElementDependency> dependency) {
		try {
			return super.getExecutorService().submit(() -> delegate.streamPrintModelReferenceElementDependency(dependency.parallel())).get();
		} catch (PrintException e) {
			throw e;
		} catch (Exception e) {
			throw wrapPrintException(e);
		}
	}

	@Override
	public Stream<Optional<PrintModelTreeTrace<ModelSegment>>> streamSegmentDependency(Stream<SegmentDependency> dependency) {
		try {
			return super.getExecutorService().submit(() -> delegate.streamSegmentDependency(dependency.parallel())).get();
		} catch (PrintException e) {
			throw e;
		} catch (Exception e) {
			throw wrapPrintException(e);
		}
	}

	@Override
	public Stream<SpreadExpressionResult> streamSpreadExpressionManagerDependency(Stream<SpreadExpressionManagerDependency> dependency) {
		try {
			return super.getExecutorService().submit(() -> delegate.streamSpreadExpressionManagerDependency(dependency.parallel())).get();
		} catch (PrintException e) {
			throw e;
		} catch (Exception e) {
			throw wrapPrintException(e);
		}
	}

	@Override
	public Stream<Optional<PrintModelTreeTrace<ModelSection>>> streamSectionDependency(Stream<SectionDependency> dependency) {
		try {
			return super.getExecutorService().submit(() -> delegate.streamSectionDependency(dependency.parallel())).get();
		} catch (PrintException e) {
			throw e;
		} catch (Exception e) {
			throw wrapPrintException(e);
		}
	}

	@Override
	public Stream<Optional<PrintModelTreeTrace<Watermark>>> streamWatermarkDependency(Stream<WatermarkDependency> dependency) {
		try {
			return super.getExecutorService().submit(() -> delegate.streamWatermarkDependency(dependency.parallel())).get();
		} catch (PrintException e) {
			throw e;
		} catch (Exception e) {
			throw wrapPrintException(e);
		}
	}

	@Override
	public Stream<MarkupResult> streamReferenceMarkupResultDependency(Stream<ReferenceMarkupResultDependency> dependency) {
		try {
			return super.getExecutorService().submit(() -> delegate.streamReferenceMarkupResultDependency(dependency.parallel())).get();
		} catch (PrintException e) {
			throw e;
		} catch (Exception e) {
			throw wrapPrintException(e);
		}
	}

	@Override
	public Stream<MarkupResult> streamElementMarkupResultDependency(Stream<ElementMarkupResultDependency> dependency) {
		try {
			return super.getExecutorService().submit(() -> delegate.streamElementMarkupResultDependency(dependency.parallel())).get();
		} catch (PrintException e) {
			throw e;
		} catch (Exception e) {
			throw wrapPrintException(e);
		}
	}

	@Override
	public Stream<ModelSegmentPrintResult> streamModelSegmentPrintResultDependency(Stream<ModelSegmentPrintResultDependency> dependency) {
		try {
			return super.getExecutorService().submit(() -> delegate.streamModelSegmentPrintResultDependency(dependency.parallel())).get();
		} catch (PrintException e) {
			throw e;
		} catch (Exception e) {
			throw wrapPrintException(e);
		}
	}
}
