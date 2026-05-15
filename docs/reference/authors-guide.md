---
title: Authors Guide
---

# Authors Guide

This page is for **documentation authors** — anyone editing the Markdown
sources in `docs/` and publishing the rendered site to GitHub.

The user guide is built with [MkDocs](https://www.mkdocs.org/) using the
[Material](https://squidfunk.github.io/mkdocs-material/) theme. Sources live
under `docs/`, the build output lands in `public/guide/`, and both are
committed to the same repository so the published web app can serve the
guide directly from `/guide/`.

## Common edits — where things live

| You want to…                                          | Edit                                                                 |
|-------------------------------------------------------|----------------------------------------------------------------------|
| Fix a typo or rewrite a paragraph                     | The relevant `.md` under `docs/`. Filenames mirror the URL path.     |
| Add a new page                                        | Create the `.md` file, then add it to `nav:` in `mkdocs.yml`.        |
| Add a screenshot                                      | Use `scripts/add-screenshot.sh <source.png> <kebab-name>` — it copies into both `docs/assets/screenshots/` and `public/guide/assets/screenshots/`. See [Screenshot conventions](#screenshot-conventions) below. |
| Change the left-hand nav order or labels              | The `nav:` block in `mkdocs.yml`.                                    |
| Change site theme, colours, plugins                   | The top of `mkdocs.yml` (`theme:`, `markdown_extensions:`, `plugins:`). |
| Update the rendered HTML served by the live app       | Run `./build-docs.sh --push`, then redeploy the app from your hosting platform. |

## Screenshot conventions

- File names are **kebab-case**, descriptive, scoped to the feature: `layer-card-edit-top.png`, `chart-pixel-values-empty.png`.
- Files live in `docs/assets/screenshots/` and are mirrored to `public/guide/assets/screenshots/`. The `scripts/add-screenshot.sh` helper does both copies in one step.
- Reference them from Markdown with a relative `../assets/screenshots/<name>.png` path and an alt text that describes the visible UI state, not just the feature name.
- Capture against the **Comprehensive demo** config when possible, so screenshots stay consistent across pages.

## Editing workflow

1. Edit Markdown files under `docs/` directly in the GitHub repo on the
   `documentation` branch.
2. Push the change to `origin/documentation`.
3. Run `./build-docs.sh --push` from `~/documentation/mkdocs-project/` to
   pull the latest `docs/`, rebuild `public/guide/`, and push the regenerated
   HTML back to GitHub.
4. Redeploy the app so the new `public/guide/` is served from the live site
   (and any custom domain).

Source edits and the corresponding rebuilt HTML always live in the same
commit history, so there is one source of truth for what the published guide
looks like.

## The `build-docs.sh` script

The script lives outside the project repo, at:

```
~/documentation/mkdocs-project/build-docs.sh
```

alongside a Python virtualenv (`venv/`) that has `mkdocs` and
`mkdocs-material` installed. On first run it clones the
`apex-ge-config-builder` repo into `./repo/`. On subsequent runs it
hard-resets `./repo/` to `origin/<branch>` so the build is always against a
clean tree that matches GitHub.

### Usage

```bash
cd ~/documentation/mkdocs-project
./build-docs.sh --help              # show usage
./build-docs.sh                     # build current branch (prompts to confirm)
./build-docs.sh -b documentation    # build a specific branch
./build-docs.sh --push              # build + commit + push
./build-docs.sh -b documentation -p \
    -m "Update charts section"      # build + push with custom commit message
```

### Options

| Flag | Description |
|------|-------------|
| `-b`, `--branch <name>` | Branch to build from (default: `documentation`). If omitted, the script prompts you to confirm or change the current branch interactively. |
| `-p`, `--push` | After a successful build, `git add` / `commit` / `push` the updated `docs/`, `public/guide/`, and `mkdocs.yml` back to the branch on GitHub. Without this flag, the script only builds locally. |
| `-m`, `--message <msg>` | Commit message used with `--push` (default: `Rebuild user guide`). |
| `-h`, `--help` | Show help and exit. |

### What it does, step by step

1. Validates that `venv/bin/activate` exists.
2. Clones the repo into `./repo/` on first run, otherwise `git fetch --all --prune`.
3. Echoes the current branch and asks which branch to build (unless `-b` was passed).
4. `git checkout <branch>` then `git reset --hard origin/<branch>` — discards
   any local edits inside `repo/`.
5. Activates the venv and runs `mkdocs build --strict --config-file repo/mkdocs.yml`.
6. If `--push`: stages `docs/`, `public/guide/`, and `mkdocs.yml`, commits if
   there is a diff, and pushes to `origin/<branch>`.

!!! warning "Local edits inside `repo/` are discarded"
    Because the script hard-resets to `origin/<branch>` on every run, any
    uncommitted edits you make inside `~/documentation/mkdocs-project/repo/`
    will be lost. Always edit via the main repo workflow (or commit from
    `repo/` manually and push) before re-running.

!!! note "Nothing to commit?"
    The build is deterministic. If no Markdown source changed since the last
    push, the rebuilt `public/guide/` will be byte-identical to what is
    already on `origin`, and the script will report
    `Nothing to commit — working tree matches origin.` That is expected.

### Live preview

For a live-reloading local preview while drafting:

```bash
cd ~/documentation/mkdocs-project/repo
mkdocs serve
```

Then open [http://127.0.0.1:8000/guide/](http://127.0.0.1:8000/guide/).

## First-time setup

If you do not already have the script and venv on your machine:

```bash
mkdir -p ~/documentation/mkdocs-project
cd ~/documentation/mkdocs-project
python3 -m venv venv
source venv/bin/activate
pip install mkdocs mkdocs-material
# then save build-docs.sh below into this directory
chmod +x build-docs.sh
./build-docs.sh --help
```

## Full script

```bash
#!/usr/bin/env bash
# build-docs.sh — Build (and optionally publish) the Apex GE Config Builder user guide.
#
# Location: ~/documentation/mkdocs-project/build-docs.sh
# Assumes:  ~/documentation/mkdocs-project/venv  (python venv with mkdocs + mkdocs-material)

set -euo pipefail

# ---- Defaults -----------------------------------------------------------------
REPO_URL="https://github.com/ormsbydaniel/apex-ge-config-builder.git"
DEFAULT_BRANCH="documentation"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="${PROJECT_DIR}/repo"
VENV_ACTIVATE="${PROJECT_DIR}/venv/bin/activate"

PUSH=0
BRANCH=""
COMMIT_MSG="Rebuild user guide"

# ---- Help ---------------------------------------------------------------------
show_help() {
  cat <<EOF
Usage: ./build-docs.sh [options]

Builds the MkDocs user guide for apex-ge-config-builder into repo/public/guide/.

Options:
  -b, --branch <name>     Branch to build from (default: ${DEFAULT_BRANCH}).
                          If omitted, the script prompts you to confirm or change
                          the current branch interactively.
  -p, --push              After a successful build, git add / commit / push the
                          updated docs/ and public/guide/ back to the branch on
                          GitHub. Without this flag, the script only builds
                          locally and leaves it to you to commit.
  -m, --message <msg>     Commit message used with --push
                          (default: "${COMMIT_MSG}").
  -h, --help              Show this help and exit.

Examples:
  ./build-docs.sh                          # build the default branch (prompts)
  ./build-docs.sh -b documentation         # build a specific branch
  ./build-docs.sh --push                   # build + commit + push
  ./build-docs.sh -b documentation -p \\
      -m "Update charts section"           # build + push with custom message

Notes:
  * On first run the repo is cloned into ./repo/. On later runs it is hard-reset
    to origin/<branch> to discard local cruft.
  * Preview locally (live reload) with:
        cd repo && mkdocs serve
    then open http://127.0.0.1:8000/guide/
EOF
}

# ---- Arg parsing --------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    -b|--branch)   BRANCH="${2:?}"; shift 2 ;;
    -p|--push)     PUSH=1; shift ;;
    -m|--message)  COMMIT_MSG="${2:?}"; shift 2 ;;
    -h|--help)     show_help; exit 0 ;;
    *) echo "Unknown option: $1" >&2; echo; show_help; exit 1 ;;
  esac
done

# ---- Sanity checks ------------------------------------------------------------
if [[ ! -f "${VENV_ACTIVATE}" ]]; then
  echo "ERROR: venv not found at ${VENV_ACTIVATE}" >&2
  echo "Create it and install deps:  python3 -m venv venv && source venv/bin/activate && pip install mkdocs mkdocs-material" >&2
  exit 1
fi

# ---- Clone or update the repo -------------------------------------------------
if [[ ! -d "${REPO_DIR}/.git" ]]; then
  echo ">>> Cloning ${REPO_URL} into ${REPO_DIR}"
  git clone "${REPO_URL}" "${REPO_DIR}"
fi

cd "${REPO_DIR}"
git fetch --all --prune

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
echo ">>> Current branch in repo/: ${CURRENT_BRANCH}"

# Determine which branch to build
if [[ -z "${BRANCH}" ]]; then
  read -r -p "Build which branch? [${CURRENT_BRANCH}] " USER_BRANCH
  BRANCH="${USER_BRANCH:-${CURRENT_BRANCH}}"
fi
echo ">>> Building branch: ${BRANCH}"

git checkout "${BRANCH}"
git reset --hard "origin/${BRANCH}"

# ---- Activate venv & build ----------------------------------------------------
# shellcheck disable=SC1090
source "${VENV_ACTIVATE}"

echo ">>> Running mkdocs build (strict)"
mkdocs build --strict --config-file "${REPO_DIR}/mkdocs.yml"

echo ">>> Build complete: ${REPO_DIR}/public/guide/"

# ---- Optional commit + push ---------------------------------------------------
if [[ "${PUSH}" -eq 1 ]]; then
  echo ">>> Staging docs/ and public/guide/"
  git add docs public/guide mkdocs.yml

  if git diff --cached --quiet; then
    echo ">>> Nothing to commit — working tree matches origin."
  else
    git commit -m "${COMMIT_MSG}"
    echo ">>> Pushing to origin/${BRANCH}"
    git push origin "${BRANCH}"
    echo ">>> Pushed."
  fi
else
  echo ">>> --push not set. To publish, run:"
  echo "    cd ${REPO_DIR} && git add docs public/guide mkdocs.yml && git commit -m \"${COMMIT_MSG}\" && git push origin ${BRANCH}"
fi
```
