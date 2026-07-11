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
// tag::StaticImageProvider[]
/*
 * StaticImageProvider defines the interface for managing static images for Print Model Editor.
 *
 * listStaticImages: Returns a list of static image names available in the system.
 * loadStaticImage: Given a image name, returns the corresponding StaticImageData if it exists.
 * uploadStaticImage: Takes a StaticImageData object and uploads it to the system, returning a SaveStaticImageResponse.
 */
export interface StaticImageProvider {
	listStaticImages: () => Promise<string[]>;
	loadStaticImage: (name: string) => Promise<StaticImageData | undefined>;
	uploadStaticImage: (imageData: StaticImageData) => Promise<SaveStaticImageResponse | undefined>;
}

/*
 * The content of a image is interpreted by the Print Model Editor as a base64-encoded string.
 */
export interface StaticImageData {
	readonly name: string;
	readonly internal_filename: string;
	readonly mime_type: string;
	readonly content: string;
	readonly size: number;
}

export interface SaveStaticImageResponse {
	readonly name: string;
}
// end::StaticImageProvider[]
