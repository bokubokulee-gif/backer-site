#!/usr/bin/env bash
# =====================================================================
# Backer → GitHub Pages, one-shot repository setup.
# Creates the repo, pushes the site, and selects the repository's pinned,
# allowlisted GitHub Actions Pages workflow.
#
#   1) Make a token (classic) with the "repo" scope:
#        https://github.com/settings/tokens/new?scopes=repo&description=backer-deploy
#   2) Run:   cd ~/Desktop/backer-site && ./deploy.sh
#   3) Paste your username + token when asked.
#
# Result:    https://<username>.github.io/<repo>/
# =====================================================================
set -e
cd "$(dirname "$0")"

echo ""
echo "  Backer → GitHub Pages"
echo "  ---------------------"
read -r -p "  GitHub username: " GH_USER
read -r -p "  Repo name [backer-site]: " REPO; REPO="${REPO:-backer-site}"
read -r -s -p "  Personal Access Token (repo scope): " GH_TOKEN; echo ""
[ -z "$GH_USER" ] || [ -z "$GH_TOKEN" ] && { echo "  Username and token are required."; exit 1; }

API="https://api.github.com"
HDR_AUTH="Authorization: token ${GH_TOKEN}"
HDR_ACC="Accept: application/vnd.github+json"

echo "  • Creating repo ${GH_USER}/${REPO} (skips if it exists)…"
curl -fsS -X POST "${API}/user/repos" -H "${HDR_AUTH}" -H "${HDR_ACC}" \
  -d "{\"name\":\"${REPO}\",\"private\":false,\"description\":\"Backer — Proof-of-Attention demo\"}" \
  >/dev/null 2>&1 || echo "    (repo already exists — continuing)"

git config user.name  "${GH_USER}" >/dev/null 2>&1 || true
git config user.email "${GH_USER}@users.noreply.github.com" >/dev/null 2>&1 || true

echo "  • Pushing site…"
git branch -M main
git remote remove origin 2>/dev/null || true
git remote add origin "https://${GH_USER}:${GH_TOKEN}@github.com/${GH_USER}/${REPO}.git"
git push -u origin main
git remote set-url origin "https://github.com/${GH_USER}/${REPO}.git"   # strip token from config

echo "  • Enabling the allowlisted GitHub Actions Pages workflow…"
curl -fsS -X POST "${API}/repos/${GH_USER}/${REPO}/pages" -H "${HDR_AUTH}" -H "${HDR_ACC}" \
  -H "X-GitHub-Api-Version: 2026-03-10" -d '{"build_type":"workflow"}' >/dev/null 2>&1 \
  || curl -fsS -X PUT "${API}/repos/${GH_USER}/${REPO}/pages" -H "${HDR_AUTH}" -H "${HDR_ACC}" \
       -H "X-GitHub-Api-Version: 2026-03-10" -d '{"build_type":"workflow"}' >/dev/null 2>&1 \
  || echo "    (couldn't auto-enable — choose GitHub Actions in Settings → Pages)"

echo ""
echo "  ✅ Done. Live in ~1 minute (first build) at:"
echo ""
echo "        https://${GH_USER}.github.io/${REPO}/"
echo ""
