import { TranslationParser } from '../parser';
import { SchemaOptions } from '../schema';

const xliff = require('xliff/xliff12ToJs');
const flat = require('flat');

export class XliffParser extends TranslationParser {
  constructor(protected options: SchemaOptions) {
    super(options);
  }

  parse(content: string): object {
    const options = this.options;

    const toJSON = xliff(content).resources[options.projectName];

    const translation = Object.keys(toJSON).reduce((acc, key) => {
      const node = toJSON[key];
      if (node.additionalAttributes.vartype === 'array') {
        acc[key] = node.target.split(',');
      } else {
        acc[key] = node.target;
      }
      if (node.note) {
        acc[`${key}.comment`] = node.note;
      }
      return acc;
    }, {});

    return flat.unflatten(translation, { safe: true });
  }
}
