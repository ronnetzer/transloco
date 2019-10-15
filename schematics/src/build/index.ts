import { EmptyTree, Rule, SchematicsException, Tree } from '@angular-devkit/schematics';
import {
  getJSONFileContent,
  getTranslationEntryPaths,
  getTranslationFiles,
  getTranslationKey,
  getTranslationsRoot,
  hasFiles,
  hasSubdirs
} from '../utils/transloco';
import { SchemaOptions } from './schema';
import { getBuilder } from './builder-factory';
import { TranslationFileFormat } from '../types';
import { JSONParser } from '../spill/parsers/json';

const fs = require('fs-extra');

function reduceTranslations(host: Tree, dirPath: string, translationJson, lang: string, key = '') {
  const dir = host.getDir(dirPath);
  if (!hasFiles(dir)) return translationJson;
  dir.subfiles
    .filter(fileName => fileName.includes(`${lang}.json`))
    .forEach(fileName => {
      if (translationJson[key]) {
        throw new SchematicsException(
          `key: ${key} is already exist in translation file, please rename it and rerun the command.`
        );
      }
      translationJson[key] = getJSONFileContent(fileName, dir, new JSONParser({} as any));
    });
  if (hasSubdirs(dir)) {
    dir.subdirs.forEach(subDirName => {
      const subDir = dir.dir(subDirName);
      const nestedKey = getTranslationKey(key, subDirName);
      reduceTranslations(host, subDir.path, translationJson, lang, nestedKey);
    });
  }

  return translationJson;
}

function deletePrevFiles(host: Tree, outDir: string) {
  if (fs.existsSync(outDir)) {
    fs.removeSync(outDir);
  }
}

export default function(options: SchemaOptions): Rule {
  return (host: Tree) => {
    deletePrevFiles(host, options.outDir);
    const root = getTranslationsRoot(host, options);
    const rootTranslations = getTranslationFiles(host, root);
    const translationEntryPaths = getTranslationEntryPaths(host, root);

    let output = rootTranslations.map(t => ({
      lang: t.lang,
      translation: translationEntryPaths.reduce((acc, path) => {
        return reduceTranslations(host, path.path, t.translation, t.lang, path.scope);
      }, t.translation)
    }));

    const treeSource = new EmptyTree();
    const builder = getBuilder(options.format);

    if (options.format === TranslationFileFormat.XLIFF) {
      // The main language should always be first
      output = output.sort(a => (a.lang === options.mainLang ? -1 : 1));
    }

    output.forEach(o => {
      builder.build(treeSource, {
        ...options,
        ...o
      });
    });

    return treeSource;
  };
}
