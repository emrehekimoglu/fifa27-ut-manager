import { describe, expect, it } from 'vitest';

import { syntheticSample, TRUTH } from '../test/synthetic.js';
import { runCalibration } from './calibrate.js';
import { isHeldOut } from './metrics.js';

describe('runCalibration', () => {
  const sample = syntheticSample(30);
  // The first card has no meta ratings, and the second has those of another version of it,
  // far off and at a position it does not play (synthetic cards play one position; 63 is ST).
  const withMissing = {
    ...sample,
    metarank: {
      ...sample.metarank,
      [String(sample.cards[0]?.eaId)]: null,
      [String(sample.cards[1]?.eaId)]: [
        { role: sample.cards[1]?.position === 'ST' ? 3 : 63, chemistryStyle: 1, score: 1 },
      ],
    },
  };
  // Run inside each test, so mutation testing attributes the run to the tests.
  const calibrate = () => runCalibration(withMissing, { ridge: 0, plusMultipliers: [2, 2.5] });

  it('recovers the weights from the training cards', () => {
    const result = calibrate();
    expect(result.rules.groups).toEqual(TRUTH.groups);
    expect(result.rules.playStylePlusMultiplier).toBe(2.5);
  });

  it('rates the held-out cards within rounding of their references', () => {
    const result = calibrate();
    expect(result.heldOut).toHaveLength(9);
    for (const group of result.heldOut) {
      expect(group.passes).toBe(true);
      expect(group.meanAbsoluteError).toBeLessThanOrEqual(0.05);
    }
  });

  it('reports the sample split and the date', () => {
    const result = calibrate();
    const rated = sample.cards.length - 2;
    const heldOut = sample.cards.slice(2).filter((card) => isHeldOut(card.eaId)).length;
    expect(result.report).toContain('- **Date:** 2026-10-09');
    expect(result.report).toContain(
      `- **Sample:** ${rated} cards with meta ratings; ${rated - heldOut} for fitting, ${heldOut} held out`,
    );
    expect(result.report).toContain('- **Result:** every group passes');
  });
});
