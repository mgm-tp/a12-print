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
package com.mgmtp.a12.print.engine.runtime.xml.internal.serialization;

import com.mgmtp.a12.print.engine.runtime.xml.internal.model.PrintDocumentXml;
import jakarta.xml.bind.JAXBContext;
import jakarta.xml.bind.JAXBException;
import jakarta.xml.bind.Marshaller;
import jakarta.xml.bind.Unmarshaller;
import jakarta.xml.bind.util.JAXBSource;
import lombok.Value;
import org.xml.sax.ErrorHandler;
import org.xml.sax.SAXException;
import org.xml.sax.SAXParseException;

import javax.xml.XMLConstants;
import javax.xml.validation.Schema;
import javax.xml.validation.SchemaFactory;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

public class XmlSerialization {

	private static final String SCHEMA_PATH = "PrintDocument.xsd";

	private static final Marshaller marshaller;
	private static final Unmarshaller unmarshaller;
	private static final JAXBContext context;

	private static final Schema schema;

	static {
		try {
			context = JAXBContext.newInstance(PrintDocumentXml.class);
			marshaller = context.createMarshaller();
			marshaller.setProperty(Marshaller.JAXB_FORMATTED_OUTPUT, Boolean.TRUE);

			unmarshaller = context.createUnmarshaller();

			SchemaFactory sf = SchemaFactory.newInstance(XMLConstants.W3C_XML_SCHEMA_NS_URI);
			schema = sf.newSchema(XmlSerialization.class.getClassLoader().getResource(SCHEMA_PATH));
		} catch (JAXBException | SAXException e) {
			throw new RuntimeException(e);
		}
	}

	public static byte[] serializeXML(PrintDocumentXml printDocumentXml) {
		try {
			final var xmlOutputStream = new ByteArrayOutputStream();
			marshaller.marshal(
				printDocumentXml,
				xmlOutputStream
			);
			return xmlOutputStream.toByteArray();
		} catch (JAXBException e) {
			throw new RuntimeException(e);
		}
	}

	public static PrintDocumentXml deserializeXML(String content) {
		try {
			final var inputStream = new ByteArrayInputStream(content.getBytes(StandardCharsets.UTF_8));
			return (PrintDocumentXml) unmarshaller.unmarshal(inputStream);
		} catch (JAXBException e) {
			throw new RuntimeException(e);
		}
	}

	public static List<ValidationMessage> validate(String content) {
		final var validationResult = new ArrayList<ValidationMessage>();
		try {
			final var printDocumentXml = deserializeXML(content);
			final var source = new JAXBSource(context, printDocumentXml);
			final var validator = schema.newValidator();
			validator.setErrorHandler(new ErrorHandler() {
				@Override
				public void warning(SAXParseException exception) {
					validationResult.add(new ValidationMessage(ValidationResultType.WARNING, exception.getMessage()));
				}

				@Override
				public void error(SAXParseException exception) {
					validationResult.add(new ValidationMessage(ValidationResultType.ERROR, exception.getMessage()));
				}

				@Override
				public void fatalError(SAXParseException exception) {
					validationResult.add(new ValidationMessage(ValidationResultType.FATAL_ERROR, exception.getMessage()));
				}
			});
			validator.validate(source);
		} catch (SAXException | JAXBException | IOException e) {
			throw new RuntimeException(e);
		}

		return validationResult;
	}

	@Value
	public static class ValidationMessage {
		ValidationResultType type;
		String message;
	}

	public enum ValidationResultType {
		ERROR,
		FATAL_ERROR,
		WARNING;
	}
}
