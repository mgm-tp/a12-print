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
rootProject.name = "print"

include("test-app")
include("codemod")
include("documentation")
include("engine-api")
include("engine-runtime")
include("engine-runtime-codegen")
include("engine-runtime-kernel")
include("engine-runtime-test")
include("engine-runtime-xml")
include("model-api")
include("model-api-codegen")
include("model-api-utils")
include("model-document")
include("model-editor-component")
include("model-migration")
include("print-dev-tools")
include("print-fonts")
include("print-shell")
include("print-workspace")
include("typesetting")

dependencyResolutionManagement {
	versionCatalogs {
		create("thirdPartyLibs", Action {
			from(files("./gradle/thirdPartyLibs.versions.toml"))
		})
		create("a12Libs", Action {
			from(files("./gradle/a12Libs.versions.toml"))
		})
	}
}

