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
/* eslint-disable @typescript-eslint/no-explicit-any */
export declare module "antlr4" {
	export declare class Lexer extends Recognizer<number> {
		static DEFAULT_MODE: number;

		_input: CharStream;
		_interp: LexerATNSimulator;
		text: string;
		line: number;
		column: number;
		_tokenStartCharIndex: number;
		_tokenStartLine: number;
		_tokenStartColumn: number;
		_type: number;

		constructor(input: CharStream);
		reset(): void;
		nextToken(): Token;
		skip(): void;
		more(): void;
		setMode(m: number): void;
		getMode(): number;
		getModeStack(): number[];
		pushMode(m: number): void;
		popMode(): number;
		emitToken(token: Token): void;
		emit(): Token;
		emitEOF(): Token;
		getAllTokens(): Token[];
	}

	export declare class BufferedTokenStream extends TokenStream {
		tokenSource: Lexer;
	}
	export declare class CommonTokenStream extends BufferedTokenStream {
		tokens: Token[];
		constructor(lexer: Lexer);
		constructor(lexer: Lexer, channel: number);
		fill(): void;
	}

	export declare class TokenStream {
		index: number;
		size: number;

		LA(i: number): number;
		LT(k: number): Token;
		getText(interval?: Interval): string;
		getHiddenTokensToLeft(tokenIndex: number, channelIndex?: number): Token[];
		getHiddenTokensToRight(tokenIndex: number, channelIndex?: number): Token[];
		get(idx: number): Token;
	}

	export declare class CharStream {
		index: number;
		size: number;

		constructor(data: string);
		constructor(data: string, decodeToUnicodeCodePoints: boolean);
		reset(): void;
		consume(): void;
		LA(offset: number): number;
		LT(offset: number): number;
		mark(): number;
		release(marker: number): void;
		seek(index: number): void;
		getText(start: number, stop: number): string;
		toString(): string;
	}

	export declare class Token {
		static INVALID_TYPE: number;
		static EOF: number;
		static DEFAULT_CHANNEL: number;
		static HIDDEN_CHANNEL: number;

		tokenIndex: number;
		line: number;
		column: number;
		channel: number;
		text: string;
		type: number;
		start: number;
		stop: number;

		clone(): Token;
		cloneWithType(type: number): Token;
		getTokenSource(): TokenSource;
		getInputStream(): CharStream;
	}

	export declare class ErrorStrategy {
		reset(recognizer: Parser): void;
		sync(recognizer: Parser): void;
		recover(recognizer: Parser, e: RecognitionException): void;
		recoverInline(recognizer: Parser): Token;
		reportMatch(recognizer: Parser): void;
		reportError(recognizer: Parser, e: RecognitionException): void;
	}

	export declare class Interval {
		start: number;
		stop: number;

		constructor(start: number, stop: number);
		constructor(start: Token, stop: Token | undefined);
	}

	export declare class IntervalSet {
		isNil: boolean;
		size: number;
		minElement: number;
		maxElement: number;
		intervals: Interval[];

		contains(i: number): boolean;
		toString(literalNames?: (string | null)[], symbolicNames?: string[], elemsAreChar?: boolean): string;
	}

	export declare abstract class Printer {
		print(s: string): void;
		println(s: string): void;
	}

	export declare class Parser extends Recognizer<Token> {
		static EOF: number;

		_input: TokenStream;
		_ctx: ParserRuleContext;
		_interp: ParserATNSimulator;
		_errHandler: ErrorStrategy;
		_parseListeners?: any[];
		matchedEOF: boolean;
		buildParseTrees: boolean;
		printer?: Printer;
		syntaxErrorsCount: number;

		constructor(input: TokenStream);
		match(ttype: number): Token;
		matchWildcard(): Token;
		getParseListeners(): ParseTreeListener[];
		addParseListener(listener: ParseTreeListener): void;
		removeParseListener(listener: ParseTreeListener): void;
		removeParseListeners(): void;
		consume(): Token;
		enterRule(localctx: ParserRuleContext, state: number, ruleIndex: number): void;
		exitRule(): void;
		triggerExitRuleEvent(): void;
		enterOuterAlt(localctx: ParserRuleContext, altNum: number): void;
		enterRecursionRule(localctx: ParserRuleContext, state: number, ruleIndex: number, precedence: number): void;
		pushNewRecursionContext(localctx: ParserRuleContext, state: number, ruleIndex: number): void;
		unrollRecursionContexts(parentCtx: ParserRuleContext): void;
		precpred(localctx: ParserRuleContext, precedence: number): boolean;
		getRuleInvocationStack(): string[];
		dumpDFA(): void;
		getExpectedTokens(): IntervalSet;
		getTokenStream(): TokenStream;
		reset(): void;
		setTokenStream(input: TokenStream): void;
		notifyErrorListeners(msg: string, offendingToken: Token, err: RecognitionException | undefined): void;
		getCurrentToken(): Token;
	}

	export declare class Recognizer<TSymbol> {
		state: number;

		removeErrorListeners(): void;
		addErrorListener(listener: ErrorListener<TSymbol>): void;
		getErrorListener(): ErrorListener<TSymbol>;
		getLiteralNames(): string[];
		getSymbolicNames(): string[];
	}

	export declare class PredictionMode {
		static SLL: number;
		static LL: number;
		static LL_EXACT_AMBIG_DETECTION: number;
	}

	export declare class ParserATNSimulator extends ATNSimulator {
		predictionMode: PredictionMode;
		decisionToDFA: DFA[];
		atn: ATN;
		debug?: boolean;
		trace_atn_sim?: boolean;

		constructor(
			recog: Recognizer<Token>,
			atn: ATN,
			decisionToDFA: DFA[],
			sharedContextCache: PredictionContextCache
		);
		adaptivePredict(input: TokenStream, decision: number, outerContext: ParserRuleContext): number;
	}
	export declare class ATNSimulator {}
	export declare class PredictionContextCache {}
	export declare class LexerATNSimulator implements ATNSimulator {
		decisionToDFA: DFA[];

		constructor(
			recog: Recognizer<number> | any,
			atn: ATN,
			decisionToDFA: DFA[],
			sharedContextCache: PredictionContextCache
		);
		consume(input: CharStream): void;
	}
	export declare class ATNState {
		atn: ATN;
		stateNumber: number;
	}
	export declare class DecisionState extends ATNState {
		decision: number;
		nonGreedy: boolean;
	}

	export declare class DFA {
		constructor(ds: any, index: number);
		toLexerString(): string;
	}

	export declare class ATNConfig {
		state: ATNState;
	}
	export declare class ATNConfigSet {
		configs: ATNConfig[];
	}
	export declare class ATN {
		static INVALID_ALT_NUMBER: number;

		states: ATNState[];
		decisionToState: DecisionState[];
		ruleToStartState: RuleStartState[];
		ruleToStopState: RuleStopState[];

		getExpectedTokens(stateNumber: number, ctx: RuleContext): IntervalSet;
		nextTokens(atnState: ATNState, ctx?: RuleContext): IntervalSet;
	}
	export declare class ATNDeserializationOptions {
		readOnly?: boolean;
		verifyATN?: boolean;
		generateRuleBypassTransitions?: boolean;
	}
	export declare class ATNDeserializer {
		constructor(options?: ATNDeserializationOptions);
		deserialize(data: number[]): ATN;
	}

	export interface ExceptionParams {
		message: string;
		recognizer?: Recognizer<never>;
		input?: CharStream | TokenStream;
		ctx?: ParserRuleContext;
	}
	export declare class RecognitionException extends Error {
		ctx: RuleContext;
		offendingToken: Token | null;
		constructor(params: ExceptionParams);
	}
	export declare class FailedPredicateException extends RecognitionException {
		constructor(recognizer: Parser, predicate: string | undefined, message: string | undefined);
	}

	export declare class NoViableAltException extends RecognitionException {
		deadEndConfigs: ATNConfigSet;

		constructor(recognizer: Recognizer<any>);

		startToken: Token;
	}

	export declare class ErrorListener<TSymbol> {
		syntaxError(
			recognizer: Recognizer<TSymbol>,
			offendingSymbol: TSymbol,
			line: number,
			column: number,
			msg: string,
			e: RecognitionException | undefined
		): void;
	}

	export declare class ParseTreeWalker {
		static DEFAULT: ParseTreeWalker;

		walk<T extends ParseTreeListener>(listener: T, t: ParseTree): void;
	}
	export declare abstract class ParseTreeListener {
		visitTerminal(node: TerminalNode): void;
		visitErrorNode(node: ErrorNode): void;
		enterEveryRule(ctx: ParserRuleContext): void;
		exitEveryRule(ctx: ParserRuleContext): void;
	}
	export declare class ErrorNode extends TerminalNode {}
	export declare class TerminalNode extends ParseTree {
		symbol: Token;
		parentCtx: ParserRuleContext;
	}
	export declare abstract class RuleNode extends ParseTree {}
	export declare class Tree {}

	export declare class SyntaxTree extends Tree {}

	export declare class ParseTree extends SyntaxTree {
		getText(): string;
	}
	export declare class ParseTreeVisitor<Result> {
		visit(tree: ParseTree): Result;
		visitChildren(node: RuleNode): Result;
		visitTerminal(node: TerminalNode): Result;
		visitErrorNode(node: ErrorNode): Result;
	}

	export declare class RuleContext extends RuleNode {
		parentCtx: RuleContext | undefined;
		invokingState: number;

		get ruleContext(): RuleContext;
		toStringTree(ruleNames: string[] | null, recog: Parser): string;
	}
	export declare class ParserRuleContext extends RuleContext {
		start: Token;
		stop: Token | undefined;
		children: ParseTree[] | null;
		parentCtx: ParserRuleContext | undefined;
		exception?: RecognitionException;
		parser?: Parser;

		constructor(parent?: ParserRuleContext, invokingStateNumber?: number);
		copyFrom(ctx: ParserRuleContext): void;
		getChildCount(): number;
		getChild(i: number): ParseTree;
		getToken(ttype: number, i: number): TerminalNode;
		getTokens(ttype: number): TerminalNode[];
		getTypedRuleContext<T extends ParserRuleContext, P extends Parser>(
			ctxType: { new (parser?: P, parent?: ParserRuleContext, invokingState?: number, ...args: any[]): T },
			i: number
		): T;
		getTypedRuleContexts<T extends ParserRuleContext, P extends Parser>(ctxType: {
			new (parser?: P, parent?: ParserRuleContext, invokingState?: number, ...args: any[]): T;
		}): T[];
	}
}
