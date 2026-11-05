# Git workflow reference

This project benefits from a few advanced Git commands that help when working on a feature branch, fixing a bug, or cleaning up local history before sharing changes.

## `git stash`

Use `git stash` when you want to temporarily save uncommitted work without committing it.

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

# Show the patch for the latest stash
git stash show -p

# Restore and remove the latest stash if it applies cleanly
git stash pop

# Restore a specific stash without removing it
git stash apply stash@{0}

# Remove a specific stash
git stash drop stash@{0}

# Remove every stash
git stash clear
```

Use `-u` when you want to include untracked files. Use `-a` only when you intentionally want to stash ignored files too, such as local build artifacts or editor settings.

## `git cherry-pick`

Use `git cherry-pick` to apply the changes from one commit onto the current branch without copying the whole branch history.

```bash
# Move to the branch that should receive the fix
git switch main

# Apply a single commit by hash
git cherry-pick a1b2c3d

# Apply multiple commits in order
git cherry-pick a1b2c3d d4e5f6a

# Continue after resolving conflicts
git cherry-pick --continue

# Abort the cherry-pick
git cherry-pick --abort
```

This is useful when a fix was committed on another branch and you want to bring only that fix into the current branch.

## `git revert`

Use `git revert` when you want to undo a commit without rewriting public history. It creates a new commit that reverses the original changes.

```bash
# Revert a specific commit
git revert a1b2c3d

# Revert without opening the editor for the message
git revert --no-edit a1b2c3d

# Continue after resolving conflicts
git revert --continue

# Abort the revert
git revert --abort
```

This is the safer option for shared branches because it preserves history and avoids force-pushing.

## `git reset`

Use `git reset` to move the current branch back to another commit. This changes local history and should be used carefully.

```bash
# Move HEAD back one commit and keep changes staged
git reset --soft HEAD~1

# Move HEAD back one commit and unstage changes
git reset --mixed HEAD~1

# Move HEAD back one commit and discard changes
# WARNING: this permanently removes uncommitted work and local commits
git reset --hard HEAD~1
```

`--soft` is good for keeping work staged, `--mixed` is the default and keeps the changes in the working tree, and `--hard` discards everything after the target commit. Use `--hard` only when you are certain you do not need the changes.

## Recommended workflow

- Use `git stash` for temporary context-switching.
- Use `git cherry-pick` to bring one fix onto another branch.
- Use `git revert` to undo a bad commit safely.
- Use `git reset` only on local, unpublished work.

## Quick reminder

Before using commands that rewrite or discard history, check your status:

```bash
git status
git log --oneline --decorate --graph -n 10
```

These commands help keep development safe and predictable while still allowing quick recovery from mistakes.
