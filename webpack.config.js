const fs = require('fs');
const path = require('path');
const glob = require('glob');
const webpack = require('webpack');

// Share plguins
const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const PurgecssPlugin = require('purgecss-webpack-plugin');

// Dev plugins
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

// Prod plugins
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const SafeParser = require('postcss-safe-parser');
const CompressionPlugin = require('compression-webpack-plugin');
const BrotliPlugin = require('brotli-webpack-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');

const getEnvironmentVariables = (evnName) => {
  const dotenvFiles = [`.env.${evnName}.local`, `.env.${evnName}`, '.env'];
  const environmentVariables = { NODE_ENV: evnName };

  dotenvFiles.forEach(dotenvFile => {
    if (fs.existsSync(dotenvFile)) {
      const envConfig = dotenv.config({ path: dotenvFile });

      dotenvExpand(envConfig);

      if (envConfig.parsed) {
        Object.keys(envConfig.parsed).forEach(
          key => (environmentVariables[`${key}`] = envConfig.parsed[key])
        );
      }
    }
  });

  const paths = {
    src: path.resolve(__dirname, 'src'),
    dist: path.resolve(__dirname, 'dist'),
    public: path.resolve(__dirname, 'public'),
    entry: path.resolve(__dirname, 'src', 'main.tsx'),
    publicPath: process.env.PUBLIC_PATH || '/',

    // dev server
    https: process.env.HTTPS || false,
    host: process.env.HOST || '0.0.0.0',
    port: process.env.PORT || 3000
  };

  environmentVariables['PUBLIC_PATH'] = paths.publicPath;

  const processEnv = {
    'process.env': Object.keys(environmentVariables).reduce((env, key) => {
      env[key] = JSON.stringify(environmentVariables[key]);

      return env;
    }, {})
  };

  return {
    paths,
    environmentVariables,
    processEnv
  };
};

const getStyleLoaders = isDevEnv => {
  if (isDevEnv) {
    return {
      test: /\.(sa|sc|c)ss$/,
      use: ['style-loader', 'css-loader', 'sass-loader']
    };
  }

  return {
    test: /\.(sa|sc|c)ss$/,
    use: [
      MiniCssExtractPlugin.loader,
      {
        loader: 'css-loader',
        options: {
          importLoaders: 1,
          sourceMap: false
        }
      },
      {
        loader: 'postcss-loader',
        options: {
          ident: 'postcss',
          plugins: () => [
            require('postcss-flexbugs-fixes'),
            require('postcss-preset-env')({
              autoprefixer: {
                flexbox: 'no-2009'
              },
              stage: 3
            })
          ],
          sourceMap: false
        }
      },
      {
        loader: 'sass-loader',
        options: {
          sourceMap: false
        }
      }
    ]
  };
};

module.exports = (env, argv) => {
  process.env.NODE_ENV = argv.mode;
  process.env.BABEL_ENV = argv.mode;
  const isDevEnv = argv.mode === 'development' ? true : false;

  const { paths, environmentVariables, processEnv } = getEnvironmentVariables(argv.mode);

  const config = {
    mode: argv.mode,
    entry: paths.entry,
    output: {
      filename: `static/js/[name]${isDevEnv ? '' : '.[contenthash:8]'}.js`,
      chunkFilename: `static/js/[name]${isDevEnv ? '' : '.[contenthash:8]'}.chunk.js`,
      path: paths.dist,
      pathinfo: isDevEnv,
      publicPath: paths.publicPath
    },
    module: {
      strictExportPresence: true,
      rules: [
        // Disable require.ensure as it's not a standard language feature.
        {
          parser: {
            requireEnsure: false
          }
        },
        {
          enforce: 'pre',
          exclude: /node_modules/,
          include: /src/,
          test: /\.(j|t)sx?$/,
          loader: 'eslint-loader'
        },
        {
          oneOf: [
            {
              exclude: /node_modules/,
              include: /src/,
              test: /\.(j|t)sx?$/,
              use: {
                loader: 'babel-loader'
              }
            },
            getStyleLoaders(isDevEnv),
            {
              test: /\.(bmp|gif|jpe?g|png|svg)$/,
              use: {
                loader: 'url-loader',
                options: {
                  limit: 10000,
                  name: 'static/media/[name].[contenthash:8].[ext]'
                }
              }
            },
            {
              exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
              use: {
                loader: 'file-loader',
                options: {
                  name: 'static/media/[name].[contenthash:8].[ext]'
                }
              }
            }
          ]
        }
      ]
    },
    resolve: {
      modules: ['node_modules', 'src'],
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
    },
    performance: false,
    target: 'web',
    bail: !isDevEnv,
    cache: true,
    stats: {
      colors: true,
      errors: true,
      modules: false
    },
    plugins: [
      !isDevEnv && new CleanWebpackPlugin(),
      new webpack.ProgressPlugin(),
      new HtmlWebpackPlugin({
        inject: true,
        template: './public/index.html',
        baseUrl: paths.publicPath,
        minify: isDevEnv
          ? false
          : {
              removeComments: true,
              collapseWhitespace: true,
              removeRedundantAttributes: true,
              useShortDoctype: true,
              removeEmptyAttributes: true,
              removeStyleLinkTypeAttributes: true,
              keepClosingSlash: true,
              minifyJS: true,
              minifyCSS: true,
              minifyURLs: true
            },
        templateParameters: environmentVariables
      }),
      new webpack.DefinePlugin(processEnv),
      !isDevEnv &&
        new CopyPlugin([
          {
            from: paths.public,
            to: paths.dist,
            ignore: ['index.html']
          }
        ]),
      new MiniCssExtractPlugin({
        filename: `static/css/[name]${isDevEnv ? '' : '.[contenthash:8]'}.css`,
        chunkFilename: `static/css/[name]${isDevEnv ? '' : '.[contenthash:8]'}.chunk.css`
      }),
      new PurgecssPlugin({
        paths: glob.sync(`${paths.src}/**/*`, { nodir: true })
      }),
      isDevEnv && new webpack.NamedModulesPlugin(),
      isDevEnv && new webpack.HotModuleReplacementPlugin(),
      isDevEnv && new CaseSensitivePathsPlugin(),
      isDevEnv && new BundleAnalyzerPlugin(),
      !isDevEnv &&
        new CompressionPlugin({
          filename: '[path].gz[query]',
          algorithm: 'gzip',
          test: /\.(js|css|html)$/,
          threshold: 10240,
          minRatio: 0.99
        }),
      !isDevEnv &&
        new BrotliPlugin({
          asset: '[path].br[query]',
          test: /\.(js|css|html)$/,
          threshold: 10240,
          minRatio: 0.99
        }),
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      !isDevEnv &&
        new WorkboxPlugin.GenerateSW({
          clientsClaim: true,
          exclude: [/\.map$/, /\.gz$/],
          // importWorkboxFrom: 'cdn',
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [new RegExp('^/_'), new RegExp('/[^/]+\\.[^/]+$')],
          swDest: 'service-worker.js',
          skipWaiting: true
          // precacheManifestFilename: 'precache-manifest.[manifestHash].js'
        })
    ].filter(Boolean),
    optimization: {
      removeAvailableModules: true,
      removeEmptyChunks: true,
      mergeDuplicateChunks: true,
      // usedExports: true,
      // sideEffects: true,
      minimize: !isDevEnv,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            parse: {
              ecma: 8
            },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2
            },
            mangle: {
              safari10: true
            },
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true
            }
          },
          parallel: true,
          cache: true,
          sourceMap: false
        }),
        new OptimizeCssAssetsPlugin({
          cssProcessorOptions: {
            parser: SafeParser,
            map: false,
            discardComments: {
              removeAll: true
            }
          }
        })
      ],
      splitChunks: {
        cacheGroups: {
          vendor: {
            test: /[\\\/]node_modules[\\\/]/,
            name: 'vendors',
            chunks: 'all',
            reuseExistingChunk: true
          }
        }
      },
      runtimeChunk: 'single'
    },
    node: {
      node: 'empty',
      module: 'empty',
      dgram: 'empty',
      dns: 'mock',
      fs: 'empty',
      http2: 'empty',
      net: 'empty',
      tls: 'empty',
      child_process: 'empty'
    }
  };

  if (isDevEnv) {
    config.devtool = 'cheap-module-source-map';
    config.output.devtoolModuleFilenameTemplate = info =>
      path.resolve(info.absoluteResourcePath).replace(/\\/g, '/');

    config.devServer = {
      compress: true,
      contentBase: paths.src,
      disableHostCheck: true,
      historyApiFallback: true,
      https: paths.https,
      host: paths.host,
      hot: true,
      inline: true,
      open: true,
      overlay: true,
      port: paths.port,
      public: `http://localhost:${paths.port}`,
      publicPath: paths.publicPath,
      stats: {
        colors: true,
        errors: true,
        modules: false
      },
      useLocalIp: true,
      watchContentBase: false
    };
  }

  return config;
};
