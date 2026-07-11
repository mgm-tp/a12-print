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
package com.mgmtp.a12.print.typesetting.internal.model.impl;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import tools.jackson.databind.annotation.JsonDeserialize;
import com.mgmtp.a12.print.typesetting.internal.model.*;
import com.mgmtp.a12.print.typesetting.internal.model.deserializer.AuthorDeserializer;
import com.mgmtp.a12.print.typesetting.internal.model.deserializer.LicenceDeserializer;
import com.mgmtp.a12.print.typesetting.internal.model.deserializer.CleanupStringDeserializer;
import lombok.*;
import lombok.experimental.NonFinal;

import java.util.ArrayList;
import java.util.List;

@Value
@NoArgsConstructor(force = true, access = AccessLevel.PROTECTED)
@JsonIgnoreProperties(ignoreUnknown = true)
public class HyphenationGeneralDto implements HyphenationGeneral {

	@JsonProperty(value = "title", required = true)
	String title;

	@JsonProperty(value = "language", required = true)
	@JsonDeserialize(as = LanguageDto.class)
    Language language;

	@JsonProperty(value = "notice")
	@JsonDeserialize(using = CleanupStringDeserializer.class)
	String notice;

	@JsonProperty(value = "copyright")
	String copyright;

	@JsonProperty(value = "version")
	String version;

	@JsonProperty(value = "licence")
	@JsonDeserialize(using = LicenceDeserializer.class)
    Licence licence;

	@JsonProperty(value = "source")
	String source;

	@JsonProperty(value = "texlive")
	@JsonDeserialize(as = TexLiveDto.class)
    TexLive texLive;

	@JsonProperty(value = "hyphenmins")
	@JsonDeserialize(as = HyphenMinsDto.class)
    HyphenMins hyphenMins;

	@JsonProperty(value = "authors")
	@JsonDeserialize(contentUsing = AuthorDeserializer.class)
	List<Author> authors = new ArrayList<>();

	@NonFinal
	@JsonProperty(value = "checksum")
	String checksum;

	@Override
	public void setChecksum(String checksum) {
		this.checksum = checksum;
	}
}
