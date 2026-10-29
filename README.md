# Decliner Legal Site

Static legal pages for Decliner by Meroviq.

Public domain:
https://renelo.meroviq.com

Primary URLs:
- Terms of Service: https://renelo.meroviq.com/terms
- Privacy Policy: https://renelo.meroviq.com/privacy
- Open Source Licenses: https://renelo.meroviq.com/licenses

Current privacy document version: 1.0
Privacy effective date: October 8, 2026

The site is deployed from `public/` through GitHub Pages.


## App-language links

The app selects destinations from its current resource locale, independently of
system/browser language. All nine existing translations are reused:
`en`, `ko`, `es`, `fr`, `pt-BR`, `id`, `de`, `ja`, `hi`.

- Terms: `/terms/{language}/v1.0/`
- Privacy: `/privacy/{language}/v1.0/`
- Licenses: `/licenses/#<language>`; English uses `/licenses/` (page top).

Hindi content already exists in the versioned Terms/Privacy documents and the
`#hi` license section. Existing `/terms`, `/privacy`, `/licenses` URLs remain
compatible; generic Terms/Privacy visitors retain browser-language routing and
manual language links. Unsupported app languages fall back to English.

## Local regression checks

Run `node tests/legal.cjs` with Playwright available on the Node module path and
Chromium installed. `CHROME_EXECUTABLE` can select an existing browser;
`LEGAL_QA_DIR` optionally writes screenshots and JSON evidence to an external
development output directory. The script serves only local `public/` on a random
loopback port; it does not contact the live site or deploy.

Checks cover generic URL compatibility, manual no-JavaScript language links,
Hindi and existing-language narrow/large-text layouts, explicit app-language
URLs against English/Hindi/French browser locales, and all local link/fragment
targets. Browser routing/layout checks do not replace native legal review.
