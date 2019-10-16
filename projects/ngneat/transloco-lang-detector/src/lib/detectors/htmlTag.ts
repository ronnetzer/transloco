import { Detector, DetectorConfig } from '../detector';

export class HtmlTagDetector extends Detector {
  static type = 'htmlTag';

  detect({ htmlElement }: DetectorConfig): string | undefined {
    let found;
    let htmlTag = htmlElement || (typeof document !== 'undefined' ? document.documentElement : null);

    if (htmlTag && typeof htmlTag.getAttribute === 'function') {
      found = htmlTag.getAttribute('lang');
    }

    return found;
  }
}
