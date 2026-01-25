<!-- Title (use imperative): -->
chore: untrack node_modules and add to .gitignore

## Summary
- Untracked committed `node_modules/` directories and ensured `node_modules/` is listed in `.gitignore`.

## What changed
- Removed tracking of `backend/node_modules` and `frontend/attenance-frontend/node_modules` from the working tree (untracked via git).
- Added/validated `node_modules/` and `**/node_modules/` entries in the repository `.gitignore`.

## Why
- `node_modules` should not be stored in Git: it bloats the repository and causes platform-specific conflicts.

## Impact
- This change does not rewrite repository history; it only stops tracking `node_modules` going forward.
- If you need `node_modules` removed from past commits (to shrink repository size), we can perform a history rewrite using `git filter-repo` or BFG. That operation is destructive and requires a force-push — all collaborators must re-clone or follow recovery steps.

## Recommended follow-ups (optional)
1. Run a clean install locally:

   ```bash
   npm ci
   # or
   npm install
   ```

2. If you want a full history purge (removes `node_modules` from past commits):
   - I can prepare and run `git filter-repo` or BFG on a branch and coordinate a forced update.
   - After a history rewrite, all contributors must re-clone the repository (or follow instructions to recover their local branches).

## Testing
- Confirm frontend and backend build by running `npm install` in each package and `npm start` locally.

## Notes for reviewers
- This is a housekeeping change. Approving will keep `node_modules` out of future commits and avoid accidental re-addition.
