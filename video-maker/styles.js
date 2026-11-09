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
    play: `"Playfair Display", ${SCRIPTS}, serif`,
  };

  // Which design fits which business type (the AI plan's style).
  const LAYOUT_FOR = {
    jewel: 'luxe', wedding: 'luxe', royal: 'luxe',
    gym: 'bold', offer: 'bold',
    food: 'fresh',
    property: 'clean', product: 'clean',
    birthday: 'playful',
  };

  const NAMES = { playful: 'Playful', luxe: 'Luxe', bold: 'Bold', fresh: 'Fresh', clean: 'Clean', editor: 'Editor reveal', beat: 'Beat drop', parallax: '3D pop', stack: 'Layer build-up' };

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
  // ---- Colours ----
  const HEX = /^#[0-9a-f]{6}$/i;
  const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const toHex = (c) => `#${c.map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('')}`;
  // k > 0 mixes towards white, k < 0 towards black.
  const tint = (hex, k) => toHex(rgb(hex).map((c) => (k < 0 ? c * (1 + k) : c + (255 - c) * k)));
  const lum = (hex) => { const [r, g, b] = rgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };

  // The AI (or "New look") can give its own colours in d.design; otherwise
  // the colours of the business type are used.
  function theme(d) {
    const base = THEMES[d.style] || THEMES.default;
    const accent = d.design?.accent;
    if (!HEX.test(accent || '')) return { ...base, light: tint(base.accent, 0.45), pale: tint(base.accent, 0.75), deep: tint(base.accent, -0.4) };
    const dark = HEX.test(d.design.dark || '') ? d.design.dark : tint(accent, -0.82);
    return {
      accent,
      ink: lum(accent) > 0.6 ? '#111111' : '#ffffff',
      shade: rgb(dark).join(','),
      chip: lum(accent) > 0.55 ? tint(accent, -0.45) : accent,
      light: tint(accent, 0.45), pale: tint(accent, 0.75), deep: tint(accent, -0.4),
    };
  }

  // Headline font: the design's choice, else the layout's own.
  const FONT_KEYS = () => ({ round: F.round, serif: F.serif, jost: F.jost, impact: F.impact, sans: F.sans, play: F.play });
  const headFont = (d, fallback) => FONT_KEYS()[d.design?.font] || fallback;
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
    deco: 'none',
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
        const head = { size: u * (wide(d) ? 6.4 : 7.6), weight: 600, font: headFont(d, F.round), maxWidth, x, maxLines: 3 };
        const line = { size: u * 3.6, weight: 700, font: F.round, maxWidth, x, maxLines: 2, color: 'rgba(255,255,255,.92)' };
        const hl = write(ctx, item.line, { ...line, measure: true });
        const hh = write(ctx, item.head, { ...head, measure: true });
        const y = bottom - hl - (hl ? u * 1.5 : 0) - hh;
        if (item.label) pill(ctx, item.label, { x, y: y - u * 7.5, size: u * 2.7, bg: th.accent, color: th.ink, alpha: appear, maxWidth });
        write(ctx, item.head, { ...head, y, alpha: appear });
        write(ctx, item.line, { ...line, y: y + hh + u * 1.5, alpha: ease((local - 0.35) / 0.6) });
      } else if (seg.kind === 'intro') {
        const o = { size: u * (wide(d) ? 7.2 : 8.8), weight: 600, font: headFont(d, F.round), maxWidth: d.w * 0.86, x: d.w / 2, align: 'center' };
        const value = d.subtitle || d.title;
        const y = bottom - write(ctx, value, { ...o, measure: true });
        pill(ctx, `✦ ${d.title} ✦`, { x: d.w / 2, y: y - u * 8, size: u * 2.9, bg: th.accent, color: th.ink, align: 'center', alpha: appear, maxWidth: d.w * 0.9 });
        write(ctx, value, { ...o, y, alpha: appear });
      } else {
        const cardH = d.contact ? u * 15 : 0;
        const o = { size: u * (wide(d) ? 6.6 : 7.8), weight: 600, font: headFont(d, F.round), maxWidth: d.w * 0.86, x: d.w / 2, align: 'center', maxLines: 2 };
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
    g.addColorStop(0, th.deep); g.addColorStop(0.5, th.accent); g.addColorStop(1, th.pale);
    return g;
  }

  const luxe = {
    deco: 'sparkles',
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
      const ho = { size: u * (wide(d) ? 7 : 8.6), weight: 600, font: headFont(d, F.serif), maxWidth, x, align: 'center', lineHeight: 1.02, maxLines: 3, italic: seg.kind === 'outro' };
      const so = { size: u * 3.2, weight: 400, font: F.jost, maxWidth, x, align: 'center', color: 'rgba(255,255,255,.8)', maxLines: 2, lineHeight: 1.4 };
      const hs = write(ctx, sub, { ...so, measure: true });
      const hh = write(ctx, head, { ...ho, measure: true });
      const y = bottom - hs - (hs ? u * 1.6 : 0) - hh;
      ctx.save();
      ctx.globalAlpha *= appear;
      ctx.fillStyle = th.accent;
      ctx.fillRect(x - u * 5, y - u * 8.2, u * 10 * appear, Math.max(1, u * 0.25));
      ctx.restore();
      write(ctx, eyebrow, { x, y: y - u * 5.6, size: u * 2.5, weight: 600, font: F.jost, color: th.light, align: 'center', maxWidth, upper: true, spacing: 0.34, maxLines: 1, alpha: appear });
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
        ctx.strokeStyle = th.accent;
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
        ctx.strokeStyle = th.light; ctx.lineWidth = Math.max(1, u * 0.2);
        ctx.beginPath(); ctx.roundRect(cx + u * 4.5 + bw, by, bw, u * 7, u * 3.5); ctx.stroke();
        ctx.restore();
        write(ctx, 'VISIT NOW', { x: cx + u * 2.5 + bw / 2, y: by + u * 2.2, size: u * 2.5, font: F.jost, weight: 600, color: '#000', align: 'center', maxWidth: bw, spacing: 0.14, maxLines: 1, alpha: pop, shadow: false });
        write(ctx, 'CALL NOW', { x: cx + u * 4.5 + bw * 1.5, y: by + u * 2.2, size: u * 2.5, font: F.jost, weight: 600, color: th.pale, align: 'center', maxWidth: bw, spacing: 0.14, maxLines: 1, alpha: pop, shadow: false });
      }
    },
    chrome(ctx, d, t, seg) {
      const u = unit(d);
      const th = theme(d);
      // Monogram and name.
      const r = u * 3.6;
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.strokeStyle = th.accent; ctx.lineWidth = Math.max(1, u * 0.22);
      ctx.beginPath(); ctx.arc(u * 5 + r, u * 5 + r, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
      write(ctx, (d.title || 'S').trim().charAt(0).toUpperCase(), { x: u * 5 + r, y: u * 5 + r * 0.38, size: r * 1.25, weight: 600, font: F.serif, color: th.light, align: 'center', maxWidth: r * 2, maxLines: 1, shadow: false });
      write(ctx, d.title, { x: u * 7 + r * 2, y: u * 5 + r * 0.25, size: u * 3.2, weight: 600, font: F.serif, color: th.pale, upper: true, spacing: 0.14, maxWidth: d.w * 0.62, maxLines: 1 });
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
      g.addColorStop(0, th.deep); g.addColorStop(0.5, th.accent); g.addColorStop(1, th.pale);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.roundRect(u * 5, by + u * 3.6, Math.max(u * 0.5, lw * pct), u * 0.5, u * 0.25); ctx.fill();
    },
  };

  // ---- Bold: big uppercase, accent slash, flash cuts, story bars ----
  const bold = {
    deco: 'streaks',
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
      const ho = { size: u * (wide(d) ? 9 : 12.5), weight: 400, font: headFont(d, F.impact), maxWidth, x, upper: true, lineHeight: 0.98, maxLines: 3 };
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
    deco: 'none',
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
      const ho = { size: u * (wide(d) ? 6 : 7), weight: 800, font: headFont(d, F.sans), maxWidth, x: pad, color: th.ink, shadow: false, maxLines: 3, lineHeight: 1.08 };
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
    deco: 'none',
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
        const ho = { size: u * 6.6, weight: 500, font: headFont(d, F.jost), maxWidth: pw - u * 10, x: d.w / 2, align: 'center', color: '#0f172a', shadow: false, maxLines: 3 };
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
      const ho = { x, y: top + u * 9 - (1 - appear) * u * 2, size: u * (wide(d) ? 6.4 : 7.8), weight: 500, font: headFont(d, F.jost), maxWidth, maxLines: 3, lineHeight: 1.05, alpha: appear };
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

  // ---- Editor reveal: a photo-editing app works on each photo step by
  // step (crop, light, colour, finish), then a hard cut shows the finished
  // photo full screen with a slow zoom. Before → after, for every photo.
  const STEPS = ['Crop', 'Light', 'Colour', 'Finish'];
  const YELLOW = '#ffea00';

  const editorCyan = (d) => (HEX.test(d.design?.accent || '') ? d.design.accent : '#00e5ff');

  function coverIn(ctx, img, x, y, w, h, zoom) {
    if (!img) { ctx.fillStyle = '#1e1e1e'; ctx.fillRect(x, y, w, h); return; }
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const s = Math.max(w / iw, h / ih) * zoom;
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.drawImage(img, x + (w - iw * s) / 2, y + (h - ih * s) / 2, iw * s, ih * s);
    ctx.restore();
  }

  // Black-and-white, darkness and warmth with blend modes (works in every
  // browser, unlike canvas filters).
  function grade(ctx, x, y, w, h, gray, dark, warm) {
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    const a = ctx.globalAlpha;
    if (gray > 0) { ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = a * gray; ctx.fillStyle = '#808080'; ctx.fillRect(x, y, w, h); }
    if (dark > 0) { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a * dark; ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, h); }
    if (warm > 0) { ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = a * warm; ctx.fillStyle = '#ff9a3c'; ctx.fillRect(x, y, w, h); }
    ctx.restore();
  }

  function cursor(ctx, x, y, u) {
    ctx.save();
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = Math.max(1, u * 0.25);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + u * 4.2); ctx.lineTo(x + u * 1.1, y + u * 3.1); ctx.lineTo(x + u * 2.1, y + u * 5); ctx.lineTo(x + u * 2.8, y + u * 4.6); ctx.lineTo(x + u * 1.9, y + u * 2.8); ctx.lineTo(x + u * 3.2, y + u * 2.8); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  // The editing app: header, canvas with grid, tool bar, sliders, step pill.
  function editorApp(ctx, d, item, q, local, intro) {
    const u = unit(d);
    const cyan = editorCyan(d);
    const W = d.w;
    const H = d.h;
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, W, H);
    const isWide = wide(d);
    const cx = u * 6;
    const cy = isWide ? H * 0.2 : H * 0.17;
    const cw = isWide ? W * 0.56 : W - u * 12;
    const ch = isWide ? H * 0.66 : H * 0.5;
    const step = Math.min(3, Math.floor(q * 4));
    const sp = q * 4 - step;
    // Header: BEFORE tag and the business name.
    pill(ctx, intro ? 'New project' : 'Before', { x: cx, y: u * 5, size: u * 2.4, bg: YELLOW, color: '#000', font: F.impact, weight: 400, radius: u * 0.6, spacing: 0.08 });
    write(ctx, d.title, { x: cx, y: u * 10, size: u * (isWide ? 4.6 : 5.6), weight: 400, font: headFont(d, F.impact), upper: true, maxWidth: isWide ? W * 0.56 : W - u * 12, maxLines: 1, shadow: false });
    // Canvas with the photo being edited.
    const gray = intro ? 1 : step < 2 ? 1 : step === 2 ? 1 - ease(sp) : 0;
    const dark = intro ? 0.55 : step < 1 ? 0.45 : step === 1 ? 0.45 * (1 - ease(sp)) : 0;
    const warm = intro ? 0 : step < 3 ? 0 : 0.3 * ease(sp);
    const crop = intro ? 0 : step === 0 ? ease(sp) : 1;
    const inset = u * 2.2 * crop;
    coverIn(ctx, item?.img, cx, cy, cw, ch, 1.02 + 0.05 * crop);
    grade(ctx, cx, cy, cw, ch, gray, dark, warm);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = Math.max(1, u * 0.12);
    for (let i = 1; i < 3; i += 1) {
      ctx.beginPath(); ctx.moveTo(cx + (cw * i) / 3, cy); ctx.lineTo(cx + (cw * i) / 3, cy + ch); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + (ch * i) / 3); ctx.lineTo(cx + cw, cy + (ch * i) / 3); ctx.stroke();
    }
    // Crop corners close in during the first step.
    ctx.strokeStyle = step === 0 && !intro ? YELLOW : 'rgba(255,255,255,.85)';
    ctx.lineWidth = Math.max(2, u * 0.5);
    const L = u * 4;
    const x0 = cx + inset; const y0 = cy + inset; const x1 = cx + cw - inset; const y1 = cy + ch - inset;
    for (const [px, py, dx, dy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) {
      ctx.beginPath(); ctx.moveTo(px, py + dy * L); ctx.lineTo(px, py); ctx.lineTo(px + dx * L, py); ctx.stroke();
    }
    ctx.restore();
    if (intro) {
      const fade = ease(local / 0.6);
      write(ctx, d.subtitle || d.title, { x: cx + cw / 2, y: cy + ch * 0.4, size: u * 6, weight: 400, font: headFont(d, F.impact), align: 'center', upper: true, maxWidth: cw - u * 8, maxLines: 3, alpha: fade });
    }
    // Tool bar (crop, light, colour, finish), the active tool lit.
    const tbY = isWide ? cy : cy + ch + u * 3;
    const tbX = isWide ? cx + cw + u * 4 : cx;
    const tbW = isWide ? W - tbX - u * 6 : cw;
    ctx.fillStyle = '#1e1e1e';
    ctx.beginPath(); ctx.roundRect(tbX, tbY, tbW, u * 9, u * 2); ctx.fill();
    STEPS.forEach((name, i) => {
      const bx = tbX + (tbW / 4) * i + tbW / 8;
      const on = !intro && i === step;
      ctx.fillStyle = on ? cyan : 'rgba(255,255,255,.12)';
      ctx.beginPath(); ctx.arc(bx, tbY + u * 3.4, u * 2, 0, Math.PI * 2); ctx.fill();
      write(ctx, name, { x: bx, y: tbY + u * 6.2, size: u * 1.8, weight: 600, font: F.jost, color: on ? cyan : 'rgba(255,255,255,.6)', align: 'center', maxWidth: tbW / 4, maxLines: 1, shadow: false });
    });
    // Sliders that move as the photo is fixed.
    const slY = tbY + u * 12;
    const sliders = [['Light', 0.3 + 0.7 * (intro ? 0 : step > 1 ? 1 : step === 1 ? ease(sp) : 0)], ['Colour', intro ? 0 : step > 2 ? 1 : step === 2 ? ease(sp) : 0], ['Warmth', intro ? 0 : step === 3 ? ease(sp) : 0]];
    let knob = null;
    sliders.forEach(([name, v], i) => {
      const y = slY + i * u * 7;
      const on = !intro && i + 1 === step;
      write(ctx, name, { x: tbX, y, size: u * 2.1, weight: 500, font: F.jost, color: on ? cyan : 'rgba(255,255,255,.7)', maxWidth: tbW * 0.3, maxLines: 1, shadow: false });
      const sx = tbX + tbW * 0.3;
      const sw = tbW * 0.66;
      ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(sx, y + u * 1, sw, u * 0.5);
      ctx.fillStyle = on ? cyan : 'rgba(255,255,255,.55)'; ctx.fillRect(sx, y + u * 1, sw * v, u * 0.5);
      ctx.beginPath(); ctx.arc(sx + sw * v, y + u * 1.25, u * 1.3, 0, Math.PI * 2); ctx.fill();
      if (on) knob = [sx + sw * v, y + u * 1.25];
    });
    if (!intro) cursor(ctx, ...(knob || [x1 - u * 0.5, y1 - u * 0.5]), u);
    // Step counter in the lower third, popping in at each new step.
    const pop = intro ? 1 : 0.7 + 0.3 * ease(sp / 0.25);
    const label = intro ? (d.badge || 'Watch the magic') : `Step ${step + 1}/4 · ${STEPS[step]}`;
    ctx.save();
    const py = isWide ? H - u * 12 : H - u * 15;
    ctx.translate(W / 2, py); ctx.scale(pop, pop); ctx.translate(-W / 2, -py);
    pill(ctx, label, { x: W / 2, y: py, size: u * 3, bg: cyan, color: '#000', font: F.impact, weight: 400, align: 'center', radius: u * 0.8, spacing: 0.06, maxWidth: W * 0.9 });
    ctx.restore();
    if (item?.label && !intro) write(ctx, item.label, { x: W / 2, y: py + u * 7.4, size: u * 2.4, weight: 600, font: F.jost, color: 'rgba(255,255,255,.75)', align: 'center', upper: true, spacing: 0.18, maxWidth: W * 0.85, maxLines: 1, shadow: false });
  }

  // The finished photo full screen, slowly zooming, warm, with its caption.
  function editorReveal(ctx, d, item, q, local, freeze) {
    const u = unit(d);
    const cyan = editorCyan(d);
    coverIn(ctx, item?.img, 0, 0, d.w, d.h, freeze ? 1.15 : 1 + 0.15 * q);
    grade(ctx, 0, 0, d.w, d.h, 0, 0, 0.25);
    gradient(ctx, d, [[0, 'rgba(0,0,0,.45)'], [0.3, 'rgba(0,0,0,0)'], [0.6, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.8)']]);
    if (!freeze) {
      pill(ctx, 'After', { x: u * 6, y: u * 5, size: u * 2.4, bg: YELLOW, color: '#000', font: F.impact, weight: 400, radius: u * 0.6, spacing: 0.08 });
      const x = u * 6;
      const maxWidth = d.w - u * 12;
      const ho = { x, size: u * (wide(d) ? 7 : 8.5), weight: 400, font: headFont(d, F.impact), upper: true, maxWidth, maxLines: 3, lineHeight: 1 };
      const hh = write(ctx, item?.head, { ...ho, measure: true });
      const barH = item?.line ? u * 6 : 0;
      const y = d.h - u * (wide(d) ? 10 : 14) - barH - (barH ? u * 2 : 0) - hh;
      write(ctx, item?.head, { ...ho, y, alpha: ease(local / 0.4) });
      if (item?.line) {
        const slide = ease((local - 0.2) / 0.4);
        pill(ctx, item.line, { x, y: y + hh + u * 2, size: u * 2.9, bg: YELLOW, color: '#000', font: F.impact, weight: 400, radius: u * 0.6, spacing: 0.04, alpha: slide, maxWidth });
      }
      // A quick flash on the cut.
      if (local < 0.15) { ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - local / 0.15)})`; ctx.fillRect(0, 0, d.w, d.h); }
    }
    ctx.fillStyle = cyan;
    ctx.fillRect(0, d.h - u * 0.6, d.w, u * 0.6);
  }

  const editor = {
    deco: 'none',
    transition: { type: 'cut', dur: 0 },
    motion: { zoom: [1, 1.15] },
    draw(ctx, d, seg, t) {
      const local = t - seg.start;
      const item = d.photos[seg.photo];
      if (seg.kind === 'intro') { editorApp(ctx, d, item, 0, local, true); return; }
      if (seg.kind === 'outro') {
        editorReveal(ctx, d, item, 1, local, true);
        const u = unit(d);
        const cyan = editorCyan(d);
        const appear = ease(local / 0.5);
        const pw = Math.min(d.w - u * 12, u * 80);
        const px = (d.w - pw) / 2;
        const ph = u * (d.contact ? 30 : 20);
        const py = (d.h - ph) / 2;
        ctx.save();
        ctx.globalAlpha *= appear;
        ctx.fillStyle = 'rgba(18,18,18,.88)'; ctx.strokeStyle = cyan; ctx.lineWidth = Math.max(1, u * 0.3);
        ctx.beginPath(); ctx.roundRect(px, py, pw, ph, u * 2.5); ctx.fill(); ctx.stroke();
        ctx.restore();
        write(ctx, d.badge || d.title, { x: d.w / 2, y: py + u * 4, size: u * 2.4, weight: 600, font: F.jost, color: cyan, align: 'center', upper: true, spacing: 0.2, maxWidth: pw - u * 6, maxLines: 1, shadow: false, alpha: appear });
        write(ctx, d.closing, { x: d.w / 2, y: py + u * 8, size: u * 6, weight: 400, font: headFont(d, F.impact), align: 'center', upper: true, maxWidth: pw - u * 6, maxLines: 2, shadow: false, alpha: appear });
        if (d.contact) pill(ctx, `Call now · ${d.contact}`, { x: d.w / 2, y: py + ph - u * 10, size: u * 3, bg: YELLOW, color: '#000', font: F.impact, weight: 400, align: 'center', radius: u * 0.8, spacing: 0.04, alpha: appear, maxWidth: pw - u * 6 });
        return;
      }
      const dur = seg.end - seg.start;
      const split = 0.55;
      const p = local / dur;
      if (p < split) editorApp(ctx, d, item, p / split, local, false);
      else editorReveal(ctx, d, item, (p - split) / (1 - split), local - dur * split, false);
    },
    chrome() {},
  };



  // ---- Building blocks the design can mix ----
  const MOTIONS = {
    zoom: { zoom: [1, 1.12], focus: 0.45 },
    pan: { zoom: [1.12, 1.12], pan: 0.08, focus: 0.5 },
    drift: { zoom: [1.04, 1.18], pan: 0.02, rise: 0.015, focus: 0.5 },
    punch: { zoom: [1.02, 1.2], easeIn: true, focus: 0.45 },
  };
  const TRANSITIONS = {
    fade: { type: 'fade', dur: 0.9 }, flash: { type: 'flash', dur: 0.32 }, wipe: { type: 'wipe', dur: 0.8 },
    slide: { type: 'slide', dur: 0.7 }, zoom: { type: 'zoom', dur: 0.8 },
  };
  const rnd = (i, k) => { const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return x - Math.floor(x); };

  // ---- Shared bits for the fast templates ----
  // Condensed text on a solid block, optionally wiped in from the left.
  function blockText(ctx, d, value, o) {
    if (!value) return 0;
    const u = unit(d);
    const size = o.size;
    ctx.save();
    ctx.font = `400 ${size}px ${o.font}`;
    const lines = wrap(ctx, String(value).toUpperCase(), o.maxWidth - size * 0.8, o.maxLines || 2);
    const lh = size * 1.08;
    const widths = lines.map((line) => ctx.measureText(line).width + size * 0.8);
    const total = lines.length * lh + size * 0.3;
    let top = o.anchor === 'bottom' ? o.y - total : o.y;
    const reveal = clamp(o.wipe ?? 1, 0, 1);
    lines.forEach((line, i) => {
      const w = widths[i];
      const left = o.align === 'center' ? o.x - w / 2 : o.x;
      const y = top + i * lh;
      ctx.save();
      ctx.beginPath(); ctx.rect(left, y, w * reveal, lh + size * 0.3); ctx.clip();
      ctx.fillStyle = o.bg;
      ctx.fillRect(left, y, w, lh + size * 0.3);
      ctx.fillStyle = o.color;
      ctx.textBaseline = 'top';
      ctx.fillText(line, left + size * 0.4, y + size * 0.2);
      ctx.restore();
    });
    ctx.restore();
    return total + u * 0.5;
  }

  function coverAt(ctx, img, x, y, w, h, zoom, dx = 0, dy = 0) {
    if (!img) return;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const s = Math.max(w / iw, h / ih) * zoom;
    ctx.drawImage(img, x + (w - iw * s) / 2 + dx, y + (h - ih * s) / 2 + dy, iw * s, ih * s);
  }

  // A soft blurred copy of a photo (drawn small, then stretched), cached.
  const blurred = new WeakMap();
  function blurOf(img) {
    if (!img || typeof document === 'undefined') return img;
    if (blurred.has(img)) return blurred.get(img);
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;
    const c = document.createElement('canvas');
    c.width = 36; c.height = Math.max(1, Math.round((36 * ih) / iw));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    blurred.set(img, c);
    return c;
  }

  function ctaBox(ctx, d, local, accent) {
    const u = unit(d);
    const appear = ease(local / 0.4);
    const pw = Math.min(d.w - u * 12, u * 80);
    const ph = u * (d.contact ? 28 : 18);
    const px = (d.w - pw) / 2;
    const py = d.h - ph - u * (wide(d) ? 8 : 16) + (1 - appear) * u * 4;
    ctx.save();
    ctx.globalAlpha *= appear;
    ctx.fillStyle = 'rgba(0,0,0,.85)'; ctx.strokeStyle = YELLOW; ctx.lineWidth = Math.max(2, u * 0.4);
    ctx.beginPath(); ctx.roundRect(px, py, pw, ph, u * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
    write(ctx, d.badge || d.title, { x: d.w / 2, y: py + u * 3.5, size: u * 2.4, weight: 600, font: F.jost, color: accent, align: 'center', upper: true, spacing: 0.2, maxWidth: pw - u * 6, maxLines: 1, shadow: false, alpha: appear });
    write(ctx, d.closing, { x: d.w / 2, y: py + u * 7.5, size: u * 6, weight: 400, font: headFont(d, F.impact), align: 'center', upper: true, maxWidth: pw - u * 6, maxLines: 2, shadow: false, alpha: appear });
    if (d.contact) pill(ctx, `Call · ${d.contact}`, { x: d.w / 2, y: py + ph - u * 9.5, size: u * 3, bg: YELLOW, color: '#000', font: F.impact, weight: 400, align: 'center', radius: u * 0.8, spacing: 0.04, alpha: appear, maxWidth: pw - u * 6 });
  }

  // ---- Beat drop: photos flash by every 0.15 s with a camera shake, then
  // land on one photo with a big text pop. Cuts only. ----
  const FLICK = 0.15;
  const beat = {
    deco: 'none',
    transition: { type: 'cut', dur: 0 },
    motion: { zoom: [1, 1.1] },
    draw(ctx, d, seg, t) {
      const u = unit(d);
      const accent = editorCyan(d);
      const n = Math.max(1, d.photos.length);
      const local = t - seg.start;
      const dur = seg.end - seg.start;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, d.w, d.h);
      if (seg.kind === 'intro') {
        coverAt(ctx, d.photos[0]?.img, 0, 0, d.w, d.h, 1 + 0.05 * (local / dur));
        gradient(ctx, d, [[0, 'rgba(0,0,0,.55)'], [0.35, 'rgba(0,0,0,0)'], [0.7, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.7)']]);
        blockText(ctx, d, d.title, { x: d.w / 2, y: d.h * 0.12, size: u * 7, font: headFont(d, F.impact), bg: '#000', color: '#fff', align: 'center', maxWidth: d.w - u * 10 });
        blockText(ctx, d, d.subtitle, { x: d.w / 2, y: d.h - u * 16, anchor: 'bottom', size: u * 4.6, font: F.impact, bg: YELLOW, color: '#000', align: 'center', maxWidth: d.w - u * 10, wipe: (local - 0.3) / 0.25 });
        return;
      }
      if (seg.kind === 'outro') {
        coverAt(ctx, d.photos[seg.photo]?.img, 0, 0, d.w, d.h, 1.1);
        ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, d.w, d.h);
        ctaBox(ctx, d, local, accent);
        return;
      }
      const flick = Math.min(1.2, dur * 0.4);
      const item = d.photos[seg.photo] || {};
      if (local < flick) {
        // The fast montage through the other photos.
        const k = Math.floor(local / FLICK);
        const shown = d.photos[(seg.photo + 1 + k) % n];
        const sx = (rnd(k + seg.photo * 7, 1) - 0.5) * u * 4;
        const sy = (rnd(k + seg.photo * 7, 2) - 0.5) * u * 4;
        coverAt(ctx, shown?.img, 0, 0, d.w, d.h, 1.1, sx, sy);
        if (local - k * FLICK < 0.03) { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(0, 0, d.w, d.h); }
        blockText(ctx, d, `${String(seg.photo + 1).padStart(2, '0')}`, { x: d.w - u * 6 - u * 12, y: u * 6, size: u * 6, font: F.impact, bg: accent, color: '#000', maxWidth: u * 20 });
        return;
      }
      // Landing: the scene's photo, a short impact shake, then the text.
      const land = local - flick;
      const shake = Math.max(0, 1 - land / 0.3);
      const sx = Math.sin(land * 70) * u * 2 * shake;
      coverAt(ctx, item.img, 0, 0, d.w, d.h, 1.04 + 0.08 * (land / Math.max(0.1, dur - flick)), sx, 0);
      if (land < 0.06) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(0, 0, d.w, d.h); }
      gradient(ctx, d, [[0, 'rgba(0,0,0,.45)'], [0.3, 'rgba(0,0,0,0)'], [0.7, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.65)']]);
      if (item.label) blockText(ctx, d, item.label, { x: u * 6, y: d.h * 0.13, size: u * 3.6, font: F.impact, bg: accent, color: '#000', maxWidth: d.w - u * 12, maxLines: 1, wipe: land / 0.12 });
      blockText(ctx, d, item.head, { x: u * 6, y: d.h - u * (wide(d) ? 10 : 15), anchor: 'bottom', size: u * (wide(d) ? 6.5 : 8), font: headFont(d, F.impact), bg: '#000', color: '#fff', maxWidth: d.w - u * 12, maxLines: 3, wipe: (land - 0.05) / 0.2 });
      if (item.line) blockText(ctx, d, item.line, { x: u * 6, y: d.h - u * (wide(d) ? 10 : 15) + u * 1.2, size: u * 3.6, font: F.impact, bg: YELLOW, color: '#000', maxWidth: d.w - u * 12, maxLines: 1, wipe: (land - 0.2) / 0.2 });
    },
    chrome() {},
  };

  // ---- 3D pop: the photo sits on a card over a blurred copy of itself.
  // On each change the old card flies towards the viewer while the new one
  // grows from the centre and the background swaps underneath (parallax). ----
  function popCard(ctx, d, img, scale, alpha) {
    if (!img || scale <= 0.01) return;
    const u = unit(d);
    const cw = (wide(d) ? d.w * 0.5 : d.w * 0.8) * scale;
    const ch = (wide(d) ? d.h * 0.72 : d.h * 0.56) * scale;
    const x = (d.w - cw) / 2;
    const y = (d.h - ch) / 2 - u * 2 * scale;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = u * 6; ctx.shadowOffsetY = u * 2;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.roundRect(x - u, y - u, cw + u * 2, ch + u * 2, u * 3); ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.beginPath(); ctx.roundRect(x, y, cw, ch, u * 2.4); ctx.clip();
    coverAt(ctx, img, x, y, cw, ch, 1.02);
    ctx.restore();
  }

  const parallax = {
    deco: 'none',
    transition: { type: 'cut', dur: 0 },
    motion: { zoom: [1, 1.1] },
    draw(ctx, d, seg, t, segs) {
      const u = unit(d);
      const accent = editorCyan(d);
      const local = t - seg.start;
      const dur = seg.end - seg.start;
      const item = d.photos[seg.photo] || {};
      const k = segs.indexOf(seg);
      const prev = k > 0 ? d.photos[segs[k - 1].photo] : null;
      const swap = 0.35;
      const p = clamp(local / swap, 0, 1);
      // Background: blurred, slowly zooming out (opposite to the card).
      const bgImg = local < swap * 0.45 && prev ? prev.img : item.img;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, d.w, d.h);
      if (bgImg) coverAt(ctx, blurOf(bgImg), 0, 0, d.w, d.h, 1.25 - 0.1 * clamp(local / dur, 0, 1));
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, d.w, d.h);
      // Old card flies forward and fades; new card grows from the centre.
      if (prev && prev !== item && p < 1) popCard(ctx, d, prev.img, 1.06 + 0.7 * ease(p), 1 - p);
      const grow = seg.kind === 'outro' ? 1 : (prev === item ? 1 : 1 - Math.pow(1 - p, 3));
      popCard(ctx, d, item.img, grow * (1 + 0.06 * clamp(local / dur, 0, 1)), 1);
      if (seg.kind === 'intro') {
        blockText(ctx, d, d.title, { x: d.w / 2, y: u * 8, size: u * 6.4, font: headFont(d, F.impact), bg: '#000', color: '#fff', align: 'center', maxWidth: d.w - u * 10, wipe: (local - 0.2) / 0.25 });
        blockText(ctx, d, d.subtitle, { x: d.w / 2, y: d.h - u * 8, anchor: 'bottom', size: u * 4.2, font: F.impact, bg: YELLOW, color: '#000', align: 'center', maxWidth: d.w - u * 10, wipe: (local - 0.4) / 0.25 });
      } else if (seg.kind === 'outro') {
        ctaBox(ctx, d, local, accent);
      } else {
        if (item.label) blockText(ctx, d, item.label, { x: d.w / 2, y: u * 8, size: u * 3.4, font: F.impact, bg: YELLOW, color: '#000', align: 'center', maxWidth: d.w - u * 10, maxLines: 1, wipe: (local - 0.3) / 0.2 });
        blockText(ctx, d, item.head, { x: d.w / 2, y: d.h - u * (wide(d) ? 6 : 9), anchor: 'bottom', size: u * (wide(d) ? 5.6 : 6.6), font: headFont(d, F.impact), bg: '#000', color: '#fff', align: 'center', maxWidth: d.w - u * 10, maxLines: 2, wipe: (local - 0.35) / 0.25 });
        if (item.line) pill(ctx, item.line, { x: d.w / 2, y: d.h - u * (wide(d) ? 6 : 9) + u * 1.5, size: u * 2.8, bg: accent, color: '#000', font: F.impact, weight: 400, align: 'center', radius: u * 0.6, spacing: 0.04, alpha: ease((local - 0.55) / 0.3), maxWidth: d.w - u * 10 });
      }
    },
    chrome() {},
  };

  // ---- Layer build-up: one photo stays put while layers stack on it one by
  // one: colour pop, frame, shapes, label, title, price sticker. ----
  const LAYER_AT = [0.08, 0.22, 0.36, 0.5, 0.64, 0.78];
  const popIn = (local, at) => { const x = clamp((local - at) / 0.22, 0, 1); return x <= 0 ? 0 : 1 + 0.25 * Math.sin(x * Math.PI) * (1 - x) + (ease(x) - 1); };

  const stack = {
    deco: 'none',
    transition: { type: 'cut', dur: 0 },
    motion: { zoom: [1, 1.03] },
    draw(ctx, d, seg, t) {
      const u = unit(d);
      const accent = editorCyan(d);
      const local = t - seg.start;
      const dur = seg.end - seg.start;
      // The ending keeps the frame and shapes; its call-to-action box replaces the text layers.
      const item = seg.kind === 'intro' ? { head: d.subtitle || d.title, label: d.title, line: d.badge } : seg.kind === 'outro' ? {} : d.photos[seg.photo] || {};
      const at = (i) => LAYER_AT[i] * (seg.kind === 'outro' ? 0 : dur);
      const img = d.photos[seg.photo]?.img;
      ctx.fillStyle = '#121212'; ctx.fillRect(0, 0, d.w, d.h);
      coverAt(ctx, img, 0, 0, d.w, d.h, 1 + 0.03 * clamp(local / dur, 0, 1));
      // 1. Colour pop.
      const l1 = clamp((local - at(0)) / 0.2, 0, 1);
      if (l1 > 0) grade(ctx, 0, 0, d.w, d.h, 0, 0, 0.3 * l1);
      gradient(ctx, d, [[0, 'rgba(0,0,0,.4)'], [0.35, 'rgba(0,0,0,0)'], [0.65, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.65)']]);
      // 2. Frame.
      const l2 = popIn(local, at(1));
      if (l2 > 0) {
        ctx.save();
        ctx.globalAlpha *= Math.min(1, l2);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(2, u * 0.5);
        const m = u * 4 * (2 - Math.min(1, l2));
        ctx.strokeRect(m, m, d.w - m * 2, d.h - m * 2);
        ctx.restore();
      }
      // 3. Accent shapes.
      const l3 = popIn(local, at(2));
      if (l3 > 0) {
        ctx.save();
        ctx.fillStyle = accent;
        ctx.translate(d.w - u * 14, d.h * 0.3); ctx.rotate(0.6); ctx.scale(l3, l3);
        ctx.fillRect(-u * 9, -u * 0.8, u * 18, u * 1.6);
        ctx.fillRect(-u * 9, u * 2.4, u * 12, u * 1.6);
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = YELLOW; ctx.lineWidth = Math.max(2, u * 0.5);
        ctx.beginPath(); ctx.arc(u * 14, d.h * 0.62, u * 5 * l3, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      // 4. Label, 5. title, 6. sticker.
      const l4 = popIn(local, at(3));
      if (l4 > 0 && item.label) {
        ctx.save(); ctx.translate(u * 8, d.h * 0.12); ctx.scale(l4, l4); ctx.translate(-u * 8, -d.h * 0.12);
        blockText(ctx, d, item.label, { x: u * 8, y: d.h * 0.12, size: u * 3.4, font: F.impact, bg: accent, color: '#000', maxWidth: d.w - u * 16, maxLines: 1 });
        ctx.restore();
      }
      const l5 = clamp((local - at(4)) / 0.25, 0, 1);
      if (l5 > 0) blockText(ctx, d, item.head, { x: u * 8, y: d.h - u * (wide(d) ? 10 : 16), anchor: 'bottom', size: u * (wide(d) ? 6.4 : 7.8), font: headFont(d, F.impact), bg: '#000', color: '#fff', maxWidth: d.w - u * 16, maxLines: 3, wipe: l5 });
      const l6 = popIn(local, at(5));
      if (l6 > 0 && item.line) {
        const r = u * 10;
        ctx.save();
        ctx.translate(d.w - u * 16, d.h * 0.66); ctx.rotate(-0.2); ctx.scale(l6, l6);
        ctx.fillStyle = YELLOW;
        ctx.beginPath();
        for (let i = 0; i < 20; i += 1) { const a = (i / 20) * Math.PI * 2; const rr = i % 2 ? r * 0.85 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
        ctx.closePath(); ctx.fill();
        write(ctx, item.line, { x: 0, y: -r * 0.42, size: r * 0.3, font: F.impact, weight: 400, color: '#000', align: 'center', maxWidth: r * 1.5, maxLines: 2, lineHeight: 1, upper: true, shadow: false });
        ctx.restore();
      }
      // Layer counter, like an editing app.
      if (seg.kind !== 'outro') {
        const done = LAYER_AT.filter((a) => local >= a * dur).length;
        for (let i = 0; i < 6; i += 1) {
          ctx.fillStyle = i < done ? accent : 'rgba(255,255,255,.35)';
          ctx.fillRect(d.w - u * 6 - (6 - i) * u * 2.6, u * 5, u * 2, u * 2);
        }
        write(ctx, `Layer ${done}/6`, { x: d.w - u * 6, y: u * 8.2, size: u * 2, weight: 600, font: F.jost, color: '#fff', align: 'right', maxWidth: u * 30, maxLines: 1 });
      } else {
        ctaBox(ctx, d, local, accent);
      }
    },
    chrome() {},
  };

  const LAYOUTS = { playful, luxe, bold, fresh, clean, editor, beat, parallax, stack };

  // Moving effects over the video.
  function deco(ctx, d, t, kind) {
    const th = theme(d);
    const u = unit(d);
    ctx.save();
    if (kind === 'sparkles') {
      for (const [l, top, s, period, delay] of SPARKLES) {
        const a = Math.max(0, Math.sin(((t + delay) / period) * Math.PI * 2));
        if (a <= 0.05) continue;
        const x = (l / 100) * d.w;
        const y = (top / 100) * d.h;
        const r = (s / 450) * d.w * (0.6 + 0.6 * a);
        ctx.globalAlpha = a * 0.9;
        ctx.fillStyle = '#fffaf0';
        ctx.shadowColor = th.accent; ctx.shadowBlur = r * 3;
        ctx.beginPath();
        ctx.moveTo(x, y - r * 2); ctx.quadraticCurveTo(x, y, x + r * 2, y); ctx.quadraticCurveTo(x, y, x, y + r * 2); ctx.quadraticCurveTo(x, y, x - r * 2, y); ctx.quadraticCurveTo(x, y, x, y - r * 2);
        ctx.fill();
      }
    } else if (kind === 'confetti') {
      const colors = [th.accent, '#ffffff', th.light, '#ff5d8f', '#4ade80'];
      for (let i = 0; i < 28; i += 1) {
        const speed = 0.08 + rnd(i, 1) * 0.1;
        const y = (((t * speed + rnd(i, 2)) % 1.1) - 0.05) * d.h;
        const x = (rnd(i, 3) + Math.sin(t * (0.6 + rnd(i, 4)) + i) * 0.03) * d.w;
        ctx.save();
        ctx.translate(x, y); ctx.rotate(t * (1 + rnd(i, 5) * 3) + i);
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(-u * 0.7, -u * 0.35, u * 1.4, u * 0.7);
        ctx.restore();
      }
    } else if (kind === 'bubbles') {
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = Math.max(1, u * 0.18);
      for (let i = 0; i < 16; i += 1) {
        const speed = 0.05 + rnd(i, 1) * 0.06;
        const y = (1.05 - ((t * speed + rnd(i, 2)) % 1.1)) * d.h;
        const x = (rnd(i, 3) + Math.sin(t * 0.8 + i) * 0.02) * d.w;
        const r = u * (0.8 + rnd(i, 4) * 2.2);
        ctx.globalAlpha = 0.7;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
      }
    } else if (kind === 'petals') {
      for (let i = 0; i < 18; i += 1) {
        const speed = 0.04 + rnd(i, 1) * 0.05;
        const y = (((t * speed + rnd(i, 2)) % 1.1) - 0.05) * d.h;
        const x = (rnd(i, 3) + Math.sin(t * 0.7 + i * 2) * 0.05) * d.w;
        ctx.save();
        ctx.translate(x, y); ctx.rotate(Math.sin(t + i) * 1.2);
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = i % 3 ? th.light : '#ffd1dc';
        ctx.beginPath(); ctx.ellipse(0, 0, u * 1.3, u * 0.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    } else if (kind === 'bokeh') {
      for (let i = 0; i < 10; i += 1) {
        const x = (rnd(i, 1) + Math.sin(t * 0.15 + i) * 0.04) * d.w;
        const y = (rnd(i, 2) + Math.cos(t * 0.12 + i) * 0.03) * d.h;
        const r = u * (4 + rnd(i, 3) * 8);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `${th.light}66`); g.addColorStop(1, `${th.light}00`);
        ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 0.8 + i);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
    } else if (kind === 'streaks') {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i += 1) {
        const p = ((t * 0.35 + rnd(i, 1)) % 1.4) - 0.2;
        const x = p * d.w * 1.4 - d.w * 0.2;
        const g = ctx.createLinearGradient(x - u * 6, 0, x + u * 6, 0);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,.16)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.save();
        ctx.translate(x, d.h / 2); ctx.rotate(0.35); ctx.fillRect(-u * 6, -d.h, u * 12, d.h * 2);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  function scene(ctx, d, L, seg, t, segs, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    if (L.draw) {
      // A design that draws the whole scene itself.
      L.draw(ctx, d, seg, t, segs);
    } else {
      photo(ctx, d, seg, t, segs, MOTIONS[d.design?.motion] || L.motion);
      L.overlay(ctx, d);
      L.text(ctx, d, seg, t - seg.start, segs);
    }
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
    // The editor design always uses hard cuts (its before/after needs them).
    const { type, dur } = (L.draw ? null : TRANSITIONS[d.design?.transition]) || L.transition;
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
      } else if (type === 'slide') {
        const q = ease(p);
        ctx.save(); ctx.translate(-d.w * 0.3 * q, 0); scene(ctx, d, L, prev, t, segs, 1); ctx.restore();
        ctx.save(); ctx.translate(d.w * (1 - q), 0); scene(ctx, d, L, seg, t, segs, 1); ctx.restore();
      } else if (type === 'zoom') {
        scene(ctx, d, L, prev, t, segs, 1);
        const k = 1.15 - 0.15 * ease(p);
        ctx.save(); ctx.translate(d.w / 2, d.h / 2); ctx.scale(k, k); ctx.translate(-d.w / 2, -d.h / 2);
        scene(ctx, d, L, seg, t, segs, ease(p));
        ctx.restore();
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
    deco(ctx, d, t, L.draw ? L.deco : (d.design?.deco || L.deco));
    L.chrome(ctx, d, t, seg, segs);
  }

  const api = {
    LAYOUT_FOR, NAMES, frame, total, layoutFor: (style) => LAYOUT_FOR[style] || 'playful',
    // The building blocks a design (from the AI or "New look") can choose.
    CHOICES: { layout: Object.keys(LAYOUTS), font: ['round', 'serif', 'jost', 'impact', 'sans', 'play'], motion: Object.keys(MOTIONS), transition: Object.keys(TRANSITIONS), deco: ['none', 'sparkles', 'confetti', 'bubbles', 'petals', 'bokeh', 'streaks'] },
    fonts: [`600 40px ${F.round}`, `700 40px ${F.round}`, `600 40px ${F.serif}`, `italic 600 40px ${F.serif}`, `400 40px ${F.jost}`, `500 40px ${F.jost}`, `600 40px ${F.jost}`, `400 40px ${F.impact}`, `700 40px ${F.sans}`, `800 40px ${F.sans}`, `700 40px ${F.play}`],
    fontsUrl: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,600;1,600&family=Jost:wght@400;500;600&family=Anton&family=Poppins:wght@700;800&family=Playfair+Display:wght@700&family=Noto+Sans+Telugu:wght@600;800&family=Noto+Sans+Devanagari:wght@600;800&display=swap',
  };
  if (typeof window !== 'undefined') window.SiteCraftStyles = api;
})();
