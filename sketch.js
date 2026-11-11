// 3-4 Data Sketch — "Where did my week go?"
// A riso-print style data sketch: three soft inks, slightly off-register, with grain.
//
// One column per day:
//   SUN      size = steps walked         face = mood (1 frown → 5 grin)
//   CAPSULE  = 24 hours, filled from the bottom:
//            blue = sleep · yellow = studying · pink = phone · blank = everything else
//
// Data is loaded from data.json with await loadJSON() inside async setup().

let data;
let days = [];
let grain;

// ---------- inks ----------
const PAPER = '#f5f0e8';
const TEXT = '#2f4a8a';    // deep blue for type, 7.5:1 on paper
const BLUE = '#3a5597';    // sleep + line work
const PINK = '#e9739f';    // phone
const YELLOW = '#efb240';  // studying
const SUN_TINT = 'rgba(233, 115, 159, 0.5)'; // half-tone pink over yellow prints coral
// each ink drum lands slightly off — the riso look (kept small so it stays readable)
const OFFSET = { blue: [0, 0], pink: [2, 1.5], yellow: [-1.5, 2] };

const DISPLAY = 'Bricolage Grotesque';
const MONO = 'Space Mono';

// ---------- layout ----------
const W = 1100;
const H = 1590;
const M = 60;
const COL_LEFT = 130;
const COL_W = (W - M - COL_LEFT) / 7;
const HORIZON = 655;
const PILL_TOP = 680;
const HOUR_PX = 15;
const PILL_BOTTOM = PILL_TOP + 24 * HOUR_PX;
const PILL_W = 78;
const STEPS_REF = 17000;
const SUN_MAX_R = 58;

// legend: three columns with the same anatomy (header → graphic on a baseline → labels → caption)
const LEG_TOP = 1150;
const LEG_COLS = [M, M + 330, M + 660];
const LEG_HEAD = 1262;
const LEG_BASE = 1425;
const LEG_LABEL = 1449;
const LEG_CAPTION = 1500;

async function setup() {
  const cnv = createCanvas(W, H);
  cnv.parent('sketch-holder');
  pixelDensity(2);
  data = await loadJSON('data.json');

  days = data.days.map((d, i) => ({
    ...d,
    x: COL_LEFT + COL_W * (i + 0.5),
    r: stepsToRadius(d.steps),
  }));
  grain = makeGrain();
  buildDataTable();
}

function draw() {
  if (!data) return;
  blendMode(BLEND);
  background(PAPER);

  const hovered = days.find((d) => abs(mouseX - d.x) < COL_W / 2 && mouseY > 500 && mouseY < 1110);

  // 1. ink shapes — MULTIPLY so overlapping inks mix like real ink
  blendMode(MULTIPLY);
  inkLayer('yellow', drawYellow);
  inkLayer('pink', drawPink);
  inkLayer('blue', () => drawBlueShapes(hovered));

  // 2. grain textures the shapes only
  blendMode(BLEND);
  drawingContext.imageSmoothingEnabled = false;
  drawingContext.drawImage(grain, 0, 0, W, H);
  drawingContext.imageSmoothingEnabled = true;

  // 3. type goes on last so it stays crisp and readable
  blendMode(MULTIPLY);
  drawText();
  blendMode(BLEND);

  if (hovered) drawTooltip(hovered);
  cursor(hovered ? HAND : ARROW);
}

function inkLayer(name, fn) {
  push();
  translate(OFFSET[name][0], OFFSET[name][1]);
  fn();
  pop();
}

// =====================================================================
// MAPPINGS
// =====================================================================
function stepsToRadius(steps) {
  return sqrt(steps / STEPS_REF) * SUN_MAX_R; // sun AREA grows with steps
}

// capsule segments, bottom → top
function segments(d, bottom, pxPerHour) {
  let y = bottom;
  return [
    ['sleep', d.sleep, BLUE],
    ['study', d.study, YELLOW],
    ['screen', d.screen, PINK],
  ].map(([key, hrs, col]) => {
    const h = hrs * pxPerHour;
    y -= h;
    return { key, col, y, h };
  });
}

// =====================================================================
// YELLOW + PINK INK
// =====================================================================
function drawYellow() {
  noStroke();
  fill(YELLOW);
  for (const d of days) {
    circle(d.x, HORIZON - d.r, d.r * 2);
    capsuleFill(d.x, PILL_TOP, PILL_BOTTOM, PILL_W, segments(d, PILL_BOTTOM, HOUR_PX), YELLOW);
  }
  for (const s of data.stickers) if (s.ink === 'yellow') stickerShape(s);

  fill(YELLOW);
  legendSuns(true);
  legendCapsuleFill(YELLOW);
}

function drawPink() {
  noStroke();
  fill(PINK);
  headline(4, 4); // pink shadow under the blue headline
  legendTitle(3, 3);

  for (const d of days) {
    fill(SUN_TINT);
    circle(d.x, HORIZON - d.r, d.r * 2);
    capsuleFill(d.x, PILL_TOP, PILL_BOTTOM, PILL_W, segments(d, PILL_BOTTOM, HOUR_PX), PINK);
  }
  fill(PINK);
  for (const s of data.stickers) if (s.ink === 'pink') stickerShape(s);

  fill(SUN_TINT);
  legendSuns(true);
  legendCapsuleFill(PINK);
}

// =====================================================================
// BLUE INK — sleep, outlines, faces, headline, rules
// =====================================================================
function drawBlueShapes(hovered) {
  stroke(BLUE);
  strokeWeight(2);
  line(M, 84, W - M, 84);

  noStroke();
  fill(BLUE);
  headline(0, 0);
  legendTitle(0, 0);

  // hour axis + horizon
  stroke(BLUE);
  strokeWeight(1.5);
  line(COL_LEFT - 18, PILL_TOP, COL_LEFT - 18, PILL_BOTTOM);
  for (let h = 0; h <= 24; h += 6) {
    const y = PILL_BOTTOM - h * HOUR_PX;
    line(COL_LEFT - 24, y, COL_LEFT - 18, y);
  }
  line(COL_LEFT - 18, HORIZON, W - M, HORIZON);

  for (const d of days) {
    capsuleFill(d.x, PILL_TOP, PILL_BOTTOM, PILL_W, segments(d, PILL_BOTTOM, HOUR_PX), BLUE);
    capsuleOutline(d.x, PILL_TOP, PILL_BOTTOM, PILL_W);
    face(d.x, HORIZON - d.r, d.r, d.mood);
  }

  if (hovered) {
    noFill();
    stroke(BLUE);
    strokeWeight(1.5);
    drawingContext.setLineDash([4, 5]);
    rect(hovered.x - COL_W / 2 + 4, 500, COL_W - 8, 615, 14);
    drawingContext.setLineDash([]);
  }

  // legend shapes
  stroke(BLUE);
  strokeWeight(2);
  line(M, LEG_TOP, W - M, LEG_TOP);
  strokeWeight(1.5);
  line(LEG_COLS[0], LEG_BASE, LEG_COLS[0] + 290, LEG_BASE);
  line(LEG_COLS[1], LEG_BASE, LEG_COLS[1] + 290, LEG_BASE);
  line(LEG_COLS[2], LEG_BASE, LEG_COLS[2] + 290, LEG_BASE);
  for (let i = 0; i < 5; i++) face(legendFaceX(i), LEG_BASE - 24, 24, i + 1);
  legendCapsuleFill(BLUE);
  const ex = legendCapsule();
  capsuleOutline(ex.x, ex.top, ex.bottom, ex.w);
  for (const k of legendCapsuleKeys()) {
    stroke(BLUE);
    strokeWeight(1.2);
    line(ex.x + ex.w / 2 + 4, k.y, ex.x + ex.w / 2 + 18, k.y);
  }
}

function headline(dx, dy) {
  textFont(DISPLAY);
  textStyle(BOLD);
  textSize(150);
  textAlign(LEFT, BASELINE);
  drawingContext.letterSpacing = '-4px';
  const widest = max(textWidth(data.title[0]), textWidth(data.title[1]));
  if (widest > W - 2 * M) textSize((150 * (W - 2 * M)) / widest);
  text(data.title[0], M - 6 + dx, 222 + dy);
  text(data.title[1], M - 6 + dx, 352 + dy);
  drawingContext.letterSpacing = '0px';
}

function legendTitle(dx, dy) {
  textFont(DISPLAY);
  textStyle(BOLD);
  textSize(46);
  textAlign(LEFT, BASELINE);
  text('HOW TO READ IT', M + dx, 1214 + dy);
}

// =====================================================================
// TYPE — printed last, no grain
// =====================================================================
function drawText() {
  noStroke();
  fill(TEXT);

  // header
  mono(13, true);
  textAlign(LEFT, BASELINE);
  text(data.kicker, M, 70);
  textAlign(RIGHT, BASELINE);
  text(data.dateRange, W - M, 70);

  mono(15, false);
  textAlign(LEFT, BASELINE);
  text(data.dek[0], M, 412);
  text(data.dek[1], M, 437);

  // hour labels
  mono(12, false);
  textAlign(RIGHT, CENTER);
  for (let h = 0; h <= 24; h += 6) text(h + 'h', COL_LEFT - 30, PILL_BOTTOM - h * HOUR_PX);

  // day labels
  for (const d of days) {
    textAlign(CENTER, BASELINE);
    textFont(DISPLAY);
    textStyle(BOLD);
    textSize(26);
    text(d.day.toUpperCase(), d.x, PILL_BOTTOM + 42);
    mono(13, false);
    text(d.date.toLowerCase(), d.x, PILL_BOTTOM + 63);
  }

  for (const s of data.stickers) stickerText(s);

  drawLegendText();

  mono(12, false);
  textAlign(LEFT, BASELINE);
  text('printed in three inks: blue, pink, sunflower.', M, H - 32);
  textAlign(RIGHT, BASELINE);
  text('hover a day for the numbers', W - M, H - 32);
}

function mono(size, bold) {
  textFont(MONO);
  textStyle(bold ? BOLD : NORMAL);
  textSize(size);
}

// =====================================================================
// SHAPES
// =====================================================================
function capsuleFill(x, top, bottom, w, segs, col) {
  drawingContext.save();
  drawingContext.beginPath();
  drawingContext.roundRect(x - w / 2, top, w, bottom - top, w * 0.28);
  drawingContext.clip();
  noStroke();
  fill(col);
  for (const s of segs) {
    if (s.col !== col || s.h <= 0) continue;
    rect(x - w / 2, s.y + 1.5, w, s.h - 3); // small paper gap between segments
  }
  drawingContext.restore();
}

function capsuleOutline(x, top, bottom, w) {
  noFill();
  stroke(BLUE);
  strokeWeight(2.5);
  rect(x - w / 2, top, w, bottom - top, w * 0.28);
}

// mood face: 1 = frown, 3 = flat, 5 = grin
function face(x, y, r, mood) {
  const s = max(r, 14);
  noStroke();
  fill(BLUE);
  const eye = max(3.5, s * 0.13);
  circle(x - s * 0.3, y - s * 0.16, eye);
  circle(x + s * 0.3, y - s * 0.16, eye);

  const curve = ((mood - 3) / 2) * s * 0.22;
  const mw = s * 0.36;
  const my = y + s * 0.22;
  noFill();
  stroke(BLUE);
  strokeWeight(max(2, s * 0.075));
  strokeCap(ROUND);
  beginShape();
  for (let i = 0; i <= 12; i++) {
    const t = (i / 12) * 2 - 1;
    vertex(x + t * mw, my + curve * (1 - t * t) - curve * 0.35);
  }
  endShape();
}

// =====================================================================
// STICKERS
// =====================================================================
function stickerPos(s) {
  const d = days.find((dd) => dd.day === s.day);
  const top = HORIZON - d.r * 2;
  if (s.place === 'top') return { x: d.x + 14, y: top - 54, rot: 0.1 };
  const side = s.place === 'left' ? -1 : 1;
  return { x: d.x + side * (d.r * 0.55 + 22), y: top - 40, rot: side * 0.14 };
}

function stickerShape(s) {
  const p = stickerPos(s);
  push();
  translate(p.x, p.y);
  rotate(p.rot);
  beginShape();
  const n = 16;
  for (let i = 0; i < n * 2; i++) {
    const rr = i % 2 ? 40 : 48;
    const a = (PI / n) * i;
    vertex(cos(a) * rr * 1.18, sin(a) * rr);
  }
  endShape(CLOSE);
  pop();
}

function stickerText(s) {
  const p = stickerPos(s);
  push();
  translate(p.x, p.y);
  rotate(p.rot);
  noStroke();
  fill(TEXT);
  textFont(DISPLAY);
  textStyle(BOLD);
  textSize(15);
  textAlign(CENTER, CENTER);
  text(s.text[0], 0, -8);
  text(s.text[1], 0, 10);
  pop();
}

// =====================================================================
// LEGEND — 1 sun size · 2 face · 3 capsule
// =====================================================================
const LEG_SUNS = [
  [30, 4000, '4k'],
  [112, 10000, '10k'],
  [228, 17000, '17k'],
];

function legendSuns() {
  for (const [dx, steps] of LEG_SUNS) {
    const r = stepsToRadius(steps);
    circle(LEG_COLS[0] + dx, LEG_BASE - r, r * 2);
  }
  // face column: same-size suns, so only the face changes
  for (let i = 0; i < 5; i++) circle(legendFaceX(i), LEG_BASE - 24, 48);
}

function legendFaceX(i) {
  return LEG_COLS[1] + 26 + i * 60;
}

function legendCapsule() {
  const ex = { x: LEG_COLS[2] + 30, top: 1290, bottom: LEG_BASE, w: 48 };
  ex.segs = segments({ sleep: 7, study: 4, screen: 5 }, ex.bottom, (ex.bottom - ex.top) / 24);
  return ex;
}

function legendCapsuleFill(col) {
  const ex = legendCapsule();
  capsuleFill(ex.x, ex.top, ex.bottom, ex.w, ex.segs, col);
}

function legendCapsuleKeys() {
  const ex = legendCapsule();
  const name = { sleep: 'sleep', study: 'studying', screen: 'on my phone' };
  const keys = ex.segs.map((s) => ({ y: s.y + s.h / 2, label: name[s.key] }));
  keys.push({ y: ex.top + (ex.segs[2].y - ex.top) / 2, label: 'everything else' });
  return keys;
}

function drawLegendText() {
  const heads = ['SUN SIZE = STEPS', 'FACE = MOOD', 'CAPSULE = 24 HOURS'];
  const captions = [
    'steps walked: bigger sun = more steps',
    'from a rough day to a great day',
    'fills from the bottom up',
  ];

  heads.forEach((h, i) => {
    const x = LEG_COLS[i];
    // numbered badge
    noStroke();
    fill(TEXT);
    circle(x + 11, LEG_HEAD - 5, 22);
    blendMode(BLEND); // paper-colored type would vanish under MULTIPLY
    fill(PAPER);
    mono(12, true);
    textAlign(CENTER, CENTER);
    text(i + 1, x + 11, LEG_HEAD - 6);
    blendMode(MULTIPLY);
    // heading + caption
    fill(TEXT);
    mono(13, true);
    textAlign(LEFT, BASELINE);
    text(h, x + 32, LEG_HEAD);
    mono(12.5, false);
    text(captions[i], x, LEG_CAPTION);
  });

  // 1 — step labels under each sun
  mono(12, true);
  textAlign(CENTER, BASELINE);
  for (const [dx, , label] of LEG_SUNS) text(label, LEG_COLS[0] + dx, LEG_LABEL);

  // 2 — mood numbers + words
  const words = ['rough', 'low', 'meh', 'good', 'great'];
  for (let i = 0; i < 5; i++) {
    mono(12, true);
    text(i + 1, legendFaceX(i), LEG_LABEL);
    mono(11.5, false);
    text(words[i], legendFaceX(i), LEG_LABEL + 17);
  }

  // 3 — capsule key
  mono(12.5, false);
  textAlign(LEFT, CENTER);
  const ex = legendCapsule();
  for (const k of legendCapsuleKeys()) text(k.label, ex.x + ex.w / 2 + 24, k.y);
}

// =====================================================================
// GRAIN — paper specks knocked out of the ink, made once
// =====================================================================
function makeGrain() {
  // half resolution, drawn at full size without smoothing → chunky 2px specks
  const c = document.createElement('canvas');
  c.width = W / 2;
  c.height = H / 2;
  const g = c.getContext('2d');
  const img = g.createImageData(c.width, c.height);
  randomSeed(11);
  for (let i = 0; i < img.data.length; i += 4) {
    const r = random();
    if (r < 0.045) {
      img.data[i] = 245; img.data[i + 1] = 240; img.data[i + 2] = 232;
      img.data[i + 3] = 50 + random() * 90;
    } else if (r < 0.049) {
      img.data[i] = 60; img.data[i + 1] = 70; img.data[i + 2] = 110;
      img.data[i + 3] = 28;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

// =====================================================================
// TOOLTIP
// =====================================================================
function drawTooltip(d) {
  const rows = [
    ['steps', d.steps.toLocaleString()],
    ['sleep', d.sleep + ' h'],
    ['studying', d.study + ' h'],
    ['phone', d.screen + ' h'],
    ['mood', d.mood + '/5'],
  ];
  mono(12.5, false);
  const quote = d.note.toLowerCase();
  const w = max(240, textWidth(quote) + 36);
  const h = 70 + rows.length * 21 + 30;
  let tx = d.x + COL_W / 2 + 8;
  if (tx + w > W - 10) tx = d.x - COL_W / 2 - 8 - w;
  const ty = constrain(mouseY - h / 2, 480, 1120 - h);

  noStroke();
  fill(PINK);
  rect(tx + 6, ty + 6, w, h, 6);
  fill(PAPER);
  stroke(BLUE);
  strokeWeight(2.5);
  rect(tx, ty, w, h, 6);

  noStroke();
  fill(TEXT);
  textAlign(LEFT, BASELINE);
  textFont(DISPLAY);
  textStyle(BOLD);
  textSize(28);
  text(`${d.day.toUpperCase()} ${d.date.toUpperCase()}`, tx + 16, ty + 38);

  rows.forEach(([k, v], i) => {
    const y = ty + 66 + i * 21;
    mono(12.5, false);
    textAlign(LEFT, BASELINE);
    text(k, tx + 16, y);
    mono(12.5, true);
    textAlign(RIGHT, BASELINE);
    text(v, tx + w - 16, y);
  });
  mono(12.5, false);
  textAlign(LEFT, BASELINE);
  text(quote, tx + 16, ty + 76 + rows.length * 21);
}

// same numbers as an HTML table, so nothing depends on hover or color alone
function buildDataTable() {
  const body = document.querySelector('#data-table tbody');
  if (!body) return;
  body.innerHTML = data.days
    .map(
      (d) => `<tr>
        <th scope="row">${d.day} ${d.date}</th>
        <td>${d.steps.toLocaleString()}</td>
        <td>${d.sleep}</td>
        <td>${d.study}</td>
        <td>${d.screen}</td>
        <td>${d.mood}/5</td>
        <td class="note-cell">${d.note.toLowerCase()}</td>
      </tr>`
    )
    .join('');
}
