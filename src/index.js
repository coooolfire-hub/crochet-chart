// crochet-chart core: turn raster images into crochet / knitting colorwork
// charts whose main output is row-by-row written instructions in working
// order (run-length encoded), plus a visual chart.
// Zero dependencies. Works in Node and in the browser.
//
// Input pixels are raw RGBA bytes (e.g. Canvas ImageData.data), so this
// library stays decoupled from any image loader.
//
// Grid convention: grid[0] is the TOP row of the image, matching how the
// finished piece looks. Written instructions are generated bottom-up by
// default, because that is the order the work is actually made in.

/** Weighted RGB distance (redmean approximation of perceptual distance). */
export function colorDistance(r1, g1, b1, r2, g2, b2) {
  const rm = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
}

/** Find the palette entry closest to an RGB color. */
export function nearestColor(r, g, b, palette) {
  let best = null;
  let bestDist = Infinity;
  for (const c of palette) {
    const d = colorDistance(r, g, b, c.rgb[0], c.rgb[1], c.rgb[2]);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

/** Count stitches per color code. Returns entries sorted by count, desc. */
export function countColors(grid) {
  const map = new Map();
  let total = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (!cell) continue;
      total++;
      if (!map.has(cell.code)) {
        map.set(cell.code, { code: cell.code, name: cell.name, rgb: cell.rgb, count: 0 });
      }
      map.get(cell.code).count++;
    }
  }
  return { stats: [...map.values()].sort((a, b) => b.count - a.count), total };
}

/**
 * Convert raw RGBA pixels to a colorwork chart grid.
 *
 * @param {Uint8ClampedArray|Uint8Array} pixels RGBA bytes, row-major.
 * @param {number} width  source image width in pixels
 * @param {number} height source image height in pixels
 * @param {object} options
 * @param {number} options.gridWidth  chart width in stitches (default 48)
 * @param {Array}  options.palette    [{code, name, rgb:[r,g,b]}] (required)
 * @param {number} [options.maxColors] cap distinct colors; least-used
 *                   colors are remapped to their nearest surviving color
 * @param {number} [options.alphaThreshold] pixels with alpha below this
 *                   count as empty (default 128)
 * @returns {{grid: Array, gridWidth: number, gridHeight: number,
 *            stats: Array, totalStitches: number}}
 */
export function imageDataToChart(pixels, width, height, options) {
  const opts = options || {};
  const palette = opts.palette;
  if (!palette || palette.length === 0) throw new Error('options.palette is required');
  const gridWidth = opts.gridWidth || 48;
  const alphaThreshold = opts.alphaThreshold === undefined ? 128 : opts.alphaThreshold;
  const gridHeight = Math.max(1, Math.round((gridWidth * height) / width));

  const grid = [];
  for (let gy = 0; gy < gridHeight; gy++) {
    const row = [];
    const y0 = Math.floor((gy * height) / gridHeight);
    const y1 = Math.max(y0 + 1, Math.floor(((gy + 1) * height) / gridHeight));
    for (let gx = 0; gx < gridWidth; gx++) {
      const x0 = Math.floor((gx * width) / gridWidth);
      const x1 = Math.max(x0 + 1, Math.floor(((gx + 1) * width) / gridWidth));
      let r = 0, g = 0, b = 0, n = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * width + x) * 4;
          if (pixels[i + 3] < alphaThreshold) continue;
          r += pixels[i];
          g += pixels[i + 1];
          b += pixels[i + 2];
          n++;
        }
      }
      row.push(n === 0 ? null : nearestColor(r / n, g / n, b / n, palette));
    }
    grid.push(row);
  }

  if (opts.maxColors && opts.maxColors > 0) {
    const { stats } = countColors(grid);
    if (stats.length > opts.maxColors) {
      const keep = new Set(stats.slice(0, opts.maxColors).map((s) => s.code));
      const keepPalette = palette.filter((c) => keep.has(c.code));
      for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
          const cell = grid[y][x];
          if (cell && !keep.has(cell.code)) {
            grid[y][x] = nearestColor(cell.rgb[0], cell.rgb[1], cell.rgb[2], keepPalette);
          }
        }
      }
    }
  }

  const { stats, total } = countColors(grid);
  return { grid, gridWidth, gridHeight, stats, totalStitches: total };
}

/**
 * Build row-by-row working instructions for a chart.
 *
 * Crochet and knitting worked flat start at the bottom of the piece, so
 * by default row 1 is the BOTTOM row of the image (chart.grid's last
 * row). Set options.startAtBottom to false to number rows from the top.
 *
 * Flat colorwork charts are read in the direction the row is worked:
 * odd rows (1-based, right-side rows) are worked right-to-left, even
 * rows (wrong-side rows) left-to-right. Run order is reversed on
 * right-to-left rows so the runs list is already in working order.
 *
 * @param {object} chart a chart returned by imageDataToChart
 * @param {object} [options]
 * @param {boolean} [options.startAtBottom] default true
 * @returns {Array<{row: number, side: string, direction: string,
 *            runs: Array<{color: object, count: number}>}>}
 */
export function rowInstructions(chart, options) {
  const opts = options || {};
  const startAtBottom = opts.startAtBottom !== false;
  const H = chart.gridHeight;
  const out = [];
  for (let i = 0; i < H; i++) {
    const rowNum = i + 1;
    const gridRow = startAtBottom ? chart.grid[H - 1 - i] : chart.grid[i];
    const rtl = rowNum % 2 === 1;
    const cells = rtl ? gridRow.slice().reverse() : gridRow.slice();
    const runs = [];
    let open = null;
    for (const cell of cells) {
      if (!cell) {
        open = null;
        continue;
      }
      if (open && open.color.code === cell.code) {
        open.count++;
      } else {
        open = { color: cell, count: 1 };
        runs.push(open);
      }
    }
    out.push({
      row: rowNum,
      side: rtl ? 'RS' : 'WS',
      direction: rtl ? 'right-to-left' : 'left-to-right',
      runs,
    });
  }
  return out;
}

/**
 * Render written instructions as plain text: one line per row in working
 * order, followed by a yarn summary of total stitches per color.
 *
 * Example line: Row 1 (RS, right-to-left): 4x Cream, 2x Cocoa, 6x Cream
 *
 * @param {object} chart a chart returned by imageDataToChart
 * @param {object} [options] forwarded to rowInstructions
 * @returns {string}
 */
export function instructionsToText(chart, options) {
  const rows = rowInstructions(chart, options);
  const lines = rows.map((r) => {
    const runsText = r.runs.map((run) => run.count + 'x ' + run.color.name).join(', ');
    return 'Row ' + r.row + ' (' + r.side + ', ' + r.direction + '): ' + runsText;
  });
  lines.push('');
  lines.push('Yarn summary (total stitches per color):');
  for (const s of chart.stats) {
    lines.push(s.name + ': ' + s.count + ' stitches');
  }
  lines.push('Total: ' + chart.totalStitches + ' stitches');
  return lines.join('\n');
}

/**
 * Render the chart as an SVG string: one rect per stitch with its color
 * code. The SVG is drawn as the finished piece looks (image top at the
 * top); written instructions are worked from the bottom row up.
 */
export function chartToSVG(chart, svgOptions) {
  const o = svgOptions || {};
  const cell = o.cellSize || 24;
  const showCodes = o.showCodes !== false;
  const w = chart.gridWidth * cell;
  const h = chart.gridHeight * cell;
  const parts = [];
  parts.push('<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">');
  for (let y = 0; y < chart.gridHeight; y++) {
    for (let x = 0; x < chart.gridWidth; x++) {
      const c = chart.grid[y][x];
      if (!c) continue;
      const fill = 'rgb(' + c.rgb[0] + ',' + c.rgb[1] + ',' + c.rgb[2] + ')';
      parts.push('<rect x="' + x * cell + '" y="' + y * cell + '" width="' + cell + '" height="' + cell + '" fill="' + fill + '" stroke="rgba(0,0,0,0.25)"/>');
      if (showCodes) {
        const lum = 0.299 * c.rgb[0] + 0.587 * c.rgb[1] + 0.114 * c.rgb[2];
        const tc = lum > 150 ? '#222' : '#fff';
        const cx = x * cell + cell / 2;
        const cy = y * cell + cell / 2;
        parts.push('<text x="' + cx + '" y="' + (cy + cell * 0.12) + '" font-size="' + (cell * 0.3) + '" text-anchor="middle" fill="' + tc + '" font-family="monospace">' + c.code + '</text>');
      }
    }
  }
  parts.push('</svg>');
  return parts.join('');
}
