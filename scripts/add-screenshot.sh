#!/usr/bin/env bash
# add-screenshot.sh — copy a screenshot into both documentation locations.
#
# Usage:
#   scripts/add-screenshot.sh <source-path> <name>
#
# <name> must be kebab-case <area>-<subject>[-<state>], no extension.
# Examples of <area>: home, layers, layer-card, data-sources, stac-browser,
#   s3-browser, services, settings, draw-order, charts, statistics,
#   constraints, configuration, preview, healthcheck.
#
# Copies <source-path> to:
#   docs/assets/screenshots/<name>.png            (mkdocs source)
#   public/guide/assets/screenshots/<name>.png    (built/served guide)
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "usage: $0 <source-path> <name>" >&2
  exit 2
fi

src="$1"
name="$2"

if [[ ! -f "$src" ]]; then
  echo "error: source file not found: $src" >&2
  exit 1
fi

if [[ ! "$name" =~ ^[a-z0-9]+(-[a-z0-9]+)+$ ]]; then
  echo "error: name must be kebab-case (e.g. layer-card-edit-top), got: $name" >&2
  exit 1
fi

dest1="docs/assets/screenshots/${name}.png"
dest2="public/guide/assets/screenshots/${name}.png"

mkdir -p "$(dirname "$dest1")" "$(dirname "$dest2")"
cp "$src" "$dest1"
cp "$src" "$dest2"

echo "wrote $dest1"
echo "wrote $dest2"
echo "markdown: ![alt](../assets/screenshots/${name}.png)"
