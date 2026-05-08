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
import { FieldTypeDefinition, RowPropertyKeyType } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";
import { ColumnPropertyKeyType } from "@com.mgmtp.a12.print/print-model-api/lib/model/index.js";

import { PredicateClassification } from "../predicate-classification.js";

import { ComputationFieldType, Constant } from "./index.js";

export abstract class ComputationFieldTypeExt {
	static computationFieldTypeFromConstantType(constantType: Constant.ConstantType): ComputationFieldType {
		switch (constantType) {
			case Constant.ConstantType.String:
				return ComputationFieldType.String;
			case Constant.ConstantType.Float:
			case Constant.ConstantType.Integer:
				return ComputationFieldType.Number;
			case Constant.ConstantType.Boolean:
				return ComputationFieldType.Boolean;
			default:
		}
		return ComputationFieldType.Unknown;
	}

	static computationFieldTypeFromFieldTypeDefinition(fieldType: FieldTypeDefinition): ComputationFieldType {
		if (fieldType != null) {
			switch (fieldType) {
				case FieldTypeDefinition.Boolean:
					return ComputationFieldType.Boolean;
				case FieldTypeDefinition.Number:
					return ComputationFieldType.Number;
				case FieldTypeDefinition.String:
					return ComputationFieldType.String;
				case FieldTypeDefinition.TypeDefinition:
					throw new Error("Unable to convert a fieldTypeReference into a ComputationFieldType");
			}
		}
		return ComputationFieldType.Unknown;
	}

	static computationFieldTypeFromPredicateType(type: PredicateClassification.PredicateType): ComputationFieldType {
		switch (type) {
			case PredicateClassification.PredicateType.Number:
				return ComputationFieldType.Number;
			case PredicateClassification.PredicateType.Date:
				return ComputationFieldType.Date;
			case PredicateClassification.PredicateType.DateTime:
				return ComputationFieldType.DateTime;
			case PredicateClassification.PredicateType.Boolean:
				return ComputationFieldType.Boolean;
			case PredicateClassification.PredicateType.String:
				return ComputationFieldType.String;
			case PredicateClassification.PredicateType.Time:
				return ComputationFieldType.Time;
		}
		return ComputationFieldType.Unknown;
	}

	static computationFieldTypeFromColumnPropertyType(property: ColumnPropertyKeyType): ComputationFieldType {
		switch (property) {
			case ColumnPropertyKeyType.Bold:
			case ColumnPropertyKeyType.Italic:
			case ColumnPropertyKeyType.Underline:
			case ColumnPropertyKeyType.IsHidden:
			case ColumnPropertyKeyType.IsContentHidden:
				return ComputationFieldType.Boolean;
			case ColumnPropertyKeyType.HorizontalAlignment:
			case ColumnPropertyKeyType.VerticalAlignment:
			case ColumnPropertyKeyType.Font:
			case ColumnPropertyKeyType.Color:
			case ColumnPropertyKeyType.BackgroundColor:
			case ColumnPropertyKeyType.BorderStyle:
			case ColumnPropertyKeyType.BorderColor:
				return ComputationFieldType.String;
			case ColumnPropertyKeyType.FontSize:
			case ColumnPropertyKeyType.LineHeight:
			case ColumnPropertyKeyType.BorderWidth:
			case ColumnPropertyKeyType.ColumnSpan:
			case ColumnPropertyKeyType.PaddingTop:
			case ColumnPropertyKeyType.PaddingBottom:
			case ColumnPropertyKeyType.PaddingLeft:
			case ColumnPropertyKeyType.PaddingRight:
				return ComputationFieldType.Number;
			default:
				throw new Error("ColumnPropertyComputation.PropertyType " + property + "is not supported");
		}
	}

	static computationFieldTypeFromRowPropertyType(property: RowPropertyKeyType): ComputationFieldType {
		switch (property) {
			case RowPropertyKeyType.Bold:
			case RowPropertyKeyType.Italic:
			case RowPropertyKeyType.Underline:
			case RowPropertyKeyType.IsHidden:
				return ComputationFieldType.Boolean;
			case RowPropertyKeyType.HorizontalAlignment:
			case RowPropertyKeyType.VerticalAlignment:
			case RowPropertyKeyType.Font:
			case RowPropertyKeyType.Color:
			case RowPropertyKeyType.BackgroundColor:
			case RowPropertyKeyType.BorderStyle:
			case RowPropertyKeyType.BorderColor:
				return ComputationFieldType.String;
			case RowPropertyKeyType.FontSize:
			case RowPropertyKeyType.LineHeight:
			case RowPropertyKeyType.BorderWidth:
			case RowPropertyKeyType.PaddingTop:
			case RowPropertyKeyType.PaddingBottom:
			case RowPropertyKeyType.PaddingLeft:
			case RowPropertyKeyType.PaddingRight:
				return ComputationFieldType.Number;
			default:
				throw new Error("RowPropertyComputation.PropertyType " + property + "is not supported");
		}
	}
}
