## Goal

Fix the downstream `Build and Deploy` workflow, which fails at `npm ci` because `package-lock.json` is out of sync with `package.json`. Lovable manages dependencies via Bun, so the npm lockfile drifts whenever packages are added/updated here.

## Change

Regenerate `package-lock.json` against the current `package.json` and commit it. Verified locally that `npm install --package-lock-only` produces a 467-line diff and resolves cleanly — no `package.json` changes needed.

Steps:

1. Run `npm install --package-lock-only --ignore-scripts` at the project root to refresh `package-lock.json` in place.
2. Leave `package.json`, `bun.lock`, and `bun.lockb` untouched.
3. Push (auto-syncs to downstream via existing mirror workflow) and re-run `Build and Deploy`.

## Files touched

- `package-lock.json` — regenerated

## Caveat (for later, not part of this change)

Because Lovable uses Bun internally, `package-lock.json` will drift again the next time a dependency is added or updated here. When that happens, either regenerate again or switch `.github/workflows/build-and-deploy.yaml` to Bun (`oven-sh/setup-bun` + `bun install --frozen-lockfile` + `bun run build`) to make the drift self-healing. Not doing that now per your choice.
