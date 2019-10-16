import { Detector, DetectorConfig } from '../detector';

export class NavigatorDetector extends Detector {
  static type = 'navigator';

  detect(options: DetectorConfig): string | undefined {
    let found = [];

    if (navigator.languages) {
      // chrome only; not an array, so can't use .push.apply instead of iterating
      for (let i = 0; i < navigator.languages.length; i++) {
        found.push(navigator.languages[i]);
      }
    }

    if ((navigator as any).userLanguage) {
      found.push((navigator as any).userLanguage);
    }

    if (navigator.language) {
      found.push(navigator.language);
    }

    return found.length > 0 ? found[0] : undefined;
  }
}
