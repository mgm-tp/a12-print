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
const { resolve, join } = require("node:path");

const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

const context = join(__dirname);
const config = {
	mode: "development",
	context,
	entry: join(context, "src/main/typescript/internal/ui/TypesettingApp.tsx"),
	devtool: "source-map",
	devServer: {
		hot: false,
		host: "0.0.0.0",
		compress: false,
		port: 9011,
		static: [
			{
				directory: join(context, "target"),
				watch: true,
			},
		],
		devMiddleware: {
			publicPath: "/",
		},
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: [
					{
						loader: "ts-loader",
						options: {
							transpileOnly: true,
						},
					},
				],
				exclude: /node_modules/,
			},
			{
				test: /\.js$/,
				enforce: "pre",
				use: ["source-map-loader"],
			},
			{
				test: /\.css$/,
				use: ["style-loader", "css-loader"],
			},
			{
				test: /\.(png|svg|jpg|jpeg|gif)$/i,
				type: "asset",
			},
			{
				test: /\.(woff|woff2|eot|ttf|otf)$/i,
				type: "asset/resource",
				generator: {
					filename: "static/media/[hash][ext][query]",
				},
			},
		],
	},
	stats: {
		errorDetails: true,
	},
	output: {
		pathinfo: false,
		path: join(context, "build"),
		assetModuleFilename: "assets/static/[name].[ext][query]",
		publicPath: "/",
	},
	performance: {
		hints: false,
	},
	plugins: [
		// Typescript type checking
		new ForkTsCheckerWebpackPlugin(),
		// minify
		new MiniCssExtractPlugin({
			filename: "assets/css/[name].css",
		}),
		new HtmlWebpackPlugin({
			filename: "index.html",
			template: join(context, "src/main/typescript/internal/ui/index.html"),
		}),
	],
	resolveLoader: {
		modules: [join(context, "node_modules"), join(context, "node_modules", ".pnpm", "node_modules")],
	},
	resolve: {
		alias: {
			// This is required to make the workflows library's Redux store resolve to the showcase store
			// during dev (i.e. while using npm link)
			"react-redux": resolve("./node_modules/react-redux"),
			// This is required to avoid "invalid hook call" errors due to different React dependencies
			// being used during dev (i.e. while using npm link)
			// @see https://github.com/facebook/react/issues/13991#issuecomment-435587809
			react: resolve("./node_modules/react"),
			// Prevent that lodash.min is bundled, see https://github.com/lodash/lodash/issues/3079
			"./lodash.min": "lodash/lodash.js",
			"styled-components": resolve("./node_modules/styled-components"),
		},
		extensionAlias: {
			".js": [".ts", ".tsx", ".js"],
		},
		extensions: [".tsx", ".ts", ".js", ".json", ".styl", ".css", ".txt"],
	},
};

module.exports = config;
