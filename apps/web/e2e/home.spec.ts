import { expect, test } from '@playwright/test';

import packageJson from '../package.json' with { type: 'json' };
import { E2E_BUILD } from './build-fixture';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('serves a Turkish document with the app title', async ({ page }) => {
  await expect(page).toHaveTitle('FC 27 UT Manager');
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr');
});

test('shows the app name, purpose and development status', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('FC 27 UT Manager');
  await expect(page.getByRole('main')).toContainText(
    'Ultimate Team kadro kurucu ve oyuncu öneri motoru',
  );
  await expect(page.getByRole('status')).toHaveText('Yapım aşamasında: v0.1 geliştiriliyor');
});

test('shows the exact build that is deployed in the footer', async ({ page }) => {
  await expect(page.getByRole('contentinfo')).toHaveText(
    `v${packageJson.version} · ${E2E_BUILD.commitSha.slice(0, 7)} · Önizleme`,
  );
});

test('fits the viewport without horizontal scrolling', async ({ page }) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});
