import { Cacheable, Detector, DetectorConfig } from '../detector';

export class CookieDetector extends Detector implements Cacheable {
  static type = 'cookie';

  detect({ cookieKey }: DetectorConfig): string | undefined {
    let found;

    if (cookieKey) {
      let c = readCookie(cookieKey);
      if (c) found = c;
    }

    return found;
  }

  cacheLang(lang: string, { cookieKey, cookieDomain, cookieMinutes }: DetectorConfig) {
    if (cookieKey) {
      createCookie(cookieKey, lang, cookieMinutes, cookieDomain);
    }
  }
}

function readCookie(name) {
  let nameEQ = name + '=';
  let ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function createCookie(name, value, minutes, domain) {
  let expires;
  if (minutes) {
    let date = new Date();
    date.setTime(date.getTime() + minutes * 60 * 1000);
    expires = '; expires=' + (date as any).toGMTString();
  } else expires = '';
  domain = domain ? 'domain=' + domain + ';' : '';
  document.cookie = name + '=' + value + expires + ';' + domain + 'path=/';
}
