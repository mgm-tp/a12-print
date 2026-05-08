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
package com.mgmtp.a12.print.engine.runtime.internal.pdfBoxEngine.pdDocument;

import lombok.NonNull;
import org.apache.pdfbox.cos.COSDictionary;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.common.PDMetadata;
import org.apache.pdfbox.pdmodel.documentinterchange.logicalstructure.PDMarkInfo;
import org.apache.pdfbox.pdmodel.documentinterchange.logicalstructure.PDStructureElement;
import org.apache.pdfbox.pdmodel.documentinterchange.logicalstructure.PDStructureTreeRoot;
import org.apache.pdfbox.pdmodel.documentinterchange.taggedpdf.StandardStructureTypes;
import org.apache.pdfbox.pdmodel.graphics.color.PDOutputIntent;
import org.apache.pdfbox.pdmodel.interactive.viewerpreferences.PDViewerPreferences;
import org.apache.xmpbox.XMPMetadata;
import org.apache.xmpbox.schema.XMPSchema;
import org.apache.xmpbox.type.BadFieldValueException;
import org.apache.xmpbox.xml.XmpSerializer;

import javax.xml.transform.TransformerException;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;
import java.util.TimeZone;

public class PDDocumentInitializer {
	private PDDocumentInitializer() {}

	private static final String COLOR_PROFILE_PATH = "/colorspaces/sRGB2014.icc";
	private static final String CONFORMANCE = "A";
	private static final int CONFORMANCE_PART = 3;
	private static final float PDF_VERSION = 1.7f;

	private static final String PDF_A_PROPERTY = "pdfaProperty";
	private static final String PDF_A_SCHEMA = "pdfaSchema";

	public static PDDocument initialize(
		@NonNull final AccessibilityMetadata accessibilityMetadata,
		@NonNull final TimeZone timeZone
	) {
		final var newDoc = new PDDocument();
		setMetadata(newDoc, accessibilityMetadata, timeZone);
		return newDoc;
	}

	private static void setMetadata(
		@NonNull final PDDocument document,
		@NonNull final AccessibilityMetadata accessibilityMetadata,
		@NonNull final TimeZone timeZone
	) {
		document.setVersion(PDF_VERSION);

		// set document information
		final var creationDate = Calendar.getInstance(timeZone);
		final var creator = accessibilityMetadata.getProducer();
		final var title = accessibilityMetadata.getTitle();
		final var description = accessibilityMetadata.getDescription();
		final var documentInformation = document.getDocumentInformation();
		documentInformation.setAuthor(accessibilityMetadata.getAuthor());
		documentInformation.setCreator(creator);
		documentInformation.setProducer(creator);
		documentInformation.setTitle(accessibilityMetadata.getTitle());
		documentInformation.setCreationDate(creationDate);
		documentInformation.setModificationDate(creationDate);
		documentInformation.setSubject(accessibilityMetadata.getDescription());

		final var pdOutputIntent = getColorProfileData(document);

		final var markInfo = new PDMarkInfo();
		markInfo.setMarked(true);

		final var catalog = document.getDocumentCatalog();
		catalog.setMetadata(getAccessibilityMetadata(document, creationDate, creator, title, description));
		catalog.setMarkInfo(markInfo);

		catalog.setLanguage(accessibilityMetadata.getLanguage());
		catalog.setViewerPreferences(new PDViewerPreferences(new COSDictionary()));
		catalog.getViewerPreferences().setDisplayDocTitle(true);

		catalog.addOutputIntent(pdOutputIntent);

		// add the root struct element already
		final var root = new PDStructureTreeRoot();
		final var documentStructElement = new PDStructureElement(StandardStructureTypes.DOCUMENT, null);
		documentStructElement.setTitle(accessibilityMetadata.getTitle());
		documentStructElement.setLanguage(accessibilityMetadata.getLanguage());
		root.appendKid(documentStructElement);

		final var figureKey = "Figure";
		final var roleMap = new HashMap<String, String>();
		roleMap.put("Annotation", "Span");
		roleMap.put("Artifact", "P");
		roleMap.put("Bibliography", "BibEntry");
		roleMap.put("Chart", figureKey);
		roleMap.put("Diagram", figureKey);
		roleMap.put("DropCap", figureKey);
		roleMap.put("EndNote", "Note");
		roleMap.put("FootNote", "Note");
		roleMap.put("InlineShape", figureKey);
		roleMap.put("Outline", "Span");
		roleMap.put("Strikeout", "Span");
		roleMap.put("Subscript", "Span");
		roleMap.put("Superscript", "Span");
		roleMap.put("Underline", "Span");
		root.setRoleMap(roleMap);

		catalog.setStructureTreeRoot(root);
	}

	private static PDOutputIntent getColorProfileData(@NonNull final PDDocument document) {
		try (final var colorProfile = PDDocumentInitializer.class.getResourceAsStream(COLOR_PROFILE_PATH)) {
			if (colorProfile != null) {
				final var outputIntent = new PDOutputIntent(document, colorProfile);
				final var colorInfo = "sRGB IEC61966-2.1";
				outputIntent.setInfo(colorInfo);
				outputIntent.setOutputCondition(colorInfo);
				outputIntent.setOutputConditionIdentifier(colorInfo);
				outputIntent.setRegistryName("http://www.color.org");

				return outputIntent;
			} else {
				throw new PDDocumentCreationException("The color profile could not be found.");
			}
		} catch (IOException e) {
			throw new PDDocumentCreationException("There is a problem with the colorProfile", e);
		}
	}

	private static PDMetadata getAccessibilityMetadata(
		@NonNull final PDDocument document,
		@NonNull final Calendar creationDate,
		@NonNull final String creator,
		@NonNull final String title,
		@NonNull final String description
	) {
		try {
			final var xmpMetadata = XMPMetadata.createXMPMetadata();

			final var pdfASchema = xmpMetadata.createAndAddPFAIdentificationSchema();
			pdfASchema.setConformance(CONFORMANCE);
			pdfASchema.setPart(CONFORMANCE_PART);

			final var xmpSchema = xmpMetadata.createAndAddXMPBasicSchema();
			xmpSchema.setCreatorTool(creator);
			xmpSchema.setCreateDate(creationDate);
			xmpSchema.setModifyDate(creationDate);

			final var dublinCoreSchema = xmpMetadata.createAndAddDublinCoreSchema();
			dublinCoreSchema.setFormat("application/pdf");
			dublinCoreSchema.addCreator(creator);
			dublinCoreSchema.setTitle(title);
			dublinCoreSchema.setDescription(description);

			final var pdfAExt = xmpMetadata.createAndAddPDFAExtensionSchemaWithDefaultNS();
			pdfAExt.addNamespace("http://www.aiim.org/pdfa/ns/extension/", "pdfaExtension");
			pdfAExt.addNamespace("http://www.aiim.org/pdfa/ns/schema#", PDF_A_SCHEMA);
			pdfAExt.addNamespace("http://www.aiim.org/pdfa/ns/property#", PDF_A_PROPERTY);

			// PDF/A ID Schema
			pdfAExt.addBagValue("schemas",
				createPdfaSchema(
					"PDF/A ID Schema",
					"http://www.aiim.org/pdfa/ns/id/",
					"pdfaid",
					List.of(
						createPdfaProperty("Part of PDF/A standard", "part", "Integer"),
						createPdfaProperty("Conformance level of PDF/A standard", "conformance", "Text")
					)
				)
			);

			// PDF/UA
			final var pdfuaid = "pdfuaid";
			pdfAExt.addBagValue("schemas", createPdfaSchema(
				"PDF/UA Universal Accessibility Schema",
				"http://www.aiim.org/pdfua/ns/id/",
				pdfuaid ,
				List.of(
					createPdfaProperty("Indicates, which part of ISO 14289 standard is followed", "part", "Integer")
				)
			));
			pdfAExt.addNamespace("http://www.aiim.org/pdfua/ns/id/", pdfuaid);
			pdfAExt.setPrefix(pdfuaid);
			pdfAExt.setTextPropertyValue("part", "1");

			final var serializer = new XmpSerializer();
			final var byteArrayOutputStream = new ByteArrayOutputStream();
			serializer.serialize(xmpMetadata, byteArrayOutputStream, true);

			var xmp = byteArrayOutputStream.toString(StandardCharsets.UTF_8);
			// Fix for bad XML generation by some transformers
			xmp = xmp.replace(" lang=\"x-default\"", " xml:lang=\"x-default\"");

			final var metadata = new PDMetadata(document);
			metadata.importXMPMetadata(xmp.getBytes(StandardCharsets.UTF_8));

			return metadata;
		} catch (BadFieldValueException | TransformerException | IOException e) {
			throw new PDDocumentCreationException(e);
		}
	}

	private static XMPSchema createPdfaProperty(String description, String name, String valueType) {
		final var xmpSchema = new XMPSchema(XMPMetadata.createXMPMetadata(), PDF_A_PROPERTY, PDF_A_PROPERTY, PDF_A_PROPERTY);
		xmpSchema.setTextPropertyValue("name", name);
		xmpSchema.setTextPropertyValue("valueType", valueType);
		xmpSchema.setTextPropertyValue("category", "internal");
		xmpSchema.setTextPropertyValue("description", description);
		return xmpSchema;
	}

	private static XMPSchema createPdfaSchema(String schema, String namespace, String prefix, List<XMPSchema> properties) {
		final var xmpSchema = new XMPSchema(XMPMetadata.createXMPMetadata(), PDF_A_SCHEMA, PDF_A_SCHEMA, PDF_A_SCHEMA);
		xmpSchema.setTextPropertyValue("schema", schema);
		xmpSchema.setTextPropertyValue("namespaceURI", namespace);
		xmpSchema.setTextPropertyValue("prefix", prefix);
		for (XMPSchema property : properties) {
			xmpSchema.addUnqualifiedSequenceValue("property", property);
		}
		return xmpSchema;
	}
}
