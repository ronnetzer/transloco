import { Cacheable, Detector, DetectorConfig } from './detector';
import { defaults } from './defaults';
import { CookieDetector } from './detectors/cookie';
import { HtmlTagDetector } from './detectors/htmlTag';
import { LocalStorageDetector } from './detectors/localstorage';
import { QueryStringDetector } from './detectors/querystring';
import { PathDetector } from './detectors/path';
import { SubdomainDetector } from './detectors/subdomain';
import { NavigatorDetector } from './detectors/navigator';
import { TranslocoService, isBrowser } from '@ngneat/transloco';
import { skip } from 'rxjs/operators';
import { Inject, ModuleWithProviders, NgModule } from '@angular/core';

const detectors = [
  NavigatorDetector,
  CookieDetector,
  HtmlTagDetector,
  LocalStorageDetector,
  QueryStringDetector,
  PathDetector,
  SubdomainDetector
];

@NgModule({})
export class TranslocoLangDetectorModule {
  static init(config: DetectorConfig = {}): ModuleWithProviders {
    return {
      ngModule: TranslocoLangDetectorModule,
      providers: [{ provide: 'LangDetectorConfig', useValue: config }]
    };
  }

  constructor(
    private translocoService: TranslocoService,
    @Inject('LangDetectorConfig') private config: DetectorConfig
  ) {
    this.__init();
  }

  private __init() {
    if (!isBrowser()) {
      return undefined;
    }

    const merged = { ...defaults, ...this.config };

    let foundLang: string;
    for (const detectorType of merged.order) {
      const Detector = detectors.find(d => d.type === detectorType);
      const lang = new Detector().detect(merged);
      if (lang) {
        foundLang = lang;
        break;
      }
    }

    if (foundLang) {
      this.translocoService.setActiveLang(foundLang);
    }

    if (merged.caches.length) {
      this.translocoService.langChanges$.pipe(skip(1)).subscribe((lang: string) => {
        for (const detectorType of merged.caches) {
          const Detector = detectors.find(d => d.type === detectorType);
          (new Detector() as Detector & Cacheable).cacheLang(lang, merged);
        }
      });
    }
  }
}
