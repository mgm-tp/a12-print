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
<#-- @ftlvariable name="engine" type="com.mgmtp.a12.print.engine.runtime.codegen.internal.ResolveOverloadGenerator.PrintEngineCodeGenModel" -->
package com.mgmtp.a12.print.engine.runtime.internal.generated;

import lombok.*;

import java.util.stream.Stream;
import java.util.function.Function;

import com.mgmtp.a12.print.engine.api.PrintJob;
import com.mgmtp.a12.print.engine.api.PrintEngine;
import com.mgmtp.a12.print.engine.api.PrintResult;
import com.mgmtp.a12.print.engine.runtime.internal.ValueFactory;
import com.mgmtp.a12.print.engine.runtime.internal.GenericDependencyValueProvider;
import com.mgmtp.a12.print.engine.runtime.internal.generated.Internal${engine.getRuntimeResultType()}PrintEngineRuntime;

@AllArgsConstructor
@Builder(toBuilder = true, setterPrefix = "with", builderMethodName = "factory", builderClassName= "Builder")
public class Internal${engine.getRuntimeResultType()}PrintEngineRuntimeApiFactory<Job extends PrintJob, Engine extends PrintEngine<?>> {

	public com.mgmtp.a12.print.engine.runtime.internal.generated.Internal${engine.getRuntimeResultType()}PrintEngineRuntimeApi build(Job job, Engine engine, Internal${engine.getRuntimeResultType()}PrintEngineRuntime runtime) {
		return new Bound(job, engine, runtime);
	}

	// GenericDependencyValueProvider
	<#list engine.getRuntimeDependencies() as dependency >
		private GenericDependencyValueProvider<${dependency.getValue()}, ${dependency.getDependency()}, ? super Job, ? super Engine, Internal${engine.getRuntimeResultType()}PrintEngineRuntime> ${dependency.getProvider()};
	</#list>

<#list engine.getStreamDependencies() as dependency >
		private GenericDependencyValueProvider<${dependency.getValue()}, ${dependency.getDependency()}, ? super Job, ? super Engine, Internal${engine.getRuntimeResultType()}PrintEngineRuntime> ${dependency.getProvider()};
	</#list>

	public Internal${engine.getRuntimeResultType()}PrintEngineRuntimeApiFactory<Job, Engine> postProcess(Function<GenericDependencyValueProvider<?, ?, ? super Job, ? super Engine, ? extends InternalCorePrintEngineRuntime>, GenericDependencyValueProvider<?, ?, ? super Job, ? super Engine, ? extends InternalCorePrintEngineRuntime>> map) {
		<#list engine.getRuntimeDependencies() as dependency >
		this.${dependency.getProvider()} = (GenericDependencyValueProvider<${dependency.getValue()}, ${dependency.getDependency()}, ? super Job, ? super Engine, Internal${engine.getRuntimeResultType()}PrintEngineRuntime>)map.apply(this.${dependency.getProvider()});
		</#list>
		<#list engine.getStreamDependencies() as dependency >
		this.${dependency.getProvider()} = (GenericDependencyValueProvider<${dependency.getValue()}, ${dependency.getDependency()}, ? super Job, ? super Engine, Internal${engine.getRuntimeResultType()}PrintEngineRuntime>)map.apply(this.${dependency.getProvider()});
		</#list>
		return this;
	}

	@AllArgsConstructor
	private class Bound implements com.mgmtp.a12.print.engine.runtime.internal.generated.Internal${engine.getRuntimeResultType()}PrintEngineRuntimeApi {

			private final Job job;
			private final Engine engine;
			private final Internal${engine.getRuntimeResultType()}PrintEngineRuntime runtime;

			<#list engine.getRuntimeDependencies() as dependency >
				@Override
				public ValueFactory<${dependency.getValue()}> provide(
						${dependency.getDependency()} dependency
				) {
					return ${dependency.getProvider()}.produce(dependency, job, engine, runtime);
				}
			</#list>

<#list engine.getStreamDependencies() as dependency >
				@Override
				public Stream<${dependency.getValue()}> stream${dependency.getSimpleName()}(
					Stream<${dependency.getDependency()}> dependency
				) {
					return dependency.map(e -> ${dependency.getProvider()}.produce(e, job, engine, runtime).get());
				}
			</#list>

	}


}
