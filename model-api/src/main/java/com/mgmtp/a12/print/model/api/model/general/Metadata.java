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
package com.mgmtp.a12.print.model.api.model.general;

import com.mgmtp.a12.print.model.api.model.element.base.ComputationAlternative;
import com.mgmtp.a12.print.model.api.model.PrintModelEntity;
import com.mgmtp.a12.print.model.api.model.element.base.internal.LogicComponent;
import com.mgmtp.a12.print.model.api.model.element.base.internal.LogicContainer;

import java.util.List;
import java.util.stream.Stream;

public interface Metadata extends PrintModelEntity {
	String getModel();
	List<ComputationAlternative> getTitleComputation();
	List<ComputationAlternative> getDescriptionComputation();
	List<ComputationAlternative> getAuthorComputation();
	List<ComputationAlternative> getLanguageComputation();

	default MetadataLogicContainer getTitleLogicContainer() {
		return new MetadataLogicContainer(this, MetadataField.TITLE);
	}
	default MetadataLogicContainer getDescriptionLogicContainer() {
		return new MetadataLogicContainer(this, MetadataField.DESCRIPTION);
	}
	default MetadataLogicContainer getAuthorLogicContainer() {
		return new MetadataLogicContainer(this, MetadataField.AUTHOR);
	}
	default MetadataLogicContainer getLanguageLogicContainer() {
		return new MetadataLogicContainer(this, MetadataField.LANGUAGE);
	}

	enum MetadataField {
		TITLE,
		DESCRIPTION,
		AUTHOR,
		LANGUAGE
	}

	class MetadataLogicContainer implements LogicContainer {
		private final Metadata metadata;
		private final MetadataField field;

		public MetadataLogicContainer(Metadata metadata, MetadataField field) {
			this.metadata = metadata;
			this.field = field;
		}

		public Metadata getMetadata() {
			return metadata;
		}

		public MetadataField getField() {
			return field;
		}

		@Override
		public String getId() {
			return metadata.getId() + "_" + field.name().toLowerCase();
		}

		@Override
		public Stream<LogicComponent> logicComponents() {
			List<ComputationAlternative> computations = switch (field) {
				case TITLE -> metadata.getTitleComputation();
				case DESCRIPTION -> metadata.getDescriptionComputation();
				case AUTHOR -> metadata.getAuthorComputation();
				case LANGUAGE -> metadata.getLanguageComputation();
			};
			return computations.stream().map(e -> e);
		}
	}
}
