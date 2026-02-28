Title: chore: stop tracking node_modules and add to .gitignore

This branch removes tracked `node_modules` files from the repository index and ensures `node_modules/` is present in `.gitignore`.

What I did:
- Untracked all committed `node_modules` files (keeps local copies intact).
- Committed the `.gitignore` change to stop tracking `node_modules` going forward.
- Pushed the cleanup branch `feature/remove-node-modules` to `origin`.

Why:
- `node_modules` is large, platform-specific, and should not be tracked in Git. Keeping it out of the repository improves clone/fetch performance and avoids accidental commits.

Notes for collaborators:
- Pull the branch and review: `git fetch origin && git checkout feature/remove-node-modules`.
- After this merges, run `git pull` on your local clones. If you still see `node_modules` files tracked, run:

```bash
git rm -r --cached node_modules
git commit -m "chore: untrack node_modules (local)"
```

- No history rewrite was performed; this avoids forcing everyone to re-clone. If you prefer a history-clean repo (smaller repository size), we can follow up with a repository rewrite using `git filter-repo` or BFG, but that requires force pushes and coordinated re-cloning.

Open PR URL:
- https://github.com/joel1-coder/COLLEGE-ATTENDENCE-/compare/main...feature/remove-node-modules?expand=1


