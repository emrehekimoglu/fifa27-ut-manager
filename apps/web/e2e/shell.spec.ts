import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

/** The sections of the main menu, in order, with the address each one opens. */
const SECTIONS = [
  { name: 'Ana sayfa', path: '/' },
  { name: 'Katalog', path: '/katalog' },
  { name: 'Kadro', path: '/oyun-alani' },
  { name: 'Kaynaklar', path: '/kaynaklar' },
] as const;

/** Minimum touch-target height in CSS pixels (Apple HIG 44 pt, Material 48 dp). */
const MIN_TARGET = 44;

const mainMenu = (page: Page) => page.getByRole('navigation', { name: 'Ana menü' });

async function heightOf(locator: Locator): Promise<number> {
  const box = await locator.boundingBox();
  if (box === null) throw new Error('Element is not visible');
  return box.height;
}

test.beforeEach(async ({ page }) => {
  // Keep the tests offline: database, source check and card images are not needed here.
  await page.route(/^https:\/\/supabase\.e2e\.test\//, (route) => route.abort());
  await page.route('**/api/source-health', (route) => route.abort());
  await page.route(/^https:\/\/game-assets\.fut\.gg\//, (route) => route.abort());
});

test('offers a skip link as the first focusable element', async ({ page }) => {
  await page.goto('/katalog');
  await page.keyboard.press('Tab');

  const skip = page.getByRole('link', { name: 'İçeriğe geç' });
  await expect(skip).toBeFocused();
  await expect(skip).toHaveAttribute('href', '#icerik');
  await expect(page.getByRole('main')).toHaveAttribute('id', 'icerik');
});

const current = [
  { path: '/', section: 'Ana sayfa' },
  { path: '/katalog', section: 'Katalog' },
  { path: '/katalog/237067', section: 'Katalog' },
  { path: '/oyun-alani', section: 'Kadro' },
  { path: '/kaynaklar', section: 'Kaynaklar' },
] as const;

for (const { path, section } of current) {
  test(`marks ${section} as the current section on ${path}`, async ({ page }) => {
    await page.goto(path);
    const links = mainMenu(page).getByRole('link');

    await expect(links).toHaveText(SECTIONS.map((item) => item.name));
    for (const item of SECTIONS) {
      const link = mainMenu(page).getByRole('link', { name: item.name, exact: true });
      if (item.name === section) await expect(link).toHaveAttribute('aria-current', 'page');
      else await expect(link).not.toHaveAttribute('aria-current');
    }
  });
}

test('opens every section from the main menu', async ({ page }) => {
  await page.goto('/kaynaklar');
  for (const item of [...SECTIONS].reverse()) {
    await mainMenu(page).getByRole('link', { name: item.name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${item.path === '/' ? '' : item.path}$`));
  }
});

test('pages no longer carry their own link back to the landing page', async ({ page }) => {
  for (const path of ['/katalog', '/oyun-alani', '/kaynaklar']) {
    await page.goto(path);
    await expect(page.getByRole('link', { name: '← Ana sayfa' })).toHaveCount(0);
  }
});

test('places the main menu in thumb reach on phones and in the header on desktop', async ({
  page,
}, testInfo) => {
  await page.goto('/katalog');
  const box = await mainMenu(page).boundingBox();
  const viewport = page.viewportSize();
  if (box === null || viewport === null) throw new Error('Main menu or viewport missing');

  if (testInfo.project.name === 'mobile-360') {
    // A bottom tab bar: flush with the bottom edge, full width.
    expect(Math.round(box.y + box.height)).toBe(viewport.height);
    expect(Math.round(box.width)).toBe(viewport.width);
  } else {
    await expect(
      page.getByRole('banner').getByRole('navigation', { name: 'Ana menü' }),
    ).toBeVisible();
    expect(box.y).toBeLessThan(80);
  }
});

test('keeps the end of the page clear of the tab bar', async ({ page }) => {
  await page.goto('/kaynaklar');
  await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight);
  });
  const footer = await page.getByRole('contentinfo').boundingBox();
  const menu = await mainMenu(page).boundingBox();
  if (footer === null || menu === null) throw new Error('Footer or main menu missing');

  const menuIsBelowFooter = menu.y >= footer.y + footer.height;
  const menuIsAboveFooter = menu.y + menu.height <= footer.y;
  expect(menuIsBelowFooter || menuIsAboveFooter).toBe(true);
});

test('gives every main menu link a touch-sized target', async ({ page }) => {
  await page.goto('/');
  for (const item of SECTIONS) {
    const link = mainMenu(page).getByRole('link', { name: item.name, exact: true });
    expect(await heightOf(link)).toBeGreaterThanOrEqual(MIN_TARGET);
  }
});

test('gives the catalog filters touch-sized targets', async ({ page }) => {
  await page.goto('/katalog');
  expect(
    await heightOf(page.getByRole('searchbox', { name: 'Oyuncu ara' })),
  ).toBeGreaterThanOrEqual(MIN_TARGET);
  expect(await heightOf(page.getByRole('combobox', { name: 'Mevki' }))).toBeGreaterThanOrEqual(
    MIN_TARGET,
  );
});

test('gives the playground controls touch-sized targets', async ({ page }) => {
  await page.goto('/oyun-alani');
  expect(await heightOf(page.getByRole('combobox', { name: 'Diziliş' }))).toBeGreaterThanOrEqual(
    MIN_TARGET,
  );
  const spots = page.getByRole('list', { name: 'Saha' }).getByRole('button');
  await expect(spots).toHaveCount(11);
  for (const index of [0, 5, 10]) {
    expect(await heightOf(spots.nth(index))).toBeGreaterThanOrEqual(MIN_TARGET);
  }
});

test('uses a 16 px font in text fields so phones do not zoom on focus', async ({ page }) => {
  await page.goto('/katalog');
  const fontSize = await page
    .getByRole('searchbox', { name: 'Oyuncu ara' })
    .evaluate((element) => getComputedStyle(element).fontSize);
  expect(fontSize).toBe('16px');
});
