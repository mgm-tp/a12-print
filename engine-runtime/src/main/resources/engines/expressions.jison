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
/* lexical grammar */
%lex
%%

\"[^\"]*\"            return 'QSTRING'
\n([ \t]*\n){2,}      return 'NEWPARAGRAPH'
\n[ \t]*\n            return 'NEWLINE'
\s                    /* skip whitespace */
"case"                return 'CASE'
"kontext"             return 'GROUP'
[0-9]                 return 'DIGIT'
[A-Za-z]              return 'CHAR'
[\-]                  return '-'
[\_]                  return '_'
[\:]                  return ':'
[\,]                  return ','
"!="                  return '!=' 
[\=]                  return '='
[\(]                  return '('
[\)]                  return ')'
[\{]                  return '{'
[\}]                  return '}'
[\[]                  return '['
[\]]                  return ']'
[\|]                  return '|'
<<EOF>>               return 'EOF'
.                     return 'INVALID'

/lex

/* operator associations and precedence */

%start expression

%% /* language grammar */

expression
	: elements 'EOF'
		{return {type:"root",children:$elements};}
	;

elements
	: element
		{$$ = [$element];}
	| element elements
		{$$ = [$element].concat($elements);}
	;

element
	: token
	| value
	| operation
	;

operation
	: group
	| case
	;

value
	: field
	| string
	| multilingualtext
	;

token
	: 'NEWLINE'
		{$$ = {type:"token",name:"newline"};}
	| 'NEWPARAGRAPH'
		{$$ = {type:"token",name:"newparagraph"};}
	;

group
	: 'GROUP' '(' name ')' '{' elements '}'
		{$$ = {type:"group",name:$name,children:$elements};}
	;

case
	: 'CASE' field '=' string '{' elements '}'
		{$$ = {type:"case",name:$field.name,operation:"equal",content:$string.content,children:$elements};}
	| 'CASE' field '!=' string '{' elements '}'
		{$$ = {type:"case",name:$field.name,operation:"not_equal",content:$string.content,children:$elements};}
	;

field
	: '[' name ']'
		{$$ = {type:"field",name:$name};}
	| '[' name '|' formatter ']'
		{$$ = {type:"field",name:$name};}
	;

formatter
	: name
	| name '|' formatter
	;

multilingualtext
	: '(' texts ')'
		{$$ = {type:"multilingualtext",children:$texts};}
	;

texts
	: text
		{$$ = [$text];}
	| text ',' texts
		{$$ = [$text].concat($texts); }
	;

text
	: isocode ':' string
		{$$ = {type:"text",name:$isocode,content:$string.content};}
	;

name
	: namesymbol
		{$$ = $namesymbol;}
	| namesymbol name
		{$$ = $namesymbol + $name;}
	;

namesymbol
	: 'CHAR'
	| 'DIGIT'
	| '-'
	| '_'
	;

isocode
	: 'CHAR' 'CHAR'
		{$$ = $1 + $2;}
	;

string
	: 'QSTRING'
		{$$ = {type:"string",content:$1.substring(1,$1.length-1)};}
	;

%%

/**
 * This exports the module as commonjs
 *
 * Note: This is necessary because in commonjs mode jison will return a main method that needs the module fs.
 */
exports.parse = function () { return expressions.parse.apply(expressions, arguments); };
