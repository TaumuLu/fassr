import findUp from 'find-up';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { ASSETS_MANIFEST, RUNTIME_NAME } from '../lib/constants';
import { IConfig } from '../lib/types';
import { deleteCache, fileterJsAssets, log, printAndExit } from './lib/utils';
import { setWebpackConfig } from './lib/webpack-runtime';

const _DEV_ = process.env.NODE_ENV !== 'production';

const defaultConfig: IConfig = {
  isSpa: true,
  output: './public',
  outputDir: null,
  excludeRouteRegs: [/\/api\/.*/],
  purgeModuleRegs: [/node_modules\/lissom/],
  dir: '.',
  dev: _DEV_,
  staticMarkup: false,
  generateEtags: true,
  quiet: false,
  requireModules: ['superagent'],
  ignoreModules: ['babel-polyfill'],
  clientRender: true,
  elementId: null,
  entry: null,
};

class Config {
  private _isCheck: boolean;
  private _config: IConfig;
  private _assetsConfig: any;
  constructor() {
    this._config = { ...defaultConfig };
  }

  public setAssetsConfig() {
    this._assetsConfig = parseAssetsManifest(this._config);
    setWebpackConfig(this._assetsConfig);
  }

  public getAssetsConfig() {
    return this._assetsConfig;
  }

  public check() {
    this._isCheck = true;
    const { dev, outputDir } = this._config;
    if (!existsSync(outputDir)) {
      printAndExit(
        `> No such directory exists as the project root: ${outputDir}`
      );
    }
    // dev模式下延迟执行解析资源文件
    if (dev) {
      this.setAssetsConfig();
    }
  }

  public init(options: IConfig) {
    const { dev, dir, output } = this.set(options);
    if (!output) {
      printAndExit('> "output" config is required');
    }
    const outputDir = resolve(output);
    this.set({ outputDir, dir: resolve(dir) });
    if (!dev) {
      this.check();
      this.setAssetsConfig();
    }
    log('init config', JSON.stringify(this._config));

    return this._config;
  }

  public get() {
    const { dev } = this._config;
    if (dev || !this._isCheck) this.check();

    return this._config;
  }

  public set(options: IConfig) {
    const { _config } = this;
    // 合并操作
    const purgeModuleRegs = _config.purgeModuleRegs.concat(
      options.purgeModuleRegs || []
    );
    this._config = { ..._config, ...options, purgeModuleRegs };

    return this._config;
  }
}

export default new Config();

const parseAssetsManifest = (config: IConfig) => {
  const { dev, entry, outputDir } = config;
  const assetsManifestPath = findUp.sync(ASSETS_MANIFEST, { cwd: outputDir });
  if (!assetsManifestPath || !assetsManifestPath.length) {
    printAndExit('> Your webpack config does not use lissom/webpack wrapping');
  }
  if (dev) {
    deleteCache(assetsManifestPath);
  }
  const assetsManifest = require(assetsManifestPath);
  const {
    entrypoints,
    HtmlWebpackPlugin,
    outputPath,
    modules,
    chunks,
  } = assetsManifest;
  const routers = getRouters(entrypoints, outputPath, entry);
  const htmlConfig = getHtmlConfig(HtmlWebpackPlugin, outputPath);
  const entryNames = Object.keys(entrypoints).map(getPathName);

  return {
    routers,
    entryNames,
    htmlConfig,
    outputPath,
    modules,
    chunks,
  };
};

const getPathName = (name: string) => {
  return name.charAt(0) === '/' ? name : `/${name}`;
};

const getRouters = (entrypoints, outputPath: string, entry: string) => {
  return Object.keys(entrypoints).reduce(
    (p, key, i) => {
      const { chunks, assets: originAssets } = entrypoints[key];
      const assets = fileterJsAssets(originAssets);

      const router = {
        name: key,
        chunks: chunks.filter(name => name !== RUNTIME_NAME),
        assets,
        existsAts: assets.map(path => resolve(outputPath, path)),
        size: assets.length,
      };
      if (i === 0) {
        p._default = router;
      }
      if (key === entry) {
        p.default = router;
      }
      const page = getPathName(key);

      return {
        ...p,
        [page]: router,
      };
    },
    { default: null, _default: null }
  );
};

const readHtml = (existsAt: string) => {
  if (!existsSync(existsAt)) {
    const message = `Could not find a valid html file in the '${existsAt}' path!`;
    printAndExit(message);
  }
  const html = readFileSync(existsAt, 'utf8');
  return html;
};

const getHtmlConfig = (HtmlWebpackPlugin, outputPath: string) => {
  const [htmlConfig] = HtmlWebpackPlugin;
  const { childCompilationOutputName } = htmlConfig;
  const existsAt = resolve(outputPath, childCompilationOutputName);
  const html = readHtml(existsAt);

  return {
    ...htmlConfig,
    html,
    existsAt,
  };
};
