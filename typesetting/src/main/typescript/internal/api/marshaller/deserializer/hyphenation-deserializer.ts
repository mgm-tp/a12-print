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
import { Deserializer } from "@com.mgmtp.a12.print/print-model-api-utils/marshaller";

import type * as ModelAPI from "../../../../a12internal/api/model/index.js";
import type * as GeneratedDTO from "../../generated/dto/TypesettingModelDTO.js";

export class InternalDeserializer extends Deserializer<GeneratedDTO.InternalDTO, ModelAPI.Internal> {
	prefix = "internal";

	map(property: keyof GeneratedDTO.InternalDTO, dto: GeneratedDTO.InternalDTO) {
		switch (property) {
			case "hyphenation":
				return this.deserializeOptional(dto.hyphenation, new HyphenationDeserializer(this.path), property);
		}
		this.unknownProperty(property);
	}
}

export class HyphenationDeserializer extends Deserializer<GeneratedDTO.HyphenationDTO, ModelAPI.Hyphenation> {
	prefix = "hyphenation";

	map(property: keyof GeneratedDTO.HyphenationDTO, dto: GeneratedDTO.HyphenationDTO) {
		switch (property) {
			case "general":
				return this.deserializeRequired(dto.general, property, new HyphenationGeneralDeserializer(this.path));
			case "patterns":
				return this.deserializeRepeatable(
					dto.patterns,
					index => new HyphenationPatternDeserializer(this.path, index, true),
					property
				);
			case "exclusions":
				return this.deserializeRepeatable(
					dto.exclusions,
					index => new HyphenationExclusionDeserializer(this.path, index, true),
					property
				);
		}
		this.unknownProperty(property);
	}
}

export class HyphenationGeneralDeserializer extends Deserializer<GeneratedDTO.GeneralDTO, ModelAPI.HyphenationGeneral> {
	prefix = "general";

	map(property: keyof GeneratedDTO.GeneralDTO, dto: GeneratedDTO.GeneralDTO) {
		switch (property) {
			case "title":
				return dto.title;
			case "language":
				return this.deserializeOptional(dto.language, new LanguageDeserializer(this.path), property);
			case "notice":
				return dto.notice;
			case "copyright":
				return dto.copyright;
			case "version":
				return dto.version;
			case "licence":
				return this.getOptional(dto.licence, l => l.text);
			case "source":
				return dto.source;
			case "texlive":
				return this.deserializeOptional(dto.texlive, new TexLiveDeserializer(this.path), property);
			case "hyphenmins":
				return this.deserializeOptional(dto.hyphenmins, new HyphenMinsDeserializer(this.path), property);
			case "authors":
				return this.deserializeRepeatable(
					dto.authors,
					index => new AuthorDeserializer(this.path, index, true),
					property
				);
			case "checksum":
				return dto.checksum;
		}
		this.unknownProperty(property);
	}
}

class LanguageDeserializer extends Deserializer<GeneratedDTO.LanguageDTO, ModelAPI.Language> {
	prefix = "language";

	map(property: keyof GeneratedDTO.LanguageDTO, dto: GeneratedDTO.LanguageDTO) {
		switch (property) {
			case "name":
				return dto.name;
			case "tag":
				return dto.tag;
		}
		this.unknownProperty(property);
	}
}

class TexLiveDeserializer extends Deserializer<GeneratedDTO.TexliveDTO, ModelAPI.TexLive> {
	prefix = "texlive";

	map(property: keyof GeneratedDTO.TexliveDTO, dto: GeneratedDTO.TexliveDTO) {
		switch (property) {
			case "encoding":
				return dto.encoding;
			case "babelname":
				return { _key: "babelName", _value: dto.babelname };
			case "legacy_patterns":
				return dto.legacy_patterns;
			case "message":
				return dto.message;
			case "package":
				return { _key: "texPackage", _value: dto.package };
			case "use_old_patterns_comment":
				return dto.use_old_patterns_comment;
		}
		this.unknownProperty(property);
	}
}

class HyphenMinsDeserializer extends Deserializer<GeneratedDTO.HyphenminsDTO, ModelAPI.HyphenMins> {
	prefix = "hyphenmins";

	map(property: keyof GeneratedDTO.HyphenminsDTO, dto: GeneratedDTO.HyphenminsDTO) {
		switch (property) {
			case "typesetting":
				return this.deserializeRequired(dto.typesetting, property, new TypeSettingDeserializer(this.path));
			case "generation":
				return this.deserializeRequired(dto.generation, property, new GenerationDeserializer(this.path));
		}
		this.unknownProperty(property);
	}
}

class TypeSettingDeserializer extends Deserializer<GeneratedDTO.TypesettingDTO, ModelAPI.TypeSetting> {
	prefix = "typesetting";

	map(property: keyof GeneratedDTO.TypesettingDTO, dto: GeneratedDTO.TypesettingDTO) {
		switch (property) {
			case "left":
				return this.getRequired(dto.left, property);
			case "right":
				return this.getRequired(dto.right, property);
		}
		this.unknownProperty(property);
	}
}

class GenerationDeserializer extends Deserializer<GeneratedDTO.GenerationDTO, ModelAPI.Generation> {
	prefix = "generation";

	map(property: keyof GeneratedDTO.GenerationDTO, dto: GeneratedDTO.GenerationDTO) {
		switch (property) {
			case "left":
				return this.getRequired(dto.left, property);
			case "right":
				return this.getRequired(dto.right, property);
		}
		this.unknownProperty(property);
	}
}

class AuthorDeserializer extends Deserializer<GeneratedDTO.AuthorsDTO, ModelAPI.Author> {
	prefix = "authors";

	map(property: keyof GeneratedDTO.AuthorsDTO, dto: GeneratedDTO.AuthorsDTO) {
		switch (property) {
			case "name":
				return dto.name;
			case "contact":
				return dto.contact;
		}
		this.unknownProperty(property);
	}
}

export class HyphenationPatternDeserializer extends Deserializer<
	GeneratedDTO.PatternsDTO,
	ModelAPI.HyphenationPattern
> {
	prefix = "patterns";

	map(property: keyof GeneratedDTO.PatternsDTO, dto: GeneratedDTO.PatternsDTO) {
		switch (property) {
			case "v":
				return dto.v;
		}
		this.unknownProperty(property);
	}
}

export class HyphenationExclusionDeserializer extends Deserializer<
	GeneratedDTO.ExclusionsDTO | GeneratedDTO.CustomHyphenationExclusionsDTO,
	ModelAPI.HyphenationExclusion
> {
	prefix = "exclusions";

	map(
		property: keyof (GeneratedDTO.ExclusionsDTO | GeneratedDTO.CustomHyphenationExclusionsDTO),
		dto: GeneratedDTO.ExclusionsDTO | GeneratedDTO.CustomHyphenationExclusionsDTO
	) {
		switch (property) {
			case "word":
				return dto.word;
			case "index":
				return this.deserializeRepeatable(
					dto.index,
					index => new IndexDeserializer(this.path, index, true),
					property
				);
		}
		this.unknownProperty(property);
	}
}

class IndexDeserializer extends Deserializer<GeneratedDTO.IndexDTO, ModelAPI.Index> {
	prefix = "index";

	map(property: keyof GeneratedDTO.IndexDTO, dto: GeneratedDTO.IndexDTO) {
		switch (property) {
			case "v":
				return dto.v;
		}
		this.unknownProperty(property);
	}
}
