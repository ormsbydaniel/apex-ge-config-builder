**Remedy:** the downstream GitHub Actions build runs `npm ci`, so `package-lock.json` must be in sync with `package.json`.

Use this process on the branch that will be mirrored/deployed:

1. Regenerate the npm lockfile:

```bash
npm install --package-lock-only
```

2. Commit the updated `package-lock.json` together with any `package.json` dependency changes.

3. Re-run the repo sync and downstream **Build and Deploy** workflow.

**Why it failed:** dependency changes were made in `package.json` / Bun lockfiles, but the downstream deployment does not use Bun; it uses `npm ci`, which fails when `package-lock.json` is stale.

**Optional cleanup:** if the downstream repo is intended to be npm-only, remove the Bun lockfiles from that deployment branch to avoid future confusion, but the critical fix is updating `package-lock.json`.