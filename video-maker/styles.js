// AI-style video designs for the Photo Video Maker, drawn on a canvas.
// One fixed design per kind of business, so videos do not all look alike:
//   playful (schools, kids, birthdays), luxe (jewellery, weddings),
//   bold (gyms, sales), fresh (food), clean (property, products).
// The same code draws the editor preview, the recorded MP4 and the
// downloadable HTML video (which carries a copy of this file), so it must
// not depend on the page: everything comes in through `d`.
//
// d = { layout, style, w, h, intro, per, outro, title, subtitle, contact,
//       closing, badge, photos: [{ img, label, head, line }] }
(function () {
  'use strict';

  const SCRIPTS = '"Noto Sans Telugu", "Noto Sans Devanagari"';
  const F = {
    round: `Fredoka, Poppins, ${SCRIPTS}, sans-serif`,
    serif: `"Cormorant Garamond", ${SCRIPTS}, serif`,
    jost: `Jost, ${SCRIPTS}, sans-serif`,
    impact: `Anton, ${SCRIPTS}, sans-serif`,
    sans: `Poppins, ${SCRIPTS}, sans-serif`,
  };

  // Which design fits which business type (the AI plan's style).
  const LAYOUT_FOR = {
    jewel: 'luxe', wedding: 'luxe', royal: 'luxe',
    gym: 'bold', offer: 'bold',
    food: 'fresh',
    property: 'clean', product: 'clean',
    birthday: 'playful',
  };

  const NAMES = { playful: 'Playful', luxe: 'Luxe', bold: 'Bold', fresh: 'Fresh', clean: 'Clean' };

  // Colours per business type, used by every design.
  const THEMES = {
    default: { accent: '#ffc92e', ink: '#0a2e6b', shade: '4,26,68', chip: '#0b4fc0' },
    offer: { accent: '#ffd400', ink: '#1a1400', shade: '20,12,0', chip: '#b45309' },
    food: { accent: '#ff7a1a', ink: '#3b1300', shade: '43,16,4', chip: '#c2410c' },
    property: { accent: '#2dd4bf', ink: '#053b36', shade: '3,24,28', chip: '#0f766e' },
    wedding: { accent: '#f3c98b', ink: '#3b0a14', shade: '24,4,10', chip: '#9f1239' },
    royal: { accent: '#f2c46d', ink: '#3b0a14', shade: '28,4,10', chip: '#881337' },
    birthday: { accent: '#f472b6', ink: '#3b0764', shade: '30,12,60', chip: '#7c3aed' },
    product: { accent: '#38bdf8', ink: '#0b2540', shade: '6,18,36', chip: '#0369a1' },
    jewel: { accent: '#d4af37', ink: '#0b0906', shade: '6,4,3', chip: '#8a6b17' },
    gym: { accent: '#ff4d1f', ink: '#ffffff', shade: '10,6,4', chip: '#c2410c' },
  };

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
  const theme = (d) => THEMES[d.style] || THEMES.default;
  const unit = (d) => Math.min(d.w, d.h) / 100;
  const wide = (d) => d.w > d.h;

  // ---- Text helpers ----

  function wrap(ctx, value, maxWidth, maxLines) {
    const words = String(value || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let current = '';
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (ctx.measureText(next).width <= maxWidth || !current) current = next;
      else { lines.push(current); current = word; }
    }
    if (current) lines.push(current);
    if (lines.length > maxLines) {
      lines.length = maxLines;
      lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\s*\S*$/, '')}…`;
    }
    return lines;
  }

  // Draws wrapped text; returns its height. Use measure:true to only measure.
  function write(ctx, value, o) {
    if (!value) return 0;
    const size = o.size;
    ctx.save();
    ctx.font = `${o.italic ? 'italic ' : ''}${o.weight || 700} ${size}px ${o.font}`;
    if (o.spacing && 'letterSpacing' in ctx) ctx.letterSpacing = `${o.spacing * size}px`;
    const lines = wrap(ctx, o.upper ? String(value).toUpperCase() : value, o.maxWidth, o.maxLines || 3);
    const lh = size * (o.lineHeight || 1.12);
    if (!o.measure) {
      ctx.globalAlpha *= o.alpha ?? 1;
      ctx.fillStyle = o.color || '#fff';
      ctx.textAlign = o.align || 'left';
      ctx.textBaseline = 'top';
      if (o.shadow !== false) { ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = size * 0.3; ctx.shadowOffsetY = size * 0.05; }
      lines.forEach((line, i) => ctx.fillText(line, o.x, o.y + i * lh));
    }
    ctx.restore();
    return lines.length * lh;
  }

  function pill(ctx, label, o) {
    const size = o.size;
    ctx.save();
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.font = `${o.weight || 700} ${size}px ${o.font || F.round}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${(o.spacing ?? 0.1) * size}px`;
    const value = String(label).toUpperCase();
    const w = Math.min(ctx.measureText(value).width + size * 1.7, o.maxWidth || 1e9);
    const h = size * 2.1;
    const left = o.align === 'center' ? o.x - w / 2 : o.align === 'right' ? o.x - w : o.x;
    if (o.bg) {
      ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = size * 0.6;
      ctx.fillStyle = o.bg;
      ctx.beginPath(); ctx.roundRect(left, o.y, w, h, o.radius ?? h / 2); ctx.fill();
      ctx.shadowColor = 'transparent';
    }
    if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = Math.max(1, size * 0.08); ctx.beginPath(); ctx.roundRect(left, o.y, w, h, o.radius ?? h / 2); ctx.stroke(); }
    ctx.fillStyle = o.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(value, left + w / 2, o.y + h / 2 + size * 0.05, w - size * 1.2);
    ctx.restore();
    return { w, h, left };
  }

  const clock = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s) % 60).padStart(2, '0')}`;

  function gradient(ctx, d, stops, y0 = 0, y1 = d.h) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    for (const [at, color] of stops) g.addColorStop(at, color);
    ctx.fillStyle = g;
    ctx.fillRect(0, Math.min(y0, y1), d.w, Math.abs(y1 - y0));
  }

  // ---- Timeline ----
  // Opening (first photo), each photo, ending (last photo).
  function segments(d) {
    const n = Math.max(1, d.photos.length);
    const list = [{ kind: 'intro', photo: 0, start: 0, end: d.intro }];
    for (let i = 0; i < n; i += 1) list.push({ kind: 'photo', photo: i, index: i, start: d.intro + i * d.per, end: d.intro + (i + 1) * d.per });
    list.push({ kind: 'outro', photo: n - 1, start: d.intro + n * d.per, end: d.intro + n * d.per + d.outro });
    return list;
  }

  const total = (d) => d.intro + Math.max(1, d.photos.length) * d.per + d.outro;

  // Photo cover with slow camera motion over the whole time it is shown.
  function photo(ctx, d, seg, t, segs, motion) {
    const item = d.photos[seg.photo];
    if (!item?.img) {
      const th = theme(d);
      ctx.fillStyle = `rgb(${th.shade})`;
      ctx.fillRect(0, 0, d.w, d.h);
      return;
    }
    const uses = segs.filter((s) => s.photo === seg.photo);
    const from = uses[0].start;
    const to = uses[uses.length - 1].end;
    const p = clamp((t - from) / Math.max(0.1, to - from), 0, 1);
    const img = item.img;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const dir = seg.photo % 2 ? 1 : -1;
    const zoom = motion.zoom[0] + (motion.zoom[1] - motion.zoom[0]) * (motion.easeIn ? ease(p) : p);
    const scale = Math.max(d.w / iw, d.h / ih) * zoom;
    const w = iw * scale;
    const h = ih * scale;
    const dx = dir * (p - 0.5) * (motion.pan || 0) * d.w;
    const dy = -p * (motion.rise || 0) * d.h;
    ctx.drawImage(img, (d.w - w) / 2 + dx, (d.h - h) * (motion.focus ?? 0.5) + dy, w, h);
  }

  // ======================= Designs =======================

  // ---- Playful: bright pills, rounded type, call-now card ----
  const playful = {
    transition: { type: 'fade', dur: 0.9 },
    motion: { zoom: [1, 1.11], focus: 0.42 },
    overlay(ctx, d) {
      const s = theme(d).shade;
      gradient(ctx, d, [[0, `rgba(${s},.55)`], [0.5, `rgba(${s},0)`], [1, `rgba(${s},.78)`]]);
      gradient(ctx, d, [[0, `rgba(${s},0)`], [1, `rgba(${s},.8)`]], d.h * 0.42, d.h);
    },
    text(ctx, d, seg, local) {
      const u = unit(d);
      const th = theme(d);
      const appear = ease((local - 0.15) / 0.6);
      const bottom = d.h - u * (wide(d) ? 9 : 11) + (1 - appear) * u * 4;
      const item = d.photos[seg.photo] || {};
      if (seg.kind === 'photo') {
        const x = u * 6;
        const maxWidth = d.w - u * 12;
        const head = { size: u * (wide(d) ? 6.4 : 7.6), weight: 600, font: F.round, maxWidth, x, maxLines: 3 };
        const line = { size: u * 3.6, weight: 700, font: F.round, maxWidth, x, maxLines: 2, color: 'rgba(255,255,255,.92)' };
        const hl = write(ctx, item.line, { ...line, measure: true });
        const hh = write(ctx, item.head, { ...head, measure: true });
        const y = bottom - hl - (hl ? u * 1.5 : 0) - hh;
        if (item.label) pill(ctx, item.label, { x, y: y - u * 7.5, size: u * 2.7, bg: th.accent, color: th.ink, alpha: appear, maxWidth });
        write(ctx, item.head, { ...head, y, alpha: appear });
        write(ctx, item.line, { ...line, y: y + hh + u * 1.5, alpha: ease((local - 0.35) / 0.6) });
      } else if (seg.kind === 'intro') {
        const o = { size: u * (wide(d) ? 7.2 : 8.8), weight: 600, font: F.round, maxWidth: d.w * 0.86, x: d.w / 2, align: 'center' };
        const value = d.subtitle || d.title;
        const y = bottom - write(ctx, value, { ...o, measure: true });
        pill(ctx, `✦ ${d.title} ✦`, { x: d.w / 2, y: y - u * 8, size: u * 2.9, bg: th.accent, color: th.ink, align: 'center', alpha: appear, maxWidth: d.w * 0.9 });
        write(ctx, value, { ...o, y, alpha: appear });
      } else {
        const cardH = d.contact ? u * 15 : 0;
        const o = { size: u * (wide(d) ? 6.6 : 7.8), weight: 600, font: F.round, maxWidth: d.w * 0.86, x: d.w / 2, align: 'center', maxLines: 2 };
        const hh = write(ctx, d.closing, { ...o, measure: true });
        let y = bottom - cardH - (cardH ? u * 3 : 0) - hh;
        pill(ctx, d.badge || d.title, { x: d.w / 2, y: y - u * 7.5, size: u * 2.7, bg: '#fff', color: th.chip, align: 'center', alpha: appear, maxWidth: d.w * 0.9 });
        write(ctx, d.closing, { ...o, y, alpha: appear });
        if (d.contact) {
          const pop = ease((local - 0.45) / 0.6);
          const cw = Math.min(d.w * 0.78, u * 72);
          y += hh + u * 3;
          ctx.save();
          ctx.globalAlpha *= pop;
          ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = u * 3; ctx.shadowOffsetY = u;
          ctx.fillStyle = th.accent;
          ctx.beginPath(); ctx.roundRect((d.w - cw) / 2, y, cw, cardH, u * 3.5); ctx.fill();
          ctx.restore();
          write(ctx, 'CALL NOW', { x: d.w / 2, y: y + cardH * 0.16, size: u * 2.8, font: F.round, color: th.ink, align: 'center', maxWidth: cw, shadow: false, alpha: pop, spacing: 0.15 });
          write(ctx, `📞 ${d.contact}`, { x: d.w / 2, y: y + cardH * 0.45, size: u * 6, weight: 600, font: F.round, color: th.ink, align: 'center', maxWidth: cw - u * 4, maxLines: 1, shadow: false, alpha: pop });
        }
      }
    },
    chrome(ctx, d, t) {
      const u = unit(d);
      const th = theme(d);
      const size = u * 2.9;
      pill(ctx, `${clock(t)} / ${clock(total(d))}`, { x: u * 5, y: u * 5, size, bg: 'rgba(0,0,0,.35)', color: '#fff', weight: 600, spacing: 0.04 });
      if (d.badge) pill(ctx, d.badge, { x: d.w - u * 5, y: u * 5, size: u * 2.5, bg: '#fff', color: th.chip, align: 'right' });
      ctx.fillStyle = 'rgba(255,255,255,.3)';
      ctx.fillRect(0, d.h - u * 0.7, d.w, u * 0.7);
      ctx.fillStyle = th.accent;
      ctx.fillRect(0, d.h - u * 0.7, d.w * clamp(t / total(d), 0, 1), u * 0.7);
    },
  };

  // ---- Luxe: serif type, gold hairline, sparkles, film bar ----
  const SPARKLES = [[8, 18, 7, 3.2, 0], [82, 15, 6, 2.7, 0.5], [68, 28, 5, 3.8, 1.1], [18, 38, 5, 2.9, 0.2], [88, 47, 8, 4.1, 1.5], [12, 56, 6, 3.4, 0.8],
    [76, 62, 5, 3, 0.1], [32, 22, 4, 2.6, 1.8], [52, 14, 4, 3.6, 0.7], [44, 66, 6, 3.1, 1.2], [90, 70, 5, 3.9, 0.4], [6, 72, 5, 2.8, 1.4]];

  function goldText(ctx, d, y, height) {
    const th = theme(d);
    const g = ctx.createLinearGradient(d.w * 0.2, y, d.w * 0.8, y + height);
    g.addColorStop(0, '#8a6b17'); g.addColorStop(0.5, th.accent); g.addColorStop(1, '#f7ebc8');
    return g;
  }

  const luxe = {
    transition: { type: 'fade', dur: 1.2 },
    motion: { zoom: [1.04, 1.18], pan: 0.02, rise: 0.015, focus: 0.5 },
    overlay(ctx, d) {
      gradient(ctx, d, [[0, 'rgba(0,0,0,.72)'], [0.45, 'rgba(0,0,0,.05)'], [1, 'rgba(0,0,0,.88)']]);
      const r = ctx.createRadialGradient(d.w / 2, d.h / 2, Math.min(d.w, d.h) * 0.3, d.w / 2, d.h / 2, Math.max(d.w, d.h) * 0.75);
      r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, 'rgba(0,0,0,.4)');
      ctx.fillStyle = r; ctx.fillRect(0, 0, d.w, d.h);
    },
    text(ctx, d, seg, local) {
      const u = unit(d);
      const th = theme(d);
      const appear = ease((local - 0.2) / 0.7);
      const item = d.photos[seg.photo] || {};
      const cardH = seg.kind === 'outro' && d.contact ? u * 20 : 0;
      const bottom = d.h - u * (wide(d) ? 16 : 26) - cardH + (1 - appear) * u * 3;
      const maxWidth = d.w * 0.84;
      const x = d.w / 2;
      const eyebrow = seg.kind === 'intro' ? d.title : seg.kind === 'outro' ? (d.badge || 'Special offer') : item.label;
      const head = seg.kind === 'intro' ? (d.subtitle || d.title) : seg.kind === 'outro' ? d.closing : item.head;
      const sub = seg.kind === 'photo' ? item.line : seg.kind === 'outro' ? '' : '';
      const ho = { size: u * (wide(d) ? 7 : 8.6), weight: 600, font: F.serif, maxWidth, x, align: 'center', lineHeight: 1.02, maxLines: 3, italic: seg.kind === 'outro' };
      const so = { size: u * 3.2, weight: 400, font: F.jost, maxWidth, x, align: 'center', color: 'rgba(255,255,255,.8)', maxLines: 2, lineHeight: 1.4 };
      const hs = write(ctx, sub, { ...so, measure: true });
      const hh = write(ctx, head, { ...ho, measure: true });
      const y = bottom - hs - (hs ? u * 1.6 : 0) - hh;
      ctx.save();
      ctx.globalAlpha *= appear;
      ctx.fillStyle = th.accent;
      ctx.fillRect(x - u * 5, y - u * 8.2, u * 10 * appear, Math.max(1, u * 0.25));
      ctx.restore();
      write(ctx, eyebrow, { x, y: y - u * 5.6, size: u * 2.5, weight: 600, font: F.jost, color: '#f3d98b', align: 'center', maxWidth, upper: true, spacing: 0.34, maxLines: 1, alpha: appear });
      write(ctx, head, { ...ho, y, alpha: appear, color: seg.kind === 'outro' ? goldText(ctx, d, y, hh) : '#fff' });
      write(ctx, sub, { ...so, y: y + hh + u * 1.6, alpha: ease((local - 0.45) / 0.7) });
      if (cardH) {
        const pop = ease((local - 0.6) / 0.7);
        const cx = u * 6;
        const cw = d.w - u * 12;
        const cy = d.h - u * (wide(d) ? 12 : 18) - cardH + (1 - pop) * u * 2;
        ctx.save();
        ctx.globalAlpha *= pop;
        ctx.fillStyle = 'rgba(0,0,0,.55)';
        ctx.strokeStyle = 'rgba(212,175,55,.5)';
        ctx.lineWidth = Math.max(1, u * 0.2);
        ctx.beginPath(); ctx.roundRect(cx, cy, cw, cardH, u * 3.5); ctx.fill(); ctx.stroke();
        ctx.restore();
        write(ctx, `📞 ${d.contact}`, { x, y: cy + u * 3, size: u * 3.6, weight: 600, font: F.jost, align: 'center', maxWidth: cw - u * 4, maxLines: 1, alpha: pop, shadow: false });
        const bw = (cw - u * 7) / 2;
        const by = cy + cardH - u * 9.5;
        ctx.save();
        ctx.globalAlpha *= pop;
        ctx.fillStyle = th.accent;
        ctx.beginPath(); ctx.roundRect(cx + u * 2.5, by, bw, u * 7, u * 3.5); ctx.fill();
        ctx.strokeStyle = '#f3d98b'; ctx.lineWidth = Math.max(1, u * 0.2);
        ctx.beginPath(); ctx.roundRect(cx + u * 4.5 + bw, by, bw, u * 7, u * 3.5); ctx.stroke();
        ctx.restore();
        write(ctx, 'VISIT NOW', { x: cx + u * 2.5 + bw / 2, y: by + u * 2.2, size: u * 2.5, font: F.jost, weight: 600, color: '#000', align: 'center', maxWidth: bw, spacing: 0.14, maxLines: 1, alpha: pop, shadow: false });
        write(ctx, 'CALL NOW', { x: cx + u * 4.5 + bw * 1.5, y: by + u * 2.2, size: u * 2.5, font: F.jost, weight: 600, color: '#f7ebc8', align: 'center', maxWidth: bw, spacing: 0.14, maxLines: 1, alpha: pop, shadow: false });
      }
    },
    chrome(ctx, d, t, seg) {
      const u = unit(d);
      const th = theme(d);
      // Sparkles twinkle over the film.
      ctx.save();
      for (const [l, top, s, period, delay] of SPARKLES) {
        const a = Math.max(0, Math.sin(((t + delay) / period) * Math.PI * 2));
        if (a <= 0.05) continue;
        const x = (l / 100) * d.w;
        const y = (top / 100) * d.h;
        const r = (s / 450) * d.w * (0.6 + 0.6 * a);
        ctx.globalAlpha = a * 0.9;
        ctx.fillStyle = '#fff6d5';
        ctx.shadowColor = th.accent; ctx.shadowBlur = r * 3;
        ctx.beginPath();
        ctx.moveTo(x, y - r * 2); ctx.quadraticCurveTo(x, y, x + r * 2, y); ctx.quadraticCurveTo(x, y, x, y + r * 2); ctx.quadraticCurveTo(x, y, x - r * 2, y); ctx.quadraticCurveTo(x, y, x, y - r * 2);
        ctx.fill();
      }
      ctx.restore();
      // Monogram and name.
      const r = u * 3.6;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.strokeStyle = th.accent; ctx.lineWidth = Math.max(1, u * 0.22);
      ctx.beginPath(); ctx.arc(u * 5 + r, u * 5 + r, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
      write(ctx, (d.title || 'S').trim().charAt(0).toUpperCase(), { x: u * 5 + r, y: u * 5 + r * 0.38, size: r * 1.25, weight: 600, font: F.serif, color: '#f3d98b', align: 'center', maxWidth: r * 2, maxLines: 1, shadow: false });
      write(ctx, d.title, { x: u * 7 + r * 2, y: u * 5 + r * 0.25, size: u * 3.6, weight: 600, font: F.serif, color: '#f7ebc8', upper: true, spacing: 0.18, maxWidth: d.w * 0.5, maxLines: 1 });
      write(ctx, `${Math.round(total(d))} SEC FILM`, { x: d.w - u * 5, y: u * 6.2, size: u * 1.9, weight: 500, font: F.jost, color: 'rgba(255,255,255,.7)', align: 'right', spacing: 0.2, maxWidth: d.w * 0.3, maxLines: 1 });
      // Film bar: time, scene, percent and a gold progress line.
      const by = d.h - u * 6.5;
      const pct = clamp(t / total(d), 0, 1);
      write(ctx, `${clock(t)} / ${clock(total(d))}`, { x: u * 5, y: by, size: u * 2.2, weight: 500, font: F.jost, color: 'rgba(255,255,255,.85)', spacing: 0.16, maxWidth: d.w * 0.4, maxLines: 1 });
      write(ctx, seg.kind === 'photo' ? (d.photos[seg.photo]?.label || '') : '', { x: d.w / 2, y: by, size: u * 2, weight: 500, font: F.jost, color: 'rgba(255,255,255,.55)', align: 'center', upper: true, spacing: 0.16, maxWidth: d.w * 0.36, maxLines: 1 });
      write(ctx, `${Math.round(pct * 100)}%`, { x: d.w - u * 5, y: by, size: u * 2.2, weight: 500, font: F.jost, color: 'rgba(255,255,255,.85)', align: 'right', maxWidth: d.w * 0.2, maxLines: 1 });
      const lw = d.w - u * 10;
      ctx.fillStyle = 'rgba(255,255,255,.25)';
      ctx.beginPath(); ctx.roundRect(u * 5, by + u * 3.6, lw, u * 0.5, u * 0.25); ctx.fill();
      const g = ctx.createLinearGradient(u * 5, 0, u * 5 + lw, 0);
      g.addColorStop(0, '#8a6b17'); g.addColorStop(0.5, th.accent); g.addColorStop(1, '#f7ebc8');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.roundRect(u * 5, by + u * 3.6, Math.max(u * 0.5, lw * pct), u * 0.5, u * 0.25); ctx.fill();
    },
  };

  // ---- Bold: big uppercase, accent slash, flash cuts, story bars ----
  const bold = {
    transition: { type: 'flash', dur: 0.32 },
    motion: { zoom: [1.02, 1.2], easeIn: true, focus: 0.45 },
    overlay(ctx, d) {
      const th = theme(d);
      gradient(ctx, d, [[0, 'rgba(0,0,0,.55)'], [0.4, 'rgba(0,0,0,.1)'], [1, 'rgba(0,0,0,.85)']]);
      // A diagonal accent slash behind the text.
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = th.accent;
      ctx.beginPath();
      ctx.moveTo(0, d.h * 0.66); ctx.lineTo(d.w, d.h * 0.58); ctx.lineTo(d.w, d.h * 0.585); ctx.lineTo(0, d.h * 0.668);
      ctx.fill();
      ctx.restore();
    },
    text(ctx, d, seg, local) {
      const u = unit(d);
      const th = theme(d);
      const slam = ease(local / 0.35);
      const x = u * 6 - (1 - slam) * u * 10;
      const maxWidth = d.w - u * 12;
      const item = d.photos[seg.photo] || {};
      const label = seg.kind === 'intro' ? d.title : seg.kind === 'outro' ? (d.badge || 'Limited offer') : item.label;
      const head = seg.kind === 'intro' ? (d.subtitle || d.title) : seg.kind === 'outro' ? d.closing : item.head;
      const line = seg.kind === 'photo' ? item.line : '';
      const ho = { size: u * (wide(d) ? 9 : 12.5), weight: 400, font: F.impact, maxWidth, x, upper: true, lineHeight: 0.98, maxLines: 3 };
      const hh = write(ctx, head, { ...ho, measure: true });
      const bar = seg.kind === 'outro' && d.contact ? u * 11 : 0;
      const bottom = d.h - u * (wide(d) ? 8 : 12) - bar - (bar ? u * 3 : 0);
      const lh = write(ctx, line, { size: u * 4, weight: 400, font: F.impact, maxWidth, x, measure: true });
      const y = bottom - lh - (lh ? u * 1.5 : 0) - hh;
      if (label) pill(ctx, label, { x, y: y - u * 7.2, size: u * 2.8, bg: th.accent, color: th.ink === '#ffffff' ? '#fff' : '#000', font: F.impact, weight: 400, radius: u * 0.6, spacing: 0.08, alpha: slam, maxWidth });
      write(ctx, head, { ...ho, y, alpha: slam });
      write(ctx, line, { x, y: y + hh + u * 1.5, size: u * 4, weight: 400, font: F.impact, color: th.accent, maxWidth, maxLines: 2, upper: true, spacing: 0.04, alpha: ease((local - 0.2) / 0.35) });
      if (bar) {
        const pop = ease((local - 0.35) / 0.4);
        ctx.save();
        ctx.globalAlpha *= pop;
        ctx.fillStyle = th.accent;
        ctx.fillRect(0, d.h - u * (wide(d) ? 8 : 12) - bar, d.w * pop, bar);
        ctx.restore();
        write(ctx, `CALL ${d.contact}`, { x: d.w / 2, y: d.h - u * (wide(d) ? 8 : 12) - bar + u * 2.4, size: u * 6.4, weight: 400, font: F.impact, color: th.ink === '#ffffff' ? '#fff' : '#000', align: 'center', maxWidth: d.w - u * 8, maxLines: 1, shadow: false, alpha: pop });
      }
    },
    chrome(ctx, d, t, seg, segs) {
      const u = unit(d);
      const th = theme(d);
      // Story-style bars, one per scene.
      const n = segs.length;
      const gap = u * 0.8;
      const bw = (d.w - u * 8 - gap * (n - 1)) / n;
      segs.forEach((s, i) => {
        const fill = clamp((t - s.start) / (s.end - s.start), 0, 1);
        const x = u * 4 + i * (bw + gap);
        ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(x, u * 3, bw, u * 0.6);
        ctx.fillStyle = '#fff'; ctx.fillRect(x, u * 3, bw * fill, u * 0.6);
      });
      pill(ctx, d.title, { x: u * 4, y: u * 5.5, size: u * 2.6, bg: '#000', color: '#fff', font: F.impact, weight: 400, radius: u * 0.6, spacing: 0.06, maxWidth: d.w * 0.6 });
      const blink = Math.sin(t * 6) > 0 ? 1 : 0.35;
      const tag = pill(ctx, d.badge || 'Offer', { x: d.w - u * 4, y: u * 5.5, size: u * 2.6, bg: 'rgba(0,0,0,.55)', color: '#fff', font: F.impact, weight: 400, align: 'right', radius: u * 0.6, spacing: 0.06, maxWidth: d.w * 0.35 });
      ctx.save();
      ctx.globalAlpha = blink;
      ctx.fillStyle = th.accent;
      ctx.beginPath(); ctx.arc(tag.left - u * 1.6, u * 5.5 + tag.h / 2, u * 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    },
  };

  // ---- Fresh: white card slides up, round sticker, warm colours ----
  const fresh = {
    transition: { type: 'fade', dur: 0.6 },
    motion: { zoom: [1.06, 1.14], pan: 0.03, focus: 0.35 },
    overlay(ctx, d) {
      gradient(ctx, d, [[0, 'rgba(0,0,0,.45)'], [0.3, 'rgba(0,0,0,0)']], 0, d.h * 0.3);
    },
    text(ctx, d, seg, local) {
      const u = unit(d);
      const th = theme(d);
      const slide = ease((local - 0.05) / 0.55);
      const item = d.photos[seg.photo] || {};
      const pad = u * 6;
      const maxWidth = d.w - pad * 2 - (seg.kind === 'photo' && item.line ? u * 4 : 0);
      const label = seg.kind === 'intro' ? d.title : seg.kind === 'outro' ? (d.badge || 'Order now') : item.label;
      const head = seg.kind === 'intro' ? (d.subtitle || d.title) : seg.kind === 'outro' ? d.closing : item.head;
      const ho = { size: u * (wide(d) ? 6 : 7), weight: 800, font: F.sans, maxWidth, x: pad, color: th.ink, shadow: false, maxLines: 3, lineHeight: 1.08 };
      const hh = write(ctx, head, { ...ho, measure: true });
      const btn = seg.kind === 'outro' && d.contact ? u * 9 : 0;
      const cardH = u * 12 + hh + (btn ? btn + u * 3 : 0);
      const top = d.h - cardH * slide;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = u * 4;
      ctx.fillStyle = '#fffaf3';
      ctx.beginPath(); ctx.roundRect(0, top, d.w, cardH + u * 4, [u * 6, u * 6, 0, 0]); ctx.fill();
      ctx.restore();
      ctx.fillStyle = th.accent;
      ctx.beginPath(); ctx.roundRect(d.w / 2 - u * 5, top + u * 1.6, u * 10, u * 0.8, u * 0.4); ctx.fill();
      if (label) write(ctx, label, { x: pad, y: top + u * 4, size: u * 2.6, weight: 700, font: F.sans, color: th.accent, upper: true, spacing: 0.14, maxWidth, maxLines: 1, shadow: false });
      write(ctx, head, { ...ho, y: top + u * 7.6 });
      if (btn) {
        const by = top + u * 7.6 + hh + u * 3;
        ctx.fillStyle = th.accent;
        ctx.beginPath(); ctx.roundRect(pad, by, d.w - pad * 2, btn, btn / 2); ctx.fill();
        write(ctx, `📞 ${d.contact}`, { x: d.w / 2, y: by + btn * 0.22, size: u * 4.4, weight: 700, font: F.sans, color: '#fff', align: 'center', maxWidth: d.w - pad * 3, maxLines: 1, shadow: false });
      }
      // Round sticker with the price or tag.
      if (seg.kind === 'photo' && item.line) {
        const pop = ease((local - 0.35) / 0.4);
        const r = u * 11 * pop;
        if (r > 1) {
          const cx = d.w - u * 15;
          const cy = top - u * 4;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(-0.18);
          ctx.fillStyle = th.accent;
          ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = u * 2;
          ctx.beginPath();
          for (let i = 0; i < 24; i += 1) {
            const a = (i / 24) * Math.PI * 2;
            const rr = i % 2 ? r * 0.9 : r;
            ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
          }
          ctx.closePath(); ctx.fill();
          ctx.shadowColor = 'transparent';
          write(ctx, item.line, { x: 0, y: -r * 0.42, size: r * 0.3, weight: 800, font: F.sans, color: '#fff', align: 'center', maxWidth: r * 1.5, maxLines: 2, lineHeight: 1, shadow: false });
          ctx.restore();
        }
      }
    },
    chrome(ctx, d, t, seg, segs) {
      const u = unit(d);
      const th = theme(d);
      const n = segs.length;
      const gap = u * 0.8;
      const bw = (d.w - u * 8 - gap * (n - 1)) / n;
      segs.forEach((s, i) => {
        const fill = clamp((t - s.start) / (s.end - s.start), 0, 1);
        const x = u * 4 + i * (bw + gap);
        ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.roundRect(x, u * 3, bw, u * 0.7, u * 0.35); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(x, u * 3, Math.max(0.1, bw * fill), u * 0.7, u * 0.35); ctx.fill();
      });
      const tag = pill(ctx, d.title, { x: u * 4, y: u * 5.5, size: u * 2.7, bg: '#fffaf3', color: th.ink, font: F.sans, weight: 800, spacing: 0.04, maxWidth: d.w * 0.6 });
      ctx.fillStyle = th.accent;
      ctx.beginPath(); ctx.arc(tag.left + tag.w + u * 2, u * 5.5 + tag.h / 2, u * 1.2, 0, Math.PI * 2); ctx.fill();
    },
  };

  // ---- Clean: thin type, scene numbers, wipe transitions ----
  const clean = {
    transition: { type: 'wipe', dur: 0.8 },
    motion: { zoom: [1.12, 1.12], pan: 0.08, focus: 0.5 },
    overlay(ctx, d) {
      gradient(ctx, d, [[0, 'rgba(0,0,0,.6)'], [0.42, 'rgba(0,0,0,0)']], 0, d.h * 0.5);
      gradient(ctx, d, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.45)']], d.h * 0.75, d.h);
    },
    text(ctx, d, seg, local, segs) {
      const u = unit(d);
      const th = theme(d);
      const appear = ease((local - 0.25) / 0.6);
      const item = d.photos[seg.photo] || {};
      const x = u * 6;
      const maxWidth = d.w - u * 12;
      if (seg.kind === 'outro') {
        // A light panel with the closing line and contact.
        const pw = d.w - u * 12;
        const ho = { size: u * 6.6, weight: 500, font: F.jost, maxWidth: pw - u * 10, x: d.w / 2, align: 'center', color: '#0f172a', shadow: false, maxLines: 3 };
        const hh = write(ctx, d.closing, { ...ho, measure: true });
        const ph = u * 16 + hh + (d.contact ? u * 9 : 0);
        const py = (d.h - ph) / 2 + (1 - appear) * u * 3;
        ctx.save();
        ctx.globalAlpha *= appear;
        ctx.fillStyle = 'rgba(255,255,255,.93)';
        ctx.beginPath(); ctx.roundRect(u * 6, py, pw, ph, u * 2); ctx.fill();
        ctx.fillStyle = th.accent; ctx.fillRect(d.w / 2 - u * 4, py + u * 5, u * 8, Math.max(1, u * 0.3));
        ctx.restore();
        write(ctx, d.badge || d.title, { x: d.w / 2, y: py + u * 7.4, size: u * 2.4, weight: 600, font: F.jost, color: th.chip, align: 'center', upper: true, spacing: 0.22, maxWidth: pw - u * 8, maxLines: 1, shadow: false, alpha: appear });
        write(ctx, d.closing, { ...ho, y: py + u * 11.5, alpha: appear });
        if (d.contact) write(ctx, `📞 ${d.contact}`, { x: d.w / 2, y: py + u * 13 + hh + u * 1.5, size: u * 4.6, weight: 600, font: F.jost, color: '#0f172a', align: 'center', maxWidth: pw - u * 8, maxLines: 1, shadow: false, alpha: appear });
        return;
      }
      const label = seg.kind === 'intro' ? d.title : item.label;
      const head = seg.kind === 'intro' ? (d.subtitle || d.title) : item.head;
      const line = seg.kind === 'photo' ? item.line : '';
      const top = u * (wide(d) ? 12 : 16);
      const count = segs.filter((s) => s.kind === 'photo').length;
      const number = seg.kind === 'intro' ? '' : `${String(seg.index + 1).padStart(2, '0')} — ${String(count).padStart(2, '0')}`;
      if (number) write(ctx, number, { x, y: top, size: u * 2.6, weight: 600, font: F.jost, color: th.accent, spacing: 0.2, maxWidth, maxLines: 1, alpha: appear });
      if (label) write(ctx, label, { x, y: top + u * 4.4, size: u * 2.5, weight: 500, font: F.jost, color: 'rgba(255,255,255,.85)', upper: true, spacing: 0.26, maxWidth, maxLines: 1, alpha: appear });
      const ho = { x, y: top + u * 9 - (1 - appear) * u * 2, size: u * (wide(d) ? 6.4 : 7.8), weight: 500, font: F.jost, maxWidth, maxLines: 3, lineHeight: 1.05, alpha: appear };
      const hh = write(ctx, head, ho);
      ctx.save();
      ctx.globalAlpha *= appear;
      ctx.fillStyle = th.accent;
      ctx.fillRect(x, top + u * 10.5 + hh, u * 12 * appear, Math.max(1, u * 0.35));
      ctx.restore();
      write(ctx, line, { x, y: top + u * 12.5 + hh, size: u * 3.4, weight: 400, font: F.jost, color: 'rgba(255,255,255,.9)', maxWidth, maxLines: 2, alpha: ease((local - 0.45) / 0.6) });
    },
    chrome(ctx, d, t) {
      const u = unit(d);
      const th = theme(d);
      const y = d.h - u * 7;
      ctx.fillStyle = 'rgba(255,255,255,.35)';
      ctx.fillRect(u * 6, y - u * 2, d.w - u * 12, Math.max(1, u * 0.15));
      ctx.fillStyle = th.accent;
      ctx.fillRect(u * 6, y - u * 2, (d.w - u * 12) * clamp(t / total(d), 0, 1), Math.max(1, u * 0.3));
      write(ctx, d.title, { x: u * 6, y, size: u * 2.5, weight: 600, font: F.jost, upper: true, spacing: 0.2, maxWidth: d.w * 0.5, maxLines: 1 });
      write(ctx, d.badge || clock(t), { x: d.w - u * 6, y, size: u * 2.5, weight: 500, font: F.jost, color: 'rgba(255,255,255,.8)', align: 'right', upper: true, spacing: 0.2, maxWidth: d.w * 0.4, maxLines: 1 });
    },
  };

  const LAYOUTS = { playful, luxe, bold, fresh, clean };

  function scene(ctx, d, L, seg, t, segs, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    photo(ctx, d, seg, t, segs, L.motion);
    L.overlay(ctx, d);
    L.text(ctx, d, seg, t - seg.start, segs);
    ctx.restore();
  }

  // Draws the frame at time t.
  function frame(ctx, t, d) {
    const L = LAYOUTS[d.layout] || playful;
    const segs = segments(d);
    let k = segs.findIndex((s) => t < s.end);
    if (k < 0) k = segs.length - 1;
    const seg = segs[k];
    const into = t - seg.start;
    const { type, dur } = L.transition;
    if (k > 0 && into < dur) {
      const prev = segs[k - 1];
      const p = into / dur;
      if (type === 'wipe') {
        scene(ctx, d, L, prev, t, segs, 1);
        const edge = d.w * (1 - ease(p));
        ctx.save();
        ctx.beginPath(); ctx.rect(edge, 0, d.w - edge, d.h); ctx.clip();
        scene(ctx, d, L, seg, t, segs, 1);
        ctx.restore();
        ctx.fillStyle = theme(d).accent;
        ctx.fillRect(edge - unit(d) * 0.3, 0, unit(d) * 0.6, d.h);
      } else if (type === 'flash') {
        scene(ctx, d, L, p < 0.5 ? prev : seg, t, segs, 1);
        ctx.fillStyle = `rgba(255,255,255,${0.85 * (1 - Math.abs(p * 2 - 1))})`;
        ctx.fillRect(0, 0, d.w, d.h);
      } else {
        scene(ctx, d, L, prev, t, segs, 1);
        scene(ctx, d, L, seg, t, segs, ease(p));
      }
    } else {
      scene(ctx, d, L, seg, t, segs, 1);
    }
    L.chrome(ctx, d, t, seg, segs);
  }

  const api = {
    LAYOUT_FOR, NAMES, frame, total, layoutFor: (style) => LAYOUT_FOR[style] || 'playful',
    fonts: [`600 40px ${F.round}`, `700 40px ${F.round}`, `600 40px ${F.serif}`, `italic 600 40px ${F.serif}`, `400 40px ${F.jost}`, `500 40px ${F.jost}`, `600 40px ${F.jost}`, `400 40px ${F.impact}`, `700 40px ${F.sans}`, `800 40px ${F.sans}`],
    fontsUrl: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,600;1,600&family=Jost:wght@400;500;600&family=Anton&family=Poppins:wght@700;800&family=Noto+Sans+Telugu:wght@600;800&family=Noto+Sans+Devanagari:wght@600;800&display=swap',
  };
  if (typeof window !== 'undefined') window.SiteCraftStyles = api;
})();
