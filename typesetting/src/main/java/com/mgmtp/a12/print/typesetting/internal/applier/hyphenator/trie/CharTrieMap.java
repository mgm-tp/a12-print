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
package com.mgmtp.a12.print.typesetting.internal.applier.hyphenator.trie;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.IntStream;

public class CharTrieMap implements CharTrie {

    private final List<Character> characters;
    private final List<CharTrieMapNode> nodes;

    private int size;

    public CharTrieMap() {
		this.characters = new ArrayList<>();
		this.nodes = new ArrayList<>();
		this.size = 0;
    }

    private int findIndex(final int key) {
		return IntStream.range(0, size).filter(i -> characters.get(i) == key).findFirst().orElse(-1);
	}

    public CharTrieMapNode put(final char ch, final CharTrieMapNode node) {
        final int oldIndex = findIndex(ch);
        if (oldIndex >= 0) {
            final CharTrieMapNode oldValue = nodes.get(oldIndex);
            nodes.set(oldIndex, node);
            return oldValue;
        }
        characters.add(ch);
        nodes.add(node);
        size++;
        return null;
    }

    public CharTrieMapNode get(final char ch) {
        for (int i = 0; i < size; i++) {
            if (characters.get(i) == ch)
                return nodes.get(i);
        }
        return null;
    }
}
