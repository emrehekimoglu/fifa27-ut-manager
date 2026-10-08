import { expect, test } from '@playwright/test';
import type { Locator, Page, Route } from '@playwright/test';

import { E2E_SUPABASE } from './build-fixture';
import futggCards from './fixtures/futgg-catalog-cards.json' with { type: 'json' };
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

const SYNCS = `${E2E_SUPABASE.url}/rest/v1/catalog_syncs**`;
const CARDS = `${E2E_SUPABASE.url}/rest/v1/cards**`;

/** Answers the stored-catalog query like PostgREST, with the total in Content-Range. */
function fulfillCards(route: Route, cards: readonly unknown[], total: number): Promise<void> {
  const range = cards.length > 0 ? `0-${cards.length - 1}` : '*';
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    headers: { 'content-range': `${range}/${total}` },
    body: JSON.stringify(cards.map((data) => ({ data }))),
  });
}

const SUCCEEDED_SYNC = {
  id: 12,
  started_at: '2026-10-07T03:47:05+00:00',
  finished_at: '2026-10-07T04:11:52+00:00',
  status: 'succeeded',
  source: 'futgg',
  card_count: 19958,
  deactivated_count: 4,
  error: null,
};

test.beforeEach(async ({ page }) => {
  await page.route(SYNCS, (route) => fulfillJson(route, [SUCCEEDED_SYNC]));
  await page.route(CARDS, (route) => fulfillCards(route, futggCards, 19958));
  // Card images come from third-party CDNs; keep the tests offline and deterministic.
  await page.route(/^https:\/\/game-assets\.fut\.gg\//, (route) => route.abort());
});

test('is reachable from the landing page', async ({ page }) => {
  await page.route(API, (route) => fulfillJson(route, report));
  await page.goto('/');
  await page.getByRole('link', { name: 'Veri kaynakları' }).click();

  await expect(page).toHaveURL(/\/kaynaklar$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Veri kaynakları');
});

test('shows the FUT.GG catalog stored by the daily sync', async ({ page }) => {
  await openWithReport(page);
  const futgg = page.getByRole('region', { name: 'FUT.GG' });

  await expect(futgg.getByText('Birincil kaynak', { exact: true })).toBeVisible();
  await expect(field(futgg, 'Durum')).toHaveText('Çalışıyor');
  await expect(field(futgg, 'Kart sayısı')).toHaveText('19.958');
  await expect(field(futgg, 'Son başarılı çekim')).toHaveText('7 Ekim 2026 07:11');
  await expect(field(futgg, 'Yanıt süresi')).toHaveCount(0);
  await expect(field(futgg, 'Hata ayrıntısı')).toHaveCount(0);
  await expect(futgg.getByRole('list', { name: 'Örnek kartlar' }).getByRole('listitem')).toHaveText(
    [
      'Pelé 95 · CAM · ICON',
      'Takefusa Kubo 80 · RM · Real Sociedad',
      'Thibaut Courtois 90 · GK · Real Madrid',
    ],
  );
});

test('names the league of a sample card that has no club, such as a hero', async ({ page }) => {
  const [pele] = futggCards;
  await page.route(CARDS, (route) =>
    fulfillCards(
      route,
      [
        {
          ...pele,
          eaId: 261593,
          basePlayerEaId: 261593,
          name: 'Jürgen Kohler',
          overall: 89,
          position: 'CB',
          alternatePositions: [],
          rarity: { eaId: 72, name: 'Base Hero' },
          club: null,
          league: { eaId: 19, name: 'Bundesliga' },
          nation: { eaId: 21, name: 'Germany' },
        },
      ],
      19958,
    ),
  );
  await openWithReport(page);
  const region = page.getByRole('region', { name: 'FUT.GG' });

  await expect(
    region.getByRole('list', { name: 'Örnek kartlar' }).getByRole('listitem'),
  ).toHaveText(['Jürgen Kohler 89 · CB · Bundesliga']);
});

test('shows a failed FUT.GG sync with its error, keeping the stored cards', async ({ page }) => {
  await page.route(SYNCS, (route) =>
    fulfillJson(route, [
      { ...SUCCEEDED_SYNC, status: 'failed', source: null, error: '[futgg] HTTP 503' },
    ]),
  );
  await openWithReport(page);
  const futgg = page.getByRole('region', { name: 'FUT.GG' });

  await expect(field(futgg, 'Durum')).toHaveText('Hata');
  await expect(field(futgg, 'Hata ayrıntısı')).toHaveText('[futgg] HTTP 503');
  await expect(field(futgg, 'Kart sayısı')).toHaveText('19.958');
  await expect(
    futgg.getByRole('list', { name: 'Örnek kartlar' }).getByRole('listitem'),
  ).toHaveCount(3);
});

test('explains when no FUT.GG data has been stored yet', async ({ page }) => {
  await page.route(SYNCS, (route) => fulfillJson(route, []));
  await page.route(CARDS, (route) => fulfillCards(route, [], 0));
  await openWithReport(page);
  const futgg = page.getByRole('region', { name: 'FUT.GG' });

  await expect(field(futgg, 'Durum')).toHaveText('Henüz veri yok');
  await expect(field(futgg, 'Kart sayısı')).toHaveText('0');
  await expect(field(futgg, 'Son başarılı çekim')).toHaveText('—');
  await expect(futgg.getByRole('list', { name: 'Örnek kartlar' })).toHaveCount(0);
});

test('reports when the stored FUT.GG catalog cannot be read', async ({ page }) => {
  await page.route(CARDS, (route) => fulfillJson(route, { message: 'permission denied' }, 401));
  await openWithReport(page);
  const futgg = page.getByRole('region', { name: 'FUT.GG' });

  await expect(futgg.getByRole('alert')).toHaveText('FUT.GG verisi alınamadı.');
  await expect(field(page.getByRole('region', { name: 'EA resmi API' }), 'Durum')).toHaveText(
    'Çalışıyor',
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

test('shows card images from FUT.GG but none for EA cards, whose images are outdated', async ({
  page,
}) => {
  await openWithReport(page);
  const samples = (name: string) =>
    page.getByRole('region', { name }).getByRole('list', { name: 'Örnek kartlar' });

  await expect(samples('FUT.GG').locator('img')).toHaveCount(3);
  await expect(samples('EA resmi API').locator('img')).toHaveCount(0);
  await expect(samples('EA resmi API').getByRole('listitem')).toHaveCount(3);
});

test('shows a failing EA check with its error and without sample cards', async ({ page }) => {
  const [ea] = report.sources;
  await openWithReport(page, {
    ...report,
    sources: [
      {
        ...ea,
        status: 'error',
        totalCards: null,
        totalIsCapped: false,
        sample: [],
        error: '[ea] HTTP 502',
      },
    ],
  });
  const region = page.getByRole('region', { name: 'EA resmi API' });

  await expect(field(region, 'Durum')).toHaveText('Hata');
  await expect(field(region, 'Kart sayısı')).toHaveText('—');
  await expect(field(region, 'Hata ayrıntısı')).toHaveText('[ea] HTTP 502');
  await expect(region.getByRole('list', { name: 'Örnek kartlar' })).toHaveCount(0);
  await expect(field(page.getByRole('region', { name: 'FUT.GG' }), 'Durum')).toHaveText(
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
  await expect(page.getByRole('region', { name: 'EA resmi API' })).toBeVisible();
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
  await expect(field(page.getByRole('region', { name: 'EA resmi API' }), 'Durum')).toHaveText(
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
  await expect(page.getByRole('region', { name: 'EA resmi API' })).toBeVisible();

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

test.describe('catalog sync status', () => {
  test('shows the latest successful sync', async ({ page }) => {
    await openWithReport(page);
    const sync = page.getByRole('region', { name: 'Katalog senkronizasyonu' });

    await expect(field(sync, 'Durum')).toHaveText('Başarılı');
    await expect(field(sync, 'Son çalışma')).toHaveText('7 Ekim 2026 06:47');
    await expect(field(sync, 'Kaynak')).toHaveText('FUT.GG');
    await expect(field(sync, 'Kart sayısı')).toHaveText('19.958');
    await expect(field(sync, 'Pasife alınan kart')).toHaveText('4');
    await expect(field(sync, 'Hata ayrıntısı')).toHaveCount(0);
  });

  test('shows a failed sync with its error', async ({ page }) => {
    await page.route(SYNCS, (route) =>
      fulfillJson(route, [
        {
          ...SUCCEEDED_SYNC,
          id: 13,
          status: 'failed',
          source: null,
          card_count: null,
          deactivated_count: null,
          error: '[futgg] partition 60-64: collected 4282 of 4375 cards after 3 passes',
        },
      ]),
    );
    await openWithReport(page);
    const sync = page.getByRole('region', { name: 'Katalog senkronizasyonu' });

    await expect(field(sync, 'Durum')).toHaveText('Başarısız');
    await expect(field(sync, 'Kaynak')).toHaveText('—');
    await expect(field(sync, 'Kart sayısı')).toHaveText('—');
    await expect(field(sync, 'Hata ayrıntısı')).toHaveText(
      '[futgg] partition 60-64: collected 4282 of 4375 cards after 3 passes',
    );
  });

  test('explains when no sync has run yet', async ({ page }) => {
    await page.route(SYNCS, (route) => fulfillJson(route, []));
    await openWithReport(page);

    await expect(page.getByRole('region', { name: 'Katalog senkronizasyonu' })).toContainText(
      'Henüz bir katalog senkronizasyonu çalışmadı.',
    );
  });

  test('reports when the database cannot be reached', async ({ page }) => {
    await page.route(SYNCS, (route) => fulfillJson(route, { message: 'unavailable' }, 503));
    await openWithReport(page);
    const sync = page.getByRole('region', { name: 'Katalog senkronizasyonu' });

    // supabase-js retries a 503 three times (about 7 s) before giving up.
    await expect(sync.getByRole('alert')).toHaveText('Senkronizasyon durumu alınamadı.', {
      timeout: 15_000,
    });
  });
});
