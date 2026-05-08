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
import { ReactElement } from "react";

import { BulletList } from "@com.mgmtp.a12.widgets/widgets-core/lib/bullet-list/index.js";
import { MessageBox } from "@com.mgmtp.a12.widgets/widgets-core/lib/message-box/index.js";
import { DeepPartialErrorMap } from "@com.mgmtp.a12.print/print-model-api/lib/errors/index.js";

import { useDefaultLocalizer } from "../../localization/localizer.js";
import { PrintSettingModel } from "../../../api/model/print-setting-model.js";

const { Item, Ordered, Unordered } = BulletList;

interface ErrorNotificationProps {
	errorMap: DeepPartialErrorMap<PrintSettingModel>;
}

export function ErrorNotification({ errorMap }: ErrorNotificationProps): ReactElement {
	const errors = errorMap["@error"];
	const localizer = useDefaultLocalizer();

	return (
		<MessageBox
			label={
				<Ordered>
					{errors.map((error, index) => {
						const { jsonPath, errorMessage } = error;
						return (
							<Item key={index}>
								{jsonPath.map(element => `${element.elementName}[${element.index}]`).join("/")}
								<Unordered>
									{errorMessage.map(message => {
										return <Item key={message.key}>{localizer(message)}</Item>;
									})}
								</Unordered>
							</Item>
						);
					})}
				</Ordered>
			}
		/>
	);
}
