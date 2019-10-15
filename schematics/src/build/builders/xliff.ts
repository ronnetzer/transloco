import { BuilderOptions, FileBuilder } from '../builder';
import { Tree } from '@angular-devkit/schematics';
import * as builder from 'xmlbuilder';
import * as flat from 'flat';

export class XliffBuilder extends FileBuilder {
  private mainLangTranslation;
  private mainLangOriginal;
  build(tree: Tree, options: BuilderOptions) {
    if (!this.mainLangTranslation) {
      this.mainLangOriginal = options.translation;
      this.mainLangTranslation = flat(options.translation, { safe: true });
    }

    const content = flat(options.translation, { safe: true });

    let xml = builder
      .create('xliff', { encoding: 'UTF-8' }, {}, { separateArrayItems: false })
      .attribute('version', '1.2')
      .attribute('xmlns', 'urn:oasis:names:tc:xliff:document:1.2')
      .ele('file', {
        'source-language': 'en',
        datatype: 'plaintext',
        original: options.projectName
      })
      .ele('body');

    Object.keys(content).forEach(translationKey => {
      let source = this.mainLangTranslation[translationKey];
      let target = content[translationKey];

      if (isComment(translationKey) === false) {
        if (isMissing(target)) {
          target = options.missingTranslationValue;
        }

        if (isMissing(source)) {
          source = options.missingTranslationValue;
        }

        let vartype = 'string';
        if (this.mainLangOriginal.hasOwnProperty(translationKey) === false) {
          vartype = 'object';
        }

        if (Array.isArray(source)) {
          source = source.toString();
          target = target.toString();
          vartype = 'array';
        }

        let node = xml
          .ele('trans-unit', { id: translationKey, vartype })
          .ele('source', {}, source)
          .up()
          .ele('target', {}, target)
          .up();

        const comment = findComment(this.mainLangTranslation, translationKey);
        if (comment) {
          node.ele('note', { priority: '1', from: 'comment' }, comment);
        }
      }
    });

    tree.create(`${this.getPath(options)}.xlf`, xml.end({ pretty: true }));
  }
}

function findComment(translation, key) {
  return translation[`${key}.comment`];
}

function isComment(key) {
  const splitted = key.split('.');
  return splitted.length > 1 && splitted.pop() === 'comment';
}

function isMissing(value) {
  return value == undefined || value === '';
}
