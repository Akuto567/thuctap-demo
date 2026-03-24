#!/usr/bin/env bash
# build-templates.sh
#
# Builds every game template project and copies the output into the builder's
# templates directory, mirroring what the GitHub Actions workflow does.
# Does NOT build the builder itself.
#
# Usage:
#   ./build-templates.sh              # build all games
#   ./build-templates.sh group-sort   # build a single game by id

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILDER_TEMPLATES="$REPO_ROOT/builder-projects/electron-app-mui/templates"

# ── Game list ─────────────────────────────────────────────────────────────────
# Add a new row here when you add a new game template project.
#   Format: "<project_path>|<game_id>"
GAMES=(
  "template-projects/group-sort|group-sort"
  "template-projects/plane-quiz|plane-quiz"
  # "template-projects/my-new-game|my-new-game"
)

# ── Helpers ───────────────────────────────────────────────────────────────────
info()  { echo -e "\033[1;34m[INFO]\033[0m  $*"; }
ok()    { echo -e "\033[1;32m[ OK ]\033[0m  $*"; }
warn()  { echo -e "\033[1;33m[WARN]\033[0m  $*"; }
err()   { echo -e "\033[1;31m[ERR ]\033[0m  $*" >&2; }

build_game() {
  local project_path="$1"
  local game_id="$2"
  local abs_project="$REPO_ROOT/$project_path"
  local target_dir="$BUILDER_TEMPLATES/$game_id/game"

  if [[ ! -d "$abs_project" ]]; then
    err "Template project not found: $abs_project"
    return 1
  fi

  info "Building '$game_id'  ($project_path)"

  # Install dependencies
  (cd "$abs_project" && yarn install --immutable)

  # Build
  (cd "$abs_project" && yarn build)

  # Copy dist -> builder templates/<game_id>/game/
  info "Copying dist -> $target_dir"
  mkdir -p "$target_dir"
  cp -r "$abs_project/dist/." "$target_dir/"

  ok "Done: $game_id"
}

# ── Main ─────────────────────────────────────────────────────────────────────
FILTER="${1:-}"  # optional: only build this game_id

built=0
failed=0

for entry in "${GAMES[@]}"; do
  project_path="${entry%%|*}"
  game_id="${entry##*|}"

  # If a filter was supplied, skip non-matching games
  if [[ -n "$FILTER" && "$game_id" != "$FILTER" ]]; then
    continue
  fi

  if build_game "$project_path" "$game_id"; then
    (( built++ )) || true
  else
    (( failed++ )) || true
    warn "Build failed for $game_id — continuing"
  fi
done

echo ""
if [[ $failed -gt 0 ]]; then
  err "Completed with errors: $built built, $failed failed."
  exit 1
else
  ok "All done: $built game(s) built and copied to builder templates."
fi
