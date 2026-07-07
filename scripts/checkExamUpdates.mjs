import { createHash } from 'node:crypto';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const contentPath = path.join(rootDir, 'src', 'data', 'az204-content.json');
const snapshotPath = path.join(rootDir, 'scripts', 'exam-watch.snapshot.json');
const localReportJsonPath = path.join(rootDir, 'exam-watch-report.json');
const localReportMarkdownPath = path.join(rootDir, 'exam-watch-report.md');
const prReportMarkdownPath = path.join(rootDir, 'reports', 'az204-microsoft-learn-watch.md');

const updateSnapshot = process.argv.includes('--update-snapshot');
const advanceSnapshot = process.argv.includes('--advance-snapshot');
const writePrReport = process.argv.includes('--pr');

const officialSourceLabels = new Map([
  [
    'https://learn.microsoft.com/en-us/credentials/certifications/azure-developer',
    'Certification page'
  ],
  [
    'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-204',
    'Study guide'
  ],
  ['https://learn.microsoft.com/en-us/training/courses/az-204t00', 'Training course']
]);

function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}

function normalizeUrlKey(url) {
  return url.replace(/\/+$/, '');
}

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function parseAttributes(rawAttributes) {
  const attributes = {};
  const attributePattern = /([:\w-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/g;
  for (const match of rawAttributes.matchAll(attributePattern)) {
    const rawValue = match[2].replace(/^["']|["']$/g, '');
    attributes[match[1].toLowerCase()] = decodeHtml(rawValue.trim());
  }
  return attributes;
}

function extractMeta(html) {
  const meta = {};
  for (const match of html.matchAll(/<meta\s+([^>]+)>/gi)) {
    const attributes = parseAttributes(match[1]);
    const key = (attributes.name ?? attributes.property ?? '').toLowerCase();
    if (key && attributes.content) {
      meta[key] = attributes.content;
    }
  }
  return meta;
}

function extractTitle(html) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return titleMatch ? decodeHtml(titleMatch[1]).replace(/\s+/g, ' ').trim() : '';
}

function normalizeHtmlText(html) {
  const mainMatch =
    html.match(/<main\b[\s\S]*?<\/main>/i) ??
    html.match(/<article\b[\s\S]*?<\/article>/i) ??
    html.match(/<body\b[\s\S]*?<\/body>/i);

  return decodeHtml(mainMatch?.[0] ?? html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, 'utf8'));
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
      'user-agent': 'AZ204-Quiz-Cards Microsoft Learn PR agent'
    },
    signal: AbortSignal.timeout(30000)
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return {
    body: await response.text(),
    status: response.status,
    etag: response.headers.get('etag') ?? '',
    lastModified: response.headers.get('last-modified') ?? ''
  };
}

async function fetchOfficialSource(url) {
  const { body, status, etag, lastModified } = await fetchText(url);
  const meta = extractMeta(body);
  const normalizedText = normalizeHtmlText(body);

  return {
    label: officialSourceLabels.get(normalizeUrlKey(url)) ?? url,
    url,
    status,
    title: extractTitle(body),
    description: meta.description ?? '',
    msDate: meta['ms.date'] ?? '',
    canonicalUrl: meta['og:url'] ?? '',
    etag,
    lastModified,
    contentLength: normalizedText.length,
    contentHash: hash(normalizedText)
  };
}

async function buildCurrentState() {
  const content = await readJson(contentPath);
  const officialSources = await Promise.all(
    content.metadata.sourceUrls.map((url) => fetchOfficialSource(url))
  );

  return {
    schemaVersion: 2,
    checkedAt: new Date().toISOString(),
    watchPolicy: 'microsoft-learn-only',
    exam: {
      code: content.metadata.examCode,
      name: content.metadata.examName,
      skillsMeasuredAsOf: content.metadata.skillsMeasuredAsOf,
      examRetiresOn: content.metadata.examRetiresOn
    },
    officialSources
  };
}

async function loadSnapshot() {
  if (!fsSync.existsSync(snapshotPath)) {
    return null;
  }

  return readJson(snapshotPath);
}

function addChange(changes, scope, message, details = {}) {
  changes.push({ scope, message, ...details });
}

function compareOfficialSources(previous, current) {
  const changes = [];
  const previousByUrl = new Map(
    (previous.officialSources ?? []).map((source) => [normalizeUrlKey(source.url), source])
  );

  for (const source of current.officialSources) {
    const previousSource = previousByUrl.get(normalizeUrlKey(source.url));
    if (!previousSource) {
      addChange(changes, 'microsoft-learn', `${source.label} is now watched.`, {
        url: source.url
      });
      continue;
    }

    if (previousSource.msDate !== source.msDate) {
      addChange(changes, 'microsoft-learn', `${source.label} ms.date changed.`, {
        url: source.url,
        before: previousSource.msDate || '(missing)',
        after: source.msDate || '(missing)'
      });
    }

    if (previousSource.title !== source.title) {
      addChange(changes, 'microsoft-learn', `${source.label} title changed.`, {
        url: source.url,
        before: previousSource.title,
        after: source.title
      });
    }

    if (previousSource.description !== source.description) {
      addChange(changes, 'microsoft-learn', `${source.label} description changed.`, {
        url: source.url,
        before: previousSource.description,
        after: source.description
      });
    }

    if (previousSource.contentHash !== source.contentHash) {
      addChange(changes, 'microsoft-learn', `${source.label} page text changed.`, {
        url: source.url,
        before: previousSource.contentHash,
        after: source.contentHash
      });
    }
  }

  for (const previousSource of previous.officialSources ?? []) {
    if (!current.officialSources.some((source) => normalizeUrlKey(source.url) === normalizeUrlKey(previousSource.url))) {
      addChange(changes, 'microsoft-learn', `${previousSource.label} is no longer watched.`, {
        url: previousSource.url
      });
    }
  }

  return changes;
}

function shortHash(value) {
  return value ? value.slice(0, 12) : '(missing)';
}

function formatChange(change) {
  const parts = [`- **${change.scope}**: ${change.message}`];
  if (change.url) parts.push(`  Source: ${change.url}`);
  if (change.before !== undefined || change.after !== undefined) {
    const before =
      typeof change.before === 'string' && change.before.length === 64
        ? shortHash(change.before)
        : change.before;
    const after =
      typeof change.after === 'string' && change.after.length === 64 ? shortHash(change.after) : change.after;
    parts.push(`  Before: \`${before ?? '(none)'}\``);
    parts.push(`  After: \`${after ?? '(none)'}\``);
  }
  return parts.join('\n');
}

function formatReport(current, changes) {
  const lines = [
    '# AZ-204 Microsoft Learn Watch',
    '',
    `Checked at: \`${current.checkedAt}\``,
    `Exam: \`${current.exam.code} - ${current.exam.name}\``,
    `Tracked skills date: \`${current.exam.skillsMeasuredAsOf}\``,
    `Tracked retirement date: \`${current.exam.examRetiresOn}\``,
    `Policy: \`${current.watchPolicy}\``,
    '',
    changes.length === 0
      ? 'No Microsoft Learn source updates were detected against the stored snapshot.'
      : `${changes.length} possible Microsoft Learn update(s) detected.`,
    ''
  ];

  if (changes.length > 0) {
    lines.push('## Changes', '');
    lines.push(...changes.map(formatChange).flatMap((entry) => [entry, '']));
    lines.push(
      '## Review Checklist',
      '',
      '1. Open each changed Microsoft Learn source linked above.',
      '2. Check whether AZ-204 skills, retirement date, measured skills date, services, or topic wording changed.',
      '3. Update `src/data/az204-content.json` only after confirming the change against Microsoft Learn.',
      '4. Run `npm run validate:content`, `npm run test`, and `npm run build` before merging.',
      '5. If no content change is needed, merge only the snapshot update to accept this source state.',
      ''
    );
  }

  lines.push('## Watched Microsoft Learn Sources', '');
  for (const source of current.officialSources) {
    lines.push(
      `- ${source.label}: ${source.url}`,
      `  Title: \`${source.title || '(missing)'}\``,
      `  Description: \`${source.description || '(missing)'}\``,
      `  ms.date: \`${source.msDate || '(missing)'}\``,
      `  Last-Modified: \`${source.lastModified || '(missing)'}\``,
      `  Text hash: \`${shortHash(source.contentHash)}\``
    );
  }

  return `${lines.join('\n')}\n`;
}

async function writeReport(current, changes) {
  const markdown = formatReport(current, changes);
  const markdownPath = writePrReport && changes.length > 0 ? prReportMarkdownPath : localReportMarkdownPath;

  await writeJson(localReportJsonPath, {
    checkedAt: current.checkedAt,
    changed: changes.length > 0,
    changes,
    current
  });

  await fs.mkdir(path.dirname(markdownPath), { recursive: true });
  await fs.writeFile(markdownPath, markdown);

  if (process.env.GITHUB_STEP_SUMMARY) {
    await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, markdown);
  }

  if (process.env.GITHUB_OUTPUT) {
    await fs.appendFile(process.env.GITHUB_OUTPUT, `changed=${changes.length > 0}\n`);
    await fs.appendFile(process.env.GITHUB_OUTPUT, `report_path=${markdownPath}\n`);
  }

  console.log(markdown);
}

const current = await buildCurrentState();
const snapshot = await loadSnapshot();

if (updateSnapshot) {
  await writeJson(snapshotPath, current);
  await writeReport(current, []);
  console.log(`Updated Microsoft Learn watch snapshot at ${snapshotPath}.`);
} else {
  if (!snapshot) {
    throw new Error(`Missing ${snapshotPath}. Run npm run watch:exam:update-snapshot first.`);
  }

  const changes = compareOfficialSources(snapshot, current);
  await writeReport(current, changes);

  if (advanceSnapshot && changes.length > 0) {
    await writeJson(snapshotPath, current);
    console.log(`Advanced Microsoft Learn watch snapshot at ${snapshotPath}.`);
  }
}
