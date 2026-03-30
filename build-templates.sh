#!/usr/bin/env bash
# build-templates.sh
#
# Builds all game template projects by calling yarn commands in template-projects,
# then copies the output into the builder's templates directory.
#
# Usage:
#   ./build-templates.sh              # build all games
#   ./build-templates.sh group-sort   # build a single game by id

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_PROJECTS="$REPO_ROOT/template-projects"
BUILDER_TEMPLATES="$REPO_ROOT/builder-projects/electron-app-mui/templates"

# ── Game list ─────────────────────────────────────────────────────────────────
# Add a new row here when you add a new game template project.
#   Format: "<game_id>|<game_id>" (project path matches game id)
GAMES=(
  "group-sort"
  "plane-quiz"
  "balloon-letter-picker"
  "pair-matching"
  "word-search"
  "whack-a-mole"
  # "my-new-game"
)

# ── Helpers ───────────────────────────────────────────────────────────────────
info()  { echo -e "\033[1;34m[INFO]\033[0m  $*"; }
ok()    { echo -e "\033[1;32m[ OK ]\033[0m  $*"; }
warn()  { echo -e "\033[1;33m[WARN]\033[0m  $*"; }
err()   { echo -e "\033[1;31m[ERR ]\033[0m  $*" >&2; }

# ── Main ─────────────────────────────────────────────────────────────────────
FILTER="${1:-}"  # optional: only build this game_id

# Change to template-projects directory
cd "$TEMPLATE_PROJECTS"

# Check if yarn is available
if ! command -v yarn &> /dev/null; then
    err "yarn is not installed. Run: corepack enable && corepack prepare yarn@4.13.0 --activate"
    exit 1
fi

# Install dependencies
info "Installing dependencies..."
if ! yarn install; then
    err "Failed to install dependencies"
    exit 1
fi

# Build shared libraries first
info "Building shared libraries..."
if ! yarn build:shared; then
    err "Failed to build shared libraries"
    exit 1
fi

ok "Shared libraries built successfully"
echo ""

# Build each game template
built=0
failed=0

for game_id in "${GAMES[@]}"; do
  # If a filter was supplied, skip non-matching games
  if [[ -n "$FILTER" && "$game_id" != "$FILTER" ]]; then
    continue
  fi

  info "Building '$game_id'"

  # Build using yarn workspace
  if ! yarn "build:$game_id"; then
    err "Build failed for $game_id"
    (( failed++ )) || true
    warn "Build failed for $game_id — continuing"
    continue
  fi

  # Copy dist -> builder templates/<game_id>/game/
  target_dir="$BUILDER_TEMPLATES/$game_id/game"
  abs_project="$TEMPLATE_PROJECTS/$game_id"
  
  info "Copying dist -> $target_dir"
  mkdir -p "$target_dir"
  rm -rv "$target_dir/" 2>/dev/null || true
  cp -rv "$abs_project/dist/." "$target_dir/"

  ok "Done: $game_id"
  (( built++ )) || true
done

echo ""
if [[ $failed -gt 0 ]]; then
  err "Completed with errors: $built built, $failed failed."
  exit 1
else
  ok "All done: $built game(s) built and copied to builder templates."
fi
