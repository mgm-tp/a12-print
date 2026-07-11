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
package com.mgmtp.a12.print.typesetting.internal.model.deserializer;

import tools.jackson.core.JacksonException;
import tools.jackson.core.JsonParser;
import tools.jackson.core.JsonToken;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.ValueDeserializer;
import tools.jackson.databind.JsonNode;

public abstract class ScalarOrObjectDeserializer<T> extends ValueDeserializer<T> {

	@Override
	public T deserialize(JsonParser p, DeserializationContext ctx) {
		JsonToken t = p.currentToken();

		if (t == JsonToken.VALUE_NULL) {
			return null;
		}

		if (t == JsonToken.VALUE_STRING) {
			return fromScalar(p.getString());
		}

		if (t == JsonToken.START_ARRAY) {
			JsonNode arr = p.objectReadContext().readTree(p);
			if (arr.isEmpty()) return null;
			return fromNode(arr.get(0), p, ctx);
		}

		JsonNode n = p.objectReadContext().readTree(p);
		return fromNode(n, p, ctx);
	}

	protected abstract T fromScalar(String value);
	protected abstract T fromNode(JsonNode node, JsonParser p, DeserializationContext ctx) throws JacksonException;
}
