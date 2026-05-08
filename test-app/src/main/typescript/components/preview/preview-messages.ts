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
export const RESOURCE_KEYS = {
	button: {
		print: "Print",
		copy: "Copy",
		clear: "Clear",
		editModelName: "Edit model name",
		setting: "Setting",
		reload: "Reload",
	},
	errors: {
		preview: {
			printModelNotLoaded: "The print model could not be loaded",
			previewNotGenerated: "The preview could not be generated",
			missingCommitReference:
				"The pending changes contain a new model reference. Please commit the changes and reopen the preview",
			invalidPrintModel: "The preview could not be generated because of an invalid print model",
			noTestDocument: "There are no test documents for the referenced data model",
		},
	},
	preview: {
		previewOptionLabel: "Using Print model with pending changes",
		timeZoneLabel: "Time zone",
		docmentLabel: "Document",
		localizationLabel: "Localization",
		requiredTimeZoneError: "Please select a time zone for printing the preview",
		defaultTimeZoneGroup: "Default Time Zone",
		otherTimeZoneGroup: "Other Time Zones",
		printingTime: "Printing Time",
	},
};
