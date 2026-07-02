Add two temporary diagnostic steps to `.github/workflows/mirror-to-esa-apex.yaml`, inserted **before** the existing `Add ESA remote` step so they run regardless of whether the push works.

## Step 1 — Show mirror context (non-secret sanity check)

Confirms the run is coming from the expected source repo, branch, and targeting the expected ESA repo/ref.

```yaml
- name: Show mirror context
  run: |
    echo "Source repo:   ${{ github.repository }}"
    echo "Workflow ref:  ${{ github.ref_name }}"
    echo "Target repo:   ${ESA_REPO}"
    echo "Requested ref: ${REF}"
```

## Step 2 — Verify ESA token can see target repo

Uses the `gh` CLI (pre-installed on `ubuntu-latest`) with `GH_TOKEN` set to the mirror PAT. This makes a real authenticated API call, so:

- If it succeeds, the PAT is valid, approved, and can see the repo — narrowing the problem to the git push step.
- If it fails, we see the exact GitHub error (not-found vs. permission vs. bad credentials).
- Either way, the PAT's "last used" timestamp will update, proving whether the workflow is actually sending this token.

```yaml
- name: Verify ESA token can see target repo
  env:
    GH_TOKEN: ${{ secrets.ESA_APEX_MIRROR_TOKEN }}
  run: |
    set -euo pipefail
    gh auth status
    gh repo view "${ESA_REPO}" --json nameWithOwner,visibility,defaultBranchRef
```

The token value is never echoed; `gh auth status` masks it, and `secrets.*` values are automatically redacted from Actions logs.

## Placement

Insert both steps between the existing `Validate token is configured` step and `Checkout ref with full history` (they don't need the checkout). No other steps are changed. Once we identify the cause, we can remove or keep these diagnostics.