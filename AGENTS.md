# Working in this repo

Eleventy 3 site for wilnichols.com. Prose, albums and recipes live in a
separate private repo carried here as a submodule at `vault/`.

## Architecture

`vault/` is the Obsidian vault. The six published folders are reached through
symlinks so that 11ty's directory data cascade still applies to them:

```
src/Album Groups/notes        -> ../../vault/Photography/Album Groups
src/Albums/Albums/notes       -> ../../../vault/Photography/Albums
src/Notes/Entries/notes       -> ../../../vault/Entries
src/Notes/Case Studies/notes  -> ../../../vault/Work/Case Studies
src/Notes/Links/notes         -> ../../../vault/Links
src/Notes/Recipes-Posts/notes -> ../../../vault/Recipes
src/Pens/Pens-posts/notes     -> ../../../vault/Pens
```

11ty follows symlinked directories and the parent's `.11tydata.js` cascades
into them, which is what keeps every permalink, layout and tag rule in this
repo while the markdown lives in the vault. Do not move build config into the
vault.

Pen frontmatter carries paths like `../static/css/pens/fading-list.scss`, which
`src/_includes/highlight.njk` feeds to `{% include %}`. Nunjucks resolves those
against the **includes directory**, not against the note, so they are immune to
the extra directory level the symlink introduces. Do not "fix" them to match the
note's own depth.

## Rules

**Directory data files must be named after their directory.** `Recipes.11tydata.js`
sat in `Recipes-Posts/` and had never once loaded — no layout, no tags, the
recipe absent from the feed and rendering as raw HTML. Verify with:

```bash
find src -name "*.11tydata.js" | while read f; do
  d=$(basename "$(dirname "$f")"); n=$(basename "$f" .11tydata.js)
  [ "$d" = "$n" ] || echo "MISMATCH $f"
done
```

**Never edit `vault/` in place.** It is a submodule checkout. Commit in the
vault repo, push, then `git -C vault fetch && git -C vault checkout <sha>` and
commit the pointer.

**Computed data overrides frontmatter.** `title` returns `page.fileSlug`
deliberately; several albums carry a frontmatter `title` that disagrees, and
the filename is the version that ships. If you ever make frontmatter win, use
`||` not `??` — 11ty supplies an empty string, not undefined, when the key is
absent, and `??` blanks every title on the site.

## Verifying a change

Byte-diffing `_site` is useless: the `bust` filter stamps a fresh timestamp
into every asset URL on every build. Strip it first, then compare.

```bash
git worktree add -q --detach /tmp/main-build main
# build both with ELEVENTY_ENV=dev FAST=true, then
sed 's/?v=[0-9]\{6,\}//g'
```

Compare three things, in order: the set of output files, the `<title>` of every
page, and only then contents. The page-set check alone will miss a change that
alters text without adding or removing a page.

`FAST=true` skips the S3 album listing, so galleries are empty and album `key`
is only exercised through `og:image`. That is enough to catch a key regression.

## Environment

`.env` holds AWS credentials for the album listing and the CDN host. Netlify
needs a deploy key on the private vault repo to fetch the submodule, and the
vault repo needs a `SITE_REPO_TOKEN` secret so its action can open PRs here.
