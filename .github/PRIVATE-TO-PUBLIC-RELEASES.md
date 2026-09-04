# Publishing APKs from a private source repo to this public site

Each private product repo builds and signs an APK in GitHub Actions. Because
the source repo is private, its release assets can't be fetched from a
logged-out browser. Instead, CI **commits the signed APK directly into this
repo** at a fixed path:

- `downloads/<app>-latest.apk` — the APK itself (overwritten every release)
- `downloads/<app>-latest.json` — `{ version, published_at, size, sha }` for
  the site to show version/date/size next to the download button

The download button on each product page is a plain `<a>` to that stable
path, so it works even with JS disabled. A small script optionally enriches
the callout with version metadata when the JSON is present.

## Trust model

- **Target repo** (this one, `Setunex/setunex.github.io`) — public, owned by
  the **Setunex org**. Receives APK commits.
- **Source repos** (`Adhyayan`, `Contacts`) — private, owned by a **personal
  user account**, not by the Setunex org.
- **GitHub App "Setunex APK Publisher"** — owned by the **Setunex org**,
  installed **only** on `Setunex/setunex.github.io`, with a single
  permission: `Contents: Read and write`.
- Each source repo stores the App's ID and private key as Actions secrets.
  The workflow uses them to mint a **short-lived (~1 h) installation token**
  scoped to just this repo, `git push`es the APK, and the token dies with
  the job.

The App is the stable trust anchor in the Setunex org; tokens are ephemeral
and minted per run.

## One-time setup

1. In **Setunex org** → _Settings → Developer settings → GitHub Apps → New
   GitHub App_:
   - **Name**: `Setunex APK Publisher`
   - **Homepage URL**: `https://setunex.github.io`
   - **Webhook**: uncheck _Active_ (no webhook needed).
   - **Repository permissions**: `Contents: Read and write`. Leave every
     other permission at _No access_.
   - **Where can this GitHub App be installed?**: _Only on this account_.
   - Create, then on the App page click **Generate a private key** — it
     downloads a `.pem` file. Also note the numeric **App ID** at the top of
     the page.
2. On the same App page, click **Install App** → install on **`Setunex`**,
   and restrict it to the single repo `setunex.github.io`.
3. In **each private source repo** (e.g. `<your-user>/Adhyayan`,
   `<your-user>/Contacts`) → _Settings → Secrets and variables → Actions_,
   add two secrets:
   - `SITE_PUBLISHER_APP_ID` — the numeric App ID from step 1.
   - `SITE_PUBLISHER_APP_KEY` — the **full contents** of the `.pem` file,
     including the `-----BEGIN…` and `-----END…` lines.
4. Nothing on the site side needs a matching change — the download button
   already points at `downloads/<app>-latest.apk`.

## Workflow step to add to each private source repo

Add this after the signed APK is on disk. Adjust `APK_SRC` and `APP_SLUG`
(and optionally the version source).

```yaml
- name: Mint site-write token
  id: site_token
  uses: actions/create-github-app-token@v2
  with:
    app-id: ${{ secrets.SITE_PUBLISHER_APP_ID }}
    private-key: ${{ secrets.SITE_PUBLISHER_APP_KEY }}
    owner: Setunex
    repositories: setunex.github.io

- name: Publish APK to setunex.github.io
  env:
    GH_TOKEN: ${{ steps.site_token.outputs.token }}
    SITE_REPO: Setunex/setunex.github.io
    APP_SLUG: adhyayan # or contacts / kutumb-connect
    APK_SRC: android/app/build/outputs/apk/release/app-release.apk
    # Prefer a real semver tag; fall back to short SHA for main-branch builds.
    VERSION: ${{ github.ref_type == 'tag' && github.ref_name || github.sha }}
  run: |
    set -euo pipefail

    git config --global user.email "actions@github.com"
    git config --global user.name  "Setunex APK Publisher"

    git clone --depth=1 \
      "https://x-access-token:${GH_TOKEN}@github.com/${SITE_REPO}.git" site

    mkdir -p site/downloads
    cp "$APK_SRC" "site/downloads/${APP_SLUG}-latest.apk"

    SIZE=$(stat -c%s "site/downloads/${APP_SLUG}-latest.apk")
    cat > "site/downloads/${APP_SLUG}-latest.json" <<EOF
    {
      "version": "${VERSION}",
      "published_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
      "size": ${SIZE},
      "sha": "${{ github.sha }}"
    }
    EOF

    cd site
    git add "downloads/${APP_SLUG}-latest.apk" "downloads/${APP_SLUG}-latest.json"
    if git diff --cached --quiet; then
      echo "No APK change; nothing to publish."
      exit 0
    fi
    git commit -m "${APP_SLUG}: publish ${VERSION}"
    git push
```

Trigger on tag push (`on: push: tags: ['v*']`) so each tag becomes one new
APK on the site. Each commit overwrites the previous APK in the working
tree — the site only ever exposes the latest build.

## Rotation and revocation

- **Compromised source repo** → uninstall the App from
  `Setunex/setunex.github.io` (org → _Settings → GitHub Apps → configure →
  Uninstall_). Every source repo loses the ability to publish, immediately.
  Reinstall when clean.
- **Compromised private key** → on the App page, click _Generate a private
  key_ to create a new one, then _Delete_ the old one. Update the
  `SITE_PUBLISHER_APP_KEY` secret in each source repo.
- **Retiring a source repo** → nothing to do on the App side; just remove
  the two secrets from the retired repo.

## Notes and trade-offs

- **Previous APK is deleted** — the file lives at a fixed path, so a new
  commit replaces it in the working tree. Git history still keeps old
  blobs; if repo size ever becomes a concern, switch this step to a
  single-commit orphan branch (`git checkout --orphan apks`) and
  force-push from CI.
- **Attribution** — commits from CI are authored by _Setunex APK
  Publisher_, not by a human account, so the site repo's history clearly
  distinguishes bot commits from human ones.
- **Pages caching** — GitHub Pages usually serves updates within a minute
  of the push. The JSON metadata is fetched with `cache: 'no-cache'` so
  version/date/size updates as soon as Pages redeploys.
