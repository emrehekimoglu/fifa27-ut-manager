import { expect, test } from '@playwright/test';
import type { Locator, Page, Route } from '@playwright/test';

import report from './fixtures/source-health-report.json' with { type: 'json' };

const API = '**/api/source-health';

function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

/** The value shown next to a label in a source's details list. */
function field(region: Locator, label: string): Locator {
  return region.locator(`dt:text-is("${label}") + dd`);
}

async function openWithReport(page: Page, body: unknown = report): Promise<void> {
  await page.route(API, (route) => fulfillJson(route, body));
  await page.goto('/kaynaklar');
}

test.beforeEach(async ({ page }) => {
  // Card images come from third-party CDNs; keep the tests offline and deterministic.
  await page.route(
    /^https:\/\/(game-assets\.fut\.gg|ratings-images-prod\.pulse\.ea\.com)\//,
    (route) => route.abort(),
  );
});

test('is reachable from the landing page', async ({ page }) => {
  await page.route(API, (route) => fulfillJson(route, report));
  await page.goto('/');
  await page.getByRole('link', { name: 'Veri kaynakları' }).click();

  await expect(page).toHaveURL(/\/kaynaklar$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Veri kaynakları');
});

test('shows the live status of the primary card source', async ({ page }) => {
  await openWithReport(page);
  const futgg = page.getByRole('region', { name: 'FUT.GG' });

  await expect(futgg.getByText('Birincil kaynak', { exact: true })).toBeVisible();
  await expect(field(futgg, 'Durum')).toHaveText('Çalışıyor');
  await expect(field(futgg, 'Yanıt süresi')).toHaveText('412 ms');
  await expect(field(futgg, 'Kart sayısı')).toHaveText('10.000+');
  await expect(field(futgg, 'Kontrol saati')).toHaveText('22:00');
  await expect(futgg.getByRole('list', { name: 'Örnek kartlar' }).getByRole('listitem')).toHaveText(
    [
      'Pelé 95 · CAM · ICON',
      'Takefusa Kubo 80 · RM · Real Sociedad',
      'Thibaut Courtois 90 · GK · Real Madrid',
    ],
  );
});

test('shows the live status of the fallback card source', async ({ page }) => {
  await openWithReport(page);
  const ea = page.getByRole('region', { name: 'EA resmi API' });

  await expect(ea.getByText('Yedek kaynak', { exact: true })).toBeVisible();
  await expect(field(ea, 'Durum')).toHaveText('Çalışıyor');
  await expect(field(ea, 'Yanıt süresi')).toHaveText('1,2 sn');
  await expect(field(ea, 'Kart sayısı')).toHaveText('19.789');
  await expect(ea.getByRole('list', { name: 'Örnek kartlar' }).getByRole('listitem')).toHaveText([
    'Kylian Mbappé 91 · ST · Real Madrid',
    'Thibaut Courtois 90 · GK · Real Madrid',
    'Erling Haaland 91 · ST · Manchester City',
  ]);
});

test('shows a failing source with its error and without sample cards', async ({ page }) => {
  const [futgg, ea] = report.sources;
  await openWithReport(page, {
    ...report,
    sources: [
      {
        ...futgg,
        status: 'error',
        totalCards: null,
        totalIsCapped: false,
        sample: [],
        error: '[futgg] HTTP 403',
      },
      ea,
    ],
  });
  const region = page.getByRole('region', { name: 'FUT.GG' });

  await expect(field(region, 'Durum')).toHaveText('Hata');
  await expect(field(region, 'Kart sayısı')).toHaveText('—');
  await expect(field(region, 'Hata ayrıntısı')).toHaveText('[futgg] HTTP 403');
  await expect(region.getByRole('list', { name: 'Örnek kartlar' })).toHaveCount(0);
  await expect(field(page.getByRole('region', { name: 'EA resmi API' }), 'Durum')).toHaveText(
    'Çalışıyor',
  );
});

test('shows progress while the sources are being checked', async ({ page }) => {
  let release: () => void = () => undefined;
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(API, async (route) => {
    await released;
    await fulfillJson(route, report);
  });
  await page.goto('/kaynaklar');

  await expect(page.getByRole('status')).toHaveText('Kaynaklar kontrol ediliyor…');
  release();
  await expect(page.getByRole('region', { name: 'FUT.GG' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveCount(0);
});

test('reports when the status cannot be loaded and recovers on retry', async ({ page }) => {
  let fail = true;
  await page.route(API, (route) =>
    fail ? fulfillJson(route, { message: 'boom' }, 500) : fulfillJson(route, report),
  );
  await page.goto('/kaynaklar');

  await expect(page.getByRole('alert')).toHaveText('Kaynak durumu alınamadı.');
  fail = false;
  await page.getByRole('button', { name: 'Tekrar dene' }).click();

  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(field(page.getByRole('region', { name: 'FUT.GG' }), 'Durum')).toHaveText(
    'Çalışıyor',
  );
});

test('re-checks the sources on demand', async ({ page }) => {
  let requests = 0;
  await page.route(API, (route) => {
    requests += 1;
    return fulfillJson(route, report);
  });
  await page.goto('/kaynaklar');
  await expect(page.getByRole('region', { name: 'FUT.GG' })).toBeVisible();

  await page.getByRole('button', { name: 'Yeniden kontrol et' }).click();

  await expect.poll(() => requests).toBe(2);
});

test('shows the price access results of the data spike', async ({ page }) => {
  await openWithReport(page);
  const table = page.getByRole('table', { name: 'Fiyat erişimi testi (7 Ekim 2026)' });
  const rows = table.getByRole('row');

  await expect(rows).toHaveCount(4);
  await expect(rows.nth(0).locator('th, td')).toHaveText([
    'Kaynak',
    'Sunucudan',
    'Ev bilgisayarından',
    'Karar',
  ]);
  await expect(rows.nth(1).locator('th, td')).toHaveText([
    'FUT.GG',
    'Fiyat gösterilmiyor',
    'Fiyat alındı',
    'Fiyat kaynağı (M5)',
  ]);
  await expect(rows.nth(2).locator('th, td')).toHaveText([
    'FUTWIZ',
    'Engellendi',
    'Sadece görünür tarayıcıda',
    'Kullanılmayacak',
  ]);
  await expect(rows.nth(3).locator('th, td')).toHaveText([
    'FUTBIN',
    'Engellendi',
    'CAPTCHA istedi',
    'Kullanılmayacak',
  ]);
});

test('fits the viewport without horizontal scrolling', async ({ page }) => {
  await openWithReport(page);
  await expect(page.getByRole('region', { name: 'FUT.GG' })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});
