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
package com.mgmtp.a12.print.typesetting.internal.applier.hyphenator;

import com.mgmtp.a12.print.typesetting.internal.model.Index;

import java.util.Arrays;
import java.util.List;

public class HyphenIndex {
	private int[] indices;
	private int size = 0;

	public HyphenIndex() {
		this.indices = new int[0];
	}

	public HyphenIndex(int inputLength) {
		this.indices = new int[inputLength / 4];
	}

	public HyphenIndex(List<Index> indices) {
		this.indices = indices.stream().mapToInt(Index::getValue).toArray();
	}

	private void resize() {
		indices = Arrays.copyOf(indices, indices.length + 1);
	}

	public void add(int index) {
		if (size == indices.length) {
			resize();
		}
		indices[size++] = index;
	}

	public int[] getIndices() {
		return indices;
	}

	public int size() {
		return size;
	}
}
