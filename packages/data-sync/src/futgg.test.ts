import { describe, expect, it } from 'vitest';

import lastPage from '../test/fixtures/futgg-definitions-last-page.json' with { type: 'json' };
import page from '../test/fixtures/futgg-definitions-page.json' with { type: 'json' };
import { SourceValidationError } from './catalog-card.js';
import type { CatalogCard } from './catalog-card.js';
import { fetchFutggDefinitionsPage, parseFutggDefinitionsPage } from './futgg.js';
import { SourceHttpError } from './http.js';

type RawPage = typeof page;
type RawItem = RawPage['data'][number];

function withItem(index: number, patch: Partial<Record<keyof RawItem, unknown>>): unknown {
  const copy = structuredClone(page) as { data: Record<string, unknown>[] };
  copy.data[index] = { ...copy.data[index], ...patch };
  return copy;
}

function cardAt(index: number): CatalogCard {
  const card = parseFutggDefinitionsPage(page).cards[index];
  if (!card) throw new Error(`fixture has no card at ${index}`);
  return card;
}

// Expected values come from the raw fixture and were cross-checked independently:
// positions against the labels of EA's ratings API, feet against the players'
// known preferred foot, and goalkeeper face stats against EA's values for the same card.

describe('parseFutggDefinitionsPage', () => {
  it('reads the pagination metadata of an intermediate page', () => {
    const parsed = parseFutggDefinitionsPage(page);
    expect(parsed.currentPage).toBe(3);
    expect(parsed.nextPage).toBe(4);
    expect(parsed.total).toBe(10000);
    expect(parsed.cards).toHaveLength(4);
  });

  it('reports no next page on the last page', () => {
    const parsed = parseFutggDefinitionsPage(lastPage);
    expect(parsed.currentPage).toBe(334);
    expect(parsed.nextPage).toBeNull();
    expect(parsed.cards.map((card) => card.name)).toEqual(['Maxence Rivera']);
  });

  it('normalises an icon card completely', () => {
    expect(cardAt(0)).toEqual({
      source: 'futgg',
      eaId: 237067,
      basePlayerEaId: 237067,
      name: 'Pelé',
      overall: 95,
      position: 'CAM',
      alternatePositions: ['ST'],
      rarity: { eaId: 12, name: 'Base Icon' },
      club: { eaId: 112658, name: 'ICON' },
      league: { eaId: 2118, name: 'Icons' },
      nation: { eaId: 54, name: 'Brazil' },
      faceStats: {
        pace: 93,
        shooting: 94,
        passing: 91,
        dribbling: 94,
        defending: 58,
        physicality: 74,
      },
      goalkeeperFaceStats: null,
      attributes: {
        acceleration: 93,
        sprintSpeed: 93,
        agility: 92,
        balance: 91,
        jumping: 86,
        stamina: 85,
        strength: 74,
        reactions: 96,
        aggression: 57,
        composure: 96,
        interceptions: 65,
        positioning: 95,
        vision: 95,
        ballControl: 95,
        crossing: 88,
        dribbling: 94,
        finishing: 96,
        freeKickAccuracy: 87,
        headingAccuracy: 92,
        longPassing: 86,
        shortPassing: 94,
        defensiveAwareness: 54,
        shotPower: 93,
        longShots: 92,
        standingTackle: 50,
        slidingTackle: 47,
        volleys: 94,
        curve: 87,
        penalties: 91,
        gkDiving: 13,
        gkHandling: 6,
        gkKicking: 11,
        gkReflexes: 7,
        gkPositioning: 8,
      },
      skillMoves: 5,
      weakFoot: 4,
      foot: 'right',
      heightCm: 173,
      weightKg: 70,
      accelerateType: 'explosive',
      playStyles: [2, 39, 5, 16, 20, 22],
      playStylesPlus: [0],
      rolesPlus: [31],
      rolesPlusPlus: [132, 143],
      chemistry: {
        fullChemistryInPosition: true,
        extraClubChemistry: 0,
        extraLeagueChemistry: 0,
        extraNationChemistry: 0,
        countsForEveryLeague: true,
        countsForEveryNation: false,
      },
      isUntradeable: false,
      imageUrl:
        'https://game-assets.fut.gg/cdn-cgi/image/quality=85,format=auto,width=300/2027/futgg-player-item-card/27-237067.711e4a56fc985316a12d1d181e37921e51c25f6f869d97ce7a4c12ebff10f234.webp',
    });
  });

  it('normalises a left-footed rare winger with no special chemistry', () => {
    const kubo = cardAt(1);
    expect(kubo.name).toBe('Takefusa Kubo');
    expect(kubo.position).toBe('RM');
    expect(kubo.alternatePositions).toEqual(['RW']);
    expect(kubo.foot).toBe('left');
    expect(kubo.rarity).toEqual({ eaId: 0, name: 'Rare' });
    expect(kubo.club).toEqual({ eaId: 457, name: 'Real Sociedad' });
    expect(kubo.league).toEqual({ eaId: 53, name: 'LALIGA EA SPORTS' });
    expect(kubo.nation).toEqual({ eaId: 163, name: 'Japan' });
    expect(kubo.playStylesPlus).toEqual([]);
    expect(kubo.rolesPlusPlus).toEqual([]);
    expect(kubo.chemistry).toEqual({
      fullChemistryInPosition: false,
      extraClubChemistry: 0,
      extraLeagueChemistry: 0,
      extraNationChemistry: 0,
      countsForEveryLeague: false,
      countsForEveryNation: false,
    });
  });

  it('keeps both outfield and goalkeeper face stats for a goalkeeper', () => {
    const courtois = cardAt(2);
    expect(courtois.position).toBe('GK');
    expect(courtois.alternatePositions).toEqual([]);
    expect(courtois.accelerateType).toBe('lengthy');
    expect(courtois.goalkeeperFaceStats).toEqual({
      diving: 87,
      handling: 89,
      kicking: 78,
      reflexes: 90,
      speed: 46,
      positioning: 90,
    });
    expect(courtois.faceStats).toEqual({
      pace: 48,
      shooting: 24,
      passing: 34,
      dribbling: 29,
      defending: 17,
      physicality: 53,
    });
  });

  it('distinguishes a promo card from its base player', () => {
    const donnarumma = cardAt(3);
    expect(donnarumma.eaId).toBe(50562269);
    expect(donnarumma.basePlayerEaId).toBe(230621);
    expect(donnarumma.rarity).toEqual({ eaId: 3, name: 'Team of the week' });
  });

  it('builds the name from first and last name when there is no common name', () => {
    const parsed = parseFutggDefinitionsPage(withItem(1, { commonName: null }));
    expect(parsed.cards[1]?.name).toBe('Takefusa Kubo');
    const icon = parseFutggDefinitionsPage(withItem(0, { commonName: '' }));
    expect(icon.cards[0]?.name).toBe('Edson Arantes Nascimento');
  });

  it.each([
    ['explosive', 'EXPLOSIVE'],
    ['mostly_explosive', 'MOSTLY_EXPLOSIVE'],
    ['controlled_explosive', 'CONTROLLED_EXPLOSIVE'],
    ['controlled', 'CONTROLLED'],
    ['controlled_lengthy', 'CONTROLLED_LENGTHY'],
    ['mostly_lengthy', 'MOSTLY_LENGTHY'],
    ['lengthy', 'LENGTHY'],
  ])('maps the AcceleRATE type %s', (expected, raw) => {
    const parsed = parseFutggDefinitionsPage(withItem(0, { accelerateType: raw }));
    expect(parsed.cards[0]?.accelerateType).toBe(expected);
  });

  it('maps every position the game uses', () => {
    const ids = [0, 3, 5, 7, 10, 12, 14, 16, 18, 23, 25, 27];
    const parsed = parseFutggDefinitionsPage(withItem(0, { alternativePositionIds: ids }));
    expect(parsed.cards[0]?.alternatePositions).toEqual([
      'GK',
      'RB',
      'CB',
      'LB',
      'CDM',
      'RM',
      'CM',
      'LM',
      'CAM',
      'RW',
      'ST',
      'LW',
    ]);
  });

  it('rejects a position the game no longer uses', () => {
    // 2 was RWB, removed from Ultimate Team since FC 25.
    expect(() => parseFutggDefinitionsPage(withItem(1, { position: 2 }))).toThrow(
      new SourceValidationError('futgg', 'unknown position id 2'),
    );
  });

  it('rejects an unknown AcceleRATE type', () => {
    expect(() => parseFutggDefinitionsPage(withItem(0, { accelerateType: 'TURBO' }))).toThrow(
      SourceValidationError,
    );
  });

  it('rejects an unknown foot value', () => {
    expect(() => parseFutggDefinitionsPage(withItem(0, { foot: 3 }))).toThrow(
      SourceValidationError,
    );
  });

  it('rejects an item with a missing attribute', () => {
    expect(() =>
      parseFutggDefinitionsPage(withItem(2, { attributeSprintSpeed: undefined })),
    ).toThrow(SourceValidationError);
  });

  it('rejects a response without a data array', () => {
    expect(() => parseFutggDefinitionsPage({ next: null, currentPage: 1, total: 0 })).toThrow(
      SourceValidationError,
    );
  });
});

describe('fetchFutggDefinitionsPage', () => {
  it('requests the given page and parses the response', async () => {
    const calls: string[] = [];
    const parsed = await fetchFutggDefinitionsPage(7, (url) => {
      calls.push(url);
      return Promise.resolve(Response.json(page));
    });
    expect(calls).toEqual(['https://www.fut.gg/api/fut/players/v2/27/definitions/?page=7']);
    expect(parsed.cards).toHaveLength(4);
  });

  it('fails with the HTTP status when the source refuses the request', async () => {
    const result = fetchFutggDefinitionsPage(1, () =>
      Promise.resolve(new Response('Forbidden', { status: 403 })),
    );
    await expect(result).rejects.toThrow(new SourceHttpError('futgg', 403, 'HTTP 403'));
  });
});
