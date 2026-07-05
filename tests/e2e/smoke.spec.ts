import { expect, test } from '@playwright/test';

test('dashboard renders exam structure and audit warning', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /AZ-204 study cockpit/i })).toBeVisible();
  await expect(page.getByText('Retirement: 31 lipca 2026')).toBeVisible();
  await expect(page.getByText('Microsoft-mapped')).toBeVisible();
});

test('flashcards can flip and mark known', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Fiszki/i }).click();
  await page.getByRole('button', { name: /Prompt/i }).click();
  await expect(page.getByText('Answer')).toBeVisible();
  await page.getByRole('button', { name: /Znam/i }).click();
  await expect(page.getByText(/known/i)).toBeVisible();
});

test('subchapter exam shows explanations after submit', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Egzaminy', exact: true }).click();
  await page.getByRole('button', { name: /Chapter:/ }).click();
  await page.getByRole('option', { name: /Connect to and consume/i }).click();
  await page.getByRole('button', { name: /Subchapter:/ }).click();
  await page.getByRole('option', { name: /Implement Azure API Management/i }).click();

  for (let index = 0; index < 26; index += 1) {
    await page.locator('.question-card .option-button').first().click({ force: true });
    if (index === 25) {
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
  await expect(page.getByRole('heading', { name: /625 pytań/i })).toBeVisible();
});
