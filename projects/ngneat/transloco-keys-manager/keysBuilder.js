#!/usr/bin/env node
const fs = require('fs');
const promptDirectory = require('inquirer-directory');
const inquirerFileTreeSelection = require('inquirer-file-tree-selection-prompt');
const inquirer = require('inquirer');
const find = require('find');
const ora = require('ora');
const glob = require('glob');
const [localLang] = require('os-locale')
  .sync()
  .split('-');
const messages = require('./messages').getMessages(localLang);
const { mergeDeep, buildObjFromPath, isObject } = require('./helpers');
const { regexs } = require('./regexs');
const TEMPLATE_TYPE = { STRUCTURAL: 0, NG_TEMPLATE: 1 };
let spinner;

inquirer.registerPrompt('directory', promptDirectory);
inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection);

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
  scopeKeys = matchedStr.match(regexs.templateKey(varName));
  read = readSearch && readSearch.groups.read;
  return { scopeKeys, read, varName };
}

function extractTSKeys({ src, keepFlat = [] }) {
  const srcPath = `${process.cwd()}/${src}`;
  const keys = {};
  let fileCount = 0;
  return new Promise(resolve => {
    find
      .eachfile(/\.ts$/, srcPath, file => {
        if (file.endsWith('.spec.ts')) return;
        fileCount++;
        const str = fs.readFileSync(file, { encoding: 'UTF-8' });
        const service = regexs.serviceInjection.exec(str);
        if (service) {
          /** service translationCalls regex */
          const rgx = regexs.translationCalls(service.groups.serviceName);
          let result = rgx.exec(str);
          while (result) {
            const [key, ...inner] = result.groups.key.split('.');
            if (keepFlat.includes(key)) {
              keys[result.groups.key] = '';
            } else {
              const value = inner.length ? buildObjFromPath(inner) : '';
              keys[key] = keys[key] && isObject(value) ? mergeDeep(keys[key], value) : value;
            }
            result = rgx.exec(str);
          }
        }
      })
      .end(() => {
        resolve({ keys, fileCount });
      });
  });
}

function extractTemplateKeys({ src, keepFlat = [] }) {
  const srcPath = `${process.cwd()}/${src}`;
  const keys = {};
  let fileCount = 0;
  return new Promise(resolve => {
    find
      .eachfile(/\.html$/, srcPath, file => {
        fileCount++;
        const str = fs.readFileSync(file, { encoding: 'UTF-8' });
        let result;
        /** structural directive and ng-template */
        [regexs.structural, regexs.template].forEach((rgx, index) => {
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
        [regexs.directive, regexs.pipe, regexs.bindingPipe].forEach(rgx => {
          result = rgx.exec(str);
          while (result) {
            const [key, ...inner] = result.groups.key.split('.');
            if (keepFlat.includes(key)) {
              keys[result.groups.key] = '';
            } else {
              const value = inner.length ? buildObjFromPath(inner) : '';
              keys[key] = keys[key] && isObject(value) ? mergeDeep(keys[key], value) : value;
            }
            result = rgx.exec(str);
          }
        });
      })
      .end(() => {
        resolve({ keys, fileCount });
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
      const { fileLang } = regexs.fileLang.exec(fileName).groups;
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
  console.log(`\n           🌵 ${messages.done} 🌵`);
}

function buildKeys(options) {
  return Promise.all([extractTemplateKeys(options), extractTSKeys(options)]).then(([template, ts]) => {
    const keys = mergeDeep({}, template.keys, ts.keys);
    return Promise.resolve({ keys, fileCount: template.fileCount + ts.fileCount });
  });
}

function buildTranslationFiles({ argvMap, basePath }) {
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
      name: 'output',
      message: messages.output,
      basePath,
      when: () => !argvMap.output
    },
    {
      type: 'confirm',
      default: false,
      name: 'hasScope',
      message: messages.hasScope,
      when: () => argvMap.config || !argvMap.noScope
    },
    {
      type: 'file-tree-selection',
      name: 'config',
      messages: messages.config,
      when: ({ hasScope }) => argvMap.config || (hasScope && !argvMap.noScope)
    },
    {
      type: 'input',
      default: `en${localLang !== 'en' ? ', ' + localLang : ''}`,
      name: 'langs',
      message: messages.langs,
      when: () => !argvMap.langs
    },
    {
      type: 'input',
      name: 'keepFlat',
      message: messages.keepFlat,
      when: () => !argvMap.keepFlat
    }
  ];
  inquirer
    .prompt(queries)
    .then(input => {
      const src = input.src || argvMap.src || 'src';
      const langs = input.langs || argvMap.langs;
      const output = input.output || argvMap.output || 'assets/i18n';
      let keepFlat = input.keepFlat || argvMap.keepFlat;
      keepFlat = keepFlat ? keepFlat.split(',').map(l => l.trim()) : [];
      console.log('\x1b[4m%s\x1b[0m', `\n${messages.startBuild(langs.length)} 👷️🏗\n`);
      spinner = ora().start(`${messages.extract} 🗝`);
      const options = { src, keepFlat };
      buildKeys(options).then(({ keys, fileCount }) => {
        spinner.succeed(`${messages.extract} 🗝`);
        console.log(`${messages.keysFound(countKeys(keys), fileCount)}`);
        createFiles({ keys, langs, outputPath: `${process.cwd()}/${output}` });
      });
    })
    .catch(e => console.log(e));
}

module.exports = { buildTranslationFiles, buildKeys };
