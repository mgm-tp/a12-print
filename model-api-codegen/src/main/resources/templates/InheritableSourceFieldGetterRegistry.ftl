<#--
  ~ SPDX-License-Identifier: EUPL-1.2 OR LicenseRef-commercial
  ~
  ~ Copyright (c) 2012-2026 mgm technology partners GmbH
  ~
  ~ Dual License
  ~ ------------
  ~ This source file is part of the mgm A12 Platform and available under
  ~ a choice of two different licenses:
  ~
  ~ 1. Open-Source License - EUPL v1.2
  ~    You may redistribute and/or modify this file under the terms of the
  ~    European Union Public License, version 1.2 - see https://eupl.eu/.
  ~
  ~ 2. Commercial License
  ~    Alternatively, you may obtain a commercial license from
  ~    mgm technology partners GmbH, that permits use of this software
  ~    under different terms (including support and maintenance services).
  ~
  ~    Please contact a12-license@mgm-tp.com for more information.
  ~
  ~ You must select and comply with exactly one of the above license options.
  ~
  ~ Warranty Disclaimer (applies to either option)
  ~ ----------------------------------------------
  ~ THIS SOFTWARE IS PROVIDED "AS IS" AND WITHOUT WARRANTY OF ANY KIND,
  ~ WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
  ~ OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  ~ NON-INFRINGEMENT, EXCEPT WHERE SUCH DISCLAIMERS ARE HELD TO BE
  ~ LEGALLY INVALID. SEE THE RESPECTIVE LICENSE TEXT FOR DETAILS.
  -->
package com.mgmtp.a12.print.engine.model.api.model.generated;


import java.lang.reflect.Field;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;

public class InheritableSourceFieldGetterRegistry {

    private static final Map<Class<?>, Map<String, Function<Object, Object>>> REGISTRY = Map.of(
    <#list classes as class>
        ${class.name}.class, Map.of(
        <#list class.fields as field>
            "${field.name}", obj -> ((${class.name}) obj).${field.getter}()<#if field_has_next>,</#if>
        </#list>
        )<#if class_has_next>,</#if>
    </#list>
    );

    private InheritableSourceFieldGetterRegistry() {}

    public static Object getterByFieldName(Object obj, String fieldName) {
        Map<String, Function<Object, Object>> fieldMap = REGISTRY.get(obj.getClass());
        if (fieldMap == null) {
            throw new IllegalArgumentException("No registry for class: " + obj.getClass());
        }
        Function<Object, Object> getter = fieldMap.get(fieldName);
        if (getter == null) {
            throw new IllegalArgumentException("No field: " + fieldName + " in " + obj.getClass());
        }
        return getter.apply(obj);
    }

    public static Object getterByFieldPath(Object obj, String path) {
        String[] paths = path.split("/");
        Object current = obj;

        for (String fieldName : paths) {
            Object result = getterByFieldName(current, fieldName);
            if (result instanceof Optional) {
                Optional<?> optional = (Optional<?>) result;
                if (optional.isPresent()) {
                    current = optional.get();
                } else {
                    return null;
                }
            } else {
                current = result;
            }
        }
        return current;
    }
}
