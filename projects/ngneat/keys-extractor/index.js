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
const { mergeDeep, buildObjFromPath, isObject } = require('./helpers');

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
  structural: /<([a-zA-Z-]*)[^*>]*\*transloco=(?:'|")\s*let\s+(?<varName>\w*)[^'"]*(?:'|").*>[^]+?<\/\1>/g,
  templateKey: varName => new RegExp(`${varName}(?:(?:\\[(?:'|"))|\\.)([^}|]*)`, 'g'),
  template: /<ng-template[^>]*transloco[^>]*>[^<]*<\/ng-template/g,
  directive: /\stransloco="(?<key>[^"]*)"/g,
  pipe: /{{\s*(?:'|")(?<key>[^}\r\n]*)(?:'|")\s*\|\s*(?:transloco)/g,
  bindingPipe: /=(?:'|")(?:\s*(?:'|")(?<key>[^}\r\n]*)(?:'|")\s*\|)\s*(?:transloco)/g,
  fileLang: /(?<fileLang>[^./]*)\.json/
};

const TEMPLATE_TYPE = { STRUCTURAL: 0, NG_TEMPLATE: 1 };

function countKeys(obj) {
  return Object.keys(obj).reduce((acc, curr) => (isObject(obj[curr]) ? ++acc + countKeys(obj[curr]) : ++acc), 0);
}

function getTemplateBasedKeys(rgxResult, templateType) {
  let scopeKeys, read, readSearch, varName;
  const [matchedStr] = rgxResult;
  if (templateType === TEMPLATE_TYPE.STRUCTURAL) {
    varName = rgxResult.groups.varName;
    readSearch = matchedStr.match(/read:\s*(?:'|")(?<read>[a-zA-Z-0-9-_]*)(?:'|")/);
  } else {
    varName = matchedStr.match(/let-(?<varName>\w*)/).groups.varName;
    readSearch = matchedStr.match(/(?:\[?read\]?=\s*(?:'|"){1,2}(?<read>[a-zA-Z-0-9-_]*)(?:'|"){1,2})/);
  }
  scopeKeys = matchedStr.match(regex.templateKey(varName));
  read = readSearch && readSearch.groups.read;
  return { scopeKeys, read, varName };
}

function extractKeys(srcPath) {
  const keys = {};
  let fileCount = 0;
  return new Promise(resolve => {
    find
      .eachfile(/\.html$/, srcPath, file => {
        fileCount++;
        const str = fs.readFileSync(file, { encoding: 'UTF-8' });
        let result;
        /** structural directive and ng-template */
        [regex.structural, regex.template].forEach((rgx, index) => {
          result = rgx.exec(str);
          while (result) {
            const { scopeKeys, read, varName } = getTemplateBasedKeys(result, index);
            scopeKeys &&
              scopeKeys.forEach(rawKey => {
                let [key, ...inner] = rawKey
                  .trim()
                  .replace(/\[/g, '.')
                  .replace(/'|"|\]/g, '')
                  .replace(`${varName}.`, '')
                  .split('.');
                /** Set the read as the first key */
                if (read) {
                  inner.unshift(key);
                  key = read;
                }
                const value = inner.length ? buildObjFromPath(inner) : '';
                keys[key] = keys[key] && isObject(value) ? mergeDeep(keys[key], value) : value;
              });
            result = rgx.exec(str);
          }
        });
        /** directive & pipe */
        [regex.directive, regex.pipe, regex.bindingPipe].forEach(rgx => {
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
        console.log(`${messages.keysFound(countKeys(keys), fileCount)}`);
        resolve(keys);
      });
  });
}

function createJson(outputPath, lang, json) {
  fs.writeFileSync(`${outputPath}/${lang.trim()}.json`, json, 'utf8');
}

function verifyOutputDir(outputPath) {
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }
}

function createFiles({ keys, langs, outputPath }) {
  spinner = ora().start(`${messages.creatingFiles} 🗂`);
  verifyOutputDir(outputPath);
  const existingFiles = glob.sync(`${outputPath}/*.json`);
  let existingLangs;
  let langArr = langs.split(',').map(l => l.trim());
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
      const file = fs.readFileSync(fileName, { encoding: 'UTF-8' });
      const merged = mergeDeep({}, keys, JSON.parse(file));
      fs.writeFileSync(fileName, JSON.stringify(merged, null, 2), { encoding: 'UTF-8' });
    }
  }
  /** If there are items in the array, that means that we need to create missing translation files */
  if (langArr.length) {
    const json = JSON.stringify(keys, null, 2);
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
    extractKeys(`${process.cwd()}/${srcPath}`).then(keys =>
      createFiles({ keys, langs, outputPath: `${process.cwd()}/${outputPath}` })
    );
  });
