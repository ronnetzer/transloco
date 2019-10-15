import { Tree } from '@angular-devkit/schematics';
import { SchemaOptions } from './schema';

export type BuilderOptions = {
  lang: string;
  translation: object;
} & SchemaOptions;

export abstract class FileBuilder {
  abstract build(tree: Tree, options: BuilderOptions);

  getPath({ outDir, lang }: BuilderOptions) {
    return `${outDir}/${lang}`;
  }
}
