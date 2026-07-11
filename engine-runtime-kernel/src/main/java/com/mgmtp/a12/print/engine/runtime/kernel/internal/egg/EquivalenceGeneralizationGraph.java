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
package com.mgmtp.a12.print.engine.runtime.kernel.internal.egg;

import com.mgmtp.a12.print.engine.api.exception.impl.PrintCompilerException;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.ComputationSyntaxTree;
import com.mgmtp.a12.print.engine.runtime.kernel.internal.elements.SyntaxTreeElement;
import lombok.NonNull;

import java.util.*;
import java.util.concurrent.Callable;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentSkipListMap;
import java.util.concurrent.ConcurrentSkipListSet;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

public class EquivalenceGeneralizationGraph {

	private final AtomicInteger idFactory = new AtomicInteger(0);
	private final ConcurrentSkipListMap<Integer, EggNode> lookup = new ConcurrentSkipListMap<>();
	private final ConcurrentHashMap<SyntaxTreeElement, EggNode> elements;
	private final ConcurrentSkipListSet<EggNode> queue = new ConcurrentSkipListSet<>(Comparator.comparingInt(EggNode::id));
	private final EqqMatrix generalizeEqqMatrix = new EqqMatrix(0, 0);
	private final EggRuleSet ruleSet;

	public EquivalenceGeneralizationGraph(@NonNull EggRuleSet ruleSet) {
		this.ruleSet = ruleSet;
		this.elements = new ConcurrentHashMap<>();
	}

	public Optional<EggNode> get(int nodeId) {
		return Optional.ofNullable(getInternal(nodeId));
	}

	public EggNode getInternal(int nodeId) {
		return lookup.getOrDefault(nodeId, null);
	}

	public Optional<EggNode> get(SyntaxTreeElement element) {
		final var result = elements.getOrDefault(element, null);
		if (result != null) {
			return Optional.of(result);
		}
		return Optional.ofNullable(elements.getOrDefault(normalize(element), null));
	}

	public boolean has(SyntaxTreeElement element) {
		return elements.containsKey(element);
	}

	public int size() {
		return elements.size();
	}

	public EggNode add(SyntaxTreeElement t) {
		return elements.computeIfAbsent(
			normalize(t),
			tree -> {
				var node = EggNode.factory()
								  .id(idFactory.getAndIncrement())
								  .tree(tree)
								  .build();
				lookup.put(node.id(), node);
				queue.add(node);
				return node;
			}
		);
	}

	public EggNode addRaw(SyntaxTreeElement t) {
		return elements.computeIfAbsent(
			t,
			tree -> {
				var node = EggNode.factory()
								  .id(idFactory.getAndIncrement())
								  .tree(tree)
								  .build();
				lookup.put(node.id(), node);
				queue.add(node);
				return node;
			}
		);
	}

	private SyntaxTreeElement normalize(SyntaxTreeElement tree) {
		var finalTree = tree;
		var prevTree = tree;
		do {
			prevTree = finalTree;
			finalTree = ruleSet.getNormalizations().stream().reduce(
				prevTree,
				(a, b) -> b.instantiate(a).apply(),
				(a, b) -> b
			);
		} while (!finalTree.equals(prevTree));
		return finalTree;
	}

	public EggNode add(ComputationSyntaxTree element) {
		return add(element.getRoot());
	}

	public void run() {
		runExpansion();
	}

	private void runExpansion() {
		if (queue.isEmpty()) {
			return;
		}

		while (!queue.isEmpty()) {
			var tasks = new ArrayList<Callable<Void>>();

			try {
				processEggNodeForTasks(tasks);

				for(var t : tasks) {
					t.call();
				}

			} catch (Exception e) {
				throw new PrintCompilerException("Rewrite encountered and exception: ", e);
			}
		}

	}

	private void processEggNodeForTasks(ArrayList<Callable<Void>> tasks) {
		while (!queue.isEmpty()) {
			final var next = queue.pollFirst();
			if (next == null) {
				continue;
			}
			tasks.add(() -> {
				var current = next;
				var prev = next;
				do {
					prev = current;
					for (var generalization : ruleSet.getGeneralization()) {

						final var rule = generalization.instantiate(current.getTree());
						var result = rule.apply();
						current = add(result);
						if (!current.equals(prev)) {
							rule.annotate(current);
							generalizeEqqMatrix.set(prev, current);
							break;
						}

					}

				} while (!prev.equals(current));
				return null;
			});
		}
	}

	public Set<EggNode> findLeafNodes() {
		return elements.values()
					   .stream()
					   .filter(generalizeEqqMatrix::isLeaf)
					   .collect(Collectors.toUnmodifiableSet());
	}

	public Set<EggNode> findIncomingNode(EggNode node) {
		return generalizeEqqMatrix.findAllIncoming(
			node.id(), lookup.keySet().stream().mapToInt(e -> e)
		).mapToObj(lookup::get).collect(Collectors.toUnmodifiableSet());
	}

	public Optional<EggNode> findOutgoingNode(EggNode node) {
		return generalizeEqqMatrix.findAllOutgoing(node).mapToObj(this::getInternal).findAny();
	}

	static class EqqMatrix {
		public final ArrayList<BitSet> store;
		private final int initialBitSetCapacity;

		public EqqMatrix(int capacity, int initialBitSetCapacity) {
			this.initialBitSetCapacity = initialBitSetCapacity;
			store = new ArrayList<>(capacity);
			for (var i = 0; i < capacity; i++) {
				store.add(new BitSet(this.initialBitSetCapacity));
			}
		}

		public synchronized void add(int id) {
			while (store.size() <= id) {
				store.add(null);
			}
		}

		private synchronized BitSet getOrAdd(int id) {
			add(id);
			var set = store.get(id);
			if (set == null) {
				var newSet = new BitSet(initialBitSetCapacity);
				store.set(id, newSet);
				return newSet;
			} else {
				return set;
			}
		}

		private synchronized boolean contains(EggNode node) {
			return contains(node.id());
		}

		private synchronized boolean contains(int id) {
			return store.size() > id && store.get(id) != null;
		}

		public synchronized boolean isLeaf(EggNode node) {
			if (!contains(node.id())) {
				return true;
			}
			var bitset = store.get(node.id());
			return bitset.isEmpty();
		}

		public synchronized boolean get(EggNode from, EggNode to) {
			if (!contains(from)) {
				return false;
			}
			if (from.id() == to.id()) {
				return true;
			}
			return getOrAdd(from.id()).get(to.id());
		}

		public synchronized IntStream findAllOutgoing(EggNode node) {
			return findAllOutgoing(node.id());
		}

		public synchronized IntStream findAllOutgoing(int node) {
			if (!contains(node)) {
				return IntStream.empty();
			}
			return getOrAdd(node).stream();
		}

		public synchronized IntStream findAllIncoming(int node, IntStream candidates) {
			return candidates.filter(candidate -> {
				if (!contains(candidate)) {
					return false;
				}
				var bitset = store.get(candidate);
				return bitset != null && bitset.get(node);
			});
		}

		public synchronized void set(EggNode from, EggNode to) {
			if (from.id() == to.id()) {
				return;
			}
			getOrAdd(from.id()).set(to.getId(), true);
		}

		public synchronized void set(EggNode from, EggNode to, boolean value) {
			getOrAdd(from.id()).set(to.getId(), value);
		}

	}


}
