# User-Scoped Claude Code Instructions

## Beads Issue Tracking (Global)

All projects should use Beads (`bd`) for AI-optimized issue tracking when a `.beads/` directory exists.

### Startup Check
At session start, check if `.beads/` exists in the project:
- If yes: Run `bd ready --json` to see available work
- If no: This project doesn't use Beads yet (user can initialize with `bd init` if desired)

### Essential Commands
| Command | Purpose |
|---------|---------|
| `bd ready` | Show unblocked tasks ready for work |
| `bd create "Title" -p 1` | Create priority-1 issue |
| `bd update <id> --status in_progress` | Claim a task |
| `bd close <id> --reason "Done"` | Complete a task |
| `bd dep add <child> <parent>` | Link dependencies |
| `bd sync` | Export and push changes |
| `bd show <id>` | View issue details |
| `bd list` | List all issues |

### Workflow Rules
1. **Before starting work**: Run `bd ready` to find unblocked tasks
2. **Claim work**: `bd update <id> --status in_progress`
3. **During work**: If you discover bugs/issues, create them with `bd create` and link with `bd dep add <new-id> <current-id> --type discovered-from`
4. **After completing**: `bd close <id> --reason "Done"` and `bd sync`
5. **Never lose work**: Always file discovered issues before moving on
6. **Landing the plane**: When finishing a session, run `bd sync` to ensure all changes are pushed

### Pre-existing Bugs and Errors
When you encounter bugs or errors that are **unrelated to the current task** or are **pre-existing in the codebase**:
1. **Create a bead** for the issue using `bd create "BUG: <description>" -p 2 --type bug`
2. **Do NOT attempt to fix** if it would distract from the current task
3. **Document** what you observed in the bead description
4. **Continue** with the original task

This ensures issues are captured for another developer to resolve without derailing current work.

### CRITICAL: Verification Before Closing
**NEVER close a bead until the fix/feature is VERIFIED to be working correctly.**

- Do NOT close beads just because code was written and pushed
- Do NOT close beads based on "should work" assumptions
- Wait for deployment to complete and TEST the actual behavior
- Ask the user to verify if you cannot test yourself
- Only close after confirmation that the change works as expected

If you need to track that code is written but unverified, add a comment to the bead or update its description with "Pending verification" instead of closing it.

### Priority Scale
- 0 = Critical (security, data loss, build failures)
- 1 = High (major features, significant bugs)
- 2 = Medium (enhancements, minor issues)
- 3 = Low (refinement, optimization)
- 4 = Backlog (future possibilities)

### Issue Types
`bug`, `feature`, `task`, `epic`, `chore`

### Beads Viewer
If you need to visualize the issue graph or get insights, the `bv` TUI is available:
- `bv` - Launch viewer
- `bv --robot-triage` - Get full project snapshot (for AI)
- `bv --robot-plan` - Get execution plan
