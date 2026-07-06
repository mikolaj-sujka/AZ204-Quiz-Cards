# AZ-204 Quiz Cards

A local-first React + TypeScript study app for **Exam AZ-204: Developing Solutions for Microsoft Azure**.

The app includes:

- Microsoft Learn-aligned chapters and subchapters.
- 625 imported source-quiz items mapped to Microsoft Learn topic sources.
- 516 closed source-quiz questions available in exams.
- 625 imported source-quiz items plus original cards available as flashcards.
- Flashcards with “znam / powtórz” progress in `localStorage`.
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

The app uses two content layers:

1. `src/data/az204-content.json`
   - Official Microsoft AZ-204 chapter structure.
   - Original verified starter questions and flashcards.
   - Metadata for the external source quiz.

2. `src/data/source-quiz.generated.json`
   - Generated from `https://github.com/arvigeus/AZ-204`.
   - Every item is mapped to an AZ-204 chapter/subchapter and Microsoft Learn source URLs.
   - Closed questions are included in exams.
   - Open/code questions are included as flashcards.

The generated bank currently contains:

- `625` total imported study items.
- `516` closed questions usable in exams.
- `109` open/code questions usable as flashcards.
- Known corrected items include Cosmos DB resource-name limits and a Cosmos DB composite-index answer.

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

## Design

The UI is a dark study cockpit with black/gold visual direction, animated filter panels, 3D flashcard flip, hover transitions, readable code blocks, and responsive desktop/mobile layouts.
