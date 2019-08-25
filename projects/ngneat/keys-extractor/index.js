#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const promptDirectory = require('inquirer-directory');
const inquirer = require('inquirer');
const find = require('find');
const ora = require('ora');
const glob = require('glob');
const [localLang] = require('os-locale')
  .sync()
  .split('-');
const messages = require('./messages').getMessages(localLang);
const { mergeDeep, buildObjFromPath } = require('./helpers');

inquirer.registerPrompt('directory', promptDirectory);
const basePath = path.resolve(process.cwd());
const sourceFilesPath = [
  {
    type: 'confirm',
    name: 'src',
    message: messages.src.confirm
  },
  {
    type: 'directory',
    name: 'srcPath',
    message: messages.src.customPath,
    basePath,
    when: ({ src }) => !src
  }
];
const langFiles = {
  type: 'input',
  default: `en${localLang !== 'en' ? ', ' + localLang : ''}`,
  name: 'langs',
  message: messages.langs
};
const output = [
  {
    type: 'confirm',
    name: 'output',
    message: messages.output.confirm
  },
  {
    type: 'directory',
    name: 'outputPath',
    message: messages.output.customPath,
    basePath,
    when: ({ output }) => !output
  }
];

let spinner;
const regex = {
  structuralScope: /<([a-zA-Z-]*)[^*>]*\*transloco=(?:'|")\s*let\s+(?<varName>\w*)\s*(?:'|").*>[^]+?<\/\1>/g,
  structuralKey: varName => new RegExp(`${varName}(?:\\[|\\.)([^}|]*)`, 'g'),
  directive: /\stransloco="(?<key>[^"]*)"/g,
  pipe: /{{\s*(?:'|")(?<key>[^}\r\n]*)(?:'|")\s*\|\s*(?:transloco)/g,
  fileLang: /(?<fileLang>[^./]*)\.json/
};
function extractKeys(srcPath) {
  const keys = {};
  let fileCount = 0;
  return new Promise(resolve => {
    find
      .eachfile(/\.html$/, srcPath, file => {
        fileCount++;
        const str = fs.readFileSync(path.join(__dirname, file), { encoding: 'UTF-8' });
        /** structuralScope */
        let result = regex.structuralScope.exec(str);
        while (result) {
          const {
            groups: { varName }
          } = result;
          const structuralKeys = result[0].match(regex.structuralKey(varName));
          structuralKeys &&
            structuralKeys.forEach(rawKey => {
              const [key, ...inner] = rawKey
                .trim()
                .replace(/\[/g, '.')
                .replace(/'|"|\]/g, '')
                .replace(`${varName}.`, '')
                .split('.');
              keys[key] = inner.length ? buildObjFromPath(inner) : '';
            });
          result = regex.structuralScope.exec(str);
        }
        /** directive & pipe */
        [regex.directive, regex.pipe].forEach(rgx => {
          result = rgx.exec(str);
          while (result) {
            const {
              groups: { key }
            } = result;
            keys[key] = '';
            result = rgx.exec(str);
          }
        });
      })
      .end(() => {
        spinner.succeed(`${messages.process.extract} 🗝`);
        console.log(`${messages.keysFound(Object.keys(keys).length, fileCount)}`);
        resolve(keys);
      });
  });
}

function createJson(outputPath, lang, json) {
  fs.writeFileSync(`${outputPath}/${lang.trim()}.json`, json, 'utf8');
}

function verifyOutputDir(outputPath) {
  if (!fs.existsSync(outputPath)) {
    outputPath.split('/').reduce((path, currDir) => {
      path += '/' + currDir;
      fs.mkdirSync(path);
      return path;
    }, '.');
  }
}

function createFiles({ keys, langs, outputPath }) {
  spinner = ora().start(`${messages.creatingFiles} 🗂`);
  verifyOutputDir(outputPath);
  const existingFiles = glob.sync(`${outputPath}/*.json`);
  let existingLangs;
  let langArr = langs.split(',');
  /** iterate over the json files and merge the keys */
  if (existingFiles.length) {
    existingLangs = [];
    for (const fileName of existingFiles) {
      /** extract the lang name from the file */
      const { fileLang } = regex.fileLang.exec(fileName).groups;
      existingLangs.push(`'${fileLang}'`);
      /** remove this lang from the langs array since the file already exists */
      langArr = langArr.filter(lang => lang !== fileLang);
      /** Read and write the merged json */
      const file = fs.readFileSync(path.join(__dirname, fileName), { encoding: 'UTF-8' });
      const merged = mergeDeep({}, keys, JSON.parse(file));
      fs.writeFileSync(fileName, JSON.stringify(merged), 'utf8');
    }
  }
  /** If there are items in the array, that means that we need to create missing translation files */
  if (langArr.length) {
    const json = JSON.stringify(keys);
    langArr.forEach(lang => createJson(outputPath, lang, json));
  }
  spinner.succeed();
  if (existingLangs) {
    spinner.succeed(messages.merged(existingLangs, existingFiles));
  }
  console.log(`             🌵 ${messages.done} 🌵`);
}

inquirer
  .prompt([...sourceFilesPath, langFiles, ...output])
  .then(({ srcPath = 'src', langs, outputPath = 'assets/i18n' }) => {
    console.log('\x1b[4m%s\x1b[0m', `\n${messages.start(langs.length)} 👷️🏗\n`);
    spinner = ora().start(`${messages.process.extract} 🗝`);
    extractKeys(srcPath).then(keys => createFiles({ keys, langs, outputPath }));
  });
