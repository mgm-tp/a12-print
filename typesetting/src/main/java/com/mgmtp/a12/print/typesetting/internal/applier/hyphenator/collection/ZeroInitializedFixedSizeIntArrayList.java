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
package com.mgmtp.a12.print.typesetting.internal.applier.hyphenator.collection;

public class ZeroInitializedFixedSizeIntArrayList implements FixedSizeIntList {
	private int size = 0;
	private int[] elements;

	public ZeroInitializedFixedSizeIntArrayList(int size) {
		elements = new int[size];
		this.size = size;
		for (int i = 0; i < size; i++) {
			elements[i] = 0;
		}
	}

	public void add(int i) {
		elements[size++] = i;
	}

	public int get(int i) {
		if (i >= size || i < 0) {
			throw new IndexOutOfBoundsException("Index " + i + " out of bounds, size: " + size);
		}
		return elements[i];
	}

	public void set(int index, int value) {
		if (index >= size || index < 0) {
			throw new IndexOutOfBoundsException("Index " + index + " out of bounds, size: " + size);
		}
		elements[index] = value;
	}

	public int size() {
		return size;
	}
}
