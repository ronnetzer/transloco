import { Detector, DetectorConfig } from '../detector';

export class QueryStringDetector extends Detector {
  static type = 'querystring';

  detect({ queryStringKey }: DetectorConfig): string | undefined {
    let found;

    let query = window.location.search.substring(1);
    let params = query.split('&');
    for (let i = 0; i < params.length; i++) {
      let pos = params[i].indexOf('=');
      if (pos > 0) {
        let key = params[i].substring(0, pos);
        if (key === queryStringKey) {
          found = params[i].substring(pos + 1);
        }
      }
    }

    return found;
  }
}
