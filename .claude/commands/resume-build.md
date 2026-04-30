# /resume-build — Resume Autonomous Build

Read `docs/BUILD_STATUS.md` to determine the last successfully completed phase,
then continue building from the next phase without human intervention.

## Step 1 — Read build status
Read `docs/BUILD_STATUS.md`.
If the file does not exist, assume no phases are complete and run `/build-all` from the beginning.

## Step 2 — Verify last completed phase
Run the completion checklist for the last phase marked ✅ to confirm it is actually complete.
If it fails verification, re-run that phase before continuing.

## Step 3 — Continue from next phase
Pick up exactly where the build left off, following all the same rules as `/build-all`:
- No confirmation between phases
- Fix soft blockers automatically
- Stop and report hard blockers
- Update `docs/BUILD_STATUS.md` after each phase

## Step 4 — Handle partial phases
If a phase is marked 🔄 (in progress), re-run it from the beginning.
Claude Code creates files idempotently — re-running a phase is always safe.
Existing files that are already correct will be verified and left untouched.
Files that are missing or incorrect will be created or fixed.

## Note on context
If this is a new Claude Code session, re-read `CLAUDE.md` first to restore full project context
before resuming. All agent definitions in `.claude/agents/` are available as before.
