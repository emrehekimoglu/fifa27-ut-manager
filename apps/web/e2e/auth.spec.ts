import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import packageJson from '../package.json' with { type: 'json' };
import { ALLOWED_EMAIL, IS_ALLOWED, LOGOUT, STRANGER_EMAIL, signIn } from './auth';
import { E2E_BUILD, E2E_PORT, E2E_SUPABASE } from './build-fixture';

const AUTHORIZE = `${E2E_SUPABASE.url}/auth/v1/authorize**`;

const mainMenu = (page: Page) => page.getByRole('navigation', { name: 'Ana menü' });

test.beforeEach(async ({ page }) => {
  // Nothing else may reach the database: a request the test did not expect fails.
  await page.route(/^https:\/\/supabase\.e2e\.test\//, (route) => route.abort());
  await page.route('**/api/source-health', (route) => route.abort());
  await page.route(/^https:\/\/game-assets\.fut\.gg\//, (route) => route.abort());
});

test.describe('signed out', () => {
  for (const path of ['/', '/katalog', '/katalog/237067', '/oyun-alani', '/kaynaklar']) {
    test(`asks for Google sign-in instead of showing ${path}`, async ({ page }) => {
      await page.goto(path);

      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Giriş yap');
      await expect(page.getByRole('main')).toContainText(
        'FC 27 UT Manager yalnızca davetli hesaplara açık.',
      );
      await expect(page.getByRole('button', { name: 'Google ile giriş yap' })).toBeVisible();
      await expect(mainMenu(page)).toHaveCount(0);
    });
  }

  test('still shows the deployed build in the footer', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('contentinfo')).toHaveText(
      `v${packageJson.version} · ${E2E_BUILD.commitSha.slice(0, 7)} · Önizleme`,
    );
  });

  test('sends the user to Google and back to the page they asked for', async ({ page }) => {
    let authorize: URL | undefined;
    await page.route(AUTHORIZE, (route) => {
      authorize = new URL(route.request().url());
      return route.fulfill({ status: 200, contentType: 'text/html', body: '<p>Google</p>' });
    });
    await page.goto('/katalog?q=pele');

    await page.getByRole('button', { name: 'Google ile giriş yap' }).click();

    await expect(page.getByText('Google')).toBeVisible();
    expect(authorize?.origin).toBe(E2E_SUPABASE.url);
    expect(authorize?.pathname).toBe('/auth/v1/authorize');
    expect(authorize?.searchParams.get('provider')).toBe('google');
    expect(authorize?.searchParams.get('redirect_to')).toBe(
      `http://localhost:${E2E_PORT}/katalog?q=pele`,
    );
  });
});

test.describe('signed in with an allow-listed account', () => {
  test('shows the page with the menu and the account', async ({ page }) => {
    await signIn(page);
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('FC 27 UT Manager');
    await expect(mainMenu(page)).toHaveCount(1);
    await expect(page.getByRole('banner').getByTestId('account-email')).toHaveText(ALLOWED_EMAIL);
    await expect(page.getByRole('button', { name: 'Çıkış yap' })).toBeVisible();
  });

  test('signs out on this device and asks for sign-in again', async ({ page }) => {
    await signIn(page);
    let logout: URL | undefined;
    await page.route(LOGOUT, (route) => {
      logout = new URL(route.request().url());
      return route.fulfill({ status: 204 });
    });
    await page.goto('/');

    await page.getByRole('button', { name: 'Çıkış yap' }).click();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Giriş yap');
    await expect(mainMenu(page)).toHaveCount(0);
    expect(logout?.searchParams.get('scope')).toBe('local');
  });
});

test.describe('signed in with any other account', () => {
  test('refuses access and names the account', async ({ page }) => {
    await signIn(page, { email: STRANGER_EMAIL, allowed: false });
    await page.goto('/katalog');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Erişim yok');
    await expect(page.getByRole('main')).toContainText(
      `${STRANGER_EMAIL} hesabının bu uygulamaya erişimi yok.`,
    );
    await expect(mainMenu(page)).toHaveCount(0);
    await expect(page.getByRole('list', { name: 'Kartlar' })).toHaveCount(0);
  });

  test('lets the user sign out to try another account', async ({ page }) => {
    await signIn(page, { email: STRANGER_EMAIL, allowed: false });
    await page.route(LOGOUT, (route) => route.fulfill({ status: 204 }));
    await page.goto('/');

    await page.getByRole('main').getByRole('button', { name: 'Çıkış yap' }).click();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Giriş yap');
  });
});

test('reports a failed access check and retries it', async ({ page }) => {
  await signIn(page);
  let attempts = 0;
  await page.route(IS_ALLOWED, (route) => {
    attempts += 1;
    return attempts === 1
      ? route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'canceling statement due to statement timeout' }),
        })
      : route.fulfill({ status: 200, contentType: 'application/json', body: 'true' });
  });
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Erişim kontrol edilemedi');
  await expect(page.getByRole('alert')).toHaveText('canceling statement due to statement timeout');

  await page.getByRole('button', { name: 'Tekrar dene' }).click();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('FC 27 UT Manager');
  expect(attempts).toBe(2);
});
