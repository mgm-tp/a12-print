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
grammar PrintComputation;

computation
	: computationBody EOF
	;

computationBody
	: expression
	;

expression
	: operation
	| member
	;

member
	: predicateLike
	| constant
	| dereference
	| COMMENT
	;

predicateLike
	: predicate
	| infixPredicate
	;

predicate
	: operator=LABEL '(' predicateSignature ')'
	| operator=LABEL
	;

infixPredicate
	: infixPredicateParameter operator=LABEL infixPredicateParameter
	;

infixPredicateParameter
	: dereference
	| constant
	;

predicateSignature
	: predicateInclusionParameter
	| predicateConsistenceParameter
	| predicateParameterList
	;

predicateInclusionParameter
	: predicateParameterList IN_OPERATOR predicateParameterList
	;

predicateConsistenceParameter
	: predicateParameterList TO_OPERATOR predicateParameterList
	;

predicateParameterList
	: predicateParameter (COMMA predicateParameter)*
	;

predicateParameter
	: variable
	| arithmeticOperation
	| constant
	| dereference
	| filter
	;

filter
	: variable HAVING_OPERATOR operation
	;

constant
	: value=(
		BOOLEAN_LITERAL
		| STRING_LITERAL
		| FLOATING_POINT_LITERAL
		| NUMBER_LITERAL
	)
	;

dereference
	: CORNER_BRACE_LEFT
	  (semanticIndex | variableAttribute | variable)
	  CORNER_BRACE_RIGHT
	;

semanticIndex
	: variable
	FOR_OPERATOR
	(constant | variable)
	;

variableAttribute
	: variable
	ARROW_OPERATOR
	(constant | variable)
	;

variable
	: absoluteReference
	| relativeReference
	| rootReference
	;

rootReference
	: SLASH
	;

absoluteReference
	: (SLASH referenceElement)+
	;

relativeReference
	: relativeSegment (	SLASH relativeSegment)*
	;

relativeSegment
	:
	turningGroup
	| upwardReference
	| referenceElement
	;

referenceElement
	: referenceLabel
	| referenceList
	;

referenceLabel
	: label=(LABEL | QUOTED_LITERAL)
	;

referenceList
	: label=(LABEL | QUOTED_LITERAL) '*'
	;
turningGroup
	: '..'
	referenceElement
	;

upwardReference
	: '..'
	;

operation
	: BRACE_LEFT operation BRACE_RIGHT
	| logicOperation
	| compareOperation
	| arithmeticOperation
	;

logicOperation
	: lef=logicOperationLeft (operator=AND_OPERATOR right=logicOperationRight)+
	| lef=logicOperationLeft (operator=OR_OPERATOR right=logicOperationRight)+
	| BRACE_LEFT logicOperation BRACE_RIGHT
	;

logicOperationLeft
	: BRACE_LEFT logicOperation BRACE_RIGHT
	| compareOperation
	| member
	;

logicOperationRight
	: logicOperation
	| compareOperation
	| member
	;

compareOperation
	: BRACE_LEFT compareOperation BRACE_RIGHT
	| (arithmeticOperation | member) operator=(GREATER_THAN_OPERATOR | GREATER_THAN_OR_EQUAL_OPERATOR | LESS_THAN_OPERATOR | LESS_THAN_OR_EQUAL_OPERATOR) (arithmeticOperation | member)
 	| member operator=(EQUALITY_OPERATOR| UNEQUALITY_OPERATOR) member
	;

arithmeticOperation
	: BRACE_LEFT arithmeticOperation BRACE_RIGHT
	| left=arithmeticOperationLeft operator=(MULTIPLICATION_OPERATOR | SLASH) right=arithmeticOperationRight
	| left=arithmeticOperationLeft operator=(PLUS_OPERATOR | MINUS_OPERATOR) right=arithmeticOperationRight
	;

arithmeticOperationLeft
	: BRACE_LEFT arithmeticOperation BRACE_RIGHT
	| member
	;

arithmeticOperationRight
	: arithmeticOperation
	| member
	;

/* Begin Lexing Rules */

FOR_OPERATOR
	:  [ \t\n\r]+ ( 'for' | 'FOR' | 'For')  [ \t\n\r]+
	;

HAVING_OPERATOR
	:  [ \t\n\r]+ ('having')  [ \t\n\r]+
	;

IN_OPERATOR
	:  [ \t\n\r]+ ('in' | 'IN' | 'In')  [ \t\n\r]+
	;

TO_OPERATOR
	:  [ \t\n\r]+ ('to' | 'TO' | 'To')  [ \t\n\r]+
	;

CURRENT_REPETITION_FILTER_OPERATOR
	: '$'
	;

NUMBER_LITERAL
    : (('-'? [1-9][0-9]?[0-9]?([ ]?[0-9][0-9][0-9])*) | '0')
    ;

FLOATING_POINT_LITERAL
    : NUMBER_LITERAL '.' [ ]? ([0-9][0-9][0-9][ ]?)* [0-9]?[0-9]?[0-9]
    ;

ARROW_OPERATOR
    : '->'
    ;

PLUS_OPERATOR
    : '+'
    ;

MINUS_OPERATOR
    : '-'
    ;

EQUALITY_OPERATOR
    : '=='
    ;

UNEQUALITY_OPERATOR
    : '!='
    ;

GREATER_THAN_OR_EQUAL_OPERATOR
    : '>='
    ;

LESS_THAN_OR_EQUAL_OPERATOR
    : '<='
    ;

GREATER_THAN_OPERATOR
    : '>'
    ;

LESS_THAN_OPERATOR
    : '<'
    ;

MULTIPLICATION_OPERATOR
    : '*'
    ;

SLASH
    : '/'
    ;

AND_OPERATOR
    : [ \t\n\r]+ ('and' | 'And' | 'AND') [ \t\n\r]+
    ;

OR_OPERATOR
    : [ \t\n\r]+ ('or' | 'Or' | 'OR') [ \t\n\r]+
    ;

BOOLEAN_LITERAL
    : 'true' | 'false' | 'False' | 'True'
    ;

SPACE
    : ' ' -> skip
    ;

NEWLINE
    : [\r\n]+ -> skip
    ;

WS
    : [ \t]+ -> skip
    ;

STRING_LITERAL
    : '"' (.*?) '"'
    {setText(getText().substring(1, getText().length()-1));}
    ;

QUOTED_LITERAL
    : '\'' (.*?) '\''
    {setText(getText().substring(1, getText().length()-1));}
    ;

COMMENT
    : ';;' (.*?) NEWLINE
    {setText(getText().substring(2, getText().length()-1));}
    ;

LABEL
    :  [\p{L}0-9\-_] +
    ;


BRACE_LEFT
    : '('
    ;
BRACE_RIGHT
    : ')'
    ;
CORNER_BRACE_LEFT
    : '['
    ;

CORNER_BRACE_RIGHT
    : ']'
    ;

CURLY_BRACE_LEFT
    : '{'
    ;

CURLY_BRACE_RIGHT
    : '}'
    ;

COMMA
    : ','
    ;
