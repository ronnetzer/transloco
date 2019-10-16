import { Detector, DetectorConfig } from '../detector';

export class SubdomainDetector extends Detector {
  static type = 'subdomain';

  detect({ lookupFromSubdomainIndex }: DetectorConfig): string | undefined {
    let found;
    const language = window.location.href.match(/(?:http[s]*\:\/\/)*(.*?)\.(?=[^\/]*\..{2,5})/gi);
    if (language instanceof Array) {
      if (typeof lookupFromSubdomainIndex === 'number') {
        found = language[lookupFromSubdomainIndex]
          .replace('http://', '')
          .replace('https://', '')
          .replace('.', '');
      } else {
        found = language[0]
          .replace('http://', '')
          .replace('https://', '')
          .replace('.', '');
      }
    }
    return found;
  }
}
