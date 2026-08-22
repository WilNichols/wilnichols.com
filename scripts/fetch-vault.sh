#!/usr/bin/env bash
# Content lives in a private repo. Locally `vault` is a symlink to the working
# vault, so this does nothing. On Netlify there is no symlink, so the content is
# fetched here, before Eleventy runs.
#
# Everything is checked out except .obsidian, which is 9.2MB of vendored plugin
# bundles out of 11.4MB tracked. An exclusion rather than an allowlist, so adding
# a post type needs a symlink and nothing here: what publishes is still decided by
# `private:` and `draft:` in the note, not by this script.
set -euo pipefail

# NETLIFY comes from the platform, not from the inline assignment in the npm
# script, which is why running netlify-build locally correctly no-ops here.
if [ -z "${NETLIFY:-}" ] && [ -z "${VAULT_FORCE_FETCH:-}" ]; then
  echo "[vault] local build, using the existing symlink"
  exit 0
fi

REPO="${VAULT_REPO:-https://github.com/WilNichols/vault.git}"
REF="${VAULT_REF:-main}"

# A publish hook may name the exact commit it wants, so preview, stage and
# publish can all build the same content. Absent (daily build, Zapier), take the
# branch tip.
SHA="$(node -e 'try{const b=JSON.parse(process.env.INCOMING_HOOK_BODY||"{}");if(typeof b.sha==="string"&&/^[0-9a-f]{7,40}$/.test(b.sha))process.stdout.write(b.sha)}catch(e){}' 2>/dev/null || true)"
TARGET="${SHA:-$REF}"

# Token via a credential helper, never in a URL: an argv or a failed-command echo
# would put it in the build log.
if [ -n "${GH_VAULT_PAT:-}" ]; then
  git config --global credential.helper \
    '!f() { echo username=x-access-token; echo "password=${GH_VAULT_PAT}"; }; f'
elif [ -z "${VAULT_FORCE_FETCH:-}" ]; then
  echo "[vault] GH_VAULT_PAT is not set" >&2
  exit 1
fi

rm -rf vault
mkdir -p vault
git -C vault init -q
git -C vault remote add origin "$REPO"
git -C vault sparse-checkout set --no-cone '/*' '!/.obsidian/'

echo "[vault] fetching ${TARGET}${SHA:+ (pinned by the publish hook)}"
git -C vault fetch --depth 1 -q origin "$TARGET"
git -C vault checkout -q FETCH_HEAD

echo "[vault] at $(git -C vault rev-parse --short HEAD), $(find vault -name '*.md' | wc -l | tr -d ' ') notes"
