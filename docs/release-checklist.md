# Release checklist

Use this checklist before pushing to GitHub or sharing a packaged build.

## Secrets

- [ ] No real API key in source files.
- [ ] No real API key in screenshots.
- [ ] No local `chrome.storage.local` export committed.
- [ ] Run:

```bash
rg -n "sk-[A-Za-z0-9_-]+|api[-_ ]?key|Bearer " .
```

Expected allowed matches:

- Code that refers to `apiKey` fields.
- Tests using placeholder values such as `sk-test`.
- README / docs explaining API key setup.

## Build and tests

- [ ] Run `npm run check`.
- [ ] Load the folder in `chrome://extensions`.
- [ ] Open `https://x.com`.
- [ ] Verify the injected `X Organizer` entry opens the side panel.
- [ ] Verify `Capture page` works on a loaded X page.
- [ ] Verify `Settings` can validate a test provider key.
- [ ] Verify JSON export does not include the API key.

## Docs

- [ ] English README is up to date.
- [ ] Chinese README is up to date.
- [ ] Screenshots under `docs/screenshots/` are current.
- [ ] Privacy note is linked from README.
- [ ] Known limitations are documented.

## Repository hygiene

- [ ] Do not commit `.playwright-cli/`.
- [ ] Do not commit `output/` scratch screenshots.
- [ ] Do not commit `node_modules/`.
- [ ] Do not commit generated `.zip` release bundles unless intentionally publishing them.
