import ParseHtml from '../server/lib/parse-html';

export type ReactComp<P = {}> = React.ComponentClass<P> | React.SFC<P>;

export interface IConfig {
  // isSpa?: boolean;
  output?: string;
  outputDir?: string; // auto generate
  excludeRouteRegs?: Array<RegExp | string>;
  purgeModuleRegs?: Array<RegExp | string>;
  dir?: string;
  dev?: boolean;
  staticMarkup?: boolean;
  generateEtags?: boolean;
  quiet?: boolean;
  requireModules?: string[];
  ignoreModules?: string[];
  clientRender?: boolean;
  entry?: string;
  rootAttr?: { [attr: string]: string };
}

export interface IAssetsConfig {
  routers: IRouters;
  parseHtml: ParseHtml;
  outputPath: string;
  modules: IModules;
  chunks: IChunks;
}

export interface IRouter {
  assets: string[];
  chunks: string[];
  existsAts: string[];
  name: string;
  size: number;
}

export interface IRouters {
  [router: string]: IRouter;
}

export interface IHtmlWebpackPlugin {
  assetJson: string[];
  childCompilationOutputName: string;
}

export interface IModules {
  [module: string]: {
    issuerId: string;
    name: string;
  };
}

export interface IChunks {
  [chunk: string]: {
    entry: boolean;
    files: string[];
    hash: string;
    initial: boolean;
    names: string[];
  };
}

export interface IEntrypoints {
  [entry: string]: {
    chunks: string[];
    assets: string[];
    children: any;
    childAssets: any;
  };
}

export interface IQuery {
  [key: string]: string;
}

export interface ICtx {
  error: any;
  req: any;
  res: any;
  pathname: string;
  query: IQuery;
  asPath: string;
}

export interface ISSRData {
  props: any;
  asyncProps: any;
  pathname: string;
  clientRender: boolean;
  rootAttr: IConfig['rootAttr'];
}
