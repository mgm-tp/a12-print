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
import * as React from "react";
import { useDrag, useDrop } from "react-dnd";
import { DefaultTheme, useTheme } from "styled-components";

import { Icon } from "@com.mgmtp.a12.widgets/widgets-core/lib/icon/index.js";
import { PopUpMenu } from "@com.mgmtp.a12.widgets/widgets-core/lib/pop-up-menu/index.js";

interface Item {
	id: string;
	originalIndex: number;
}

interface CardProps {
	id: string;
	findCard: (id: string) => { index: number } | undefined;
	moveCard: (id: string, to: number) => void;
	children?: React.ReactNode;
	theme: DefaultTheme;
}

const cardStyle: (theme: DefaultTheme) => React.CSSProperties = (theme: DefaultTheme) => {
	const cardStyle: React.CSSProperties = {
		borderBottom: `1px solid ${theme.colors.divider.colorLight}`,
		padding: "10px 12px",
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		cursor: "pointer",
	};
	return cardStyle;
};

const Card: React.FunctionComponent<CardProps> = ({ id, findCard, moveCard, children, theme }) => {
	const originalIndex = findCard(id)?.index ?? 0;
	const [{ isDragging }, drag] = useDrag(
		() => ({
			type: "TextStyleCard",
			item: { id, originalIndex },
			collect: monitor => ({ isDragging: monitor.isDragging() }),
			end: (item, monitor) => {
				const { id: droppedId, originalIndex } = item;
				const didDrop = monitor.didDrop();
				if (!didDrop) {
					moveCard(droppedId, originalIndex);
				}
			},
		}),
		[id, originalIndex, moveCard]
	);

	const [, drop] = useDrop(
		() => ({
			accept: "TextStyleCard",
			hover({ id: draggedId }: Item) {
				if (draggedId !== id) {
					const selCard = findCard(id);
					if (selCard) {
						moveCard(draggedId, selCard.index);
					}
				}
			},
		}),
		[findCard, moveCard]
	);

	return (
		<div
			ref={node => {
				drag(drop(node));
			}}
			style={{ ...cardStyle(theme), opacity: isDragging ? 0 : 1 }}
		>
			<span>{children}</span>
			<div style={{ display: "flex", alignItems: "center" }}>
				<Icon size="big" style={{ cursor: "grab", color: "rgb(161, 161, 161)" }}>
					drag_handle
				</Icon>
				<PopUpMenu></PopUpMenu>
			</div>
		</div>
	);
};

const ITEMS = [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" }, { id: "6" }, { id: "7" }];

export const DragList = () => {
	const [cards, setCards] = React.useState(ITEMS);
	const [, drop] = useDrop(() => ({ accept: "TextStyleCard" }));
	const theme = useTheme();

	const findCard = React.useCallback(
		(id: string) => {
			const card = cards.find(el => el.id === id);
			return card ? { card, index: cards.indexOf(card) } : undefined;
		},
		[cards]
	);

	const moveCard = React.useCallback(
		(id: string, atIndex: number) => {
			const card = findCard(id);
			if (card) {
				setCards(prevCards => {
					const newCards = [...prevCards];
					newCards.splice(card.index, 1);
					newCards.splice(atIndex, 0, card.card);
					return newCards;
				});
			}
		},
		[findCard, setCards]
	);

	return (
		<div
			ref={ref => {
				drop(ref);
			}}
			style={{
				overflowY: "auto",
				maxHeight: 190,
			}}
		>
			{cards.map(item => (
				<Card key={item.id} id={item.id} findCard={findCard} moveCard={moveCard} theme={theme}>
					{item.id}
				</Card>
			))}
		</div>
	);
};
