import { TranslationFileFormat } from '../types';
import { TranslationParser } from './parser';
import { JSONParser } from './parsers/json';
import { XliffParser } from './parsers/xliff';
import { SchemaOptions } from './schema';

export function getParser(format: TranslationFileFormat, options: SchemaOptions): TranslationParser {
  switch (format) {
    case TranslationFileFormat.JSON:
      return new JSONParser(options);
    case TranslationFileFormat.XLIFF:
      return new XliffParser(options);
    default:
      return new JSONParser(options);
  }
}
