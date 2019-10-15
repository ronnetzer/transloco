import { TranslationParser } from '../parser';
import { SchemaOptions } from '../schema';

export class JSONParser extends TranslationParser {
  constructor(protected options: SchemaOptions) {
    super(options);
  }

  parse(content: string): object {
    return JSON.parse(content);
  }
}
