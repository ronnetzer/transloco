import { BuilderOptions, FileBuilder } from '../builder';
import { Tree } from '@angular-devkit/schematics';

export class JSONBuilder extends FileBuilder {
  build(tree: Tree, options: BuilderOptions) {
    tree.create(`${this.getPath(options)}.json`, JSON.stringify(options.translation, null, 2));
  }
}
