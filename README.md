# crochet-chart

Turn any image into a **crochet / knitting colorwork chart** whose main
output is **row-by-row written instructions in working order**
(run-length encoded), plus a yarn summary and an SVG chart.
Zero dependencies, runs in Node and in the browser.

把任意图片转成**钩针 / 棒针配色编织图**，核心输出是按实际编织顺序逐行写出的
文字说明（游程编码），附每色针数汇总和 SVG 图解。零依赖，Node 和浏览器都能跑。

![license](https://img.shields.io/badge/license-MIT-green)

## Why

A grid picture alone is not a pattern. People who actually crochet or
knit colorwork work from written instructions:

- the work starts at the **bottom** of the piece, so row 1 is the
  bottom row of the image, not the top
- flat pieces are worked back and forth, so rows **alternate
  direction**: right-side rows are read right-to-left, wrong-side rows
  left-to-right, and the color runs must be listed in that working
  order
- you need to know **how many stitches of each color** a row takes,
  and how much yarn each color needs overall

crochet-chart generates exactly that, as a small library you can
build on.

## Install

```bash
npm install crochet-chart
```

Or clone this repo and import `src/index.js` directly — there are no
dependencies to install.

## Usage

```js
import { imageDataToChart, rowInstructions, instructionsToText, chartToSVG } from 'crochet-chart';
import { yarn20 } from 'crochet-chart/palettes/yarn-20';

// pixels: raw RGBA bytes, e.g. Canvas ImageData.data in the browser,
// or decoded image data in Node (bring your own decoder).
const chart = imageDataToChart(pixels, width, height, {
  gridWidth: 40,   // chart width in stitches
  palette: yarn20, // [{ code, name, rgb: [r, g, b] }]
  maxColors: 8,    // cap distinct colors (optional)
});

console.log(chart.totalStitches); // total stitches
console.log(chart.stats);         // [{ code, name, rgb, count }] sorted desc

// Written instructions, ready to work from:
console.log(instructionsToText(chart));
```

Output:

```
Row 1 (RS, right-to-left): 1x Cream, 1x Cocoa, 2x Cream
Row 2 (WS, left-to-right): 2x Cocoa, 2x Cream

Yarn summary (total stitches per color):
Cream: 5 stitches
Cocoa: 3 stitches
Total: 8 stitches
```

Row 1 is the bottom row of the image. Odd (right-side) rows list their
runs right-to-left, even (wrong-side) rows left-to-right, matching the
direction each row is actually worked.

## Demo

Open `examples/demo.html` through any static server, e.g.:

```bash
npx serve .
# then visit http://localhost:3000/examples/demo.html
```

Pick an image, set the stitch width and max colors, and you get the
chart plus the full written instructions. Note: the demo uses ES
modules, so it must be served over http — opening the file directly
with file:// will not work.

## Bring your own palette

A palette is just an array of `{ code, name, rgb }`. To work with the
colors of a real yarn line, convert its shade card to that shape and
pass it in — the mapping, instructions and exports all work
unchanged. Community-contributed palettes are welcome, see
CONTRIBUTING.md. `palettes/yarn-20.js` ships a generic 20-color yarn
set with representative RGB values.

## API

- `imageDataToChart(pixels, width, height, options)` — main entry.
  Options: `gridWidth`, `palette` (required), `maxColors`,
  `alphaThreshold`. Returns `{ grid, gridWidth, gridHeight, stats,
  totalStitches }`. `grid[0]` is the top row of the image.
- `rowInstructions(chart, { startAtBottom })` — array of
  `{ row, side, direction, runs }` in working order. `runs` is a
  run-length list of `{ color, count }`, already reversed on
  right-to-left rows.
- `instructionsToText(chart, options)` — the instructions as plain
  text, with a per-color yarn summary.
- `chartToSVG(chart, { cellSize, showCodes })` — SVG chart string,
  drawn as the finished piece looks (row 1 at the bottom).
- `nearestColor(r, g, b, palette)` — closest palette entry (redmean
  weighted RGB distance).
- `countColors(grid)` — `{ stats, total }`.

## Roadmap

- [ ] Technique notes: tapestry crochet (carry the unused yarn) vs
  fair-isle / stranded knitting (float management) guidance per chart
- [ ] Gauge calculator: stitches and rows per 10 cm in, finished
  dimensions out, so charts can be sized to a target size
- [ ] C2C (corner-to-corner) mode: diagonal box-stitch instructions
- [ ] Real yarn-line palette packs
- [ ] Printable PDF chart with row numbers on both edges

## 中文说明

钩针和棒针的配色编织（提花）不能只给一张格子图：织的人是从作品
底部往上织的，第一行是图片的最下面一行；平织还要左右交替方向，
正面行从右往左读、反面行从左往右读，每段颜色的长度必须按实际
编织顺序排列。本库把图片转成配色网格后，直接生成这种逐行文字
说明（例如「Row 1 (RS, right-to-left): 1x Cream, 1x Cocoa,
2x Cream」），并统计每种线一共需要多少针，方便备线。

## Related

crochet-chart is the open-source companion of
[格作 Gezuo](https://beads.coooolfire.tech), a free web tool that turns
images into patterns for fuse beads, bricks, crochet and cross-stitch
with production previews and material lists.

## License

MIT
