# Budget Chrome Extension

Source lives in this folder (`budget-frontend/extension/`). The web app Settings tab links to the packaged zip.

## Develop

```bash
npm run zip:extension   # writes public/budget-extension.zip + config.defaults.json
```

`config.defaults.json` is generated from `.env` (API URL, keys) when zipping.

## Install

See **Settings → Chrome Extension** in the web app, or:

1. Run `npm run zip:extension`
2. Unzip `public/budget-extension.zip`
3. Chrome → Extensions → Developer mode → Load unpacked → select folder

## Files

```
extension/
  manifest.json
  popup.html / popup.js / popup.css
  options.html / options.js / options.css
  lib/api.js
  config.defaults.json   (generated at zip time)
```
