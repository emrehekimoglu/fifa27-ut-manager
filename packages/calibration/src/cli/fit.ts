/**
 * Step 2 of the true-rating calibration workflow: fits the weights on <dir>/sample.json and
 * writes <dir>/weights.json and <dir>/true-rating-calibration.md.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { runCalibration } from '../calibrate.js';
import { parseSample } from '../sample-file.js';

const dir = process.argv[2] ?? 'calibration';
const sample = parseSample(JSON.parse(readFileSync(join(dir, 'sample.json'), 'utf8')));
const result = runCalibration(sample);
writeFileSync(join(dir, 'weights.json'), `${JSON.stringify(result.rules.groups, null, 2)}\n`);
writeFileSync(join(dir, 'true-rating-calibration.md'), result.report);
console.log(result.report);
