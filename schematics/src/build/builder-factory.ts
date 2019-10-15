import { TranslationFileFormat } from '../types';
import { JSONBuilder } from './builders/json';
import { XliffBuilder } from './builders/xliff';
import { FileBuilder } from './builder';

export function getBuilder(format: TranslationFileFormat): FileBuilder {
  switch (format) {
    case TranslationFileFormat.JSON:
      return new JSONBuilder();
    case TranslationFileFormat.XLIFF:
      return new XliffBuilder();
    default:
      return new JSONBuilder();
  }
}
