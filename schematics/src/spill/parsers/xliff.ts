import { TranslationParser } from '../parser';
import { SchemaOptions } from '../schema';

const xliff = require('xliff/xliff12ToJs');

export class XliffParser extends TranslationParser {
  objects = {};

  constructor(protected options: SchemaOptions) {
    super(options);
  }

  parse(content: string): object {
    const options = this.options;

    const toJSON = xliff(content).resources[options.projectName];

    const translation = Object.keys(toJSON).reduce((acc, key) => {
      const node = toJSON[key];
      const vartype = node.additionalAttributes.vartype;
      if (vartype === 'object') {
        this.objects[key] = true;
      }

      if (vartype === 'array') {
        acc[key] = node.target.split(',');
      } else {
        acc[key] = node.target;
      }
      if (node.note) {
        acc[`${key}.comment`] = node.note;
      }
      return acc;
    }, {});

    return unflatten(translation, this.objects);
  }
}

function unflatten(translation, objects) {
  let result = {};
  for (let [key, val] of Object.entries(translation)) {
    if (!objects[key]) {
      result[key] = val;
      continue;
    }

    const keys = key.split('.');

    keys.reduce((acc, currentKey, index) => {
      if (index === keys.length - 1) {
        acc[currentKey] = val;
      } else {
        acc[currentKey] = acc[currentKey] || {};
      }

      return acc[currentKey];
    }, result);
  }
  return result;
}
