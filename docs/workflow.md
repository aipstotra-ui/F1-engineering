# Workflow

## Step loop (one roadmap step = one branch = one PR)
1. **Orient.** Read the `PLAN.md` "Now" block plus only the docs `CLAUDE.md` routes to for this step.
2. **Branch.** `git checkout -b step-NN-short-name` from an up-to-date `main`.
3. **Build.** Small commits. Explain every new file to the user in 1–2 plain sentences.
4. **Self-check.** `npm test`, `npm run typecheck` and `npm run lint` must all pass. If `lab/` changed: `uv run --directory lab ruff check`, `uv run --directory lab ruff format --check` and `uv run --directory lab pytest -m "not network"`.
5. **Checkers.** Pick agents from the trigger table in `CLAUDE.md` using `git diff --name-only main...HEAD`. If visual-qa is triggered, first start `npm run dev` in the background. Launch them **in parallel in one message** and give each one the changed file list (plus the new/changed fact IDs for f1-fact-checker).
6. **Fix.** The main agent fixes the findings, then re-runs only the checkers that reported a blocker.
7. **Record.** Tick the step in `PLAN.md` and update its **Now** block. Append any new decision to `docs/decisions.md`. Add new facts to `docs/facts.md`.
8. **Ship.** Commit, push and open a PR (the template fills in the checklist). Watch CI. **The user reviews and merges.** Never push to `main`.
9. **Report.** Give the user the step report below in chat.

## Step report (after every step)
```
## Step NN done: <name>
**What was made**: 3–6 bullets in plain words, naming the key files
**Try it**: exact commands / URL (Vercel preview) and what you should see
**Checks**: tests/typecheck/lint/pytest results + each agent's verdict (and what was fixed)
**Not done / caveats**: anything skipped or unverified
**Next**: the next step in one line
```

## Checker contract
- Input: the step goal + the changed files (paths only; the agent reads what it needs).
- Output: at most ~15 lines, as `BLOCKER|WARN|NIT  path:line  problem → fix`, ending with `VERDICT: PASS` or `VERDICT: FAIL`.
- Checkers never edit files. Only `part-pipeline` writes, and only within its allowed paths.
- Paste each checker's verdict line into the PR template.

## Step 4 (part production) branching
AI parts are produced in batches alongside other steps: one branch + PR per batch, `parts-batch-NN`, each holding a few cleaned parts plus their catalog stubs and source rows.

## Web access
f1-fact-checker uses WebSearch/WebFetch to read sources (text lookups). Visual browsing of the app uses the gstack browse CLI (visual-qa), per the global `/browse` rule.

## Deep checks (occasional, heavier gstack skills)
- `/cso` before the app goes public.
- `/qa` before deploy (Step 20).

## Session hand-off
Before ending a session mid-step, update the `PLAN.md` "Now" block: current step, next action, open questions, blockers. Keep it to 10 lines or fewer.

## Commits
Imperative subject (≤ 60 chars), with a body when the change needs explaining. End with the Co-Authored-By line the harness provides.
