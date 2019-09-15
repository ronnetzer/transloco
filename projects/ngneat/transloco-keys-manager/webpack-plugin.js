const { mergeDeep } = require('./transloco-keys-manager/helpers');
const { initProcessParams, extractTemplateKeys, extractTSKeys } = require('./transloco-keys-manager/keysBuilder');
const { compareKeysToFiles } = require('./transloco-keys-manager/keysDetective');
const pkgDir = require('pkg-dir');
const fs = require('fs');

let init = true;
const packageConfig = fs.readFileSync(`${pkgDir.sync()}/package.json`, { encoding: 'UTF-8' });
const config = JSON.parse(packageConfig)['transloco-keys-manager'];
const commonConfig = initProcessParams({}, config.extract);
class TranslocoPlugin {
  apply(compiler) {
    compiler.hooks.watchRun.tapAsync('WatchRun', (comp, cb) => {
      if (init) {
        cb();
        init = false;
        return;
      }
      const keysExtractions = { html: [], ts: [] };
      for (const file of Object.keys(comp.watchFileSystem.watcher.mtimes)) {
        let fileType;
        if (file.endsWith('.html')) {
          fileType = 'html';
        } else if (!file.endsWith('spec.ts') && file.endsWith('.ts')) {
          fileType = 'ts';
        }
        fileType ? keysExtractions[fileType].push(file) : keysExtractions;
      }
      if (keysExtractions.html.length || keysExtractions.ts.length) {
        Promise.all([
          extractTemplateKeys({ ...commonConfig, files: keysExtractions.html }),
          extractTSKeys({ ...commonConfig, files: keysExtractions.ts })
        ]).then(([htmlResult, tsResult]) => {
          const allKeys = mergeDeep({}, htmlResult.keys, tsResult.keys);
          const keysFound = Object.keys(allKeys).some(key => Object.keys(allKeys[key]).length > 0);
          // hold a file map and deep compare?
          keysFound &&
            compareKeysToFiles({ keys: allKeys, i18nPath: config.find.i18n, addMissing: true, prodMode: true });
          cb();
        });
      } else {
        cb();
      }
    });
  }
}
module.exports = {
  plugins: [new TranslocoPlugin()]
};
