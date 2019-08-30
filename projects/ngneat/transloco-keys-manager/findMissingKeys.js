const promptDirectory = require('inquirer-directory');
const inquirer = require('inquirer');
const { buildKeys } = require('./keysBuilder');
const [localLang] = require('os-locale')
  .sync()
  .split('-');
const messages = require('./messages').getMessages(localLang);
const ora = require('ora');
const glob = require('glob');

inquirer.registerPrompt('directory', promptDirectory);

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
      name: 'filesLocation',
      message: messages.translationsLocation,
      basePath,
      when: () => !argvMap.output
    }
  ];
  inquirer
    .prompt(queries)
    .then(input => {
      const src = input.src || argvMap.src || 'src';
      const filesLocation = input.filesLocation || argvMap.filesLocation || 'assets/i18n';
      console.log('\n 🕵🔎', `\x1b[4m${messages.startSearch}\x1b[0m`, '🔍🕵\n');
      spinner = ora().start(`${messages.extract} `);
      const options = { src };
      buildKeys(options).then(() => {
        spinner.succeed(`${messages.extract} 🗝`);
        spinner = ora().start(`${messages.checkMissing} `);
      });
    })
    .catch(e => console.log(e));
}

module.exports = { findMissingKeys };
