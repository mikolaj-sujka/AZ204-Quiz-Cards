# AZ-204 Quiz Cards

A local-first React + TypeScript study app for **Exam AZ-204: Developing Solutions for Microsoft Azure**.

The app includes:

- Microsoft Learn-aligned chapters and subchapters.
- 484 imported source-quiz items mapped to Microsoft Learn topic sources, all usable as exam questions.
- 32 original reference articles, one per exam-relevant service/concept, written and verified against Microsoft Learn, with a "read" toggle in `localStorage`.
- Sequential subchapter exams and weighted 100-question mock exam mode.
- End-of-exam review with score, all questions, correct answers, explanations, and Microsoft Learn links.
- Polish UI/explanations with official English Azure terms.
- Content validation for required Microsoft Learn source links.

## Commands

```bash
npm install
npm run dev
npm run validate:content
npm run test
npm run build
npm run watch:exam
```

## Deploy To GitHub Pages

The app is configured for:

```text
https://mikolaj-sujka.github.io/AZ204-Quiz-Cards/
```

Deployment runs automatically from GitHub Actions on every push to `main`.

In GitHub, open **Settings -> Pages** and set **Build and deployment / Source** to
**GitHub Actions**. The workflow in `.github/workflows/deploy-pages.yml` installs
dependencies, validates content, runs tests, builds the Vite app, and publishes
`dist`.

## Run Locally

```bash
npm run dev
```

Open `http://localhost:5173/AZ204-Quiz-Cards/`.

## Content Model

The app uses three content layers:

1. `src/data/az204-content.json`
   - Official Microsoft AZ-204 chapter structure.
   - A small set of original verified starter questions.
   - Metadata for the external source quiz.

2. `src/data/source-quiz.generated.json`
   - Generated from `https://github.com/arvigeus/AZ-204`.
   - Every item is mapped to an AZ-204 chapter/subchapter and Microsoft Learn source URLs.
   - Only closed (multiple-choice) items are imported; open/code-only items with no exam use are filtered out at generation time.

3. `src/data/articles.json`
   - Original reference articles, one per exam-relevant service/concept (e.g. Container Registry, Container Instances, Container Apps), grouped under the same chapters/subchapters as the rest of the app.
   - Researched and written directly against current Microsoft Learn documentation, not derived from the source quiz.

The generated bank currently contains:

- `484` total imported study items, all usable as exam questions.
- A 2026-07-13 Microsoft Learn audit removed 36 duplicate/out-of-scope/unfixable items and corrected 23 others (see `scripts/importSourceQuiz.mjs`, `EXCLUDED_IDS`/`ID_CORRECTIONS`/`TEXT_CORRECTIONS`, for the full list and reasoning). Known corrected items include Cosmos DB resource-name limits and a Cosmos DB composite-index answer.
- A further 105 open/code-only items (never usable as exam questions) are excluded from generation entirely, since the flashcards module that used to display them has been removed.

## Audit And Sources

Official Microsoft references used by the app:

- https://learn.microsoft.com/en-us/credentials/certifications/azure-developer/
- https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-204
- https://learn.microsoft.com/en-us/training/courses/az-204t00

The imported source quiz remains attribution-sensitive:

- Source quiz: https://az-204.vercel.app/
- Source repo: https://github.com/arvigeus/AZ-204
- Source license: Custom Non-Commercial Attribution License (CNAL) Version 1.0

See `NOTICE.md`.

## Validation

Run:

```bash
npm run validate:content
npm run typecheck
npm run test
npm run test:e2e
```

`validate:content` checks that active original content and generated source-quiz items have required chapter/subchapter mapping, answers, dates, and Microsoft Learn source URLs.

## Exam Watch

`.github/workflows/exam-watch.yml` runs every three days and checks only official
Microsoft Learn sources:

- official Microsoft Learn AZ-204 certification, study guide, and training pages

If it detects a possible update, it opens or updates a review PR from
`automation/az204-microsoft-learn-watch`. The PR contains:

- `reports/az204-microsoft-learn-watch.md` with the detected Microsoft Learn changes
- `scripts/exam-watch.snapshot.json` advanced to the newly reviewed source state

Useful local commands:

```bash
npm run watch:exam
npm run watch:exam:pr
npm run watch:exam:update-snapshot
```

Merge the generated PR only after reviewing the detected Microsoft Learn changes.

## Design

The UI is a dark study cockpit with black/gold visual direction, animated filter panels, hover transitions, readable code blocks, and responsive desktop/mobile layouts.
