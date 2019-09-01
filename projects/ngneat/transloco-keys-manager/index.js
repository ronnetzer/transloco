#!/usr/bin/env node
const { buildTranslationFiles } = require('./keysBuilder');
const { findMissingKeys } = require('./keysDetective');
const { toCamelCase } = require('./helpers');
const path = require('path');
const ACTIONS = { EXTRACT: '--extract', FIND_MISSING: '--find-missing' };
const [action, ...argv] = process.argv.slice(2);
const argvMap = argv.reduce((acc, arg, i, arr) => {
  if (arg.includes('--')) {
    const key = toCamelCase(arg.replace('--', ''));
    const isFlag = arr[i + 1] === undefined || arr[i + 1].includes('--');
    acc[key] = isFlag ? true : arr[i + 1];
  }
  return acc;
}, {});
const basePath = path.resolve(process.cwd());
const options = { argvMap, basePath };
switch (action) {
  case ACTIONS.EXTRACT:
    buildTranslationFiles(options);
    break;
  case ACTIONS.FIND_MISSING:
    findMissingKeys(options);
    break;
  default:
    console.log(`No action was passed... quiting`);
}
