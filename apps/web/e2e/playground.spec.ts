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

/** The pitch spot of a slot, e.g. "RW", whose name starts with the slot code. */
const spot = (page: Page, code: string) =>
  page.getByRole('list', { name: 'Saha' }).getByRole('button', { name: new RegExp(`^${code} · `) });
/** The details panel of the selected slot, named like "RW · Sağ kanat". */
const slot = (page: Page, name: string) => page.getByRole('region', { name });
const styleSelect = (region: Locator) => region.getByRole('combobox', { name: 'Kimya stili' });
// The true ratings come from the calibrated weights; the unit tests check the arithmetic.
const TRUE_RATING = /^\d{1,2},\d$/;
const summary = (page: Page) => page.getByRole('region', { name: 'Kadro özeti' });

/** Taps an empty slot on the pitch and picks a card in the search that opens. */
async function pick(page: Page, code: string, cardText: string): Promise<void> {
  await spot(page, code).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: cardText }).click();
  await expect(dialog).toHaveCount(0);
}

async function pickTrio(page: Page): Promise<void> {
  await pick(page, 'GK', 'Thibaut Courtois 90 · GK · Real Madrid');
  await pick(page, 'RW', 'Takefusa Kubo 80 · RM · Real Sociedad');
  await pick(page, 'ST', 'Pelé 95 · CAM · ICON');
}

async function centre(locator: Locator): Promise<{ x: number; y: number }> {
  const box = await locator.boundingBox();
  if (box === null) throw new Error('Element is not visible');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
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

test('starts with an empty 4-3-3 on the pitch', async ({ page }) => {
  await page.goto('/oyun-alani');

  await expect(page.getByRole('combobox', { name: 'Diziliş' })).toHaveValue('8');
  await expect(field(summary(page), 'Kadro reytingi')).toHaveText('0');
  await expect(field(summary(page), 'Takım kimyası')).toHaveText('0 / 33');
  await expect(field(summary(page), 'Kadro gerçek reytingi')).toHaveText('0,0');
  const spots = page.getByRole('list', { name: 'Saha' }).getByRole('button');
  await expect(spots).toHaveCount(11);
  for (const [index, name] of [
    'GK · Kaleci, boş',
    'RB · Sağ bek, boş',
    'RCB · Stoper, boş',
    'LCB · Stoper, boş',
    'LB · Sol bek, boş',
    'RCM · Merkez orta saha, boş',
    'CM · Merkez orta saha, boş',
    'LCM · Merkez orta saha, boş',
    'RW · Sağ kanat, boş',
    'ST · Santrafor, boş',
    'LW · Sol kanat, boş',
  ].entries()) {
    await expect(spots.nth(index)).toHaveAccessibleName(name);
  }
  await expect(
    page.getByText('Ayrıntıları görmek için sahadaki bir oyuncuya dokun.'),
  ).toBeVisible();
});

test('lays the slots out in their formation, attack at the top', async ({ page }) => {
  await page.goto('/oyun-alani');
  const [gk, lcb, cm, st, lw, rw, lb] = await Promise.all(
    ['GK', 'LCB', 'CM', 'ST', 'LW', 'RW', 'LB'].map((code) => centre(spot(page, code))),
  );
  if (!gk || !lcb || !cm || !st || !lw || !rw || !lb) throw new Error('Spot missing');

  expect(gk.y).toBeGreaterThan(lcb.y);
  expect(lcb.y).toBeGreaterThan(cm.y);
  expect(cm.y).toBeGreaterThan(st.y);
  expect(lw.x).toBeLessThan(st.x);
  expect(st.x).toBeLessThan(rw.x);
  expect(lb.x).toBeLessThan(lcb.x);
  expect(Math.round(lw.y)).toBe(Math.round(st.y));
});

test('searches cards that can play the slot and places the chosen one', async ({ page }) => {
  const requests = await serveCards(page);
  await page.goto('/oyun-alani');
  await spot(page, 'RW').click();
  const dialog = page.getByRole('dialog', { name: 'Kart seç · RW' });

  await expect(
    dialog.getByRole('button', { name: 'Takefusa Kubo 80 · RM · Real Sociedad' }),
  ).toBeVisible();
  expect(requests.at(-1)?.['or']).toBe('(position.eq.RW,alternate_positions.cs.{RW})');
  await dialog.getByRole('searchbox', { name: 'Oyuncu ara' }).fill('Kubo');
  await expect.poll(() => requests.at(-1)?.['search_name']).toBe('ilike.%kubo%');
  await dialog.getByRole('button', { name: 'Takefusa Kubo 80 · RM · Real Sociedad' }).click();

  await expect(dialog).toHaveCount(0);
  await expect(spot(page, 'RW')).toHaveAccessibleName('RW · Sağ kanat, Takefusa Kubo 80');
  await expect(slot(page, 'RW · Sağ kanat')).toContainText('Takefusa Kubo 80');
  await expect(field(slot(page, 'RW · Sağ kanat'), 'Kimya')).toHaveText('0 / 3');
});

test('closes the card search without changing the slot', async ({ page }) => {
  await serveCards(page);
  await page.goto('/oyun-alani');
  await spot(page, 'GK').click();
  await page.getByRole('dialog').getByRole('button', { name: 'Kapat' }).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(slot(page, 'GK · Kaleci')).toContainText('Boş');
  await expect(slot(page, 'GK · Kaleci').getByRole('button', { name: 'Kart seç' })).toBeVisible();
});

test('updates chemistry and squad rating as cards are placed', async ({ page }) => {
  await serveCards(page);
  await page.goto('/oyun-alani');

  await pick(page, 'GK', 'Thibaut Courtois 90 · GK · Real Madrid');
  // One player rated 90: sum 90, cf 81.82 → round(171.82) / 11 → 15.
  await expect(field(summary(page), 'Kadro reytingi')).toHaveText('15');
  await pick(page, 'RW', 'Takefusa Kubo 80 · RM · Real Sociedad');
  await pick(page, 'ST', 'Pelé 95 · CAM · ICON');

  // Pelé is an icon (3) and lifts LALIGA to 3: Courtois and Kubo get 1 each.
  await expect(field(summary(page), 'Kadro reytingi')).toHaveText('41');
  await expect(field(summary(page), 'Takım kimyası')).toHaveText('5 / 33');
  await expect(field(slot(page, 'ST · Santrafor'), 'Kimya')).toHaveText('3 / 3');
  await spot(page, 'GK').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(field(slot(page, 'GK · Kaleci'), 'Kimya')).toHaveText('1 / 3');
  await spot(page, 'RW').click();
  await expect(field(slot(page, 'RW · Sağ kanat'), 'Kimya')).toHaveText('1 / 3');
});

test('shows what the chosen chemistry style changes in the stats', async ({ page }) => {
  await serveCards(page);
  await page.goto('/oyun-alani');
  await pickTrio(page);
  const striker = slot(page, 'ST · Santrafor');
  const stats = striker.getByRole('list', { name: 'İstatistikler' }).getByRole('listitem');

  await styleSelect(striker).selectOption({ label: 'Stil yok' });
  await expect(stats).toHaveText([
    'Hız 93',
    'Şut 94',
    'Pas 91',
    'Dripling 94',
    'Defans 58',
    'Fizik 74',
  ]);
  await styleSelect(striker).selectOption({ label: 'Hunter' });
  // Hunter at 3 chemistry (worked out in the domain tests): pace +6, shooting +3.
  await expect(stats).toHaveText([
    'Hız 99 +6',
    'Şut 97 +3',
    'Pas 91',
    'Dripling 94',
    'Defans 58',
    'Fizik 74',
  ]);

  await expect(striker.getByTestId('style-boosts')).toHaveText(
    'Hunter tam kimyada: Hızlanma +6 · Sprint hızı +6 · Pozisyon alma +3 · Bitiricilik +3 · Şut gücü +3 · Vole +9 · Penaltı +6',
  );

  await striker.getByText('Tüm statlar').click();
  const shooting = striker.getByRole('region', { name: 'Şut' });
  await expect(shooting.getByRole('listitem')).toHaveText([
    'Pozisyon alma 98 +3',
    'Bitiricilik 99 +3',
    'Şut gücü 96 +3',
    'Uzaktan şut 92',
    'Vole 99 +5',
    'Penaltı 97 +6',
  ]);

  await spot(page, 'GK').click();
  await expect(styleSelect(slot(page, 'GK · Kaleci')).locator('option')).toHaveText([
    /^Otomatik \((GK Basic|Wall|Glove|Shield|Cat)\)$/,
    'Stil yok',
    'GK Basic',
    'Wall',
    'Glove',
    'Shield',
    'Cat',
  ]);
});

test('shows the AcceleRATE type with the chosen chemistry style', async ({ page }) => {
  await serveCards(page);
  await page.goto('/oyun-alani');
  await pickTrio(page);
  const striker = slot(page, 'ST · Santrafor');

  await styleSelect(striker).selectOption({ label: 'Stil yok' });
  await expect(field(striker, 'AcceleRATE')).toHaveText('Patlayıcı');
  // Pelé has 3 chemistry, so Sniper's full boost makes him Controlled.
  await styleSelect(striker).selectOption({ label: 'Sniper' });
  await expect(field(striker, 'AcceleRATE')).toHaveText('Kontrollü');
  await spot(page, 'GK').click();
  await expect(field(slot(page, 'GK · Kaleci'), 'AcceleRATE')).toHaveText('Uzun');
});

test('shows the PlayStyles and the roles at the slot position', async ({ page }) => {
  await serveCards(page);
  await page.goto('/oyun-alani');
  await pickTrio(page);
  const striker = slot(page, 'ST · Santrafor');

  await expect(field(striker, "PlayStyle'lar")).toHaveText(
    'Finesse Shot+, Power Shot, Precision Header, Incisive Pass, Technical, Trickster, Quick Step',
  );
  // Pelé is a CAM with Shadow Striker++ and Playmaker+ there, but only False 9++ at ST.
  await expect(field(striker, 'Roller')).toHaveText('False 9++');
  await spot(page, 'RW').click();
  await expect(field(slot(page, 'RW · Sağ kanat'), 'Roller')).toHaveText('Inside Forward+');
  await spot(page, 'GK').click();
  await expect(field(slot(page, 'GK · Kaleci'), 'Roller')).toHaveText('Goalkeeper++');
});

test('picks each player’s chemistry style automatically and shows the true ratings', async ({
  page,
}) => {
  await serveCards(page);
  await page.goto('/oyun-alani');
  await pickTrio(page);
  const striker = slot(page, 'ST · Santrafor');

  await expect(styleSelect(striker)).toHaveValue('auto');
  await expect(styleSelect(striker).locator('option').first()).toHaveText(
    /^Otomatik \([A-Za-z ]+\)$/,
  );
  await expect(striker.getByTestId('style-boosts')).toHaveText(/^[A-Za-z ]+ tam kimyada: /);
  for (const [code, name] of [
    ['GK', 'GK · Kaleci'],
    ['RW', 'RW · Sağ kanat'],
    ['ST', 'ST · Santrafor'],
  ] as const) {
    await spot(page, code).click();
    await expect(field(slot(page, name), 'Gerçek reyting')).toHaveText(TRUE_RATING);
  }
  await expect(field(summary(page), 'Kadro gerçek reytingi')).toHaveText(TRUE_RATING);
  await expect(field(summary(page), 'Kadro gerçek reytingi')).not.toHaveText('0,0');

  // Picking a style by hand switches Otomatik off; picking Otomatik again restores it.
  await styleSelect(striker).selectOption({ label: 'Hunter' });
  await expect(styleSelect(striker)).toHaveValue('17');
  await expect(styleSelect(striker).locator('option').first()).toHaveText('Otomatik');
  await styleSelect(striker).selectOption({ index: 0 });
  await expect(styleSelect(striker)).toHaveValue('auto');
});

test('has no automatic style for a player without chemistry', async ({ page }) => {
  await serveCards(page);
  await page.goto('/oyun-alani');
  await pickTrio(page);

  await page.getByRole('combobox', { name: 'Diziliş' }).selectOption({ label: '4-4-2' });
  await spot(page, 'LM').click();
  const winger = slot(page, 'LM · Sol orta saha');

  await expect(styleSelect(winger).locator('option').first()).toHaveText('Otomatik (Etkisiz)');
  await expect(field(winger, 'Gerçek reyting')).toHaveText(TRUE_RATING);
});

test('keeps the cards when the formation changes, out of position where they no longer fit', async ({
  page,
}) => {
  await serveCards(page);
  await page.goto('/oyun-alani');
  await pickTrio(page);

  await page.getByRole('combobox', { name: 'Diziliş' }).selectOption({ label: '4-4-2' });

  await expect(spot(page, 'LM')).toHaveAccessibleName(
    'LM · Sol orta saha, Takefusa Kubo 80, mevki dışı',
  );
  await spot(page, 'LM').click();
  await expect(slot(page, 'LM · Sol orta saha')).toContainText('Takefusa Kubo 80');
  await expect(field(slot(page, 'LM · Sol orta saha'), 'Kimya')).toHaveText('Mevki dışı');
  await styleSelect(slot(page, 'LM · Sol orta saha')).selectOption({ label: 'Hunter' });
  await expect(slot(page, 'LM · Sol orta saha')).toContainText(
    'Kimyası 0 olduğu için stil şu an etki etmiyor.',
  );
  await spot(page, 'RS').click();
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
  await expect(spot(page, 'ST')).toHaveAccessibleName('ST · Santrafor, boş');
  await expect(field(summary(page), 'Takım kimyası')).toHaveText('0 / 33');
});

test('replaces a placed card through the slot panel', async ({ page }) => {
  await serveCards(page);
  await page.goto('/oyun-alani');
  await pick(page, 'GK', 'Thibaut Courtois 90 · GK · Real Madrid');

  await slot(page, 'GK · Kaleci').getByRole('button', { name: 'Değiştir' }).click();

  await expect(page.getByRole('dialog', { name: 'Kart seç · GK' })).toBeVisible();
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
  await spot(page, 'GK').click();

  await expect(page.getByRole('dialog').getByRole('alert')).toHaveText('Kartlar yüklenemedi.');
});

test('fits the viewport without horizontal scrolling', async ({ page }) => {
  await serveCards(page);
  await page.goto('/oyun-alani');
  await pickTrio(page);
  await styleSelect(slot(page, 'ST · Santrafor')).selectOption({ label: 'Hunter' });
  await slot(page, 'ST · Santrafor').getByText('Tüm statlar').click();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
});
