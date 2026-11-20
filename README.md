# Decline Legal Site

Static legal pages for Decline by Meroviq.

Public domain:
https://renelo.meroviq.com

Primary URLs:
- Terms of Service: https://renelo.meroviq.com/terms
- Privacy Policy: https://renelo.meroviq.com/privacy
- Open Source Licenses: https://renelo.meroviq.com/licenses

Current Terms version: 1.1, effective upon publication of this version.
Previous Terms remain available at `/terms/{language}/v1.0/`.

Current privacy document version: 1.0
Privacy effective date: October 8, 2026

The site is deployed from `public/` through GitHub Pages.


## App-language links

The app selects destinations from its current resource locale, independently of
system/browser language. The thirteen supported languages are
`en`, `ko`, `es`, `fr`, `pt-BR`, `id`, `de`, `ja`, `hi`, `bn`, `mr`, `te`, `ta`.

- Terms: `/terms/{language}/v1.1/`
- Privacy: `/privacy/{language}/v1.0/`
- Licenses: `/licenses/#<language>`; English uses `/licenses/` (page top).

Existing `/terms`, `/privacy`, `/licenses` URLs remain
compatible; generic Terms/Privacy visitors retain browser-language routing and
manual language links. Unsupported app languages fall back to English.

## Local regression checks

Run `node tests/legal.cjs` with Playwright available on the Node module path and
Chromium installed. `CHROME_EXECUTABLE` can select an existing browser;
`LEGAL_QA_DIR` optionally writes screenshots and JSON evidence to an external
development output directory. The script serves only local `public/` on a random
loopback port; it does not contact the live site or deploy.

Checks cover generic URL compatibility, manual no-JavaScript language links,
narrow and large-text layouts for all languages, explicit app-language
URLs against English/Hindi/French browser locales, and all local link/fragment
targets. Browser routing/layout checks do not replace native legal review.
