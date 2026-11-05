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
package com.mgmtp.a12.print.model.api.walker.model.resolver;

import com.mgmtp.a12.print.model.api.exceptions.PrintWalkerException;
import com.mgmtp.a12.print.model.api.model.PrintFragmentModel;
import com.mgmtp.a12.print.model.api.model.PrintModel;
import com.mgmtp.a12.print.model.api.model.PrintModelContent;
import com.mgmtp.a12.print.model.api.model.PrintModelTreeTrace;
import com.mgmtp.a12.print.model.api.model.container.DefinitionsContainer;
import com.mgmtp.a12.print.model.api.model.container.TopLevelReferenceContainer;
import com.mgmtp.a12.print.model.api.model.reference.FragmentReference;
import com.mgmtp.a12.print.model.api.model.segment.ModelSegment;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class FragmentModelDefinitionResolverTest {

	@Test
	void givenNoFragmentReferences_whenResolveWithFragmentModels_thenReturnOwnItems() {
		PrintModelTreeTrace<Object> ownItem = mock(PrintModelTreeTrace.class);
		var ownItems = Map.of("item1", ownItem);

		var result = FragmentModelDefinitionResolver.resolveWithFragmentModels(
			ownItems,
			List.of(),
			model -> Map.of(),
			id -> Optional.empty(),
			"Segment"
		);

		assertThat(result).isEqualTo(ownItems);
	}

	@Test
	void givenFragmentReference_whenResolveWithFragmentModels_thenMapsReferenceIdToFragmentItem() {
		var reference = mock(FragmentReference.class);
		when(reference.getModel()).thenReturn("fragmentModel");
		when(reference.getRefId()).thenReturn("fragmentItemId");
		when(reference.getId()).thenReturn("localId");

		PrintModelTreeTrace<Object> fragmentItem = mock(PrintModelTreeTrace.class);
		var fragmentModel = mock(PrintFragmentModel.class);
		PrintModelTreeTrace<PrintFragmentModel> fragmentModelTrace = mock(PrintModelTreeTrace.class);
		when(fragmentModelTrace.getTracedElement()).thenReturn(fragmentModel);

		var result = FragmentModelDefinitionResolver.resolveWithFragmentModels(
			Map.of(),
			List.of(reference),
			model -> Map.of("fragmentItemId", fragmentItem),
			id -> Optional.of(fragmentModelTrace),
			"Segment"
		);

		assertThat(result).containsEntry("localId", fragmentItem);
	}

	@Test
	void givenMultipleReferencesToSameFragment_whenResolveWithFragmentModels_thenResolveFragmentOnlyOnce() {
		var reference1 = mock(FragmentReference.class);
		when(reference1.getModel()).thenReturn("fragmentModel");
		when(reference1.getRefId()).thenReturn("item1");
		when(reference1.getId()).thenReturn("local1");

		var reference2 = mock(FragmentReference.class);
		when(reference2.getModel()).thenReturn("fragmentModel");
		when(reference2.getRefId()).thenReturn("item2");
		when(reference2.getId()).thenReturn("local2");

		PrintModelTreeTrace<Object> fragmentItem1 = mock(PrintModelTreeTrace.class);
		PrintModelTreeTrace<Object> fragmentItem2 = mock(PrintModelTreeTrace.class);
		var fragmentModel = mock(PrintFragmentModel.class);
		PrintModelTreeTrace<PrintFragmentModel> fragmentModelTrace = mock(PrintModelTreeTrace.class);
		when(fragmentModelTrace.getTracedElement()).thenReturn(fragmentModel);

		PrintFragmentModelResolver resolver = mock(PrintFragmentModelResolver.class);
		when(resolver.resolvePrintFragmentModel("fragmentModel")).thenReturn(Optional.of(fragmentModelTrace));

		var result = FragmentModelDefinitionResolver.resolveWithFragmentModels(
			Map.of(),
			List.of(reference1, reference2),
			model -> Map.of("item1", fragmentItem1, "item2", fragmentItem2),
			resolver,
			"Segment"
		);

		assertThat(result).containsEntry("local1", fragmentItem1).containsEntry("local2", fragmentItem2);
		verify(resolver, times(1)).resolvePrintFragmentModel("fragmentModel");
	}

	@Test
	void givenUnresolvableFragment_whenResolveWithFragmentModels_thenThrowPrintWalkerException() {
		var reference = mock(FragmentReference.class);
		when(reference.getModel()).thenReturn("missingFragment");

		assertThrows(PrintWalkerException.class, () ->
			FragmentModelDefinitionResolver.resolveWithFragmentModels(
				Map.of(),
				List.of(reference),
				model -> Map.of(),
				id -> Optional.empty(),
				"Segment"
			)
		);
	}

	@Test
	void givenMissingItemInFragment_whenResolveWithFragmentModels_thenThrowPrintWalkerException() {
		var reference = mock(FragmentReference.class);
		when(reference.getModel()).thenReturn("fragmentModel");
		when(reference.getRefId()).thenReturn("nonExistentId");

		var fragmentModel = mock(PrintFragmentModel.class);
		PrintModelTreeTrace<PrintFragmentModel> fragmentModelTrace = mock(PrintModelTreeTrace.class);
		when(fragmentModelTrace.getTracedElement()).thenReturn(fragmentModel);

		assertThrows(PrintWalkerException.class, () ->
			FragmentModelDefinitionResolver.resolveWithFragmentModels(
				Map.of(),
				List.of(reference),
				model -> Map.of(),
				id -> Optional.of(fragmentModelTrace),
				"Segment"
			)
		);
	}

	@Test
	void givenDefinitions_whenLoadDefinitions_thenReturnMappedDefinitions() {
		var printModel = mock(PrintModel.class);
		when(printModel.getContent()).thenReturn(mock(PrintModelContent.class));

		var definition = mock(TopLevelReferenceContainer.class);
		when(definition.getId()).thenReturn("defId");
		var container = mock(DefinitionsContainer.class);
		doReturn(List.of(definition)).when(container).getDefinitions();

		Map<String, PrintModelTreeTrace<TopLevelReferenceContainer>> result =
			FragmentModelDefinitionResolver.loadDefinitions(printModel, "segments", container);

		assertThat(result).containsKey("defId");
		assertThat(result.get("defId").getTracedElement()).isEqualTo(definition);
	}

	@Test
	void givenEmptyDefinitions_whenLoadDefinitions_thenReturnEmptyMap() {
		var printModel = mock(PrintModel.class);
		when(printModel.getContent()).thenReturn(mock(PrintModelContent.class));

		var container = mock(DefinitionsContainer.class);
		when(container.getDefinitions()).thenReturn(List.of());

		var result = FragmentModelDefinitionResolver.loadDefinitions(printModel, "segments", container);

		assertThat(result).isEmpty();
	}
}
