import { describe, expect, it } from 'vitest';

import eaPage from '../test/fixtures/ea-ratings-page.json' with { type: 'json' };
import futggPage from '../test/fixtures/futgg-definitions-page.json' with { type: 'json' };
import { SourceValidationError } from './catalog-card.js';
import type { CatalogCard } from './catalog-card.js';
import { fetchEaRatingsPage, parseEaRatingsPage } from './ea.js';
import { parseFutggDefinitionsPage } from './futgg.js';
import { SourceHttpError } from './http.js';

type RawItem = (typeof eaPage)['items'][number];

function withItem(index: number, patch: Partial<Record<keyof RawItem, unknown>>): unknown {
  const copy = structuredClone(eaPage) as { items: Record<string, unknown>[] };
  copy.items[index] = { ...copy.items[index], ...patch };
  return copy;
}

/** Asserts the exact error a caller can rely on: class, name, source and message. */
function expectValidationError(run: () => unknown, message: string | RegExp): void {
  let thrown: unknown;
  try {
    run();
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(SourceValidationError);
  // toMatchObject treats a bare RegExp value as matching anything; wrap it explicitly.
  const expectedMessage: unknown =
    typeof message === 'string' ? message : expect.stringMatching(message);
  expect(thrown).toMatchObject({
    name: 'SourceValidationError',
    source: 'ea',
    message: expectedMessage,
  });
}

function cardAt(index: number): CatalogCard {
  const card = parseEaRatingsPage(eaPage).cards[index];
  if (!card) throw new Error(`fixture has no card at ${index}`);
  return card;
}

describe('parseEaRatingsPage', () => {
  it('reads the total number of base cards', () => {
    const parsed = parseEaRatingsPage(eaPage);
    expect(parsed.totalItems).toBe(19789);
    expect(parsed.cards).toHaveLength(3);
  });

  it('normalises an outfield base card, leaving unprovided fields null', () => {
    expect(cardAt(0)).toEqual({
      source: 'ea',
      eaId: 231747,
      basePlayerEaId: 231747,
      name: 'Kylian Mbappé',
      overall: 91,
      position: 'ST',
      alternatePositions: ['LW'],
      rarity: null,
      club: { eaId: 243, name: 'Real Madrid' },
      league: { eaId: null, name: 'LALIGA EA SPORTS' },
      nation: { eaId: 18, name: 'France' },
      faceStats: {
        pace: 96,
        shooting: 91,
        passing: 80,
        dribbling: 92,
        defending: 29,
        physicality: 76,
      },
      goalkeeperFaceStats: null,
      attributes: {
        acceleration: 97,
        sprintSpeed: 96,
        agility: 93,
        balance: 82,
        jumping: 90,
        stamina: 83,
        strength: 77,
        reactions: 92,
        aggression: 61,
        composure: 88,
        interceptions: 19,
        positioning: 91,
        vision: 83,
        ballControl: 93,
        crossing: 74,
        dribbling: 92,
        finishing: 95,
        freeKickAccuracy: 70,
        headingAccuracy: 78,
        longPassing: 74,
        shortPassing: 87,
        defensiveAwareness: 15,
        shotPower: 91,
        longShots: 86,
        standingTackle: 34,
        slidingTackle: 24,
        volleys: 87,
        curve: 80,
        penalties: 86,
        gkDiving: 13,
        gkHandling: 5,
        gkKicking: 7,
        gkReflexes: 6,
        gkPositioning: 11,
      },
      skillMoves: 5,
      weakFoot: 4,
      foot: 'right',
      heightCm: null,
      weightKg: null,
      accelerateType: null,
      playStyles: null,
      playStylesPlus: null,
      rolesPlus: null,
      rolesPlusPlus: null,
      chemistry: {
        fullChemistryInPosition: false,
        extraClubChemistry: 0,
        extraLeagueChemistry: 0,
        extraNationChemistry: 0,
        countsForEveryLeague: false,
        countsForEveryNation: false,
      },
      isUntradeable: false,
      imageUrl:
        'https://ratings-images-prod.pulse.ea.com/FC25/full/player-shields/en/231747.png?width=265',
    });
  });

  it('reads goalkeeper face stats from the face-stat slots, matching FUT.GG for the same card', () => {
    const courtois = cardAt(1);
    const futggCourtois = parseFutggDefinitionsPage(futggPage).cards.find(
      (card) => card.eaId === 192119,
    );
    expect(courtois.position).toBe('GK');
    expect(courtois.foot).toBe('left');
    expect(courtois.faceStats).toBeNull();
    expect(courtois.goalkeeperFaceStats).toEqual({
      diving: 87,
      handling: 89,
      kicking: 78,
      reflexes: 90,
      speed: 46,
      positioning: 90,
    });
    expect(courtois.goalkeeperFaceStats).toEqual(futggCourtois?.goalkeeperFaceStats);
    expect(courtois.attributes).toEqual(futggCourtois?.attributes);
  });

  it('treats missing alternate positions as none', () => {
    const haaland = cardAt(2);
    expect(haaland.name).toBe('Erling Haaland');
    expect(haaland.alternatePositions).toEqual([]);
    expect(haaland.foot).toBe('left');
  });

  it('prefers the common name when EA provides one', () => {
    const parsed = parseEaRatingsPage(withItem(0, { commonName: 'Mbappé' }));
    expect(parsed.cards[0]?.name).toBe('Mbappé');
  });

  it('reads a numeric height and weight when present', () => {
    const parsed = parseEaRatingsPage(withItem(0, { height: '178', weight: '73' }));
    expect(parsed.cards[0]?.heightCm).toBe(178);
    expect(parsed.cards[0]?.weightKg).toBe(73);
  });

  it('rejects an unknown position', () => {
    expectValidationError(
      () =>
        parseEaRatingsPage(
          withItem(0, { position: { id: '2', shortLabel: 'RWB', label: 'Right Wing Back' } }),
        ),
      '[ea] unknown position id 2',
    );
  });

  it('rejects an unknown alternate position', () => {
    expectValidationError(
      () =>
        parseEaRatingsPage(
          withItem(0, {
            alternatePositions: [{ id: '8', shortLabel: 'LWB', label: 'Left Wing Back' }],
          }),
        ),
      '[ea] unknown position id 8',
    );
  });

  it.each(['25x', 'p25'])('rejects the malformed position id %s', (id) => {
    expectValidationError(
      () =>
        parseEaRatingsPage(withItem(0, { position: { id, shortLabel: 'ST', label: 'Striker' } })),
      /^\[ea\] invalid response: [\s\S]*position/,
    );
  });

  it('rejects an unknown preferred foot', () => {
    expectValidationError(
      () => parseEaRatingsPage(withItem(0, { preferredFoot: 0 })),
      '[ea] unknown foot value 0',
    );
  });

  it.each(['178 cm', '~178'])('rejects the non-numeric height %s', (height) => {
    expectValidationError(
      () => parseEaRatingsPage(withItem(0, { height })),
      /^\[ea\] invalid response: [\s\S]*height/,
    );
  });

  it('rejects an item without stats', () => {
    expectValidationError(
      () => parseEaRatingsPage(withItem(1, { stats: undefined })),
      /^\[ea\] invalid response: [\s\S]*stats/,
    );
  });

  it('rejects a response without items', () => {
    expectValidationError(
      () => parseEaRatingsPage({ totalItems: 0 }),
      /^\[ea\] invalid response: [\s\S]*items/,
    );
  });
});

describe('fetchEaRatingsPage', () => {
  it('requests FC 27 ratings with the referrer header and a cache-busting parameter', async () => {
    const calls: { url: string; headers: Headers }[] = [];
    const parsed = await fetchEaRatingsPage(
      { offset: 200, limit: 3, cacheBust: 'abc' },
      (url, init) => {
        calls.push({ url, headers: new Headers(init?.headers) });
        return Promise.resolve(Response.json(eaPage));
      },
    );
    expect(calls.map((call) => call.url)).toEqual([
      'https://drop-api.ea.com/rating/ea-sports-fc?locale=en&limit=3&offset=200&cb=abc',
    ]);
    expect(calls[0]?.headers.get('drop-referrer')).toBe(
      'https://www.ea.com/games/ea-sports-fc/ratings',
    );
    expect(parsed.totalItems).toBe(19789);
  });

  it('fails with the HTTP status when the source errors', async () => {
    const result = fetchEaRatingsPage({ offset: 0, limit: 3, cacheBust: 'x' }, () =>
      Promise.resolve(new Response('Bad gateway', { status: 502 })),
    );
    await expect(result).rejects.toThrow(new SourceHttpError('ea', 502, 'HTTP 502'));
  });

  it('fails clearly when the body is not JSON', async () => {
    const result = fetchEaRatingsPage({ offset: 0, limit: 3, cacheBust: 'x' }, () =>
      Promise.resolve(new Response('<html>maintenance</html>', { status: 200 })),
    );
    await expect(result).rejects.toThrow(new SourceHttpError('ea', 200, 'invalid JSON body'));
  });
});
