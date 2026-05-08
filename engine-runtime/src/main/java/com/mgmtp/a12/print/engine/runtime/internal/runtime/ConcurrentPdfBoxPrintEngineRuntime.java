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
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.loader.*;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markdown.MarkdownToHtmlDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.markup.FormattingResult;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.metadata.AccessibilityMetadataDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.referenceElementResolver.PrintModelReferenceElementDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.referenceResolver.ReferenceElementDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.renderer.HtmlDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.restriction.PdfJobRestrictionContext;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.restriction.PdfJobRestrictionContextDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.sectionResolver.SectionDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.segmentResolver.SegmentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.textStyleResolver.TextStyleDependency;
import com.mgmtp.a12.print.engine.runtime.internal.engine.provider.watermarkResolver.WatermarkDependency;
import com.mgmtp.a12.print.engine.runtime.internal.generated.InternalPdfBoxPrintEngineRuntime;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.ComponentTree;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.ComponentTreeDependencySelector;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.ComponentTreeManagerDependency;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.ComponentTreeResult;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.layout.pdfBoxEngine.componentTrees.PageBreakInterruptResult;
import com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.provider.*;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.documentHandle.SegmentDocumentHandle;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.documentHandle.WatermarkDocumentHandle;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.pdDocument.AccessibilityMetadata;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.Component;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.ElementComponentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.ReferenceComponentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.*;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.text.TextComponentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.factories.text.TextElementComponentDependency;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.component.elements.utils.FontLoaderDependency;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.segment.SegmentHandleDependency;
import com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.provider.watermark.WatermarkHandleDependency;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.DocumentModelIndex;
import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.element.PrintModelElement;
import com.mgmtp.a12.print.model.api.model.reference.PrintModelReference;
import com.mgmtp.a12.print.model.api.model.section.ModelSection;
import com.mgmtp.a12.print.model.api.model.segment.ModelSegment;
import com.mgmtp.a12.print.model.api.model.textStyle.TextStyle;
import com.mgmtp.a12.print.model.api.model.watermark.Watermark;
import com.mgmtp.a12.print.typesetting.internal.model.TypesettingModel;
import lombok.NonNull;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.jsoup.nodes.Element;

import java.io.ByteArrayInputStream;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ExecutorService;
import java.util.stream.Stream;

public class ConcurrentPdfBoxPrintEngineRuntime extends ConcurrentPrintEngineRuntime implements InternalPdfBoxPrintEngineRuntime {

	@NonNull
	private final InternalPdfBoxPrintEngineRuntime delegate;

	public ConcurrentPdfBoxPrintEngineRuntime(
		@NonNull InternalPdfBoxPrintEngineRuntime delegate,
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
	public ValueFactory<TextStyle> provide(TextStyleDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<PrintModel> provide(PrintModelDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<TypesettingModel> provide(TypesettingModelDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<ComponentTree> provide(ComponentTreeDependencySelector dependency) {
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
	public ValueFactory<ByteArrayInputStream> provide(AttachmentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<String> provide(ExpressionEntityReplacerDependency dependency) {
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
	public ValueFactory<Optional<PrintModelTreeTrace<PrintModelElement>>> provide(ReferenceElementDependency dependency) {
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
	public ValueFactory<Optional<PrintModelTreeTrace<PrintModelReference>>> provide(
		PrintModelReferenceElementDependency dependency
	) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<SegmentDocumentHandle> provide(SegmentHandleDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<WatermarkDocumentHandle> provide(WatermarkHandleDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<PageBreakInterruptResult<ComponentTreeResult>> provide(ComponentTreeManagerDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Component> provide(ElementComponentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Component> provide(CalculationComponentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Component> provide(ChartComponentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Component> provide(FieldComponentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Component> provide(ImageComponentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Component> provide(LineComponentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Component> provide(ListingComponentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Component> provide(TableComponentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Component> provide(TableLayoutComponentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Component> provide(TextComponentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Component> provide(TextElementComponentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<Component> provide(ReferenceComponentDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<PDFont> provide(FontLoaderDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public ValueFactory<AccessibilityMetadata> provide(AccessibilityMetadataDependency dependency) {
		return awaitTask(() -> delegate.provide(dependency));
	}

	@Override
	public Stream<SegmentDocumentHandle> streamSegmentHandleDependency(Stream<SegmentHandleDependency> dependency) {
		try {
			return super.getExecutorService().submit(() -> delegate.streamSegmentHandleDependency(dependency.parallel())).get();
		} catch (PrintException e) {
			throw e;
		} catch (Exception e) {
			throw wrapPrintException(e);
		}
	}

	@Override
	public Stream<WatermarkDocumentHandle> streamWatermarkHandleDependency(Stream<WatermarkHandleDependency> dependency) {
		try {
			return super.getExecutorService().submit(() -> delegate.streamWatermarkHandleDependency(dependency.parallel())).get();
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
	public Stream<PageBreakInterruptResult<ComponentTreeResult>> streamComponentTreeManagerDependency(Stream<ComponentTreeManagerDependency> dependency) {
		try {
			return super.getExecutorService().submit(() -> delegate.streamComponentTreeManagerDependency(dependency.parallel())).get();
		} catch (PrintException e) {
			throw e;
		} catch (Exception e) {
			throw wrapPrintException(e);
		}
	}

	@Override
	public Stream<Component> streamElementComponentDependency(Stream<ElementComponentDependency> dependency) {
		try {
			return super.getExecutorService().submit(() -> delegate.streamElementComponentDependency(dependency.parallel())).get();
		} catch (PrintException e) {
			throw e;
		} catch (Exception e) {
			throw wrapPrintException(e);
		}
	}

	@Override
	public Stream<Component> streamReferenceComponentDependency(Stream<ReferenceComponentDependency> dependency) {
		try {
			return super.getExecutorService().submit(() -> delegate.streamReferenceComponentDependency(dependency.parallel())).get();
		} catch (PrintException e) {
			throw e;
		} catch (Exception e) {
			throw wrapPrintException(e);
		}
	}
}
