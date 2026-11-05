# FA Aquavolt Hydropure LLC

Owner: Private / confidential

Location: Del Rio, Texas

The website displays current weather for Del Rio using the Open-Meteo API. It loads in the visitor's browser, refreshes automatically every 15 minutes, and can be refreshed manually. A network or service error is shown on the page. Business availability and turbine operating data are not displayed because no live data source has been provided.

## Testing

Requires Node.js 18 or newer. Run `npm test` for local frontend, axe WCAG 2.1 A/AA, and color-contrast checks. Run `npm run test:live` to run those checks plus a live request to the Open-Meteo API; the live check requires internet access. axe runs in jsdom, so rendered color contrast is verified separately by the contrast test.

## Git workflow reference

These commands are useful when working on feature branches, fixing bugs, or temporarily setting aside work before sharing changes.

### `git stash`

Use `git stash` to save uncommitted work without creating a commit.

```bash
# Save tracked changes with a message
git stash push -m "work in progress"

# Save tracked and untracked files
git stash push -u -m "work in progress"

# Save tracked, untracked, and ignored files
git stash push -a -m "work in progress"

# View saved stashes
git stash list

# Show the latest stash summary
git stash show --stat

# Restore and remove the latest stash if it applies cleanly
git stash pop

# Restore a stash without removing it
git stash apply stash@{0}

# Remove a specific stash
git stash drop stash@{0}

# Remove every stash
git stash clear
```

Use `-u` for untracked files. Use `-a` only when you intentionally want ignored files included, such as local build artifacts or editor settings.

### `git cherry-pick`

Use `git cherry-pick` to apply a single commit to the current branch without merging the whole branch history.

```bash
# Move to the target branch
git switch main

# Apply one commit by hash
git cherry-pick a1b2c3d

# Apply multiple commits in order
git cherry-pick a1b2c3d d4e5f6a

# Continue after resolving any conflicts
git cherry-pick --continue

# Abort the operation
git cherry-pick --abort
```

This is helpful when a fix was already committed elsewhere and you want to bring just that fix into the current branch.

### `git revert`

Use `git revert` when you want to undo a commit safely without rewriting shared history.

```bash
# Revert one specific commit
git revert a1b2c3d

# Revert without opening an editor for the message
git revert --no-edit a1b2c3d

# Continue after resolving conflicts
git revert --continue

# Abort the revert
git revert --abort
```

This creates a new commit that reverses the change instead of deleting history, which makes it safer for shared branches.

### `git reset`

Use `git reset` to move the current branch back to another commit. It changes local history, so use it carefully.

```bash
# Move HEAD back one commit and keep changes staged
git reset --soft HEAD~1

# Move HEAD back one commit and unstage changes
git reset --mixed HEAD~1

# Move HEAD back one commit and discard changes
# WARNING: this permanently removes uncommitted work and local commits
git reset --hard HEAD~1
```

`--soft` keeps work staged, `--mixed` unstages it but keeps changes in your working tree, and `--hard` discards everything after the target commit. Use `--hard` only when you are certain you do not need the changes.

### Recommended workflow

- Use `git stash` for temporary context switching.
- Use `git cherry-pick` to bring one fix onto another branch.
- Use `git revert` to safely undo a commit that has already been shared.
- Use `git reset` only for local, unpublished work.

### Quick reminder

Before using commands that rewrite or discard history, check your status:

```bash
git status
git log --oneline --decorate --graph -n 10
```

These commands help keep development safe while still making recovery easier when a mistake happens.

## Developer documentation

The project includes a reference for working with advanced Git commands during local development and branch management.
