

## Downgrade Vitest to ^3.1.4

**File: `package.json`** (line 75)

Change `"vitest": "^4.0.18"` to `"vitest": "^3.1.4"`.

This resolves the version mismatch where Vitest 4.x requires Vite 6+ but the project uses Vite 5.4. The lockfile will be regenerated automatically.

