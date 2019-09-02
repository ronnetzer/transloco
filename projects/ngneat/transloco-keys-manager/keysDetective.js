#!/usr/bin/env node
const fs = require('fs');
const promptDirectory = require('inquirer-directory');
const inquirer = require('inquirer');
const { buildKeys, getScopesMap, readFile } = require('./keysBuilder');
const [localLang] = require('os-locale')
  .sync()
  .split('-');
const messages = require('./messages').getMessages(localLang);
const ora = require('ora');
const glob = require('glob');
const chalk = require('chalk');
const { regexs } = require('./regexs');
const { DeepDiff } = require('deep-diff');
let spinner;

inquirer.registerPrompt('directory', promptDirectory);

const queries = basePath => [
  {
    type: 'directory',
    name: 'src',
    message: messages.src,
    basePath
  },
  {
    type: 'directory',
    name: 'i18n',
    message: messages.translationsLocation,
    basePath
  },
  {
    type: 'confirm',
    default: false,
    name: 'hasScope',
    message: messages.hasScope
  },
  {
    type: 'file-tree-selection',
    name: 'configPath',
    messages: messages.config
  },
  {
    type: 'confirm',
    default: true,
    name: 'addMissing',
    message: messages.addMissing
  },
  {
    type: 'input',
    name: 'defaultValue',
    default: '""',
    message: messages.defaultValue,
    when: ({ addMissing }) => addMissing
  }
];
const defaultConfig = {
  src: 'src',
  i18n: 'assets/i18n',
  addMissing: true,
  defaultValue: '""'
};

function compareKeysToFiles({ keys, i18nPath }) {
  spinner = ora().start(`${messages.checkMissing} ✨`);
  const result = {};
  /** An array of the existing translation files in the i18n dir */
  const currentFiles = glob.sync(`${i18nPath}/**/*.json`);
  for (const fileName of currentFiles) {
    /** extract the lang name from the file */
    const { scope, fileLang } = regexs.fileLang(i18nPath).exec(fileName).groups;
    /** Read the current file */
    const file = readFile(fileName);
    const diffArr = DeepDiff(scope ? keys[scope.slice(0, -1)] : keys.__global, JSON.parse(file));
    if (diffArr) {
      const lang = `${scope || ''}${fileLang}`;
      result[lang] = {
        missing: [],
        extra: []
      };
      for (const diff of diffArr) {
        switch (diff.kind) {
          case 'D':
            result[lang].missing.push(diff);
            break;
          case 'N':
            result[lang].extra.push(diff);
            break;
        }
      }
    }
  }
  spinner.succeed(`${messages.checkMissing} ✨`);
  console.log('\n              🏁', `\x1b[4m${messages.summary}\x1b[0m`, '🏁');
  const resultFiles = Object.keys(result).filter(rf => {
    const { missing, extra } = result[rf];
    return missing.length || extra.length;
  });
  if (resultFiles.length > 0) {
    for (let i = 0; i < resultFiles.length; i++) {
      const { missing, extra } = result[resultFiles[i]];
      const hasMissing = missing.length > 0;
      const hasExtra = extra.length > 0;
      if (!(hasExtra || hasMissing)) continue;
      console.log(`\x1b[4m${i + 1}. ${resultFiles[i]}.json\x1b[0m`);
      if (hasMissing) {
        console.log('We found the following missing keys in this file:');
        console.log(missing.map(d => `'${d.path.join('.')}'`).join(', '));
      }
      if (hasExtra > 0) {
        if (hasMissing > 0) {
          console.log('But we also found some extra keys 🤔');
        } else {
          console.log(`We didn't find any missing keys but we did find some extra keys 🤔`);
        }
        console.log(
          extra.map(d => (d.path ? `'${d.path.join('.')}'` : Object.keys(d.rhs).map(v => `'${v}'`))).join(', ')
        );
      }
    }
  } else {
    console.log(`\n     🎉 ${messages.noMissing} 🎉\n`);
  }
}

function findMissingKeys({ config, basePath }) {
  inquirer
    .prompt(config.interactive ? queries(basePath) : [])
    .then(input => {
      const src = input.src || config.src || defaultConfig.src;
      const scopes = getScopesMap(input.configPath || config.configPath);
      const i18nPath = input.i18n || config.i18n || defaultConfig.i18n;
      const addMissing = input.addMissing || config.addMissing || defaultConfig.addMissing;
      const defaultValue = input.defaultValue || config.defaultValue || defaultConfig.defaultValue;
      if (!fs.existsSync(i18nPath)) {
        return console.log(chalk.bgRed.black(messages.pathDoesntExists));
      }
      console.log('\n 🕵 🔎', `\x1b[4m${messages.startSearch}\x1b[0m`, '🔍 🕵\n');
      spinner = ora().start(`${messages.extract} `);
      const options = { src, scopes, defaultValue };
      buildKeys(options).then(({ keys }) => {
        spinner.succeed(`${messages.extract} 🗝`);
        compareKeysToFiles({ keys, i18nPath: `${process.cwd()}/${i18nPath}`, addMissing });
      });
    })
    .catch(e => console.log(e));
}

module.exports = { findMissingKeys };
