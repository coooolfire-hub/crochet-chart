import { test } from 'node:test';
import assert from 'node:assert/strict';
import { imageDataToChart, rowInstructions, instructionsToText } from '../src/index.js';
import { yarn20 } from '../palettes/yarn-20.js';

const CREAM = yarn20.find((c) => c.name === 'Cream');
const COCOA = yarn20.find((c) => c.name === 'Cocoa');

// 4x2 test image, one pixel per chart cell.
//   top row    (image order): Cocoa Cocoa Cream Cream
//   bottom row (image order): Cream Cream Cocoa Cream
// With gridWidth 4 each cell pools exactly one pixel, so the mapping
// is exact (pixel values are the palette RGB values themselves).
function makeChart() {
  const rows = [
    [COCOA, COCOA, CREAM, CREAM],
    [CREAM, CREAM, COCOA, CREAM],
  ];
  const w = 4;
  const h = 2;
  const px = new Uint8ClampedArray(w * h * 4);
  rows.forEach((row, y) => {
    row.forEach((c, x) => {
      const i = (y * w + x) * 4;
      px[i] = c.rgb[0];
      px[i + 1] = c.rgb[1];
      px[i + 2] = c.rgb[2];
      px[i + 3] = 255;
    });
  });
  return imageDataToChart(px, w, h, { gridWidth: 4, palette: yarn20 });
}

function runShape(runs) {
  return runs.map((r) => [r.color.code, r.count]);
}

test('rowInstructions runs match expected counts', () => {
  const chart = makeChart();
  const rows = rowInstructions(chart);
  assert.equal(rows.length, 2);
  // Row 1 is the bottom image row, worked right-to-left:
  // image order Cream Cream Cocoa Cream becomes, in working order,
  // Cream(1) Cocoa(1) Cream(2).
  assert.equal(rows[0].row, 1);
  assert.deepEqual(runShape(rows[0].runs), [
    [CREAM.code, 1],
    [COCOA.code, 1],
    [CREAM.code, 2],
  ]);
  // Row 2 is the top image row, worked left-to-right.
  assert.equal(rows[1].row, 2);
  assert.deepEqual(runShape(rows[1].runs), [
    [COCOA.code, 2],
    [CREAM.code, 2],
  ]);
});

test('direction alternates and right-to-left rows reverse the run order', () => {
  const chart = makeChart();
  const rows = rowInstructions(chart);
  assert.equal(rows[0].direction, 'right-to-left');
  assert.equal(rows[1].direction, 'left-to-right');
  // The bottom row read in plain image order is A A B A (runs 2, 1, 1).
  // Read right-to-left (working order) the runs must come back reversed:
  // A(1) B(1) A(2) — same color at both ends, different counts, so a
  // missing reversal cannot pass silently.
  const runs = rows[0].runs;
  assert.equal(runs.length, 3);
  assert.equal(runs[0].color.code, CREAM.code);
  assert.equal(runs[0].count, 1);
  assert.equal(runs[1].color.code, COCOA.code);
  assert.equal(runs[1].count, 1);
  assert.equal(runs[2].color.code, CREAM.code);
  assert.equal(runs[2].count, 2);
  // Total stitches per row is preserved by the reversal.
  for (const r of rows) {
    assert.equal(r.runs.reduce((a, run) => a + run.count, 0), 4);
  }
});

test('instructionsToText Row 1 corresponds to the bottom image row', () => {
  const chart = makeChart();
  const lines = instructionsToText(chart).split('\n');
  assert.equal(lines[0], 'Row 1 (RS, right-to-left): 1x Cream, 1x Cocoa, 2x Cream');
  assert.equal(lines[1], 'Row 2 (WS, left-to-right): 2x Cocoa, 2x Cream');
  assert.ok(lines.includes('Cream: 5 stitches'));
  assert.ok(lines.includes('Cocoa: 3 stitches'));
  assert.ok(lines.includes('Total: 8 stitches'));
});

test('stats totals equal grid cells', () => {
  const chart = makeChart();
  assert.equal(chart.gridWidth, 4);
  assert.equal(chart.gridHeight, 2);
  assert.equal(chart.totalStitches, chart.gridWidth * chart.gridHeight);
  assert.equal(chart.totalStitches, 8);
  assert.equal(chart.stats.reduce((a, s) => a + s.count, 0), 8);
  assert.equal(chart.stats.length, 2);
});

test('startAtBottom false numbers rows from the top', () => {
  const chart = makeChart();
  const rows = rowInstructions(chart, { startAtBottom: false });
  // Row 1 is now the top image row, still read right-to-left:
  // image order Cocoa Cocoa Cream Cream -> working order Cream(2) Cocoa(2).
  assert.deepEqual(runShape(rows[0].runs), [
    [CREAM.code, 2],
    [COCOA.code, 2],
  ]);
});
