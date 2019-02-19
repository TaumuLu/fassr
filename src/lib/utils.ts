import { ReactComp } from './types';

export const getType = (value: any) => {
  return Object.prototype.toString
    .call(value)
    .slice(8, -1)
    .toLowerCase();
};

const isTypeFactory = (type: string) => (value: any) => {
  return getType(value) === type;
};

export const isFunction = isTypeFactory('function');

export const isString = isTypeFactory('string');

export const isArray = isTypeFactory('array');

export function isDef(v: any) {
  return v !== undefined && v !== null;
}

export const checkServer = (): boolean =>
  Object.prototype.toString.call(global.process) === '[object process]';

export function interopDefault(mod: any): any {
  return mod.default || mod;
}

export const getDisplayName = (Component: ReactComp) => {
  if (isString(Component)) return Component;

  return Component.displayName || Component.name || 'Unknown Component';
};

type Tpath = string | string[];

const baseGetSet = (path: Tpath): string[] => {
  const type = getType(path);
  switch (type) {
    case 'array':
      return path as string[];
    case 'string':
      return `${path}`.split('.');
    default:
      return [];
  }
};

export const get = (object: any, path: Tpath, defaultValue?: any) => {
  const pathArray = baseGetSet(path);

  return (
    pathArray.reduce((obj, key) => {
      return obj && obj[key] ? obj[key] : null;
    }, object) || defaultValue
  );
};

export const set = (object: any, path: Tpath, value: any) => {
  const pathArray = baseGetSet(path);
  const len = pathArray.length;

  return pathArray.reduce((obj, key, ind) => {
    if (obj && ind === len - 1) {
      obj[key] = value;
    }

    return obj ? obj[key] : null;
  }, object);
};
