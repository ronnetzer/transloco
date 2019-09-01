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
  console.log('\n             🏁', `\x1b[4m${messages.summary}\x1b[0m`, '🏁');
  const resultFiles = Object.keys(result);
  if (resultFiles.length > 0) {
    for (let i = 0; i < resultFiles.length; i++) {
      const resultFileSummary = result[resultFiles[i]];
      console.log(`\x1b[4m${i + 1}. ${resultFiles[i]}.json\x1b[0m`);
      if (resultFileSummary.missing.length) {
        console.log('We found the following missing keys in this file:');
        console.log(resultFileSummary.missing.map(d => `'${d.path.join('.')}'`).join(', '));
      }
      if (resultFileSummary.extra.length) {
        if (resultFileSummary.missing.length) {
          console.log('But we also found some extra keys 🤔');
        } else {
          console.log(`We didn't find any missing keys but we did find some extra keys 🤔`);
        }
        console.log(resultFileSummary.extra.map(d => `'${d.path.join('.')}'`).join(', '));
      }
    }
  } else {
    ora().succeed(`${messages.noMissing} 🎉`);
  }
}

function findMissingKeys({ argvMap, basePath }) {
  const queries = [
    {
      type: 'directory',
      name: 'src',
      message: messages.src,
      basePath,
      when: () => !argvMap.src
    },
    {
      type: 'directory',
      name: 'i18n',
      message: messages.translationsLocation,
      basePath,
      when: () => !argvMap.i18n
    },
    {
      type: 'confirm',
      default: false,
      name: 'hasScope',
      message: messages.hasScope,
      when: () => !(argvMap.config || argvMap.noScope)
    },
    {
      type: 'file-tree-selection',
      name: 'config',
      messages: messages.config,
      when: ({ hasScope }) => !argvMap.noScope && (!argvMap.config || hasScope)
    }
  ];

  inquirer
    .prompt(queries)
    .then(input => {
      const src = input.src || argvMap.src || 'src';
      const scopes = getScopesMap(input.config || argvMap.config);
      const i18nPath = input.i18n || argvMap.i18n || 'assets/i18n';
      if (!fs.existsSync(i18nPath)) {
        return console.log(chalk.bgRed.black(messages.pathDoesntExists));
      }
      console.log('\n 🕵 🔎', `\x1b[4m${messages.startSearch}\x1b[0m`, '🔍 🕵\n');
      spinner = ora().start(`${messages.extract} `);
      const options = { src, scopes };
      buildKeys(options).then(({ keys }) => {
        spinner.succeed(`${messages.extract} 🗝`);
        compareKeysToFiles({ keys, i18nPath: `${process.cwd()}/${i18nPath}` });
      });
    })
    .catch(e => console.log(e));
}

module.exports = { findMissingKeys };
