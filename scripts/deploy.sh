#!/usr/bin/env bash
# Deploy both solutions to UiPath Orchestrator.
# Prerequisites: uip login --tenant <tenant> --organization <org>
# Usage: ./scripts/deploy.sh [parent-folder-path]
#   e.g. ./scripts/deploy.sh Shared
set -euo pipefail

PARENT_FOLDER="${1:-Shared}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$REPO_ROOT/dist"
mkdir -p "$DIST"

deploy_solution() {
  local name="$1"
  local dir="$2"
  local pkg="$DIST/${name}.zip"

  echo "=== Packing $name ==="
  uip solution pack "$dir" "$DIST"

  # solution pack produces a .zip in DIST — find it
  local zip
  zip=$(ls -t "$DIST"/*.zip 2>/dev/null | head -1)
  [[ -z "$zip" ]] && { echo "ERROR: no .zip found in $DIST after pack"; exit 1; }

  echo "=== Publishing $name ($zip) ==="
  uip solution publish "$zip"

  echo "=== Deploying $name → folder '$name' under '$PARENT_FOLDER' ==="
  uip solution deploy run \
    --name "${name}-deployment" \
    --package-name "$name" \
    --folder-name "$name" \
    --parent-folder-path "$PARENT_FOLDER"

  echo "✓ $name deployed"
}

deploy_solution "ContractComparisonSolution" "$REPO_ROOT/ContractComparisonSolution"
deploy_solution "GuidelineIndexerSolution"   "$REPO_ROOT/GuidelineIndexerSolution"

echo ""
echo "=== All deployments complete ==="
echo "Verify in Orchestrator > Automations > Processes:"
echo "  $PARENT_FOLDER/ContractComparisonSolution/ContractComparisonProcess"
echo "  $PARENT_FOLDER/GuidelineIndexerSolution/guideline-indexer"
