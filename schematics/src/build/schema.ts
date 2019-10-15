import { Schema } from '@schematics/angular/module/schema';
import { TranslationFileFormat } from '../types';

export interface SchemaOptions extends Schema {
  /**
   * The folder that contain the root translation files.
   */
  translationPath: string;
  /**
   * The output directory.
   */
  outDir: string;
  /**
   * The main language, defaults to en.
   */
  mainLang?: string;
  /**
   *
   */
  format?: TranslationFileFormat;
  /**
   * The root project name.
   */
  project?: string;
  /**
   * The original name for the file
   */
  projectName?: string;
  missingTranslationValue?: string;
}
