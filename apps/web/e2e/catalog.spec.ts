import { expect, test } from '@playwright/test';
import type { Locator, Page, Route } from '@playwright/test';

import { E2E_SUPABASE } from './build-fixture';
import cards from './fixtures/futgg-catalog-cards.json' with { type: 'json' };

const CARDS = `${E2E_SUPABASE.url}/rest/v1/cards**`;
const [pele, kubo, courtois] = cards;

type Params = Record<string, string>;

/** The value shown next to a label in a details list. */
function field(region: Locator | Page, label: string): Locator {
  return region.locator(`dt:text-is("${label}") + dd`);
}

/** Answers card queries like PostgREST: rows of `{ data }`, the total in Content-Range. */
function fulfillCards(route: Route, rows: readonly unknown[], total: number): Promise<void> {
  const range = rows.length > 0 ? `0-${rows.length - 1}` : '*';
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    // Cross-origin, so the header must be exposed like Supabase does.
    headers: {
      'access-control-expose-headers': 'content-range',
      'content-range': `${range}/${total}`,
    },
    body: JSON.stringify(rows),
  });
}

/** Serves list queries with `list` and records their parameters. */
async function serveList(
  page: Page,
  list: (params: Params) => { rows: readonly unknown[]; total: number },
): Promise<Params[]> {
  const requests: Params[] = [];
  await page.route(CARDS, (route) => {
    const params = Object.fromEntries(new URL(route.request().url()).searchParams);
    requests.push(params);
    const { rows, total } = list(params);
    return fulfillCards(
      route,
      rows.map((data) => ({ data })),
      total,
    );
  });
  return requests;
}

const listItems = (page: Page) => page.getByRole('list', { name: 'Kartlar' }).getByRole('listitem');

test.beforeEach(async ({ page }) => {
  // Card images come from a third-party CDN; keep the tests offline and deterministic.
  await page.route(/^https:\/\/game-assets\.fut\.gg\//, (route) => route.abort());
});

test('is reachable from the landing page', async ({ page }) => {
  await serveList(page, () => ({ rows: cards, total: 19958 }));
  await page.goto('/');
  await page.getByRole('link', { name: 'Kart kataloğu' }).click();

  await expect(page).toHaveURL(/\/katalog$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kart kataloğu');
});

test('lists active cards best first with the number of matches', async ({ page }) => {
  const requests = await serveList(page, () => ({ rows: cards, total: 19958 }));
  await page.goto('/katalog');

  await expect(page.getByRole('status')).toHaveText('19.958 kart');
  await expect(listItems(page)).toHaveText([
    'Pelé 95 · CAM · ICON',
    'Takefusa Kubo 80 · RM · Real Sociedad',
    'Thibaut Courtois 90 · GK · Real Madrid',
  ]);
  await expect(listItems(page).first().getByRole('link')).toHaveAttribute(
    'href',
    '/katalog/237067',
  );
  expect(requests[0]).toEqual({
    select: 'data',
    is_active: 'eq.true',
    order: 'overall.desc,ea_id.asc',
    offset: '0',
    limit: '30',
  });
});

test('searches by name, ignoring case and accents', async ({ page }) => {
  const requests = await serveList(page, (params) =>
    params['search_name'] === 'ilike.%kubo%'
      ? { rows: [kubo], total: 1 }
      : { rows: cards, total: 19958 },
  );
  await page.goto('/katalog');
  await expect(listItems(page)).toHaveCount(3);

  await page.getByRole('searchbox', { name: 'Oyuncu ara' }).fill('KUBO');

  await expect(listItems(page)).toHaveText(['Takefusa Kubo 80 · RM · Real Sociedad']);
  await expect(page.getByRole('status')).toHaveText('1 kart');
  await expect(page).toHaveURL(/\/katalog\?q=KUBO$/);
  expect(requests.at(-1)?.['search_name']).toBe('ilike.%kubo%');
});

test('filters by a position the card can play', async ({ page }) => {
  const requests = await serveList(page, (params) =>
    params['or'] ? { rows: [courtois], total: 1 } : { rows: cards, total: 19958 },
  );
  await page.goto('/katalog');
  await expect(listItems(page)).toHaveCount(3);

  await page.getByRole('combobox', { name: 'Mevki' }).selectOption({ label: 'GK · Kaleci' });

  await expect(listItems(page)).toHaveText(['Thibaut Courtois 90 · GK · Real Madrid']);
  await expect(page).toHaveURL(/\/katalog\?mevki=GK$/);
  expect(requests.at(-1)?.['or']).toBe('(position.eq.GK,alternate_positions.cs.{GK})');
});

test('explains when nothing matches', async ({ page }) => {
  await serveList(page, () => ({ rows: [], total: 0 }));
  await page.goto('/katalog?q=zzzz');

  await expect(page.getByText('Aramanızla eşleşen kart yok.')).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('0 kart');
  await expect(page.getByRole('list', { name: 'Kartlar' })).toHaveCount(0);
});

test('pages through the results', async ({ page }) => {
  const requests = await serveList(page, () => ({ rows: cards, total: 75 }));
  await page.goto('/katalog');
  const pages = page.getByRole('navigation', { name: 'Sayfalar' });

  await expect(pages).toContainText('Sayfa 1 / 3');
  await expect(pages.getByRole('button', { name: 'Önceki' })).toBeDisabled();
  await pages.getByRole('button', { name: 'Sonraki' }).click();

  await expect(pages).toContainText('Sayfa 2 / 3');
  await expect(page).toHaveURL(/\/katalog\?sayfa=2$/);
  expect(requests.at(-1)).toMatchObject({ offset: '30', limit: '30' });
  await pages.getByRole('button', { name: 'Sonraki' }).click();
  await expect(pages.getByRole('button', { name: 'Sonraki' })).toBeDisabled();
});

test('restores the search, filter and page from the address', async ({ page }) => {
  const requests = await serveList(page, () => ({ rows: [pele], total: 45 }));
  await page.goto('/katalog?q=pele&mevki=CAM&sayfa=2');

  await expect(page.getByRole('searchbox', { name: 'Oyuncu ara' })).toHaveValue('pele');
  await expect(page.getByRole('combobox', { name: 'Mevki' })).toHaveValue('CAM');
  await expect(page.getByRole('navigation', { name: 'Sayfalar' })).toContainText('Sayfa 2 / 2');
  expect(requests[0]).toMatchObject({
    search_name: 'ilike.%pele%',
    or: '(position.eq.CAM,alternate_positions.cs.{CAM})',
    offset: '30',
  });
});

test('reports when the cards cannot be loaded', async ({ page }) => {
  await page.route(CARDS, (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'permission denied' }),
    }),
  );
  await page.goto('/katalog');

  await expect(page.getByRole('alert')).toHaveText('Kartlar yüklenemedi.');
});

test.describe('card detail', () => {
  async function serveCard(page: Page, rows: readonly unknown[]): Promise<Params[]> {
    const requests: Params[] = [];
    await page.route(CARDS, (route) => {
      const params = Object.fromEntries(new URL(route.request().url()).searchParams);
      requests.push(params);
      return params['ea_id']
        ? fulfillCards(route, rows, rows.length)
        : fulfillCards(
            route,
            cards.map((data) => ({ data })),
            19958,
          );
    });
    return requests;
  }

  test('opens from the list and shows every fact of the card', async ({ page }) => {
    const requests = await serveCard(page, [{ data: pele, is_active: true }]);
    await page.goto('/katalog');
    await listItems(page).first().getByRole('link').click();

    await expect(page).toHaveURL(/\/katalog\/237067$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pelé');
    await expect(field(page, 'Reyting')).toHaveText('95');
    await expect(field(page, 'Mevki')).toHaveText('CAM · Ofansif orta saha');
    await expect(field(page, 'Diğer mevkiler')).toHaveText('ST');
    await expect(field(page, 'Kart türü')).toHaveText('Base Icon');
    await expect(field(page, 'Kulüp')).toHaveText('ICON');
    await expect(field(page, 'Lig')).toHaveText('Icons');
    await expect(field(page, 'Ülke')).toHaveText('Brazil');
    await expect(field(page, 'Ayak')).toHaveText('Sağ');
    await expect(field(page, 'Zayıf ayak')).toHaveText('4');
    await expect(field(page, 'Yetenek hareketi')).toHaveText('5');
    await expect(field(page, 'Boy')).toHaveText('173 cm');
    await expect(field(page, 'Kilo')).toHaveText('70 kg');
    await expect(field(page, 'AcceleRATE')).toHaveText('Patlayıcı');
    await expect(field(page, 'Takas')).toHaveText('Takas edilebilir');
    expect(requests.at(-1)).toEqual({ select: 'data,is_active', ea_id: 'eq.237067', limit: '1' });
  });

  test('shows the face stats with their attributes', async ({ page }) => {
    await serveCard(page, [{ data: pele, is_active: true }]);
    await page.goto('/katalog/237067');
    const stats = page.getByRole('region', { name: 'İstatistikler' });

    await expect(stats.getByRole('heading', { level: 3 })).toHaveText([
      'Hız 93',
      'Şut 94',
      'Pas 91',
      'Dripling 94',
      'Defans 58',
      'Fizik 74',
    ]);
    const shooting = stats.getByRole('region', { name: 'Şut 94' });
    await expect(shooting.locator('dt')).toHaveText([
      'Pozisyon alma',
      'Bitiricilik',
      'Şut gücü',
      'Uzaktan şut',
      'Vole',
      'Penaltı',
    ]);
    await expect(field(shooting, 'Bitiricilik')).toHaveText('96');
  });

  test('shows goalkeeper stats for a goalkeeper', async ({ page }) => {
    await serveCard(page, [{ data: courtois, is_active: true }]);
    await page.goto('/katalog/192119');
    const stats = page.getByRole('region', { name: 'İstatistikler' });

    await expect(stats.getByRole('heading', { level: 3 })).toHaveText([
      'Plonjon 87',
      'Elle kontrol 89',
      'Vuruş 78',
      'Refleks 90',
      'Hız 46',
      'Pozisyon alma 90',
    ]);
    await expect(field(page, 'Diğer mevkiler')).toHaveText('—');
  });

  test('shows the AcceleRATE type each chemistry style gives', async ({ page }) => {
    await serveCard(page, [{ data: pele, is_active: true }]);
    await page.goto('/katalog/237067');
    const byStyle = page.getByRole('region', { name: 'Kimya stiline göre AcceleRATE' });

    await expect(byStyle.locator('dt')).toHaveText(['Patlayıcı', 'Kontrollü']);
    await expect(field(byStyle, 'Patlayıcı')).toHaveText(
      'Anchor, Artist, Backbone, Basic, Catalyst, Deadeye, Engine, Finisher, Gladiator, ' +
        'Guardian, Hawk, Hunter, Maestro, Marksman, Powerhouse, Sentinel, Shadow',
    );
    await expect(field(byStyle, 'Kontrollü')).toHaveText('Architect, Sniper');
  });

  test('leaves out the per-style AcceleRATE when the source has none', async ({ page }) => {
    await serveCard(page, [{ data: { ...pele, accelerateTypeByStyle: null }, is_active: true }]);
    await page.goto('/katalog/237067');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pelé');
    await expect(page.getByRole('region', { name: 'Kimya stiline göre AcceleRATE' })).toHaveCount(
      0,
    );
  });

  test('names the PlayStyles and roles of the card', async ({ page }) => {
    await serveCard(page, [{ data: pele, is_active: true }]);
    await page.goto('/katalog/237067');

    await expect(field(page, "PlayStyle'lar")).toHaveText(
      'Finesse Shot+, Power Shot, Precision Header, Incisive Pass, Technical, Trickster, Quick Step',
    );
    await expect(field(page, 'Roller')).toHaveText(
      'CAM Shadow Striker++, ST False 9++, CAM Playmaker+',
    );
  });

  test('says when the source reports no PlayStyles or roles', async ({ page }) => {
    const eaCard = {
      ...pele,
      source: 'ea',
      playStyles: null,
      playStylesPlus: null,
      rolesPlus: null,
      rolesPlusPlus: null,
    };
    await serveCard(page, [{ data: eaCard, is_active: true }]);
    await page.goto('/katalog/237067');

    await expect(field(page, "PlayStyle'lar")).toHaveText('Bilinmiyor');
    await expect(field(page, 'Roller')).toHaveText('Bilinmiyor');
  });

  test('names the missing club of a hero', async ({ page }) => {
    await serveCard(page, [{ data: { ...pele, club: null }, is_active: true }]);
    await page.goto('/katalog/237067');

    await expect(field(page, 'Kulüp')).toHaveText('—');
  });

  test('marks a card the source no longer lists', async ({ page }) => {
    await serveCard(page, [{ data: kubo, is_active: false }]);
    await page.goto('/katalog/237681');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Takefusa Kubo');
    await expect(page.getByText('Bu kart artık kaynakta listelenmiyor.')).toBeVisible();
  });

  test('explains an unknown card', async ({ page }) => {
    await serveCard(page, []);
    await page.goto('/katalog/999');

    await expect(page.getByText('Kart bulunamadı.')).toBeVisible();
    await page.getByRole('link', { name: '← Katalog' }).click();
    await expect(page).toHaveURL(/\/katalog$/);
  });

  test('does not query the database for an invalid address', async ({ page }) => {
    const requests = await serveCard(page, []);
    await page.goto('/katalog/abc');

    await expect(page.getByText('Kart bulunamadı.')).toBeVisible();
    expect(requests).toEqual([]);
  });

  test('reports when the card cannot be loaded', async ({ page }) => {
    await page.route(CARDS, (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'permission denied' }),
      }),
    );
    await page.goto('/katalog/237067');

    await expect(page.getByRole('alert')).toHaveText('Kart yüklenemedi.');
  });
});

test('fits the viewport without horizontal scrolling', async ({ page }) => {
  await serveList(page, () => ({ rows: cards, total: 19958 }));
  await page.goto('/katalog');
  await expect(listItems(page)).toHaveCount(3);
  const overflow = () =>
    page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
  expect(await overflow()).toBe(0);

  await page.route(CARDS, (route) => fulfillCards(route, [{ data: pele, is_active: true }], 1));
  await page.goto('/katalog/237067');
  await expect(page.getByRole('region', { name: 'İstatistikler' })).toBeVisible();
  expect(await overflow()).toBe(0);
});
