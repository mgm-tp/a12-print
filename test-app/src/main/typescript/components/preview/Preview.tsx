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
import { useDispatch, useSelector } from "react-redux";
import { useParams, useSearchParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";

import {
	GlobalMessageBox,
	Switch,
	Tag,
	addPrefix,
	Button,
	Icon,
	ContentBoxElements,
	Select,
	Autocomplete,
	type DropDownItem,
	ProgressIndicator,
} from "@com.mgmtp.a12.widgets/widgets-core";
import type { Model } from "@com.mgmtp.a12.base/base-model-api";

import { PreviewActions, PreviewSelectors } from "../../store/preview";
import { Locale } from "../../types";

import { useCaseConfigFromParams } from "../case-config/use-case-config-from-params";

import {
	filterDropDownItemRecursively,
	formatTimeZoneLabel,
	getAllTimeZones,
	getDefaultTimeZone,
	getTimeZoneOption,
} from "./preview-utils";
import { StyledIFrame, StyledPreviewContainer } from "./Preview.styled";
import { RESOURCE_KEYS } from "./preview-messages";

const { ActionBarGroupArea, ActionBarGroup, ActionBarGroupDivider } = ContentBoxElements;

export const PENDING_CHANGES_KEY = "pending-changes";
export const LOCALE_KEY = "locale";
export const TIME_ZONE_KEY = "timezone";
export const DOCUMENT_KEY = "document";

const DEFAULT_TIME_ZONE = getDefaultTimeZone();

const getLocaleOptions = (documentModel: Model | undefined) => {
	const options =
		documentModel?.header?.locales?.map(locale => ({
			value: locale.code,
			label: locale.code,
		})) || [];

	return options?.sort((a, b) => a.label.localeCompare(b.label));
};

const getDocumentOptions = (documentNames: string[] | undefined) => {
	const options =
		documentNames?.map(name => ({
			value: name,
			label: name,
		})) || [];

	return options?.sort((a, b) => a.label.localeCompare(b.label));
};

const getReferencedDocumentModel = (documentModels: Model[] | undefined, printModel: Model | undefined) => {
	for (const documentModel of documentModels || []) {
		const documentModelReference = printModel?.header.modelReferences?.find(
			ref => ref.reference === documentModel.header.id
		);
		if (documentModelReference) {
			return documentModel;
		}
	}
	return undefined;
};

export const Preview = () => {
	const { caseResource } = useCaseConfigFromParams();
	const documentModel = getReferencedDocumentModel(caseResource?.documentModels, caseResource?.printModel);

	const dispatch = useDispatch();
	const previewError = useSelector(PreviewSelectors.previewError);
	const isLoading = useSelector(PreviewSelectors.isPreviewLoading);
	const previewData = useSelector(PreviewSelectors.previewData);
	const [searchTimeZone, setSearchTimeZone] = useState("");

	const [searchParams, setSearchParams] = useSearchParams();
	const isPendingChanges = Boolean(searchParams.get(PENDING_CHANGES_KEY));
	const localeOptions = getLocaleOptions(documentModel);
	const documentOptions = getDocumentOptions(caseResource?.documentNames);
	const printModelId = caseResource?.printModel.header.id;

	const defaultPrintingLocale = localeOptions?.[0]?.value || Locale.DE;
	const currentPrintingLocale = searchParams.get(LOCALE_KEY) || defaultPrintingLocale;
	const currentPrintingTimezone = searchParams.get(TIME_ZONE_KEY) || DEFAULT_TIME_ZONE.name;
	const currentPrintingDocument = searchParams.get(DOCUMENT_KEY) || caseResource?.documentNames?.[0];

	const { caseId } = useParams<{ caseId: string; documentId: string }>();

	useEffect(() => {
		if (printModelId && caseId && currentPrintingLocale && currentPrintingTimezone) {
			dispatch(
				PreviewActions.generatePreview({
					documentModel,
					caseId,
					printModelId,
					documentName: currentPrintingDocument,
					isPendingChanges,
					locale: currentPrintingLocale,
					timeZone: currentPrintingTimezone,
				})
			);
		}
	}, [
		dispatch,
		documentModel,
		printModelId,
		currentPrintingDocument,
		isPendingChanges,
		currentPrintingLocale,
		currentPrintingTimezone,
		caseId,
	]);

	const onChange = () => {
		if (isPendingChanges) {
			searchParams.delete(PENDING_CHANGES_KEY);
		} else {
			searchParams.set(PENDING_CHANGES_KEY, "true");
		}
		setSearchParams(searchParams);
	};

	const onLocaleChange = (newLocale: string) => {
		searchParams.set(LOCALE_KEY, newLocale);
		setSearchParams(searchParams);
	};

	const onDocumentChange = (newDocument: string) => {
		searchParams.set(DOCUMENT_KEY, newDocument);
		setSearchParams(searchParams);
	};

	const onTimezoneChange = (timezone: DropDownItem) => {
		if (timezone.value) {
			searchParams.set(TIME_ZONE_KEY, timezone.value);
		} else {
			searchParams.delete(TIME_ZONE_KEY);
		}
		setSearchParams(searchParams);
	};

	const blob = previewData?.blob;
	const blobData = useMemo(() => {
		return blob ? URL.createObjectURL(blob) : undefined;
	}, [blob]);

	const timeZoneOptions: DropDownItem[] = useMemo(() => {
		const defaultItem: DropDownItem = {
			label: RESOURCE_KEYS.preview.defaultTimeZoneGroup,
			children: [
				{
					label: formatTimeZoneLabel(DEFAULT_TIME_ZONE.formattedOffset, DEFAULT_TIME_ZONE.name),
					value: DEFAULT_TIME_ZONE.name,
				},
			],
		};

		const otherItems: DropDownItem[] = [];

		getAllTimeZones().forEach(({ formattedOffset, name }) => {
			const timeZone = formatTimeZoneLabel(formattedOffset, name);
			if (name === DEFAULT_TIME_ZONE.name) {
				return;
			}
			otherItems.push({
				label: timeZone,
				value: name,
			});
		});

		const items: DropDownItem[] = [
			defaultItem,
			{
				label: RESOURCE_KEYS.preview.otherTimeZoneGroup,
				children: otherItems,
			},
		];

		return items;
	}, []);

	const filterItems = useCallback((itemsToBeFiltered: DropDownItem[], filterText: string): DropDownItem[] => {
		if (filterText.trim() !== "") {
			return filterDropDownItemRecursively(filterText.toLocaleLowerCase(), itemsToBeFiltered);
		}

		return itemsToBeFiltered;
	}, []);

	const handleSearch = useCallback(
		(value: string) => {
			setSearchTimeZone(currentPrintingTimezone && value.endsWith(currentPrintingTimezone) ? "" : value);
		},
		[setSearchTimeZone, currentPrintingTimezone]
	);

	const filteredTimeZoneOptions = useMemo(() => {
		return filterItems(timeZoneOptions, searchTimeZone);
	}, [filterItems, searchTimeZone, timeZoneOptions]);

	const currentTimeZoneOption = useMemo(() => {
		return currentPrintingTimezone ? getTimeZoneOption(currentPrintingTimezone) : undefined;
	}, [currentPrintingTimezone]);

	const requiredTimeZoneError = !currentPrintingTimezone ? RESOURCE_KEYS.preview.requiredTimeZoneError : undefined;
	const errorMessage = previewError || requiredTimeZoneError;

	return (
		<StyledPreviewContainer>
			<ActionBarGroupArea
				leftSlot={[
					<ActionBarGroup key="preview-toolbar" role="toolbar" className={addPrefix("-u-padding-y-md")}>
						<strong className="-u-hidden">{RESOURCE_KEYS.preview.previewOptionLabel}: </strong>
						<Switch
							id="model-mode-switch"
							className={addPrefix("-u-inline-block", "-u-width-auto", "-u-hidden")}
							checked={isPendingChanges}
							onChange={onChange}
						/>
						<ActionBarGroupDivider className={addPrefix("-u-height-6", "-u-hidden")} />
						<strong>{RESOURCE_KEYS.preview.localizationLabel}: </strong>
						<Select
							className={addPrefix("-u-width-24")}
							items={localeOptions}
							onValueChanged={onLocaleChange}
							value={currentPrintingLocale || undefined}
						/>
						<ActionBarGroupDivider className={addPrefix("-u-height-6")} />
						<strong>{RESOURCE_KEYS.preview.docmentLabel}: </strong>
						<Select
							className={addPrefix("-u-width-24")}
							items={documentOptions}
							onValueChanged={onDocumentChange}
							value={currentPrintingDocument || undefined}
						/>
						<ActionBarGroupDivider className={addPrefix("-u-height-6")} />
						<strong>{RESOURCE_KEYS.preview.timeZoneLabel}: </strong>
						<Autocomplete
							hintTemplate=""
							className={addPrefix("-u-width-64")}
							items={filteredTimeZoneOptions || []}
							onValueChange={onTimezoneChange}
							value={currentTimeZoneOption}
							error={!currentPrintingTimezone}
							onSearch={handleSearch}
						/>
						<span>{currentTimeZoneOption?.value}</span>
						<ActionBarGroupDivider className={addPrefix("-u-height-6")} />
						<strong>{RESOURCE_KEYS.preview.printingTime}: </strong>
						<Tag>{previewData?.timeStamp.toLocaleString()}</Tag>
						<Button
							disabled={!currentPrintingTimezone}
							primary
							icon={<Icon>refresh</Icon>}
							label={RESOURCE_KEYS.button.reload}
							onClick={() => {
								if (printModelId && caseId && currentPrintingLocale && currentPrintingTimezone) {
									dispatch(
										PreviewActions.generatePreview({
											documentModel,
											caseId,
											printModelId,
											documentName: currentPrintingDocument,
											isPendingChanges,
											locale: currentPrintingLocale,
											timeZone: currentPrintingTimezone,
										})
									);
								}
							}}
						/>
					</ActionBarGroup>,
				]}
			></ActionBarGroupArea>
			{isLoading ? (
				<FullSizeProgressIndicatorContainer>
					<ProgressIndicator />
				</FullSizeProgressIndicatorContainer>
			) : (
				<>
					{errorMessage && <GlobalMessageBox variant="error" content={errorMessage} focusOnMount={true} />}
					{!errorMessage && blobData && <StyledIFrame src={blobData} />}
				</>
			)}
		</StyledPreviewContainer>
	);
};

const FullSizeProgressIndicatorContainer = styled.div`
	width: 100%;
	height: 100%;
	position: absolute;
	z-index: 1;
`;
