This is a Transloco language detection plugin use to detect user language in the browser with support for:

- cookie (set cookie translocoLang=LANGUAGE)
- localStorage (set key translocoLang=LANGUAGE)
- navigator (set browser language)
- querystring (append `?lang=LANGUAGE` to URL)
- htmlTag (add html language tag <html lang="LANGUAGE" ...)
- path (http://my.site.com/LANGUAGE/...)
- subdomain (http://LANGUAGE.site.com/...)

# Getting started

First, install the package:

```
npm i @ngneat/transloco-lang-detector
```

Next, import the module in `app.module`:

```ts
import { TranslocoLangDetectorModule } from '@ngneat/transloco-lang-detector';

@NgModule({
  imports: [
    TranslocoLangDetectorModule.init(config?)
  ],
})
class AppModule {}
```

## Detector Options

```js
{
  // order and from where user language should be detected
  order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],

  // keys or params to lookup language from
  lookupQuerystring: 'lang',
  lookupCookie: 'translocoLang',
  lookupLocalStorage: 'translocoLang',
  lookupFromPathIndex: 0,
  lookupFromSubdomainIndex: 0,

  // cache user language on
  caches: ['localStorage', 'cookie'],

  // optional expire and domain for set cookie
  cookieMinutes: 10,
  cookieDomain: 'myDomain',

  // optional htmlTag with lang attribute, the default is:
  htmlTag: document.documentElement
}
```

### Credits

This is basically a Transloco port of [this](https://github.com/i18next/i18next-browser-languageDetector) package.
