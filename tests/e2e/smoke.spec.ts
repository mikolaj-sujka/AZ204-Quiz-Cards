import { expect, test } from '@playwright/test';

test('dashboard renders exam structure and audit warning', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /AZ-204 study cockpit/i })).toBeVisible();
  await expect(page.getByText('Retirement: 31 lipca 2026')).toBeVisible();
  await expect(page.getByText('Microsoft-mapped')).toBeVisible();
});

test('articles can be opened from the list, read, and marked read', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Artykuły', exact: true }).click();
  const readPill = page.locator('.split-panel .status-pill');
  const totalArticles = await page.locator('.article-row').count();
  const initialCount = Number((await readPill.textContent())?.match(/\d+/)?.[0]);

  await page.locator('.article-row').first().click();
  await expect(page.getByText('Microsoft Learn').first()).toBeVisible();

  await page.getByRole('button', { name: /Oznacz jako przeczytane/i }).click();
  await page.getByRole('button', { name: /Lista artykułów/i }).click();
  await expect(readPill).toHaveText(`${initialCount + 1}/${totalArticles} przeczytane`);
});

test('hard topics tab shows question, answer, and example', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Trudne tematy', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Trudne tematy' })).toBeVisible();
  await expect(page.locator('.hard-topic-card').first()).toBeVisible();
  await expect(page.locator('.hard-topic-answer').first()).toBeVisible();
  await expect(page.locator('.hard-topic-example').first()).toBeVisible();
  await expect(page.getByText('Microsoft Learn').first()).toBeVisible();
});

test('subchapter exam shows explanations after submit', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Egzaminy', exact: true }).click();
  await page.getByRole('button', { name: /Chapter:/ }).click();
  await page.getByRole('option', { name: /Connect to and consume/i }).click();
  await page.getByRole('button', { name: /Subchapter:/ }).click();
  await page.getByRole('option', { name: /Implement Azure API Management/i }).click();

  for (let index = 0; index < 25; index += 1) {
    await page.locator('.question-card .option-button').first().click({ force: true });
    if (index === 24) {
      await page.getByRole('button', { name: /Zakończ egzamin/i }).click({ force: true });
    } else {
      await page.getByRole('button', { name: /Dalej/i }).click({ force: true });
    }
  }

  await expect(page.getByRole('heading', { name: /poprawnych/i })).toBeVisible();
  await expect(page.getByText(/Do poprawki|Poprawnie/).first()).toBeVisible();
  await expect(page.getByText(/Microsoft Learn/i).first()).toBeVisible();
});

test('mobile layout keeps primary navigation accessible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 820 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Dashboard/i })).toBeVisible();
  await page.getByRole('button', { name: /Audyt/i }).click();
  await expect(page.getByRole('heading', { name: /484 pytań/i })).toBeVisible();
});
