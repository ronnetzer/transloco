import { Detector, DetectorConfig } from '../detector';

export class PathDetector extends Detector {
  static type = 'path';

  detect({ lookupFromPathIndex }: DetectorConfig): string | undefined {
    let found;
    const language = window.location.pathname.match(/\/([a-zA-Z-]*)/g);
    if (language instanceof Array) {
      if (typeof lookupFromPathIndex === 'number') {
        if (typeof language[lookupFromPathIndex] !== 'string') {
          return undefined;
        }
        found = language[lookupFromPathIndex].replace('/', '');
      } else {
        found = language[0].replace('/', '');
      }
    }
    return found;
  }
}
