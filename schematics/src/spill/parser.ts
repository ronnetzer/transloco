import { SchemaOptions } from './schema';

export abstract class TranslationParser {
  constructor(protected options: SchemaOptions) {}

  abstract parse(content: string): object;
}
