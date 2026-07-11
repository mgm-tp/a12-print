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
const Path = require("path");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const VirtualResourcePlugin = require("./virtual-resource-plugin");
const ReactRefreshPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const devServer = require("./dev-server");
const { DefinePlugin } = require("webpack");

const context = Path.join(__dirname);

module.exports = env => {
	return {
		mode: "development",
		devtool: "eval-source-map",
		context,
		entry: {
			devApp: "./src/main/typescript/index.tsx",
		},
		devServer,
		watchOptions: {
			ignored: ["**/*.wal", "**/*.pdf"],
		},
		module: {
			rules: [
				{
					test: /case\.config\.resource\.json$/,
					use: [
						{
							loader: Path.resolve(context, "case-config-loader.cjs"),
						},
					],
				},
				{
					test: /\.[jt]sx?$/,
					exclude: /node_modules/,
					use: [
						{
							loader: require.resolve("babel-loader"),
							options: {
								plugins: [require.resolve("react-refresh/babel")],
							},
						},
					],
					include: Path.resolve(context, "src"),
				},
				{
					test: /\.js$/,
					enforce: "pre",
					exclude: /node_modules/,
					use: ["source-map-loader"],
				},
				{
					test: /\.css$/,
					use: [MiniCssExtractPlugin.loader, "css-loader"],
				},
				{
					test: /\.(png|svg|jpg|jpeg|gif)$/i,
					type: "asset",
				},
				{
					test: /\.(woff|woff2|eot|ttf|otf)$/i,
					type: "asset/resource",
				},
			],
			noParse: /(?:LICENSE)*\.(pdf|wal|spec.ts|txt)$/,
		},
		optimization: {
			moduleIds: "deterministic",
			runtimeChunk: "single",
			splitChunks: {
				cacheGroups: {
					vendor: {
						test: /[\\/]node_modules[\\/]/,
						name: "vendors",
						chunks: "all",
					},
				},
			},
		},
		resolve: {
			alias: {
				modules: ["node_modules"],
				react: Path.resolve("./node_modules/react"),
				"styled-components": Path.resolve("./node_modules/styled-components"),
				"@use-cases": Path.resolve(__dirname, "use-cases"),
			},
			extensions: [".tsx", ".ts", ".js", ".json"],
		},
		output: {
			pathinfo: false,
			path: Path.join(context, "build"),
			filename: "[name].js",
			chunkFilename: "[name].js",
			clean: true,
			assetModuleFilename: "assets/static/[name].[hash][ext][query]",
			publicPath: "/",
		},
		plugins: [
			new CopyWebpackPlugin({
				patterns: [
					{
						from: "node_modules/monaco-editor/min",
						to: "assets/static/vs/min",
					},
					{
						from: "node_modules/monaco-editor/min-maps/",
						to: "assets/static/vs/min-maps",
					},
					{
						from: Path.resolve(__dirname, "../print-fonts/src/test/resources"),
						to: "assets/static",
					},
				],
			}),
			new ReactRefreshPlugin(),
			new VirtualResourcePlugin(),
			new ForkTsCheckerWebpackPlugin(),
			new MiniCssExtractPlugin({
				filename: "assets/css/[name].css",
				chunkFilename: "assets/css/[id].css",
			}),
			new HtmlWebpackPlugin({
				filename: "index.html",
				chunks: ["devApp"],
				template: Path.join(context, "src/main/typescript/index.html"),
				favicon: "public/images/Model-Print.svg",
			}),
			new DefinePlugin({
				"process.env.TEST": JSON.stringify(env.test),
				"process.env.DEBUG": JSON.stringify(env.debug),
			}),
		],
	};
};
