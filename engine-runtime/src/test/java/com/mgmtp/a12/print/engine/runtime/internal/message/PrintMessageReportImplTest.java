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
package com.mgmtp.a12.print.engine.runtime.internal.message;

import com.mgmtp.a12.print.engine.api.exception.PrintException;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintCompilerException;
import com.mgmtp.a12.print.engine.api.exception.impl.PrintDomainException;
import com.mgmtp.a12.print.engine.api.message.PrintMessage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PrintMessageReportImplTest {

	@AfterEach
	void cleanup() {
		PrintMessageCollector.end();
	}

	// --- report container ---

	@Test
	void getResult_withNoErrors_returnsResult() {
		var report = new PrintMessageReportImpl<>("result", List.of(warning("w1")));
		assertThat(report.getResult()).isEqualTo("result");
	}

	@Test
	void getResult_withErrors_throwsPrintException() {
		var report = new PrintMessageReportImpl<>("result", List.of(error("e1")));
		assertThatThrownBy(report::getResult).isInstanceOf(PrintException.class);
	}

	@Test
	void noErrorOccurred_withOnlyWarnings_returnsTrue() {
		var report = new PrintMessageReportImpl<>("ok", List.of(warning("w")));
		assertThat(report.noErrorOccurred()).isTrue();
	}

	@Test
	void noErrorOccurred_withErrors_returnsFalse() {
		var report = new PrintMessageReportImpl<>(null, List.of(error("e")));
		assertThat(report.noErrorOccurred()).isFalse();
	}

	// --- wrapException routing ---

	@Test
	void wrapException_happyPath_returnsReport() {
		var report = PrintMessageReportImpl.wrapException(
			() -> {
				PrintMessageCollector.addWarning("a warning");
				return new PrintMessageReportImpl<>("done", PrintMessageCollector.getMessages());
			},
			PrintCompilerException.class,
			PrintCompilerException::new
		);

		assertThat(report.noErrorOccurred()).isTrue();
		assertThat(report.getResult()).isEqualTo("done");
		assertThat(report.getMessages()).hasSize(1);
		assertThat(report.getMessages().get(0).getSeverity()).isEqualTo(PrintMessage.Severity.WARNING);
	}

	@Test
	void wrapException_printDomainException_returnsErrorReport_noRethrow() {
		var report = PrintMessageReportImpl.wrapException(
			() -> { throw new PrintDomainException("domain error"); },
			PrintCompilerException.class,
			PrintCompilerException::new
		);

		assertThat(report.noErrorOccurred()).isFalse();
		assertThat(report.getMessages()).hasSize(1);
		assertThat(report.getMessages().get(0).getDescription()).isEqualTo("domain error");
		assertThat(report.getMessages().get(0).getSeverity()).isEqualTo(PrintMessage.Severity.ERROR);
	}

	@Test
	void wrapException_printDomainException_handleAlreadyAddedMessages() {
		var report = PrintMessageReportImpl.wrapException(
			() -> {
				PrintMessageCollector.addWarning("WARNING");
				PrintMessageCollector.addError(new RuntimeException("RUNTIME"));
				throw new PrintDomainException("domain error");
			},
			PrintCompilerException.class,
			PrintCompilerException::new
		);

		assertThat(report.noErrorOccurred()).isFalse();
		assertThat(report.getMessages()).hasSize(3);
	}

	@Test
	void wrapException_printDomainException_wrappedInRuntimeException_returnsErrorReport() {
		var report = PrintMessageReportImpl.wrapException(
			() -> { throw new RuntimeException("wrapper", new PrintDomainException("nested domain error")); },
			PrintCompilerException.class,
			PrintCompilerException::new
		);

		assertThat(report.noErrorOccurred()).isFalse();
		assertThat(report.getMessages()).hasSize(1);
	}

	@Test
	void wrapException_passthroughException_rethrows() {
		assertThatThrownBy(() ->
			PrintMessageReportImpl.wrapException(
				() -> { throw new PrintCompilerException("compile failed"); },
				PrintCompilerException.class,
				PrintCompilerException::new
			)
		).isInstanceOf(PrintCompilerException.class)
			.hasMessageContaining("compile failed");
	}

	@Test
	void wrapException_unknownException_wrapsViaFactory() {
		assertThatThrownBy(() ->
			PrintMessageReportImpl.wrapException(
				() -> { throw new IllegalStateException("unexpected"); },
				PrintCompilerException.class,
				PrintCompilerException::new
			)
		).isInstanceOf(PrintCompilerException.class);
	}

	@Test
	void wrapException_alwaysCallsEnd_evenOnDomainException() {
		PrintMessageReportImpl.wrapException(
			() -> { throw new PrintDomainException("domain error"); },
			PrintCompilerException.class,
			PrintCompilerException::new
		);

		assertThat(PrintMessageCollector.getMessages()).isEmpty();
	}

	// --- helpers ---

	private static PrintMessage warning(String description) {
		return new PrintWarningMessageImpl(description);
	}

	private static PrintMessage error(String description) {
		return new PrintErrorMessageImpl(description, null);
	}
}
