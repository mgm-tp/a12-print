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
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.html.AddStylesToHtmlDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.html.HtmlReplacementDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.html.SanitizeValueDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.id.NewIdDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.AttachmentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.DocumentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.DocumentModelDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.PrintModelDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markdown.MarkdownToHtmlDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.FormattingResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.metadata.AccessibilityMetadataDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.AttachmentWrapper;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.ElementModelDocumentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.ReferenceModelDocumentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.area.AreaElementDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.listing.ListingElementDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.switchCase.SwitchElementDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.element.text.TextBasedElementDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.section.ModelDocumentSectionDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.section.ModelDocumentSectionResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.segment.ModelDocumentSegmentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.segment.ModelDocumentSegmentResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.watermark.ModelDocumentWatermarkDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.modelDocument.watermark.ModelDocumentWatermarkResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.referenceElementResolver.PrintModelReferenceElementDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.referenceResolver.ReferenceElementDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.renderer.HtmlDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.restriction.PdfJobRestrictionContext;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.restriction.PdfJobRestrictionContextDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.sectionResolver.SectionDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.segmentResolver.SegmentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.textStyleResolver.TextStyleDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.watermarkResolver.WatermarkDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalModelDocumentPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.*;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.pdDocument.AccessibilityMetadata;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.DocumentModelIndex;
import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.reference.PrintModelReference;
import com.mgmtp.a12.print.model.api.model.section.ModelSection;
import com.mgmtp.a12.print.model.api.model.segment.ModelSegment;
import com.mgmtp.a12.print.model.api.model.textStyle.TextStyle;
import com.mgmtp.a12.print.model.api.model.watermark.Watermark;
import com.mgmtp.a12.print.model.document.internal.base.IPrintElement;
import lombok.NonNull;
import org.jsoup.nodes.Element;

import java.io.ByteArrayInputStream;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutorService;
import java.util.stream.Stream;

public class ConcurrentModelDocumentPrintEngineRuntime extends ConcurrentPrintEngineRuntime implements InternalModelDocumentPrintEngineRuntime {

	@NonNull
	private final InternalModelDocumentPrintEngineRuntime delegate;

	public ConcurrentModelDocumentPrintEngineRuntime(
		@NonNull InternalModelDocumentPrintEngineRuntime delegate,
		@NonNull ExecutorService executorService
	) {
		super(executorService);
		this.delegate = delegate;
	}

	@Override
	public ValueFactory<PrintModel> provide(PrintModelDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<String> provide(MarkdownToHtmlDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<DocumentModelIndex> provide(DocumentModelDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Optional<FormattingResult>> provide(CalculationValueDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Optional<String>> provide(ChartValueDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Optional<String>> provide(ExpressionValueDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<PreCompiledExpression> provide(PreCompiledExpressionDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Optional<FormattingResult>> provide(FieldValueDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Optional<String>> provide(ImageValueDependency dependency) {
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
	public ValueFactory<TableValueResult> provide(TableValuesDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<List<TableLayoutRow>> provide(TableLayoutValuesDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<TextValueDependency.TextValueResult> provide(TextValueDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<String> provide(ExpressionEntityReplacerDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<IFieldType> provide(FieldTypeDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Optional<IFieldType>> provide(FieldTypeFromPathValueDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<FormattingResult> provide(FormattedValueDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Element> provide(AddStylesToHtmlDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
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
	public ValueFactory<String> provide(NewIdDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<PrintDocument> provide(DocumentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Optional<PrintModelTreeTrace<PrintModelElement>>> provide(ReferenceElementDependency dependency) {
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
	public ValueFactory<ComputationExpressionEvaluation> provide(ComputationExpressionDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<PrintDocument> provide(ComputeDocumentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<LogicContainerEvaluation> provide(LogicContainerEvaluationDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Optional<PrintModelTreeTrace<PrintModelReference>>> provide(
		PrintModelReferenceElementDependency dependency
	) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<AttachmentWrapper<IPrintElement>> provide(AreaElementDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<AttachmentWrapper<IPrintElement>> provide(SwitchElementDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<AttachmentWrapper<IPrintElement>> provide(ElementModelDocumentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<AttachmentWrapper<IPrintElement>> provide(ListingElementDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<AttachmentWrapper<IPrintElement>> provide(ReferenceModelDocumentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<IPrintElement> provide(TextBasedElementDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<AttachmentWrapper<ModelDocumentSectionResult>> provide(ModelDocumentSectionDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<AttachmentWrapper<ModelDocumentSegmentResult>> provide(ModelDocumentSegmentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<AttachmentWrapper<ModelDocumentWatermarkResult>> provide(ModelDocumentWatermarkDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Optional<PrintModelTreeTrace<ModelSegment>>> provide(SegmentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<TextStyle> provide(TextStyleDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<String> provide(HtmlDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<PdfJobRestrictionContext> provide(PdfJobRestrictionContextDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<ByteArrayInputStream> provide(AttachmentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<AccessibilityMetadata> provide(AccessibilityMetadataDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public Stream<AttachmentWrapper<IPrintElement>> streamElementModelDocumentDependency(Stream<ElementModelDocumentDependency> dependency) {
		try {
			return super.getExecutorService().submit(() -> delegate.streamElementModelDocumentDependency(dependency.parallel())).get();
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
	public Stream<AttachmentWrapper<ModelDocumentSegmentResult>> streamModelDocumentSegmentDependency(Stream<ModelDocumentSegmentDependency> dependency) {
		try {
			return super.getExecutorService().submit(() -> delegate.streamModelDocumentSegmentDependency(dependency.parallel())).get();
		} catch (PrintException e) {
			throw e;
		} catch (Exception e) {
			throw wrapPrintException(e);
		}
	}

	@Override
	public Stream<AttachmentWrapper<ModelDocumentWatermarkResult>> streamModelDocumentWatermarkDependency(Stream<ModelDocumentWatermarkDependency> dependency) {
		try {
			return super.getExecutorService().submit(() -> delegate.streamModelDocumentWatermarkDependency(dependency.parallel())).get();
		} catch (PrintException e) {
			throw e;
		} catch (Exception e) {
			throw wrapPrintException(e);
		}
	}

	@Override
	public Stream<AttachmentWrapper<IPrintElement>> streamReferenceModelDocumentDependency(Stream<ReferenceModelDocumentDependency> dependency) {
		try {
			return super.getExecutorService().submit(() -> delegate.streamReferenceModelDocumentDependency(dependency.parallel())).get();
		} catch (PrintException e) {
			throw e;
		} catch (Exception e) {
			throw wrapPrintException(e);
		}
	}

	@Override
	public Stream<AttachmentWrapper<ModelDocumentSectionResult>> streamModelDocumentSectionDependency(Stream<ModelDocumentSectionDependency> dependency) {
		try {
			return super.getExecutorService().submit(() -> delegate.streamModelDocumentSectionDependency(dependency.parallel())).get();
		} catch (PrintException e) {
			throw e;
		} catch (Exception e) {
			throw wrapPrintException(e);
		}
	}
}
