"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const webpack_sources_1 = require("webpack-sources");
const constants_1 = require("../../lib/constants");
const replaceReg = /Promise\.all\(([^()]*)\)/g;
class ChunksPlugin {
    apply(compiler) {
        compiler.hooks.compilation.tap('ChunksPlugin', (compilation) => {
            compilation.chunkTemplate.hooks.render.tap('ChunksPluginRenderHack', (modules) => {
                const source = new webpack_sources_1.ConcatSource();
                // 支持服务端运行和导出
                source.add(chunkHackCode);
                const replaceStr = modules.children[0].replace(/window/g, constants_1.GLOBAl_VARIABLE);
                modules.children[0] = replaceStr;
                source.add(modules);
                source.add('\n})()');
                return source;
            });
            compilation.mainTemplate.hooks.render.tap('ChunksPluginMainRenderHack', (modules, chunk) => {
                if (chunk.name === constants_1.RUNTIME_NAME) {
                    const source = new webpack_sources_1.ConcatSource();
                    // 替换webpack中的Promise.all参数用于辨别
                    const moduleSource = modules.source().replace(replaceReg, ((_match, pos) => {
                        return `Promise.all(${pos} && ${pos}.length === 0 ? { _isSyncThen: true } : ${pos})`;
                    }));
                    source.add(moduleSource);
                    return source;
                }
                return modules;
            });
        });
    }
}
exports.default = ChunksPlugin;
const chunkHackCode = `(function() {
  if (!Promise._all) {
    Promise._all = Promise.all
    Promise.all = function () {
      function _getType(context) {
        return Object.prototype.toString.call(context).slice(8, -1).toLowerCase()
      }
      function checkValue(arr) {
        if (arr.length > 0) {
          var hasValue = false
          for (var i in arr) {
            var item = arr[i]
            if (!hasValue) {
              var type = _getType(item)
              if (type === 'array') {
                hasValue = checkValue(item)
              } else if(type === 'object' && item._isSyncThen) {
                hasValue = false
              } else {
                hasValue = true
              }
            }
          }
          return hasValue
        }
        return !arr._isSyncThen
      }
      var value = arguments[0]
      if (typeof value === 'object') {
        var isSyncValue = !checkValue(value)
        if(isSyncValue) {
          return {
            _isSyncThen: true,
            then: function(onFulfilled, onRejected) {
              try {
                var module = onFulfilled() || {}
                module.then = Promise.resolve(module)
                module._isSyncModule = true
                return module
              } catch(e) {
                return Promise.reject(onRejected ? onRejected(e) : e)
              }
            }
          }
        }
      }
      return Promise._all.apply(Promise, arguments)
    }
  }
  var ${constants_1.GLOBAl_VARIABLE} = typeof window === "undefined" ? global : window
  return `;
// var _module = typeof module === "undefined" ? {} : module
// var ${GLOBAl_VARIABLE} = typeof window === "undefined" ? global : window
// _module.exports =
//# sourceMappingURL=chunks-plugin.js.map