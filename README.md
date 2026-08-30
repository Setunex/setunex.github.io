# setunex.github.io

The public website for **Setunex** — private-by-design, offline-first apps for
communities. Served at <https://setunex.github.io/>.

This repo holds only the site. Application source code lives in separate,
private repositories.

## Layout

```
index.html                 Setunex landing page (products, principles, contact)
assets/style.css           Shared stylesheet for every page
assets/sample-contacts.csv Demo CSV, mirrors the one bundled in the app
assets/csv-builder/        Google Sheet builder, offered as downloads
kutumb-connect/            Kutumb Connect product site
  index.html               Product overview
  prepare-csv.html         CSV preparation guide + field reference
  privacy-faq.html         Privacy, security implementation, FAQ
```

Adding a product means adding a sibling folder (e.g. `adhyayan/`) and a card in
`index.html`.

## Conventions

- **All links are relative.** Never use a root-absolute `/assets/...` path — it
  breaks local previews and any future move to a project-site URL.
- **Every product page** starts with the `.umbrella` strip linking back to
  `../index.html`, then its own `header.site`.
- **No personal or contact details** beyond the Setunex org link.
- Sample data is synthetic. Never commit real community data.

## Deploying

Pushing to `main` publishes the site via `.github/workflows/deploy-pages.yml`
(GitHub Actions Pages flow — no Jekyll build). Requires
**Settings ▸ Pages ▸ Source = GitHub Actions**.

Preview locally by opening `index.html` in a browser, or:

```powershell
python -m http.server 8000
```
