export type DetectorConfig = {
  // order and from where user language should be detected
  order?: ('querystring' | 'cookie' | 'localStorage' | 'navigator' | 'htmlTag' | 'path' | 'subdomain')[];

  // keys or params to lookup language from
  cookieKey?: string;
  localStorageKey?: string;
  queryStringKey?: string;
  lookupFromSubdomainIndex?: number;
  lookupFromPathIndex?: number;

  // optional expire and domain for set cookie
  cookieMinutes?: number;
  cookieDomain?: string;

  htmlElement?: Element;

  // cache user language on
  caches?: ('localStorage' | 'cookie')[];
};

export interface Cacheable {
  cacheLang(lang: string, options: DetectorConfig): void;
}

export abstract class Detector {
  abstract detect(options: DetectorConfig): string | undefined;
}
