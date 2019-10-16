import { Cacheable, Detector, DetectorConfig } from '../detector';

export class LocalStorageDetector extends Detector implements Cacheable {
  static type = 'localStorage';

  detect({ localStorageKey }: DetectorConfig): string | undefined {
    let found;

    if (localStorageKey) {
      const lang = window.localStorage.getItem(localStorageKey);
      if (lang) found = lang;
    }

    return found;
  }

  cacheLang(lang: string, { localStorageKey }: DetectorConfig) {
    if (localStorageKey) {
      window.localStorage.setItem(localStorageKey, lang);
    }
  }
}
