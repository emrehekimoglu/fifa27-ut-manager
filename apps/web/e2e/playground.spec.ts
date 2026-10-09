import { expect, test } from '@playwright/test';
import type { Locator, Page, Route } from '@playwright/test';

import { E2E_SUPABASE } from './build-fixture';
import cards from './fixtures/futgg-catalog-cards.json' with { type: 'json' };

const CARDS = `${E2E_SUPABASE.url}/rest/v1/cards**`;
const [pele, kubo, courtois] = cards;

type Params = Record<string, string>;

function field(region: Locator | Page, label: string): Locator {
  return region.locator(`dt:text-is("${label}") + dd`);
}

function fulfillCards(route: Route, rows: readonly unknown[]): Promise<void> {
  const range = rows.length > 0 ? `0-${rows.length - 1}` : '*';
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    // Cross-origin, so the header must be exposed like Supabase does.
    headers: {
      'access-control-expose-headers': 'content-range',
      'content-range': `${range}/${rows.length}`,
    },
    body: JSON.stringify(rows.map((data) => ({ data }))),
  });
}

/** Answers card searches with the fixture card that plays the requested position. */
async function serveCards(page: Page): Promise<Params[]> {
  const requests: Params[] = [];
  const byPosition: Record<string, unknown> = { GK: courtois, RW: kubo, ST: pele };
  await page.route(CARDS, (route) => {
    const params = Object.fromEntries(new URL(route.request().url()).searchParams);
    requests.push(params);
    const position = /position\.eq\.([A-Z]+)/.exec(params['or'] ?? '')?.[1] ?? '';
    const card = byPosition[position];
    return fulfillCards(route, card ? [card] : []);
  });
  return requests;
}

const slot = (page: Page, name: string) => page.getByRole('region', { name });
const summary = (page: Page) => page.getByRole('region', { name: 'Kadro özeti' });

async function pick(page: Page, slotName: string, cardText: string): Promise<void> {
  await slot(page, slotName).getByRole('button', { name: 'Kart seç' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: cardText }).click();
  await expect(dialog).toHaveCount(0);
}

/** Courtois in goal, Kubo at RW, Pelé at ST. */
async function pickTrio(page: Page): Promise<void> {
  await pick(page, 'GK · Kaleci', 'Thibaut Courtois 90 · GK · Real Madrid');
  await pick(page, 'RW · Sağ kanat', 'Takefusa Kubo 80 · RM · Real Sociedad');
  await pick(page, 'ST · Santrafor', 'Pelé 95 · CAM · ICON');
}

test.beforeEach(async ({ page }) => {
  // Card images come from a third-party CDN; keep the tests offline and deterministic.
  await page.route(/^https:\/\/game-assets\.fut\.gg\//, (route) => route.abort());
});

test('is reachable from the landing page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Kadro deneme alanı' }).click();

  await expect(page).toHaveURL(/\/oyun-alani$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kadro deneme alanı');
});

test('starts with an empty 4-3-3', async ({ page }) => {
  await page.goto('/oyun-alani');

  await expect(page.getByRole('combobox', { name: 'Diziliş' })).toHaveValue('8');
  await expect(field(summary(page), 'Kadro reytingi')).toHaveText('0');
  await expect(field(summary(page), 'Takım kimyası')).toHaveText('0 / 33');
  await expect(page.getByRole('list', { name: 'Kadro' }).getByRole('heading')).toHaveText([
    'GK · Kaleci',
    'RB · Sağ bek',
    'RCB · Stoper',
    'LCB · Stoper',
    'LB · Sol bek',
    'RCM · Merkez orta saha',
    'CM · Merkez orta saha',
    'LCM · Merkez orta saha',
    'RW · Sağ kanat',
    'ST · Santrafor',
    'LW · Sol kanat',
  ]);
  await expect(slot(page, 'RW · Sağ kanat')).toContainText('Boş');
});

test('searches cards that can play the slot and places the chosen one', async ({ page }) => {
  const requests = await serveCards(page);
  await page.goto('/oyun-alani');
  await slot(page, 'RW · Sağ kanat').getByRole('button', { name: 'Kart seç' }).click();
  const dialog = page.getByRole('dialog', { name: 'Kart seç · RW' });

  await expect(
    dialog.getByRole('button', { name: 'Takefusa Kubo 80 · RM · Real Sociedad' }),
  ).toBeVisible();
  expect(requests.at(-1)?.['or']).toBe('(position.eq.RW,alternate_positions.cs.{RW})');
  await dialog.getByRole('searchbox', { name: 'Oyuncu ara' }).fill('Kubo');
  await expect.poll(() => requests.at(-1)?.['search_name']).toBe('ilike.%kubo%');
  await dialog.getByRole('button', { name: 'Takefusa Kubo 80 · RM · Real Sociedad' }).click();

  await expect(dialog).toHaveCount(0);
  await expect(slot(page, 'RW · Sağ kanat')).toContainText('Takefusa Kubo 80');
  await expect(field(slot(page, 'RW · Sağ kanat'), 'Kimya')).toHaveText('0 / 3');
});

test('closes the card search without changing the slot', async ({ page }) => {
  await serveCards(page);
  await page.goto('/oyun-alani');
  await slot(page, 'GK · Kaleci').getByRole('button', { name: 'Kart seç' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Kapat' }).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(slot(page, 'GK · Kaleci')).toContainText('Boş');
});

test('updates chemistry and squad rating as cards are placed', async ({ page }) => {
  await serveCards(page);
  await page.goto('/oyun-alani');

  await pick(page, 'GK · Kaleci', 'Thibaut Courtois 90 · GK · Real Madrid');
  // One player rated 90: sum 90, cf 81.82 → round(171.82) / 11 → 15.
  await expect(field(summary(page), 'Kadro reytingi')).toHaveText('15');
  await pick(page, 'RW · Sağ kanat', 'Takefusa Kubo 80 · RM · Real Sociedad');
  await pick(page, 'ST · Santrafor', 'Pelé 95 · CAM · ICON');

  // Pelé is an icon (3) and lifts LALIGA to 3: Courtois and Kubo get 1 each.
  await expect(field(summary(page), 'Kadro reytingi')).toHaveText('41');
  await expect(field(summary(page), 'Takım kimyası')).toHaveText('5 / 33');
  await expect(field(slot(page, 'GK · Kaleci'), 'Kimya')).toHaveText('1 / 3');
  await expect(field(slot(page, 'RW · Sağ kanat'), 'Kimya')).toHaveText('1 / 3');
  await expect(field(slot(page, 'ST · Santrafor'), 'Kimya')).toHaveText('3 / 3');
});

test('shows the stats with the chosen chemistry style', async ({ page }) => {
  await serveCards(page);
  await page.goto('/oyun-alani');
  await pickTrio(page);
  const striker = slot(page, 'ST · Santrafor');
  const stats = striker.getByRole('list', { name: 'İstatistikler' }).getByRole('listitem');

  await expect(stats).toHaveText([
    'Hız 93',
    'Şut 94',
    'Pas 91',
    'Dripling 94',
    'Defans 58',
    'Fizik 74',
  ]);
  await striker.getByRole('combobox', { name: 'Kimya stili' }).selectOption({ label: 'Hunter' });
  await expect(stats).toHaveText([
    'Hız 99',
    'Şut 97',
    'Pas 91',
    'Dripling 94',
    'Defans 58',
    'Fizik 74',
  ]);
  await expect(
    slot(page, 'GK · Kaleci').getByRole('combobox', { name: 'Kimya stili' }).locator('option'),
  ).toHaveText(['Stil yok', 'GK Basic', 'Wall', 'Glove', 'Shield', 'Cat']);
});

test('shows the AcceleRATE type with the chosen chemistry style', async ({ page }) => {
  await serveCards(page);
  await page.goto('/oyun-alani');
  await pickTrio(page);
  const striker = slot(page, 'ST · Santrafor');

  await expect(field(striker, 'AcceleRATE')).toHaveText('Patlayıcı');
  // Pelé has 3 chemistry, so Sniper's full boost makes him Controlled.
  await striker.getByRole('combobox', { name: 'Kimya stili' }).selectOption({ label: 'Sniper' });
  await expect(field(striker, 'AcceleRATE')).toHaveText('Kontrollü');
  await expect(field(slot(page, 'GK · Kaleci'), 'AcceleRATE')).toHaveText('Uzun');
});

test('keeps the cards when the formation changes, out of position where they no longer fit', async ({
  page,
}) => {
  await serveCards(page);
  await page.goto('/oyun-alani');
  await pickTrio(page);

  await page.getByRole('combobox', { name: 'Diziliş' }).selectOption({ label: '4-4-2' });

  await expect(slot(page, 'LM · Sol orta saha')).toContainText('Takefusa Kubo 80');
  await expect(field(slot(page, 'LM · Sol orta saha'), 'Kimya')).toHaveText('Mevki dışı');
  await expect(field(slot(page, 'RS · Santrafor'), 'Kimya')).toHaveText('3 / 3');
  await expect(field(summary(page), 'Takım kimyası')).toHaveText('3 / 33');
  await expect(field(summary(page), 'Kadro reytingi')).toHaveText('41');
});

test('names the formation variants in Turkish', async ({ page }) => {
  await page.goto('/oyun-alani');
  const options = page.getByRole('combobox', { name: 'Diziliş' }).locator('option');

  await expect(options).toHaveCount(29);
  await expect(options.filter({ hasText: '4-3-3 Hücum' })).toHaveCount(1);
  await expect(options.filter({ hasText: '4-2-3-1 Geniş' })).toHaveCount(1);
});

test('removes a card from its slot', async ({ page }) => {
  await serveCards(page);
  await page.goto('/oyun-alani');
  await pickTrio(page);

  await slot(page, 'ST · Santrafor').getByRole('button', { name: 'Çıkar' }).click();

  await expect(slot(page, 'ST · Santrafor')).toContainText('Boş');
  await expect(field(summary(page), 'Takım kimyası')).toHaveText('0 / 33');
});

test('reports when the cards cannot be loaded', async ({ page }) => {
  await page.route(CARDS, (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'permission denied' }),
    }),
  );
  await page.goto('/oyun-alani');
  await slot(page, 'GK · Kaleci').getByRole('button', { name: 'Kart seç' }).click();

  await expect(page.getByRole('dialog').getByRole('alert')).toHaveText('Kartlar yüklenemedi.');
});

test('fits the viewport without horizontal scrolling', async ({ page }) => {
  await serveCards(page);
  await page.goto('/oyun-alani');
  await pickTrio(page);
  await slot(page, 'ST · Santrafor')
    .getByRole('combobox', { name: 'Kimya stili' })
    .selectOption({ label: 'Hunter' });

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});
