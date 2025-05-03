/* eslint-disable @typescript-eslint/no-var-requires */
//
//  Copyright (c) 2023 John Toebes
//
//  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
//
//  1. Redistributions of source code must retain the above copyright notice,
//     this list of conditions and the following disclaimer.
//
//  2. Redistributions in binary form must reproduce the above copyright notice,
//     this list of conditions and the following disclaimer in the documentation
//     and/or other materials provided with the distribution.
//
//  3. Neither the name of the copyright holder nor the names of its contributors
//     may be used to endorse or promote products derived from this software
//     without specific prior written permission.
//
//  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS “AS IS” AND
//  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
//  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED.
//  IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
//  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
//  BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
//  DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
//  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
//  OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
//  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
const path = require('path');
const webpack = require('webpack');
const FileManagerPlugin = require('filemanager-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const package = require('./package.json');
const { deserialize } = require('v8');
const toolsVersion = package.version;
const datebuilt = new Date().toLocaleString();

const app = path.resolve(__dirname, 'app');
const dist = path.resolve(__dirname, 'dist');
const dist_api = path.resolve(dist, 'api');
const server = path.resolve(__dirname, 'server');

process.traceDeprecation = true;

config = {
    stats: 'errors-warnings',
    mode: 'production',
    context: __dirname,
    entry: [path.join(app, 'main.ts')],
    output: {
        path: dist,
        publicPath: '',
        filename: '[name]-[fullhash].js',
        libraryTarget: 'umd',
        library: 'MyLib',
        umdNamedDefine: true,
        devtoolModuleFilenameTemplate: '[absolute-resource-path]',
        clean: false,
    },
    resolve: {
        modules: [__dirname, path.join(__dirname, 'node_modules')],
        extensions: ['.ts', '.tsx', '.js', '.css', '.eot', '.png', '.svg', '.json'],
    },
    module: {
        rules: [
            // For the typescript files, we don't want anything in the node_modules directory
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                options: {
                    transpileOnly: true,
                },
                include: [
                    app,
                    path.resolve(__dirname, 'node_modules', 'onshape-typescript-fetch'),
                ],
            },
            // All .css files are processed with the css-loader, style-loader
            {
                test: /\.css$/,
                include: __dirname,
                use: ['style-loader', 'css-loader'],
            },
            // All .svg files are inlined
            {
                test: /\.svg$/,
                type: 'asset/source',
            },
        ],
    },
    plugins: [
        new FileManagerPlugin({
            events: {
                onStart: [
                    {
                        delete: [dist],
                    },
                    { mkdir: [dist, dist_api] },
                    {
                        copy: [
                            {
                                source: path.resolve(server, '*'),
                                destination: dist,
                            },
                            {
                                source: path.resolve(server, 'api', '*'),
                                destination: dist_api,
                            },
                            {
                                source: path.resolve(app, 'static', '*'),
                                destination: dist
                            },
                            {
                                source: path.resolve(__dirname, 'app_settings.json'), // Include app_settings.json from working directory
                                destination: path.resolve(dist, 'app_settings.json'), // Copy to /server in dist
                            }
                        ],
                    },
                ],
            },
        }),
        new webpack.DefinePlugin({
            __VERSION__: JSON.stringify(toolsVersion),
            __DATE_BUILT__: JSON.stringify(datebuilt),
        }),
        new HtmlWebpackPlugin({
            inject: false,
            filename: 'index.html',
            template: path.join(__dirname, 'app', 'index.html'),
            title: 'Onshape Oauth Example',
        })
    ],
};

module.exports = (env, argv) => {
    if (argv.mode === 'development') {
        config.mode = 'development';
        config.devtool = 'inline-source-map';
        // see https://intellij-support.jetbrains.com/hc/en-us/community/posts/206339799-Webstorm-Webpack-debugging
        config.plugins.push(
            new webpack.SourceMapDevToolPlugin({
                filename: '[file].map',
            })
        );
        console.log('Building Development');
    }

    if (env.analyze) {
        config.plugins.push(new BundleAnalyzerPlugin());
    }
    return config;
};
