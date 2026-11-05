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

import { resolve } from "node:path";

import type { Locator, Page } from "@playwright/test";

import { scrollEditorStage } from "./editor-actions.ts";
import { TEST_APP_DIR } from "./test-app.ts";

export const SCREENSHOT_DIR = process.env.SCREENSHOT_DIR ?? resolve(TEST_APP_DIR, "doc-screenshots");

export const VIEWPORT = { width: 1562, height: 908 };

/*
 * The figures of the whole editor: in the default viewport the Editor Stage cuts the page off on
 * the right and at the bottom, which is what makes them look cramped.
 */
export const EDITOR_STAGE_VIEWPORT = { width: 2100, height: 1500 };

export const DEVICE_SCALE_FACTOR = 2;

const CLIP_PADDING = 8;

type BoundingBox = { x: number; y: number; width: number; height: number };

const SHUTTER = { animations: "disabled", caret: "hide" } as const;

export type Shot = {
	readonly capture: (target: Locator) => Promise<void>;
	/** Crops to the viewport region enclosing all targets. */
	readonly captureRegion: (...targets: Locator[]) => Promise<void>;
	/**
	 * Crops to what the target actually shows: a form panel is as tall as the editor, and the empty
	 * space below the last property is not part of the figure.
	 */
	readonly captureContent: (target: Locator) => Promise<void>;
	/** `captureRegion` with the bottom of `captureContent`: the region a panel fills, cropped to its content. */
	readonly captureRegionContent: (...targets: Locator[]) => Promise<void>;
	/**
	 * Crops the target to what is above `until`, inclusive. For a form whose figure is of one of its
	 * sections: the properties below are part of the form, but not of the figure.
	 */
	readonly captureUntil: (target: Locator, until: Locator) => Promise<void>;
};

const STABLE_BOX_ATTEMPTS = 20;
const STABLE_BOX_INTERVAL = 100;

const stableBoundingBox = async (name: string, target: Locator) => {
	let previous: string | undefined;
	for (let attempt = 0; attempt < STABLE_BOX_ATTEMPTS; attempt++) {
		const box = await target.boundingBox();
		const current = JSON.stringify(box);
		if (box && current === previous) {
			return box;
		}
		previous = current;
		await target.page().waitForTimeout(STABLE_BOX_INTERVAL);
	}
	throw new Error(`Cannot compute the clip for "${name}": the target does not come to rest.`);
};

const clipFor = async (name: string, targets: readonly Locator[]) => {
	const known = [];
	for (const target of targets) {
		known.push(await stableBoundingBox(name, target));
	}
	const left = Math.min(...known.map(box => box.x)) - CLIP_PADDING;
	const top = Math.min(...known.map(box => box.y)) - CLIP_PADDING;
	const right = Math.max(...known.map(box => box.x + box.width)) + CLIP_PADDING;
	const bottom = Math.max(...known.map(box => box.y + box.height)) + CLIP_PADDING;
	return { x: left, y: top, width: right - left, height: bottom - top };
};

const contentBottom = (container: Locator) =>
	container.evaluate(element =>
		Array.from(element.querySelectorAll("*"))
			.filter(child => child.children.length === 0)
			.map(child => child.getBoundingClientRect())
			.filter(rect => rect.width > 0 && rect.height > 0)
			.reduce((lowest, rect) => Math.max(lowest, rect.bottom), 0)
	);

/** The clip of a box, shortened to the content of the element that fills it. */
const contentClip = async (name: string, box: BoundingBox, content: Locator) => {
	const bottom = await contentBottom(content);
	if (bottom <= box.y) {
		throw new Error(`Cannot compute the clip for "${name}": the target shows nothing.`);
	}
	return { ...box, height: Math.min(box.height, bottom - box.y + CLIP_PADDING) };
};

export const shotFor = (page: Page, name: string): Shot => {
	const path = resolve(SCREENSHOT_DIR, `${name}.png`);
	/* The tabs that take the whole editor - General, Schema, Text Styles, Commit changes - have no stage. */
	const stageToTop = async () => {
		if (await page.getByTestId("editor-container").count()) {
			await scrollEditorStage(page, 0);
		}
	};
	/*
	 * The detail form panel is the same panel for every figure of a group, and so is the offset the
	 * figure before left it scrolled to - which for a form cropped to its top decides what is in the
	 * crop. Pinned here rather than per figure, because it holds for all of them.
	 */
	const detailFormToTop = async () => {
		const form = page.getByTestId("detail-form-container").first();
		if (await form.count()) {
			await form.evaluate(container => {
				container.scrollTop = 0;
				container.querySelectorAll("*").forEach(child => (child.scrollTop = 0));
			});
		}
	};
	const settle = async () => {
		await stageToTop();
		await detailFormToTop();
	};
	return {
		capture: async target => {
			await settle();
			await target.screenshot({ ...SHUTTER, path });
		},
		captureRegion: async (...targets) => {
			await settle();
			await page.screenshot({ ...SHUTTER, path, clip: await clipFor(name, targets) });
		},
		captureContent: async target => {
			await settle();
			const box = await stableBoundingBox(name, target);
			await page.screenshot({ ...SHUTTER, path, clip: await contentClip(name, box, target) });
		},
		captureUntil: async (target, until) => {
			await settle();
			const box = await stableBoundingBox(name, target);
			const last = await stableBoundingBox(name, until);
			const height = Math.min(box.height, last.y + last.height - box.y + CLIP_PADDING);
			await page.screenshot({ ...SHUTTER, path, clip: { ...box, height } });
		},
		captureRegionContent: async (...targets) => {
			await settle();
			const region = await clipFor(name, targets);
			const content = await contentClip(name, region, targets[targets.length - 1]);
			await page.screenshot({ ...SHUTTER, path, clip: { ...region, height: content.height } });
		},
	};
};

export const withViewport = async (
	page: Page,
	viewport: { width: number; height: number },
	takeFigure: () => Promise<void>
) => {
	await page.setViewportSize(viewport);
	try {
		await takeFigure();
	} finally {
		await page.setViewportSize(VIEWPORT);
	}
};

export const withViewportHeight = (page: Page, height: number, takeFigure: () => Promise<void>) =>
	withViewport(page, { ...VIEWPORT, height }, takeFigure);

// draws a red rectangle around the target
export const withHighlight = async (page: Page, target: Locator, takeFigure: () => Promise<void>) => {
	const box = await stableBoundingBox("highlight", target);
	const marker = await page.evaluateHandle(({ x, y, width, height }) => {
		const element = document.createElement("div");
		Object.assign(element.style, {
			position: "fixed",
			left: `${Math.round(x) - 6}px`,
			top: `${Math.round(y) - 6}px`,
			width: `${Math.round(width) + 6}px`,
			height: `${Math.round(height) + 6}px`,
			border: "3px solid #e60000",
			borderRadius: "2px",
			pointerEvents: "none",
			zIndex: "2147483647",
		});
		document.body.appendChild(element);
		return element;
	}, box);
	try {
		await takeFigure();
	} finally {
		await marker.evaluate(element => element.remove());
		await marker.dispose();
	}
};

export const blurFocus = (page: Page) => page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
