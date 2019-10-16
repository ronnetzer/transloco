import { DetectorConfig } from './detector';

export const defaults: DetectorConfig = {
  order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
  queryStringKey: 'lang',
  cookieKey: 'translocoLang',
  localStorageKey: 'translocoLang',
  lookupFromPathIndex: 0,
  lookupFromSubdomainIndex: 0,
  caches: ['localStorage']
};
