import chalk from 'chalk';
import { posix } from 'path';
import { RUNTIME_NAME } from '../../lib/constants';
import { getDisplayName } from '../../lib/utils';
import config from '../config';

function deleteCache(path: string) {
  delete require.cache[path];
}

function purgeCache(moduleName: string, ignoreModules: string[]) {
  const modPath = require.resolve(moduleName);
  searchCache(modPath, deleteCache, ignoreModules);
  const mConstructor = module.constructor as any;

  Object.keys(mConstructor._pathCache).forEach(cacheKey => {
    if (cacheKey.indexOf(moduleName) > 0) {
      delete mConstructor._pathCache[cacheKey];
    }
  });
}

function searchCache(modPath, callback, ignoreModules = []) {
  const searchMod = modPath && require.cache[modPath];

  if (searchMod !== undefined) {
    (function traverse(mod) {
      const id = mod.id;
      const isExclude = ignoreModules.some(exmod => id.includes(exmod));
      if (!isExclude) {
        mod.children.forEach(child => {
          traverse(child);
        });
      }
      callback(mod.id);
    })(searchMod);
  }
}

function normalizePagePath(page: string) {
  if (page === '/') {
    page = '/index';
  }

  if (page[0] !== '/') {
    page = `/${page}`;
  }

  const resolvedPage = posix.normalize(page);
  if (page !== resolvedPage) {
    const message = 'Requested and resolved page mismatch';
    printAndExit(message);
  }

  return page;
}

const fileterJsAssets = originAssets => {
  return originAssets.filter(path => {
    return /.js($|\?)/.test(path) && !path.includes(RUNTIME_NAME);
  });
};

const fileterCssAssets = originAssets => {
  return originAssets.filter(path => {
    return /.css($|\?)/.test(path) && !path.includes(RUNTIME_NAME);
  });
};

export function print(message: string) {
  const { dev } = config.get();
  if (!dev) return;
  const signMessage = `${chalk.green('[lissom]')} ${message.trim()}`;
  console.log(signMessage);
}

export function log(action: string, message: string, sign: string = 'INFO') {
  let chalkColor;
  switch (sign.toUpperCase()) {
    case 'INFO':
      chalkColor = chalk.cyan;
      break;
    case 'ERROR':
      chalkColor = chalk.red;
      break;
    default:
      chalkColor = chalk.white;
      break;
  }
  print(`${chalk.gray(action)} ${chalkColor(message)}`);
}

export function printAndExit(message: string, code: number = 1) {
  log('exit', message, 'ERROR');

  process.exit(code);
}

export const suffixRegs = [/\.(html|php)/, /\/[^.]*/];

const getRegSourceStr = regs => {
  return regs
    .reduce((p, reg) => {
      if (reg) {
        const type = Object.prototype.toString.call(reg).slice(8, -1);
        if (type === 'RegExp') {
          p.push(reg.source);
        } else {
          p.push(reg.toString());
        }
      }
      return p;
    }, [])
    .join('|');
};

const getReg = (regs = [], matchEnd: boolean = true) => {
  const regTpl = getRegSourceStr(regs);
  let regStr = '';
  if (regTpl) {
    regStr += `(${regTpl})${matchEnd ? '$' : ''}`;
  }
  return new RegExp(regStr);
};

function isResSent(res) {
  return res.finished || res.headersSent;
}

const loadGetInitial = (methodName: string, defaultValue: any = {}) =>
  async function(Component, ctx) {
    if (process.env.NODE_ENV !== 'production') {
      if (Component.prototype && Component.prototype[methodName]) {
        const compName = getDisplayName(Component);
        const message = `'${compName}.${methodName}()' is defined as an instance method`;
        printAndExit(message);
      }
    }

    if (!Component[methodName]) return defaultValue;

    const props = await Component[methodName](ctx);

    if (ctx.res && isResSent(ctx.res)) {
      return props;
    }

    if (!props) {
      const compName = getDisplayName(Component);
      const message = `'${compName}.${methodName}()' should resolve to an object. But found '${props}' instead.`;
      printAndExit(message);
    }

    return props;
  };

const loadGetInitialProps = loadGetInitial('getInitialProps');

const loadGetInitialStyles = loadGetInitial('getInitialStyles', null);

export {
  deleteCache,
  purgeCache,
  normalizePagePath,
  fileterJsAssets,
  fileterCssAssets,
  getRegSourceStr,
  getReg,
  isResSent,
  getDisplayName,
  loadGetInitialProps,
  loadGetInitialStyles,
};
