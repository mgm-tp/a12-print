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

import com.mgmtp.a12.print.engine.api.message.PrintErrorMessage;
import com.mgmtp.a12.print.engine.api.message.PrintMessage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

class PrintMessageCollectorTest {

	@AfterEach
	void cleanup() {
		PrintMessageCollector.end();
	}

	@Test
	void getMessages_withoutBegin_returnsEmpty() {
		assertThat(PrintMessageCollector.getMessages()).isEmpty();
	}

	@Test
	void hasNoErrors_withoutBegin_returnsTrue() {
		assertThat(PrintMessageCollector.hasNoErrors()).isTrue();
	}

	@Test
	void addWarning_isCollectedWithWarningSeverity() {
		PrintMessageCollector.begin();
		PrintMessageCollector.addWarning("missing label");

		List<PrintMessage> messages = PrintMessageCollector.getMessages();
		assertThat(messages).hasSize(1);
		assertThat(messages.get(0).getSeverity()).isEqualTo(PrintMessage.Severity.WARNING);
		assertThat(messages.get(0).getDescription()).isEqualTo("missing label");
	}

	@Test
	void addError_fromThrowable_isCollectedWithErrorSeverity() {
		PrintMessageCollector.begin();
		PrintMessageCollector.addError(new RuntimeException("boom"));

		List<PrintMessage> messages = PrintMessageCollector.getMessages();
		assertThat(messages).hasSize(1);
		assertThat(messages.get(0).getSeverity()).isEqualTo(PrintMessage.Severity.ERROR);
		assertThat(PrintMessageCollector.hasNoErrors()).isFalse();
	}

	@Test
	void addError_withExplicitDescription_usesProvidedText() {
		PrintMessageCollector.begin();
		PrintMessageCollector.addError("specific error", new RuntimeException("cause"));

		List<PrintMessage> messages = PrintMessageCollector.getMessages();
		assertThat(messages).hasSize(1);
		assertThat(messages.get(0).getDescription()).isEqualTo("specific error");
	}

	@Test
	void end_clearsAllMessages() {
		PrintMessageCollector.begin();
		PrintMessageCollector.addWarning("something");
		PrintMessageCollector.end();

		assertThat(PrintMessageCollector.getMessages()).isEmpty();
	}

	@Test
	void getMessages_returnsCopy_notLiveList() {
		PrintMessageCollector.begin();
		PrintMessageCollector.addWarning("first");
		List<PrintMessage> snapshot = PrintMessageCollector.getMessages();
		PrintMessageCollector.addWarning("second");

		assertThat(snapshot).hasSize(1);
		assertThat(PrintMessageCollector.getMessages()).hasSize(2);
	}

	@Test
	void getErrorMessage_extractsRootCauseMessage() {
		RuntimeException root = new RuntimeException("root cause message");
		RuntimeException outer = new RuntimeException("outer", root);

		PrintMessage errorMessage = PrintMessageCollector.getErrorMessage(outer);

		assertThat(errorMessage.getSeverity()).isEqualTo(PrintMessage.Severity.ERROR);
		assertThat(errorMessage.getDescription()).isEqualTo("root cause message");
	}

	@Test
	void getErrorMessage_includesFullStackTrace() {
		PrintMessage errorMessage = PrintMessageCollector.getErrorMessage(new RuntimeException("boom"));

		assertThat(errorMessage).isInstanceOf(PrintErrorMessage.class);
		var stackTrace = ((PrintErrorMessage) errorMessage).getStackTrace();
		assertThat(stackTrace).isPresent();
		assertThat(stackTrace.get()).isNotBlank();
	}

	@Test
	void threadLocalIsolation() throws InterruptedException {
		PrintMessageCollector.begin();
		PrintMessageCollector.addWarning("main thread warning");

		AtomicReference<List<PrintMessage>> otherThreadMessages = new AtomicReference<>();
		CountDownLatch latch = new CountDownLatch(1);

		Thread other = new Thread(() -> {
			PrintMessageCollector.begin();
			otherThreadMessages.set(PrintMessageCollector.getMessages());
			PrintMessageCollector.end();
			latch.countDown();
		});
		other.start();
		latch.await();

		assertThat(otherThreadMessages.get()).isEmpty();
		assertThat(PrintMessageCollector.getMessages()).hasSize(1);
	}
}
