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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler;

import com.mgmtp.a12.print.engine.runtime.internal.engine.constant.Constants;
import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.model.element.base.internal.LogicComponent;
import com.mgmtp.a12.print.model.api.model.element.type.calculation.Calculation;
import com.mgmtp.a12.print.model.api.model.element.type.expression.Expression;
import com.mgmtp.a12.print.model.api.model.element.type.listing.Listing;
import com.mgmtp.a12.print.model.api.model.element.type.table.Table;
import com.mgmtp.a12.print.model.api.model.reference.PlaceableReference;
import com.mgmtp.a12.print.model.api.walker.TraversalCommand;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelPath;
import com.mgmtp.a12.print.model.api.walker.model.PrintModelVisitor;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;

import java.util.*;
import java.util.function.Supplier;
import java.util.stream.Collectors;

@RequiredArgsConstructor
public class PrintModelCompilationUpdate {

	@NonNull
	private final PrintModel currentPrintModelState;

	@NonNull
	private final PrintModelCompilationContext printModelCompilationContext;

	public PrintModelCompilationContext run(@NonNull Supplier<PrintModelCompilationContext> contextSupplier) {
		final var newContext = contextSupplier.get();
		newContext.asyncCompile();
		return newContext;
	}

	private boolean hasAdditionalDocumentModels() {
		return !currentPrintModelState.getHeader().getModelReferences().stream()
			.filter(modelReference -> modelReference.getModelType().equals(Constants.DOCUMENT_MODEL_TYPE))
			.allMatch(modelReference ->
				printModelCompilationContext.getDocumentModelIndexMap().containsKey(modelReference.getReference())
			);
	}

	private static class PrintModelReCompilationState implements PrintModelVisitor {
		private final Set<Expression> expressions = new HashSet<>();
		private final Set<Listing> listings = new HashSet<>();
		private final Set<Table> tables = new HashSet<>();
		private final Map<String, Set<LogicComponent>> logicComponentList = new HashMap<>();

		public boolean requiresReCompilation() {
			return !expressions.isEmpty() || !logicComponentList.isEmpty() || !tables.isEmpty();
		}

		public void addLogicComponents(String id, List<LogicComponent> collect) {
			logicComponentList.compute(id, (k, v) -> {
				if (v == null) {
					v = new HashSet<>();
				}
				v.addAll(collect);
				return v;
			});
		}

		public void removeLogicComponents(String id, List<LogicComponent> collect) {
			final var result = logicComponentList.compute(id, (k, v) -> {
				if (v != null) {
					collect.forEach(v::remove);
				}
				return v;
			});
			if (result != null && result.isEmpty()) {
				logicComponentList.remove(id);
			}
		}
		public void addListing(Listing listing) {
			listings.add(listing);
		}

		public void removeListing(Listing listing) {
			listings.remove(listing);
		}
		public void addExpression(Expression expression) {
			expressions.add(expression);
		}

		public void removeExpression(Expression expression) {
			expressions.remove(expression);
		}
		public void addTable(Table table) {
			tables.add(table);
		}

		public void removeTable(Table table) {
			tables.remove(table);
		}

	}

	@RequiredArgsConstructor
	public static class PrintModelReCompilationCurrentState implements PrintModelVisitor {

		@NonNull
		private PrintModelReCompilationState state;

		@Override
		public TraversalCommand visitExpression(Expression expression, PrintModelPath path) {
			state.addExpression(expression);
			return TraversalCommand.CONTINUE;
		}

		@Override
		public TraversalCommand visitPlaceableReference(PlaceableReference reference, PrintModelPath path, int index) {
			state.addLogicComponents(
				reference.getId(),
				reference.logicComponents().collect(Collectors.toList())
			);
			return TraversalCommand.CONTINUE;
		}

		@Override
		public TraversalCommand visitCalculation(Calculation calculation, PrintModelPath path) {
			state.addLogicComponents(
				calculation.getId(),
				calculation.getCalculationProperties()
						   .logicComponents()
						   .collect(Collectors.toList())
			);
			return TraversalCommand.CONTINUE;
		}

		@Override
		public TraversalCommand visitListing(Listing listing, PrintModelPath path) {
			state.addListing(listing);
			return TraversalCommand.CONTINUE;
		}

		@Override
		public TraversalCommand visitTable(Table table, PrintModelPath path) {
			state.addTable(table);
			return TraversalCommand.CONTINUE;
		}
	}

	@RequiredArgsConstructor
	public static class PrintModelReCompilationOldState implements PrintModelVisitor {

		@NonNull
		private PrintModelReCompilationState state;

		@Override
		public TraversalCommand visitExpression(Expression expression, PrintModelPath path) {
			state.removeExpression(expression);
			return TraversalCommand.CONTINUE;
		}

		@Override
		public TraversalCommand visitPlaceableReference(PlaceableReference reference, PrintModelPath path, int index) {
			state.removeLogicComponents(
				reference.getId(),
				reference.logicComponents().collect(Collectors.toList())
			);
			return TraversalCommand.CONTINUE;
		}

		@Override
		public TraversalCommand visitCalculation(Calculation calculation, PrintModelPath path) {
			state.removeLogicComponents(
				calculation.getId(),
				calculation.getCalculationProperties()
						   .logicComponents()
						   .collect(Collectors.toList())
			);
			return TraversalCommand.CONTINUE;
		}

		@Override
		public TraversalCommand visitListing(Listing listing, PrintModelPath path) {
			state.removeListing(listing);
			return TraversalCommand.CONTINUE;
		}

		@Override
		public TraversalCommand visitTable(Table table, PrintModelPath path) {
			state.removeTable(table);
			return TraversalCommand.CONTINUE;
		}
	}

}
