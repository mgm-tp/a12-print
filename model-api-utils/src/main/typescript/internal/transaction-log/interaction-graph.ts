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
import {
	DirectedSparseLabeledGraph,
	IVertexOf,
} from "@com.mgmtp.a12.utils/utils-collections/lib/graph/DirectedSparseLabeledGraph.js";
import { PrintModel } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import {
	PRINT_MODEL_CONTENT_GENERAL_LOG_ID,
	PRINT_MODEL_HEADER_LOG_ID,
} from "@com.mgmtp.a12.print/print-model-api/lib/model/constant.js";

import {
	AnyObject,
	PartialTransactionLogPersistentEntry,
	TransactionLogEntryCommand,
	TransactionLogEntryValue,
	TransactionLogPersistentEntry,
} from "./transaction-log.js";

/**
 * List of reserved labels (predicates):
 * requires, isRequiredBy, overwrites, isOverwrittenBy represent simple interaction relations.
 * originalPush, isPushOf, isPopOf, valuePush, moves represent array relations
 * source is for the initial creation of the interaction graph
 */
export enum IGLabels {
	requires = "__requires",
	isRequiredBy = "__isRequiredBy",
	overwrites = "__overwrites",
	isOverwrittenBy = "__isOverwrittenBy",
	originalPush = "__originalPush",
	isPushOf = "__isPushOf",
	isPopOf = "__isPopOf",
	valuePush = "__valuePush",
	moves = "__moves",
	source = "__source",
	undo = "__undo",
}

/**
 * An implementation of a string based triple graph using the DirectedSparseLabeledGraph from A12 utils-collections.
 * The interaction graph is the key for resolving interaction dependencies for the commit view.
 */
export class InteractionGraph {
	protected graph: DirectedSparseLabeledGraph;
	protected sourceCounter: number;

	static createEmpty(): InteractionGraph {
		return new InteractionGraph();
	}

	static createFromPrintModel(printModel: PrintModel): InteractionGraph {
		return new InteractionGraph(printModel);
	}

	protected constructor(printModel?: PrintModel) {
		this.graph = DirectedSparseLabeledGraph.createDefault("InteractionGraph");
		this.sourceCounter = 0;
		if (printModel) {
			this.initializeFromPrintModel(printModel);
		}
	}

	protected initializeFromPrintModel(printModel: PrintModel): void {
		const { content, header } = printModel;
		this.turnTransactionLogObjectToGraph(header, PRINT_MODEL_HEADER_LOG_ID);
		this.turnTransactionLogObjectToGraph(content.general, PRINT_MODEL_CONTENT_GENERAL_LOG_ID);
		content.segments.definitions.forEach(el => this.turnTransactionLogObjectToGraph(el, el.id));
		content.sections?.definitions.forEach(el => this.turnTransactionLogObjectToGraph(el, el.id));
		content.textStyles?.definitions.forEach(el => this.turnTransactionLogObjectToGraph(el, el.id));
		content.elementDefinitions.forEach(el => this.turnTransactionLogObjectToGraph(el, el.id));
	}

	/**
	 * This should only be used for initialization from the print model. For updating the graph use {@link addTransactions}
	 */
	protected turnTransactionLogObjectToGraph(obj: object, parentId: string): void {
		const parentIdNode = this.graph.add(parentId);
		const iidNode = this.graph.add(`${IGLabels.source}_${this.sourceCounter++}`);
		for (const [propertyKey, value] of Object.entries(obj)) {
			const propertyKeyNode = this.graph.add(propertyKey);
			this.graph.connect(propertyKeyNode, iidNode, parentIdNode);
			if (!this.graph.hasConnected(this.graph.add(IGLabels.requires), iidNode, parentIdNode)) {
				this.graph.connect(this.graph.add(IGLabels.requires), iidNode, parentIdNode);
			}
			this.graph.findAllSubject(this.graph.add(IGLabels.isRequiredBy), undefined, parentIdNode).forEach(e => {
				this.graph.findAllObject(this.graph.add(IGLabels.requires), e, undefined).forEach(j => {
					if (!this.graph.hasConnected(this.graph.add(IGLabels.requires), iidNode, j)) {
						this.graph.connect(this.graph.add(IGLabels.requires), iidNode, j);
					}
				});
			});
			if (typeof value === "object" && value !== null) {
				this.addTransactionLogObjectToGraph(value, iidNode);
				continue;
			}
			if (propertyKey === "refId") {
				const valueNode = this.graph.add(value);
				if (!this.graph.hasConnected(this.graph.add(IGLabels.isRequiredBy), iidNode, valueNode)) {
					this.graph.connect(this.graph.add(IGLabels.isRequiredBy), iidNode, valueNode);
				}
				this.graph.findAllObject(this.graph.add(IGLabels.requires), iidNode, undefined).forEach(e => {
					this.graph.findAllSubject(this.graph.add(IGLabels.isRequiredBy), undefined, e).forEach(j => {
						if (!this.graph.hasConnected(this.graph.add(IGLabels.isRequiredBy), j, valueNode)) {
							this.graph.connect(this.graph.add(IGLabels.isRequiredBy), j, valueNode);
						}
					});
				});
			}
		}
	}

	private addTransactionLogObjectToGraph(value: AnyObject, iidNode: IVertexOf<string>): void {
		let newObjects = [value];
		if (Array.isArray(value)) {
			if (value.length === 0) {
				return;
			}
			if (value.every(el => typeof el === "string")) {
				value.forEach((el, i) => {
					const arrIidNode = i === 0 ? iidNode : this.graph.add(`${IGLabels.source}_${this.sourceCounter++}`);
					const valueIdNode = this.graph.add(el);
					this.graph.connect(this.graph.add(IGLabels.valuePush), arrIidNode, valueIdNode);
					this.graph.connect(this.graph.add(IGLabels.isRequiredBy), arrIidNode, valueIdNode);
				});
				return;
			}
			newObjects = value;
		}
		newObjects.forEach((el, i) => {
			const objectIdNode = this.graph.add(el.id);
			const arrIidNode = i === 0 ? iidNode : this.graph.add(`${IGLabels.source}_${this.sourceCounter++}`);
			if (!this.graph.hasConnected(this.graph.add(IGLabels.isRequiredBy), arrIidNode, objectIdNode)) {
				this.graph.connect(this.graph.add(IGLabels.isRequiredBy), arrIidNode, objectIdNode);
			}
			this.graph.connect(this.graph.add(IGLabels.originalPush), arrIidNode, objectIdNode);
			this.graph.findAllObject(this.graph.add(IGLabels.requires), arrIidNode, undefined).forEach(e => {
				this.graph.findAllSubject(this.graph.add(IGLabels.isRequiredBy), undefined, e).forEach(j => {
					if (!this.graph.hasConnected(this.graph.add(IGLabels.isRequiredBy), j, objectIdNode)) {
						this.graph.connect(this.graph.add(IGLabels.isRequiredBy), j, objectIdNode);
					}
				});
			});
			this.turnTransactionLogObjectToGraph(el, el.id);
		});
	}

	resetToEmpty(): void {
		this.graph = DirectedSparseLabeledGraph.createDefault("InteractionGraph");
		this.sourceCounter = 0;
	}

	resetToPrintModel(printModel: PrintModel): void {
		this.resetToEmpty();
		this.initializeFromPrintModel(printModel);
	}

	/**
	 * This should be used during runtime to update the graph. This needs to be linked to transaction log updates to keep
	 * the graph up to date.
	 */
	addTransactions(transactions: PartialTransactionLogPersistentEntry[]): void {
		for (const entry of transactions) {
			if (entry.command === "UNDO") {
				this.handleUndoLog(entry);
				continue;
			}
			const iidNode = this.graph.add(entry.interactionId);
			if (!TransactionLogPersistentEntry.isTransactionLogEntry(entry)) {
				this.handleEmptyLog(iidNode, entry);
				continue;
			}
			const { parentId, propertyKey, objectId, value, command } = entry;

			const parentIdNode = this.graph.add(parentId);
			const propertyKeyNode = this.graph.add(propertyKey);

			if (!this.graph.hasConnected(propertyKeyNode, iidNode, parentIdNode)) {
				this.graph.connect(propertyKeyNode, iidNode, parentIdNode);
			}

			if (!this.graph.hasConnected(this.graph.add(IGLabels.requires), iidNode, parentIdNode)) {
				this.graph.connect(this.graph.add(IGLabels.requires), iidNode, parentIdNode);
			}
			this.graph.findAllSubject(this.graph.add(IGLabels.isRequiredBy), undefined, parentIdNode).forEach(e => {
				this.graph.findAllObject(this.graph.add(IGLabels.requires), e, undefined).forEach(j => {
					if (!this.graph.hasConnected(this.graph.add(IGLabels.requires), iidNode, j)) {
						this.graph.connect(this.graph.add(IGLabels.requires), iidNode, j);
					}
				});
			});
			if (objectId) {
				this.handleEntryWithObjectId(iidNode, objectId, command);
			} else {
				this.handleEntryWithoutObjectId(iidNode, value, command, propertyKey);
			}

			if (command === "SET" || command === "REMOVE") {
				this.handleSetOverwrites(propertyKeyNode, parentIdNode, iidNode);
			}
		}
	}

	protected handleUndoLog(entry: PartialTransactionLogPersistentEntry) {
		const iidNode = this.graph.add(entry.interactionId);
		const valueNode = this.graph.add(String(entry.value));

		if (!this.graph.hasConnected(this.graph.add(IGLabels.undo), iidNode, valueNode)) {
			this.graph.connect(this.graph.add(IGLabels.undo), iidNode, valueNode);
		}

		this.graph.findAllObject(this.graph.add(IGLabels.isRequiredBy), valueNode, undefined).forEach(e => {
			this.graph.findAllSubject(this.graph.add(IGLabels.requires), undefined, e).forEach(j => {
				if (!this.graph.hasConnected(this.graph.add(IGLabels.undo), iidNode, j)) {
					this.graph.connect(this.graph.add(IGLabels.undo), iidNode, j);
				}
			});
		});
	}

	protected handleEmptyLog(iidNode: IVertexOf<string>, entry: PartialTransactionLogPersistentEntry) {
		const valueNode = this.graph.add(entry.id);
		if (!this.graph.hasConnected(this.graph.add(IGLabels.isRequiredBy), iidNode, valueNode)) {
			this.graph.connect(this.graph.add(IGLabels.isRequiredBy), iidNode, valueNode);
			this.graph.findAllObject(this.graph.add(IGLabels.requires), iidNode, undefined).forEach(e => {
				this.graph.findAllSubject(this.graph.add(IGLabels.isRequiredBy), undefined, e).forEach(j => {
					if (!this.graph.hasConnected(this.graph.add(IGLabels.isRequiredBy), j, valueNode)) {
						this.graph.connect(this.graph.add(IGLabels.isRequiredBy), j, valueNode);
					}
				});
			});
		}
	}

	protected handleEntryWithObjectId(
		iidNode: IVertexOf<string>,
		objectId: string,
		command: TransactionLogEntryCommand
	) {
		const objectIdNode = this.graph.add(objectId);
		if (command !== "POP" && command !== "MOVE") {
			if (!this.graph.hasConnected(this.graph.add(IGLabels.isRequiredBy), iidNode, objectIdNode)) {
				this.graph.connect(this.graph.add(IGLabels.isRequiredBy), iidNode, objectIdNode);
			}
			if (
				command === "PUSH" &&
				!this.graph.hasConnected(this.graph.add(IGLabels.originalPush), iidNode, objectIdNode)
			) {
				this.graph.connect(this.graph.add(IGLabels.originalPush), iidNode, objectIdNode);
			}
			this.graph.findAllObject(this.graph.add(IGLabels.requires), iidNode, undefined).forEach(e => {
				this.graph.findAllSubject(this.graph.add(IGLabels.isRequiredBy), undefined, e).forEach(j => {
					if (!this.graph.hasConnected(this.graph.add(IGLabels.isRequiredBy), j, objectIdNode)) {
						this.graph.connect(this.graph.add(IGLabels.isRequiredBy), j, objectIdNode);
					}
				});
			});
		} else if (command === "POP") {
			this.graph
				.findAllSubject(this.graph.add(IGLabels.isRequiredBy), undefined, objectIdNode)
				.filter(e => this.graph.hasConnected(this.graph.add(IGLabels.originalPush), e, objectIdNode))
				.forEach(e => {
					if (!this.graph.hasConnected(this.graph.add(IGLabels.isPushOf), e, iidNode)) {
						this.graph.connect(this.graph.add(IGLabels.isPushOf), e, iidNode);
						this.graph.connect(this.graph.add(IGLabels.isPopOf), iidNode, e);
					}
					this.graph.findAllObject(this.graph.add(IGLabels.isRequiredBy), e, undefined).forEach(j => {
						this.graph.findAllSubject(this.graph.add(IGLabels.requires), undefined, j).forEach(k => {
							if (!this.graph.hasConnected(this.graph.add(IGLabels.isPopOf), iidNode, k)) {
								this.graph.connect(this.graph.add(IGLabels.isPopOf), iidNode, k);
							}
						});
					});
					this.graph.findAllObject(this.graph.add(IGLabels.isPushOf), e, undefined).forEach(j => {
						if (j !== iidNode && !this.graph.hasConnected(this.graph.add(IGLabels.isPopOf), iidNode, j)) {
							this.graph.connect(this.graph.add(IGLabels.isPopOf), iidNode, j);
						}
					});
				});
		} else {
			const objectPush = this.graph
				.findAllSubject(this.graph.add(IGLabels.isRequiredBy), undefined, objectIdNode)
				.filter(e => this.graph.hasConnected(this.graph.add(IGLabels.originalPush), e, objectIdNode));
			const valuePush = this.graph.findAllSubject(this.graph.add(IGLabels.valuePush), undefined, objectIdNode);
			const pushNode = objectPush[0] || valuePush[0];
			if (pushNode && !this.graph.hasConnected(this.graph.add(IGLabels.isPushOf), pushNode, iidNode)) {
				this.graph.connect(this.graph.add(IGLabels.isPushOf), pushNode, iidNode);
			}

			if (!this.graph.hasConnected(this.graph.add(IGLabels.moves), iidNode, objectIdNode)) {
				this.graph.connect(this.graph.add(IGLabels.moves), iidNode, objectIdNode);
			}
			this.graph.findAllSubject(this.graph.add(IGLabels.moves), undefined, objectIdNode).forEach(e => {
				if (e === iidNode) {
					return;
				}
				if (!this.graph.hasConnected(this.graph.add(IGLabels.overwrites), iidNode, e)) {
					this.graph.connect(this.graph.add(IGLabels.overwrites), iidNode, e);
					this.graph.connect(this.graph.add(IGLabels.isOverwrittenBy), e, iidNode);
					this.graph.findAllObject(this.graph.add(IGLabels.overwrites), e, undefined).forEach(j => {
						if (!this.graph.hasConnected(this.graph.add(IGLabels.overwrites), iidNode, j)) {
							this.graph.connect(this.graph.add(IGLabels.overwrites), iidNode, j);
							this.graph.connect(this.graph.add(IGLabels.isOverwrittenBy), j, iidNode);
						}
					});
				}
			});
		}
	}

	protected handleEntryWithoutObjectId(
		iidNode: IVertexOf<string>,
		value: TransactionLogEntryValue,
		command: TransactionLogEntryCommand,
		propertyKey: string
	) {
		if (typeof value !== "string") {
			return;
		}
		if (command === "PUSH") {
			const valueIdNode = this.graph.add(value);
			if (!this.graph.hasConnected(this.graph.add(IGLabels.valuePush), iidNode, valueIdNode)) {
				this.graph.connect(this.graph.add(IGLabels.valuePush), iidNode, valueIdNode);
				this.graph.connect(this.graph.add(IGLabels.isRequiredBy), iidNode, valueIdNode);
			}
		} else if (command === "POP") {
			this.graph
				.findAllSubject(this.graph.add(IGLabels.valuePush), undefined, this.graph.add(value))
				.forEach(e => {
					if (!this.graph.hasConnected(this.graph.add(IGLabels.isPushOf), e, iidNode)) {
						this.graph.connect(this.graph.add(IGLabels.isPushOf), e, iidNode);
						this.graph.connect(this.graph.add(IGLabels.isPopOf), iidNode, e);
					}
					this.graph.findAllObject(this.graph.add(IGLabels.isRequiredBy), e, undefined).forEach(j => {
						this.graph.findAllSubject(this.graph.add(IGLabels.requires), undefined, j).forEach(k => {
							if (!this.graph.hasConnected(this.graph.add(IGLabels.isPopOf), iidNode, k)) {
								this.graph.connect(this.graph.add(IGLabels.isPopOf), iidNode, k);
							}
						});
					});
					this.graph.findAllObject(this.graph.add(IGLabels.isPushOf), e, undefined).forEach(j => {
						if (j !== iidNode && !this.graph.hasConnected(this.graph.add(IGLabels.isPopOf), iidNode, j)) {
							this.graph.connect(this.graph.add(IGLabels.isPopOf), iidNode, j);
						}
					});
				});
		} else if (propertyKey === "refId") {
			const valueNode = this.graph.add(value);
			if (!this.graph.hasConnected(this.graph.add(IGLabels.isRequiredBy), iidNode, valueNode)) {
				this.graph.connect(this.graph.add(IGLabels.isRequiredBy), iidNode, valueNode);
				this.graph.findAllObject(this.graph.add(IGLabels.requires), iidNode, undefined).forEach(e => {
					this.graph.findAllSubject(this.graph.add(IGLabels.isRequiredBy), undefined, e).forEach(j => {
						if (!this.graph.hasConnected(this.graph.add(IGLabels.isRequiredBy), j, valueNode)) {
							this.graph.connect(this.graph.add(IGLabels.isRequiredBy), j, valueNode);
						}
					});
				});
			}
		}
	}

	protected handleSetOverwrites(
		propertyKeyNode: IVertexOf<string>,
		parentIdNode: IVertexOf<string>,
		iidNode: IVertexOf<string>
	) {
		this.graph.findAllSubject(propertyKeyNode, undefined, parentIdNode).forEach(e => {
			if (e === iidNode) {
				return;
			}
			if (!this.graph.hasConnected(this.graph.add(IGLabels.overwrites), iidNode, e)) {
				this.graph.connect(this.graph.add(IGLabels.overwrites), iidNode, e);
				this.graph.connect(this.graph.add(IGLabels.isOverwrittenBy), e, iidNode);
				this.graph.findAllObject(this.graph.add(IGLabels.overwrites), e, undefined).forEach(j => {
					if (!this.graph.hasConnected(this.graph.add(IGLabels.overwrites), iidNode, j)) {
						this.graph.connect(this.graph.add(IGLabels.overwrites), iidNode, j);
						this.graph.connect(this.graph.add(IGLabels.isOverwrittenBy), j, iidNode);
					}
				});
			}
		});
	}

	/**
	 * Returns a list of interaction ids that are dependent on the given interaction.
	 */
	getCommitToPendingDependencies(iid: string): Set<string> {
		const iidNode = this.graph.add(iid);
		const dependentIids = new Set<string>();
		this.graph.findAllObject(this.graph.add(IGLabels.isRequiredBy), iidNode, undefined).forEach(e => {
			this.graph.findAllSubject(this.graph.add(IGLabels.requires), undefined, e).forEach(j => {
				const symbol = this.graph.symbolOf(j);
				if (symbol) {
					dependentIids.add(symbol);
				}
			});
		});
		this.graph.findAllObject(this.graph.add(IGLabels.isOverwrittenBy), iidNode, undefined).forEach(e => {
			const symbol = this.graph.symbolOf(e);
			if (symbol) {
				dependentIids.add(symbol);
			}
		});
		this.graph.findAllObject(this.graph.add(IGLabels.isPushOf), iidNode, undefined).forEach(e => {
			const symbol = this.graph.symbolOf(e);
			if (symbol) {
				dependentIids.add(symbol);
			}
		});
		this.graph.findAllSubject(this.graph.add(IGLabels.isPopOf), undefined, iidNode).forEach(e => {
			const symbol = this.graph.symbolOf(e);
			if (symbol) {
				dependentIids.add(symbol);
			}
		});
		return dependentIids;
	}

	/**
	 * Returns a list of interaction ids that the provided interaction is dependent on.
	 */
	getPendingToCommitDependencies(iid: string): Set<string> {
		const iidNode = this.graph.add(iid);
		const dependentIids = new Set<string>();
		this.graph.findAllObject(this.graph.add(IGLabels.requires), iidNode, undefined).forEach(e => {
			this.graph.findAllSubject(this.graph.add(IGLabels.isRequiredBy), undefined, e).forEach(j => {
				const symbol = this.graph.symbolOf(j);
				if (symbol) {
					dependentIids.add(symbol);
				}
			});
		});
		this.graph.findAllObject(this.graph.add(IGLabels.overwrites), iidNode, undefined).forEach(e => {
			const symbol = this.graph.symbolOf(e);
			if (symbol) {
				dependentIids.add(symbol);
			}
		});
		this.graph.findAllSubject(this.graph.add(IGLabels.isPushOf), undefined, iidNode).forEach(e => {
			const pushSymbol = this.graph.symbolOf(e);
			if (pushSymbol) {
				dependentIids.add(pushSymbol);
			}
		});
		this.graph.findAllObject(this.graph.add(IGLabels.isPopOf), iidNode, undefined).forEach(e => {
			const symbol = this.graph.symbolOf(e);
			if (symbol) {
				dependentIids.add(symbol);
			}
		});
		return dependentIids;
	}

	/**
	 * Returns list of interactions that would be affected by the undo of the provided interaction.
	 */
	getUndoDependencies(iid: string): Set<string> {
		const dependentIids = new Set<string>();

		this.graph.findAllObject(this.graph.add(IGLabels.undo), this.graph.add(iid), undefined).forEach(e => {
			const symbol = this.graph.symbolOf(e);
			if (symbol) {
				dependentIids.add(symbol);
			}
		});

		return dependentIids;
	}

	has(symbol: string): boolean {
		return this.graph.has(symbol);
	}

	hasConnected(label: string, subject: string, object: string): boolean {
		if (!this.graph.has(label) || !this.graph.has(subject) || !this.graph.has(object)) {
			return false;
		}
		return this.graph.hasConnected(this.graph.add(label), this.graph.add(subject), this.graph.add(object));
	}
}
