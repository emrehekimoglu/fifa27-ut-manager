import { fitRules, FIT_OPTIONS } from './fit.js';
import type { FitOptions } from './fit.js';
import { isHeldOut } from './metrics.js';
import { accuracy, calibrationReport, largestDisagreements } from './report.js';
import type { GroupAccuracy } from './report.js';
import { calibrationRows, scoresMatchCard } from './rows.js';
import type { Sample } from './sample-file.js';
import type { TrueRatingRules } from '@fc27/domain';

/** Rows of the largest disagreements listed in the report. */
const DISAGREEMENTS = 10;

export interface CalibrationResult {
  readonly rules: TrueRatingRules;
  readonly heldOut: readonly GroupAccuracy[];
  readonly report: string;
}

/** Fits the rules on the sample's training cards and reports them on the held-out cards. */
export function runCalibration(
  sample: Sample,
  options: FitOptions = FIT_OPTIONS,
): CalibrationResult {
  const rated = sample.cards.flatMap((card) => {
    const scores = sample.metarank[String(card.eaId)];
    return scores && scoresMatchCard(card, scores)
      ? [{ card, rows: calibrationRows(card, scores) }]
      : [];
  });
  const training = rated.filter(({ card }) => !isHeldOut(card.eaId));
  const heldOutCards = rated.filter(({ card }) => isHeldOut(card.eaId));
  const heldOutRows = heldOutCards.flatMap(({ rows }) => rows);

  const rules = fitRules(
    training.flatMap(({ rows }) => rows),
    options,
  );
  const heldOut = accuracy(heldOutRows, rules);
  return {
    rules,
    heldOut,
    report: calibrationReport({
      date: sample.takenAt.slice(0, 10),
      sampledCards: rated.length,
      trainingCards: training.length,
      heldOutCards: heldOutCards.length,
      rules,
      heldOut,
      disagreements: largestDisagreements(heldOutRows, rules, DISAGREEMENTS),
    }),
  };
}
