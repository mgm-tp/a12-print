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
import type { DocumentModel } from "@com.mgmtp.a12.kernel/kernel-md-facade";

/**
 * Ordered List of Computation Field Types.
 * The order determines which Type would "win" if there is Arithmetic containing multiple
 */
export enum ComputationFieldType {
	Unknown,

	String,

	Number,

	Boolean,

	Date,

	DateTime,

	Time,

	DateRange,

	DateFragment,

	Enumeration,

	Custom,

	Empty,
}

export namespace ComputationFieldType {
	export const isStringLike = (computationFieldType: ComputationFieldType): boolean => {
		switch (computationFieldType) {
			case ComputationFieldType.String:
			case ComputationFieldType.Enumeration:
			case ComputationFieldType.Custom:
			case ComputationFieldType.Empty:
				return true;
			default:
		}
		return false;
	};

	export const getFieldType = (computationFieldType: ComputationFieldType): DocumentModel.FieldType | undefined => {
		switch (computationFieldType) {
			case ComputationFieldType.Enumeration:
				return {
					type: "StringType",
					lineBreaksPermitted: false,
				} satisfies DocumentModel.StringType;
			case ComputationFieldType.String:
				return {
					type: "StringType",
					lineBreaksPermitted: true,
				} satisfies DocumentModel.StringType;
			case ComputationFieldType.Number:
				return {
					type: "NumberType",
				} satisfies DocumentModel.NumberType;
			case ComputationFieldType.Boolean:
				return {
					type: "BooleanType",
				} satisfies DocumentModel.BooleanType;
			case ComputationFieldType.Date:
				return {
					type: "DateType",
					format: "yyyy-MM-dd",
				} satisfies DocumentModel.DateType;
			case ComputationFieldType.DateTime:
				return {
					type: "DateTimeType",
					format: "yyyy-MM-dd'T'HH:mm:ss",
				} satisfies DocumentModel.DateTimeType;
			case ComputationFieldType.Time:
				return {
					type: "TimeType",
					format: "HH:mm:ss",
				} satisfies DocumentModel.TimeType;
			case ComputationFieldType.DateRange:
				return {
					type: "DateRangeType",
					format: "yyyy-MM-dd",
					rangeSeparator: "/",
				} satisfies DocumentModel.DateRangeType;
			case ComputationFieldType.DateFragment:
				return {
					type: "DateFragmentType",
					formatOfFragment: "yyyy-MM-dd",
				} satisfies DocumentModel.DateFragmentType;
		}
		return undefined;
	};

	export const isComparableTo = (
		computationFieldType: ComputationFieldType,
		otherComputationFieldType: ComputationFieldType
	): boolean => {
		switch (computationFieldType) {
			case ComputationFieldType.String:
			case ComputationFieldType.Enumeration:
				return ComputationFieldType.isStringLike(otherComputationFieldType);
			default:
		}
		return computationFieldType === otherComputationFieldType;
	};
}
