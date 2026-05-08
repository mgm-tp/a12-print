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
package com.mgmtp.a12.print.engine.runtime.internal.manager.compiler.eval.kernel;

import com.mgmtp.a12.kernel.md.document.api.IFieldInstance;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;
import java.util.Objects;
import java.util.Optional;

@RequiredArgsConstructor
public class FieldInstance implements IFieldInstance {

	private final Object value;
	@NonNull
	private final String path;

	private final int[] repeats;

	@Override
	public Optional<Object> getValue() {
		return Optional.ofNullable(value);
	}

	@Override
	public void setValue(Object value) {
		// Not needed for evaluation field instances
	}

	@Override
	public @NonNull String getPath() {
		return path;
	}

	@Override
	public int[] getRepetitions() {
		return repeats;
	}

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (o == null || getClass() != o.getClass()) return false;

		FieldInstance that = (FieldInstance) o;

		if (!path.equals(that.path)) return false;
		if (!Objects.equals(value, that.value)) return false;


		final var rA = getRepetitions();
		final var rB = getRepetitions();

		if(rA.length != rB.length){
			return false;
		}

		for(var i = 0; i < rA.length; i++) {
			if(rA[i] != rB[i]){
				return false;
			}
		}

		return true;
	}

	@Override
	public int hashCode() {
		if (value == null) {
			return 0;
		}
		int result = value.hashCode();
		result = 31 * result + path.hashCode();
		result = 31 * result + Arrays.hashCode(repeats);
		return result;
	}
}
