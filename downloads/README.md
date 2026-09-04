# APKs published by CI

This folder holds the **latest** signed APK for each Setunex app, plus a tiny
JSON metadata file. Files here are overwritten by the private source repos'
GitHub Actions on every release — there is no history of previous APKs and
none is intended.

Expected files:

- `adhyayan-latest.apk` — signed release APK, overwritten on every tag
- `adhyayan-latest.json` — `{ version, published_at, size, sha }` for the site UI
- `kutumb-connect-latest.apk` / `.json` — reserved, not published yet

The download buttons on the product pages link to these paths directly, so a
missing file surfaces as a plain 404 from GitHub Pages — that is the signal
that CI has never run for that app.
