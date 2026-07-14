---
name: verify-az204-content
description: Verify an AZ-204 quiz question, flashcard, or study-note claim against official Microsoft Learn pages before marking it verified, correcting it, or citing it as a source. Use when adding new content, auditing existing content in src/data/, investigating a suspected factual error, or deciding whether an item is redundant/out-of-scope for the current AZ-204 exam.
---

# Verify AZ-204 content against Microsoft Learn

This skill applies the correctness rule from this repo's `CLAUDE.md`: **Microsoft
Learn is the single source of truth**, not the upstream `arvigeus/AZ-204` quiz
repo, and not general model knowledge. Use it any time you're about to:

- mark a question/flashcard `"auditStatus": "verified"`,
- write or edit a `correctionNotes` explanation,
- decide an item is a duplicate / out of exam scope / safe to remove,
- answer "is this still accurate?" about existing content.

## Procedure

1. **Extract the concrete, checkable claim(s)** from the prompt/answer/explanation.
   Split compound items into individual factual claims (e.g. "supports X",
   "the default is Y", "requires Z permission") — verify each one, not just the
   overall gist.

2. **Find the current official page(s).** Prefer, in order:
   - The `sourceUrls` already attached to the item, if present — check they're
     still live and still say what the item claims (Microsoft Learn pages get
     rewritten; an old citation can go stale).
   - The relevant entry in `topicMap` in `scripts/importSourceQuiz.mjs` for that
     `sourceTopic`.
   - A targeted search restricted to `learn.microsoft.com`, e.g. via WebSearch
     with `allowed_domains: ["learn.microsoft.com"]`, or WebFetch directly if
     you already know the likely URL (service overview / concepts / limits
     pages are usually right).
   - Only use `https://learn.microsoft.com/...` URLs as evidence. Blog posts,
     Stack Overflow, third-party tutorials, or training-partner sites don't
     count as verification even if they're accurate — they're not a valid
     `sourceUrls` entry per `scripts/validateContent.mjs`.

3. **Compare claim vs. page, explicitly.** For each claim, reach one of these
   verdicts and say which:
   - **Confirmed** — the page states this (quote or closely paraphrase the
     relevant line so the verdict is checkable later).
   - **Contradicted** — the page says something different; note exactly what.
     This is a `correctionFor(...)` case in `importSourceQuiz.mjs` (imported
     items) or a direct edit (original content in `az204-content.json`).
   - **Unverifiable** — no current Microsoft Learn page confirms or denies it.
     Do not mark the item verified; flag it instead of guessing.
   - **Out of current scope** — the page confirms the fact, but the feature/
     service is not part of the AZ-204 "skills measured" as of the date in the
     retirement banner (`src/App.tsx` `Header()`), e.g. a retired SDK, a
     deprecated pricing tier, a service dropped from later skills-measured
     revisions. Candidate for exclusion, not correction.

4. **Check for redundancy alongside correctness.** When auditing (not just
   spot-checking one item), also flag items that are:
   - Near-duplicates of another active item (same underlying concept/decision
     point, no distinct wording or distinct wrong-answer set that teaches
     something new), or
   - Testing trivia that isn't actually part of what Microsoft Learn's AZ-204
     study guide/training modules cover, even if technically true.
   Redundant items are a removal candidate (exclusion list in
   `importSourceQuiz.mjs`), not a correction.

5. **Apply the result the way `CLAUDE.md` describes:**
   - Imported source-quiz item (`src/data/source-quiz.generated.json`): add/
     update a `correctionFor(...)` branch in `scripts/importSourceQuiz.mjs`
     (matched on a short, unique prompt substring), regenerate or hand-patch
     the generated JSON to match, and write a one-line `correctionNotes`
     explaining what changed and why.
   - Original content (`src/data/az204-content.json`): edit directly, keep
     `sourceUrls` pointing at what you actually checked.
   - Exclusion: track the item's `id` (or the unique prompt substring used to
     match it) so removal survives regeneration, and update
     `content.importedQuestionManifest` counts + any hardcoded totals in
     `scripts/validateContent.mjs` and `README.md` that assumed the old count.

6. **Re-run the gate** before calling anything done:
   ```bash
   npm run validate:content
   npm run typecheck
   npm run test
   ```

## What "good enough" looks like

A verification is complete when you can state, per claim: *which* Microsoft
Learn URL you checked, *what it says*, and *which verdict* that implies. "I
believe this is correct" without a URL and a quoted/paraphrased line from that
URL is not a verification — it's a guess with a source link attached.
