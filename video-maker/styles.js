// AI-style video designs for the Photo Video Maker, drawn on a canvas.
// One fixed design per kind of business, so videos do not all look alike:
//   playful (schools, kids, birthdays), luxe (jewellery, weddings),
//   bold (gyms, sales), fresh (food), clean (property, products).
// The same code draws the editor preview, the recorded MP4 and the
// downloadable HTML video (which carries a copy of this file), so it must
// not depend on the page: everything comes in through `d`.
//
// d = { layout, style, w, h, intro, per, outro, title, subtitle, contact,
//       closing, badge, details: [lines], photos: [{ img, label, head, line }] }
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
    script: `"Great Vibes", "Cormorant Garamond", ${SCRIPTS}, cursive`,
  };

  // Which design fits which business type (the AI plan's style).
  const LAYOUT_FOR = {
    jewel: 'luxe', wedding: 'luxe', royal: 'luxe',
    gym: 'bold', offer: 'bold',
    food: 'fresh',
    property: 'clean', product: 'clean',
    birthday: 'playful',
  };

  const NAMES = { playful: 'Playful', luxe: 'Luxe', bold: 'Bold', fresh: 'Fresh', clean: 'Clean', editor: 'Editor reveal', beat: 'Beat drop', parallax: '3D pop', stack: 'Layer build-up', slide: 'Slide cut-in', frame: 'Golden frame', invite: 'Festive invite', sale: 'Flash Sale', product: 'Product Spotlight', compare: 'Before / After', review: 'Customer Love', countdown: 'Top 5 Countdown', story: 'Story Ad', cinema: 'Cinematic Luxury', kinetic: 'Kinetic Text', event: 'Grand Opening' };

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

  // ---- Slide cut-in: the middle of the next photo, cut out in an arch,
  // slides in fast from the side with motion blur over the current photo.
  // The arch holds that photo exactly where the full photo will be, so when
  // it lands in the centre the background cuts to the same photo (with a
  // flash) and the arch melts into it, like a cut-out landing in its own
  // scene. Then a slow zoom out. ----
  const SLIDE = 0.24;
  function archPath(ctx, d, dx) {
    const aw = Math.min(d.w * 0.62, d.h * 0.42);
    const ah = d.h * 0.8;
    const left = (d.w - aw) / 2 + dx;
    const top = d.h - ah;
    const r = aw / 2;
    ctx.beginPath();
    ctx.moveTo(left, d.h);
    ctx.lineTo(left, top + r);
    ctx.arc(left + r, top + r, r, Math.PI, 0);
    ctx.lineTo(left + aw, d.h);
    ctx.closePath();
  }

  const slide = {
    deco: 'none',
    transition: { type: 'cut', dur: 0 },
    motion: { zoom: [1.08, 1] },
    draw(ctx, d, seg, t, segs) {
      const u = unit(d);
      const accent = editorCyan(d);
      const local = t - seg.start;
      const dur = seg.end - seg.start;
      const k = segs.indexOf(seg);
      const item = d.photos[seg.photo] || {};
      const prev = k > 0 ? d.photos[segs[k - 1].photo] : null;
      const sliding = prev && prev.img !== item.img && local < SLIDE && seg.kind !== 'outro';
      const after = Math.max(0, local - (prev && prev.img !== item.img ? SLIDE : 0));
      const zoom = seg.kind === 'intro' ? 1 + 0.05 * (local / dur) : seg.kind === 'outro' ? 1 : 1.08 - 0.08 * clamp(after / Math.max(0.1, dur - SLIDE), 0, 1);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, d.w, d.h);
      if (sliding) {
        coverAt(ctx, prev.img, 0, 0, d.w, d.h, 1);
        const p = local / SLIDE;
        const dx = d.w * (1 - (1 - Math.pow(1 - p, 3)));
        const speed = 3 * Math.pow(1 - p, 2);
        // Motion blur: fading copies trailing behind the arch.
        for (let j = 4; j >= 1; j -= 1) {
          ctx.save();
          ctx.globalAlpha *= 0.16 * speed;
          archPath(ctx, d, dx + j * u * 5 * speed); ctx.clip();
          coverAt(ctx, item.img, 0, 0, d.w, d.h, 1.08, j * u * 5 * speed, 0);
          ctx.restore();
        }
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = u * 5;
        archPath(ctx, d, dx); ctx.fillStyle = '#000'; ctx.fill();
        ctx.shadowColor = 'transparent';
        archPath(ctx, d, dx); ctx.clip();
        coverAt(ctx, item.img, 0, 0, d.w, d.h, 1.08, dx, 0);
        ctx.restore();
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = Math.max(2, u * 0.4);
        archPath(ctx, d, dx); ctx.stroke();
        ctx.restore();
        return;
      }
      coverAt(ctx, (seg.kind === 'outro' ? d.photos[seg.photo] : item).img, 0, 0, d.w, d.h, zoom);
      // The landing flash.
      if (prev && prev.img !== item.img && after < 0.08 && seg.kind !== 'outro') { ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - after / 0.08)})`; ctx.fillRect(0, 0, d.w, d.h); }
      gradient(ctx, d, [[0, 'rgba(0,0,0,.45)'], [0.3, 'rgba(0,0,0,0)'], [0.65, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.7)']]);
      if (seg.kind === 'intro') {
        blockText(ctx, d, d.title, { x: u * 6, y: d.h * 0.12, size: u * 6.6, font: headFont(d, F.impact), bg: '#000', color: '#fff', maxWidth: d.w - u * 12, wipe: (local - 0.2) / 0.25 });
        blockText(ctx, d, d.subtitle, { x: u * 6, y: d.h - u * 14, anchor: 'bottom', size: u * 4.4, font: F.impact, bg: YELLOW, color: '#000', maxWidth: d.w - u * 12, wipe: (local - 0.4) / 0.25 });
      } else if (seg.kind === 'outro') {
        ctaBox(ctx, d, local, accent);
      } else {
        const x = u * 6 - (1 - ease(after / 0.3)) * u * 20;
        if (item.label) blockText(ctx, d, item.label, { x, y: d.h * 0.12, size: u * 3.4, font: F.impact, bg: YELLOW, color: '#000', maxWidth: d.w - u * 12, maxLines: 1 });
        blockText(ctx, d, item.head, { x: u * 6, y: d.h - u * (wide(d) ? 10 : 15), anchor: 'bottom', size: u * (wide(d) ? 6.4 : 7.8), font: headFont(d, F.impact), bg: '#000', color: '#fff', maxWidth: d.w - u * 12, maxLines: 3, wipe: (after - 0.1) / 0.25 });
        if (item.line) pill(ctx, item.line, { x: u * 6, y: d.h - u * (wide(d) ? 10 : 15) + u * 1.5, size: u * 2.8, bg: accent, color: '#000', font: F.impact, weight: 400, radius: u * 0.6, spacing: 0.04, alpha: ease((after - 0.3) / 0.3), maxWidth: d.w - u * 12 });
      }
    },
    chrome() {},
  };

  // ---- Golden frame: wishes (anniversaries, weddings, birthdays). The
  // photo sits in a gold frame over a dark blurred copy of itself, breathing
  // and swaying gently, with rising golden bokeh and hearts, soft light rays
  // and calligraphy text with a gold glow; photos cross-fade inside the
  // frame and the video fades to black at the end. ----
  const goldOf = (d) => (HEX.test(d.design?.accent || '') ? d.design.accent : '#d4af37');
  const CREAM = '#fffdd0';

  function heart(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.3);
    ctx.bezierCurveTo(x, y - s * 0.3, x - s, y - s * 0.3, x - s, y + s * 0.2);
    ctx.bezierCurveTo(x - s, y + s * 0.7, x, y + s, x, y + s * 1.2);
    ctx.bezierCurveTo(x, y + s, x + s, y + s * 0.7, x + s, y + s * 0.2);
    ctx.bezierCurveTo(x + s, y - s * 0.3, x, y - s * 0.3, x, y + s * 0.3);
    ctx.fill();
  }

  function frameBox(d) {
    const fw = wide(d) ? d.h * 0.62 : d.w * 0.74;
    const fh = wide(d) ? d.h * 0.7 : d.h * 0.5;
    return { fw, fh, cx: wide(d) ? d.w * 0.32 : d.w / 2, cy: wide(d) ? d.h * 0.48 : d.h * 0.4 };
  }

  const golden = {
    deco: 'none',
    transition: { type: 'cut', dur: 0 },
    motion: { zoom: [1, 1.04] },
    draw(ctx, d, seg, t, segs) {
      const u = unit(d);
      const gold = goldOf(d);
      const light = tint(gold, 0.55);
      const local = t - seg.start;
      const dur = seg.end - seg.start;
      const k = segs.indexOf(seg);
      const item = d.photos[seg.photo] || {};
      const prev = k > 0 ? d.photos[segs[k - 1].photo] : null;
      const fade = prev && prev.img !== item.img ? clamp(local / 0.7, 0, 1) : 1;
      // Dark blurred background of the photo.
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, d.w, d.h);
      if (prev && fade < 1) coverAt(ctx, blurOf(prev.img), 0, 0, d.w, d.h, 1.2);
      ctx.save(); ctx.globalAlpha *= fade; coverAt(ctx, blurOf(item.img), 0, 0, d.w, d.h, 1.2); ctx.restore();
      ctx.fillStyle = 'rgba(0,0,0,.58)'; ctx.fillRect(0, 0, d.w, d.h);
      // Soft light rays from the top.
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i += 1) {
        const a = -0.5 + i * 0.25 + Math.sin(t * 0.3 + i) * 0.05;
        ctx.save();
        ctx.translate(d.w / 2, -u * 10); ctx.rotate(a);
        const g = ctx.createLinearGradient(0, 0, 0, d.h);
        g.addColorStop(0, `${gold}40`); g.addColorStop(1, `${gold}00`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(-u, 0); ctx.lineTo(u, 0); ctx.lineTo(u * 9, d.h * 1.1); ctx.lineTo(-u * 9, d.h * 1.1); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      // The framed photo: scales in at the start, then breathes and sways.
      const { fw, fh, cx, cy } = frameBox(d);
      const enter = seg.kind === 'intro' ? 0.9 + 0.1 * ease(local / 1.2) : 1;
      const breathe = 1 + 0.02 * (1 - Math.cos((t / 15) * Math.PI * 2));
      const s = enter * breathe;
      const sx = Math.sin(t * 1.3) * u * 0.3;
      const sy = Math.cos(t * 1.1) * u * 0.3;
      const w = fw * s;
      const h = fh * s;
      const x = cx - w / 2 + sx;
      const y = cy - h / 2 + sy;
      ctx.save();
      ctx.globalAlpha *= seg.kind === 'intro' ? ease(local / 0.8) : 1;
      ctx.shadowColor = `${gold}aa`; ctx.shadowBlur = u * 5;
      ctx.fillStyle = gold;
      ctx.beginPath(); ctx.roundRect(x - u * 1.4, y - u * 1.4, w + u * 2.8, h + u * 2.8, u * 4); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.save();
      ctx.beginPath(); ctx.roundRect(x, y, w, h, u * 3); ctx.clip();
      if (prev && fade < 1) coverAt(ctx, prev.img, x, y, w, h, 1.02);
      ctx.globalAlpha *= fade;
      coverAt(ctx, item.img, x, y, w, h, 1.02);
      ctx.restore();
      // Inner fine line and corner gems.
      ctx.strokeStyle = light; ctx.lineWidth = Math.max(1, u * 0.25);
      ctx.beginPath(); ctx.roundRect(x + u * 1.2, y + u * 1.2, w - u * 2.4, h - u * 2.4, u * 2.2); ctx.stroke();
      ctx.fillStyle = light;
      for (const [gx, gy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) {
        ctx.save(); ctx.translate(gx, gy); ctx.rotate(Math.PI / 4); ctx.fillRect(-u * 1.1, -u * 1.1, u * 2.2, u * 2.2); ctx.restore();
      }
      ctx.restore();
      // Text under the frame (beside it on wide videos).
      const tx = wide(d) ? d.w * 0.74 : d.w / 2;
      const maxWidth = wide(d) ? d.w * 0.44 : d.w * 0.88;
      let ty = wide(d) ? d.h * 0.28 : cy + fh / 2 + u * 6;
      const appear = ease((local - 0.3) / 0.6);
      const glow = { shadow: false };
      const script = (value, size) => {
        if (!value) return 0;
        ctx.save();
        ctx.shadowColor = gold; ctx.shadowBlur = size * 0.35;
        const hgt = write(ctx, value, { x: tx, y: ty, size, weight: 400, font: F.script, color: CREAM, align: 'center', maxWidth, maxLines: 2, lineHeight: 1.05, alpha: appear, ...glow });
        ctx.restore();
        return hgt;
      };
      if (seg.kind === 'intro') {
        ty += script(d.subtitle || 'Happy Anniversary', u * (wide(d) ? 8 : 9.5)) + u * 1.5;
        write(ctx, d.title, { x: tx, y: ty, size: u * 4.2, weight: 600, font: F.serif, color: light, align: 'center', upper: true, spacing: 0.16, maxWidth, maxLines: 2, alpha: ease((local - 0.6) / 0.6), shadow: false });
      } else if (seg.kind === 'outro') {
        ty += script(d.closing, u * (wide(d) ? 7 : 8.5)) + u * 1.5;
        write(ctx, d.title, { x: tx, y: ty, size: u * 3.8, weight: 600, font: F.serif, color: light, align: 'center', upper: true, spacing: 0.16, maxWidth, maxLines: 1, alpha: appear, shadow: false });
        if (d.contact) write(ctx, d.contact, { x: tx, y: ty + u * 6, size: u * 3, weight: 500, font: F.jost, color: 'rgba(255,255,255,.85)', align: 'center', maxWidth, maxLines: 1, alpha: appear, shadow: false });
      } else {
        if (item.label) { write(ctx, item.label, { x: tx, y: ty, size: u * 2.4, weight: 600, font: F.jost, color: light, align: 'center', upper: true, spacing: 0.3, maxWidth, maxLines: 1, alpha: appear, shadow: false }); ty += u * 4.5; }
        ty += script(item.head || d.subtitle, u * (wide(d) ? 7 : 8.5)) + u * 1.2;
        write(ctx, item.line, { x: tx, y: ty, size: u * 3.2, weight: 400, font: F.serif, italic: true, color: 'rgba(255,255,255,.9)', align: 'center', maxWidth, maxLines: 2, alpha: ease((local - 0.6) / 0.6), shadow: false });
      }
      // Rising golden bokeh with a few hearts.
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 26; i += 1) {
        const speed = 0.025 + rnd(i, 1) * 0.04;
        const py = (1.05 - ((t * speed + rnd(i, 2)) % 1.1)) * d.h;
        const px = (rnd(i, 3) + Math.sin(t * 0.5 + i) * 0.03) * d.w;
        const tw = 0.5 + 0.5 * Math.sin(t * (1 + rnd(i, 4)) + i);
        ctx.globalAlpha = 0.35 + 0.5 * tw;
        if (i % 6 === 0) {
          ctx.fillStyle = `${light}cc`;
          heart(ctx, px, py, u * (0.9 + rnd(i, 5)));
        } else {
          const r = u * (0.5 + rnd(i, 5) * 1.8);
          const g = ctx.createRadialGradient(px, py, 0, px, py, r * 2.2);
          g.addColorStop(0, `${light}ee`); g.addColorStop(1, `${gold}00`);
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(px, py, r * 2.2, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.restore();
      // Fade to black at the very end.
      if (seg.kind === 'outro') {
        const out = clamp((local - (dur - 1.5)) / 1.5, 0, 1);
        if (out > 0) { ctx.fillStyle = `rgba(0,0,0,${out})`; ctx.fillRect(0, 0, d.w, d.h); }
      }
    },
    chrome() {},
  };

  // ---- Festive invite: a traditional invitation (half saree, house
  // warming, naming ceremony, wedding). A moving turmeric-to-kumkum
  // background with a turning mandala, a mango-leaf toran and marigold
  // garlands that drop in and sway, the photo in a golden mandapam arch,
  // the name in calligraphy and the event details sliding up one by one. ----
  function inviteArch(ctx, x, y, w, h) {
    const r = w / 2;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.arc(x + r, y + r, r, Math.PI, 0);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
  }

  function marigold(ctx, x, y, r) {
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, '#ffd23f'); g.addColorStop(0.6, '#ff9f1c'); g.addColorStop(1, '#e85d04');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  function mangoLeaf(ctx, x, y, len, angle) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(angle);
    const g = ctx.createLinearGradient(-len * 0.2, 0, len * 0.2, 0);
    g.addColorStop(0, '#1b5e20'); g.addColorStop(0.5, '#43a047'); g.addColorStop(1, '#1b5e20');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.32, len * 0.45, 0, len);
    ctx.quadraticCurveTo(-len * 0.32, len * 0.45, 0, 0);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = Math.max(1, len * 0.02);
    ctx.beginPath(); ctx.moveTo(0, len * 0.05); ctx.lineTo(0, len * 0.92); ctx.stroke();
    ctx.restore();
  }

  const invite = {
    deco: 'none',
    transition: { type: 'cut', dur: 0 },
    motion: { zoom: [1, 1.08] },
    draw(ctx, d, seg, t, segs) {
      const u = unit(d);
      const gold = goldOf(d);
      const local = t - seg.start;
      const dur = seg.end - seg.start;
      const k = segs.indexOf(seg);
      const item = d.photos[seg.photo] || {};
      const prev = k > 0 ? d.photos[segs[k - 1].photo] : null;
      const fade = prev && prev.img !== item.img ? clamp(local / 0.7, 0, 1) : 1;
      // Moving turmeric-to-kumkum background.
      const shift = Math.sin(t * 0.25) * d.w * 0.2;
      const bg = ctx.createLinearGradient(shift, 0, d.w - shift, d.h);
      bg.addColorStop(0, '#ffc107'); bg.addColorStop(0.5, '#f57c00'); bg.addColorStop(1, '#b0003a');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, d.w, d.h);
      // A slowly turning mandala behind the frame.
      const { fw, fh, cx, cy } = frameBox(d);
      ctx.save();
      ctx.translate(cx, cy); ctx.rotate(t * 0.08);
      ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = Math.max(1, u * 0.25);
      for (let ring = 1; ring <= 4; ring += 1) {
        const r = fh * 0.22 * ring;
        const petals = 8 * ring;
        for (let i = 0; i < petals; i += 1) {
          const a = (i / petals) * Math.PI * 2;
          ctx.beginPath(); ctx.ellipse(Math.cos(a) * r, Math.sin(a) * r, u * 2.2 * ring * 0.6, u * 0.9 * ring * 0.6, a, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
      // The photo in a golden mandapam arch, slowly zooming.
      const enter = seg.kind === 'intro' ? 0.88 + 0.12 * ease((local - 0.6) / 1) : 1;
      const w = fw * 0.92 * enter;
      const h = fh * 1.04 * enter;
      const x = cx - w / 2;
      const y = cy - h / 2;
      const zoom = 1 + 0.08 * clamp(local / dur, 0, 1);
      ctx.save();
      ctx.globalAlpha *= seg.kind === 'intro' ? ease((local - 0.5) / 0.7) : 1;
      ctx.shadowColor = 'rgba(80,0,20,.55)'; ctx.shadowBlur = u * 5;
      ctx.fillStyle = gold;
      inviteArch(ctx, x - u * 1.8, y - u * 1.8, w + u * 3.6, h + u * 3.6); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.save();
      inviteArch(ctx, x, y, w, h); ctx.clip();
      ctx.fillStyle = '#fff3e0'; ctx.fillRect(x, y, w, h);
      if (prev && fade < 1) coverAt(ctx, prev.img, x, y, w, h, zoom);
      ctx.globalAlpha *= fade;
      coverAt(ctx, item.img, x, y, w, h, zoom);
      ctx.restore();
      // Marigold beads along the arch.
      const r = w / 2;
      const beads = 22;
      for (let i = 0; i <= beads; i += 1) {
        const a = Math.PI + (i / beads) * Math.PI;
        marigold(ctx, x + r + Math.cos(a) * (r + u * 0.9), y + r + Math.sin(a) * (r + u * 0.9), u * 1.1);
      }
      for (let i = 1; i <= 6; i += 1) {
        const py = y + r + ((h - r) * i) / 6;
        marigold(ctx, x - u * 0.9, py, u * 1.1); marigold(ctx, x + w + u * 0.9, py, u * 1.1);
      }
      ctx.restore();
      // Toran and side garlands drop in at the start and sway.
      const drop = (1 - ease(t / 1.2)) * u * 24;
      const sway = Math.sin(t * 1.4) * 0.06;
      ctx.save();
      ctx.translate(0, -drop);
      ctx.strokeStyle = '#8d6e63'; ctx.lineWidth = Math.max(1, u * 0.3);
      ctx.beginPath(); ctx.moveTo(0, u * 3); ctx.quadraticCurveTo(d.w / 2, u * 6, d.w, u * 3); ctx.stroke();
      const leaves = wide(d) ? 15 : 9;
      for (let i = 0; i < leaves; i += 1) {
        const lx = ((i + 0.5) / leaves) * d.w;
        const ly = u * 3 + Math.sin((lx / d.w) * Math.PI) * u * 3;
        mangoLeaf(ctx, lx, ly, u * 9, sway * (i % 2 ? 1 : -1));
        marigold(ctx, lx + d.w / leaves / 2, ly + u * 0.6, u * 1.4);
      }
      for (const side of [u * 4, d.w - u * 4]) {
        const strands = wide(d) ? 12 : 16;
        for (let i = 0; i < strands; i += 1) {
          const gy = u * 8 + i * u * 2.6;
          const gx = side + Math.sin(t * 1.2 + i * 0.3) * u * 0.4 * (i / strands);
          marigold(ctx, gx, gy, u * 1.25);
        }
      }
      ctx.restore();
      // Text.
      const tx = wide(d) ? d.w * 0.74 : d.w / 2;
      const maxWidth = wide(d) ? d.w * 0.44 : d.w * 0.86;
      let ty = wide(d) ? d.h * 0.22 : cy + fh / 2 + u * 5;
      const glowText = (value, o) => {
        if (!value) return 0;
        ctx.save();
        ctx.shadowColor = 'rgba(90,0,20,.85)'; ctx.shadowBlur = o.size * 0.3; ctx.shadowOffsetY = o.size * 0.05;
        const hgt = write(ctx, value, { x: tx, align: 'center', maxWidth, shadow: false, ...o, y: ty });
        ctx.restore();
        return hgt;
      };
      if (seg.kind === 'intro') {
        // Heading pops in on the toran.
        const pop = popIn(local, 1.0);
        const label = d.badge || 'Invitation';
        if (pop > 0) {
          ctx.save();
          const py = wide(d) ? u * 10 : d.h * 0.12;
          ctx.translate(d.w / 2, py); ctx.scale(pop, pop); ctx.translate(-d.w / 2, -py);
          pill(ctx, label, { x: d.w / 2, y: py, size: u * 2.8, bg: '#7b1030', color: '#ffe082', font: F.serif, weight: 600, align: 'center', spacing: 0.2, maxWidth: d.w * 0.8 });
          ctx.restore();
        }
        ty += glowText(d.subtitle || 'You are invited', { size: u * (wide(d) ? 6 : 7), weight: 700, font: headFont(d, F.play), color: '#fff8e1', maxLines: 2, alpha: ease((local - 1.2) / 0.6) }) + u * 1;
        glowText(d.title, { size: u * (wide(d) ? 7 : 8.5), weight: 400, font: F.script, color: '#ffe082', maxLines: 1, alpha: ease((local - 1.6) / 0.6) });
        return;
      }
      ty += glowText(seg.kind === 'outro' ? d.closing : (item.head || d.title), { size: u * (wide(d) ? 6.6 : 8), weight: 400, font: F.script, color: '#ffe082', maxLines: 2, alpha: ease(local / 0.5) }) + u * 1.5;
      const lines = (d.details && d.details.length ? d.details : [item.line].filter(Boolean));
      lines.slice(0, 4).forEach((line, i) => {
        const p = ease((local - 0.4 - i * 0.35) / 0.45);
        if (p <= 0) return;
        ctx.save();
        ctx.translate(0, (1 - p) * u * 5);
        glowText(line, { size: u * 3.4, weight: 600, font: F.jost, color: '#ffffff', maxLines: 1, alpha: p });
        ctx.restore();
        ty += u * 5;
      });
      if (seg.kind === 'outro' && d.contact) glowText(`📞 ${d.contact}`, { size: u * 3.2, weight: 600, font: F.jost, color: '#ffe082', maxLines: 1, alpha: ease((local - 1.6) / 0.5) });
    },
    chrome() {},
  };

  // ===================== Ad templates =====================
  // Ten designs built on the editing techniques most used in social media
  // ads. Each draws whole scenes itself (`draw`) and handles its own
  // transitions, so the timeline only cuts between segments.
  const acc = (d, fallback) => (HEX.test(d.design?.accent || '') ? d.design.accent : fallback);
  const prevOf = (d, segs, seg) => { const k = segs.indexOf(seg); return k > 0 ? d.photos[segs[k - 1].photo] : null; };
  const words = (value) => String(value || '').split(/\s+/).filter(Boolean);

  function starburst(ctx, x, y, r, spikes, color, rot = 0) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i += 1) {
      const a = (i / (spikes * 2)) * Math.PI * 2;
      const rr = i % 2 ? r * 0.78 : r;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // Text on a tilted tape (sale stickers).
  function tape(ctx, d, value, x, y, angle, bg, color, size) {
    if (!value) return;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(angle);
    ctx.font = `400 ${size}px ${F.impact}`;
    const w = ctx.measureText(String(value).toUpperCase()).width + size * 1.4;
    ctx.fillStyle = bg;
    ctx.fillRect(-w / 2, -size * 0.8, w, size * 1.6);
    ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(value).toUpperCase(), 0, size * 0.05);
    ctx.restore();
  }

  function confettiBurst(ctx, d, local, colors) {
    const u = unit(d);
    if (local < 0 || local > 3) return;
    ctx.save();
    for (let i = 0; i < 46; i += 1) {
      const a = rnd(i, 1) * Math.PI * 2;
      const v = (0.35 + rnd(i, 2) * 0.55) * d.h;
      const x = d.w / 2 + Math.cos(a) * v * local * 0.6;
      const y = d.h * 0.45 + Math.sin(a) * v * local * 0.6 + 0.5 * d.h * 0.5 * local * local;
      ctx.globalAlpha = clamp(1 - local / 3, 0, 1);
      ctx.save(); ctx.translate(x, y); ctx.rotate(local * 6 + i);
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(-u * 0.8, -u * 0.4, u * 1.6, u * 0.8);
      ctx.restore();
    }
    ctx.restore();
  }

  function grain(ctx, d, t, amount) {
    const u = unit(d);
    ctx.save();
    const frameNo = Math.floor(t * 24);
    for (let i = 0; i < 160; i += 1) {
      ctx.globalAlpha = amount * rnd(i, frameNo);
      ctx.fillStyle = rnd(i + 3, frameNo) > 0.5 ? '#fff' : '#000';
      ctx.fillRect(rnd(i, frameNo + 1) * d.w, rnd(i, frameNo + 2) * d.h, u * 0.3, u * 0.3);
    }
    ctx.restore();
  }

  // ---- 1. Flash Sale: zoom punch, shake, flash cut, tapes, price burst,
  // pulsing shop-now button. ----
  const sale = {
    deco: 'none', transition: { type: 'cut', dur: 0 }, motion: { zoom: [1, 1.1] },
    draw(ctx, d, seg, t) {
      const u = unit(d);
      const red = acc(d, '#ff1744');
      const yellow = '#ffd600';
      const local = t - seg.start;
      const dur = seg.end - seg.start;
      const item = d.photos[seg.photo] || {};
      const punch = 1.25 - 0.2 * ease(local / 0.3) + 0.05 * clamp(local / dur, 0, 1);
      const shake = Math.max(0, 1 - local / 0.3);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, d.w, d.h);
      coverAt(ctx, item.img, 0, 0, d.w, d.h, punch, Math.sin(local * 80) * u * 2 * shake, Math.cos(local * 70) * u * 1.5 * shake);
      gradient(ctx, d, [[0, 'rgba(0,0,0,.35)'], [0.4, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.75)']]);
      if (local < 0.08) { ctx.fillStyle = `rgba(255,255,255,${0.8 * (1 - local / 0.08)})`; ctx.fillRect(0, 0, d.w, d.h); }
      // Diagonal sale stripes along the bottom.
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.translate(0, d.h * 0.82); ctx.rotate(-0.08);
      ctx.fillStyle = red; ctx.fillRect(-d.w * 0.1, -u * 2, d.w * 1.2, u * 1.6);
      ctx.fillStyle = yellow; ctx.fillRect(-d.w * 0.1, u * 0.2, d.w * 1.2, u * 0.8);
      ctx.restore();
      if (seg.kind === 'intro') {
        const slam = Math.max(1, 2.4 - 1.4 * ease(local / 0.35));
        ctx.save();
        ctx.translate(d.w / 2, d.h * 0.42); ctx.scale(slam, slam); ctx.translate(-d.w / 2, -d.h * 0.42);
        blockText(ctx, d, d.subtitle || 'Big Sale', { x: d.w / 2, y: d.h * 0.36, size: u * (wide(d) ? 9 : 11), font: headFont(d, F.impact), bg: red, color: '#fff', align: 'center', maxWidth: d.w - u * 8, maxLines: 3 });
        ctx.restore();
        tape(ctx, d, d.badge || 'Limited time', d.w * 0.34, d.h * 0.18, -0.12, yellow, '#000', u * 3.4);
        blockText(ctx, d, d.title, { x: d.w / 2, y: d.h - u * 22, size: u * 4, font: F.impact, bg: '#000', color: '#fff', align: 'center', maxWidth: d.w - u * 10, maxLines: 1, wipe: (local - 0.4) / 0.25 });
        return;
      }
      if (seg.kind === 'outro') {
        blockText(ctx, d, d.closing, { x: d.w / 2, y: d.h * 0.34, size: u * 8.5, font: headFont(d, F.impact), bg: red, color: '#fff', align: 'center', maxWidth: d.w - u * 8, maxLines: 2, wipe: local / 0.3 });
        const pulse = 1 + 0.06 * Math.sin(local * 8);
        const by = d.h * 0.58;
        ctx.save();
        ctx.translate(d.w / 2, by); ctx.scale(pulse, pulse); ctx.translate(-d.w / 2, -by);
        pill(ctx, 'Shop now', { x: d.w / 2, y: by, size: u * 4.4, bg: yellow, color: '#000', font: F.impact, weight: 400, align: 'center', radius: u * 1.2, spacing: 0.06 });
        ctx.restore();
        // A tapping finger pointer.
        ctx.save();
        ctx.font = `${u * 7}px sans-serif`; ctx.textAlign = 'center';
        ctx.fillText('👆', d.w / 2 + u * 14, by + u * 13 + Math.sin(local * 8) * u);
        ctx.restore();
        if (d.contact) blockText(ctx, d, `Call ${d.contact}`, { x: d.w / 2, y: by + u * 22, size: u * 4, font: F.impact, bg: '#000', color: '#fff', align: 'center', maxWidth: d.w - u * 10, maxLines: 1 });
        return;
      }
      tape(ctx, d, item.label || d.badge || 'Hot deal', u * 26, d.h * 0.15, -0.1, yellow, '#000', u * 3.2);
      blockText(ctx, d, item.head, { x: u * 6, y: d.h * 0.78, anchor: 'bottom', size: u * (wide(d) ? 7 : 9), font: headFont(d, F.impact), bg: red, color: '#fff', maxWidth: d.w - u * 12, maxLines: 3, wipe: (local - 0.1) / 0.25 });
      if (item.line) {
        const pop = popIn(local, 0.35);
        if (pop > 0) {
          const r = u * 13 * pop * (1 + 0.04 * Math.sin(local * 6));
          const cx = d.w - u * 17;
          const cy = d.h * 0.32;
          starburst(ctx, cx, cy, r, 14, yellow, local * 0.4);
          starburst(ctx, cx, cy, r * 0.86, 14, red, local * 0.4);
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.15);
          write(ctx, item.line, { x: 0, y: -r * 0.36, size: r * 0.28, font: F.impact, weight: 400, color: '#fff', align: 'center', maxWidth: r * 1.4, maxLines: 2, lineHeight: 1, upper: true, shadow: false });
          ctx.restore();
        }
      }
    },
    chrome() {},
  };

  // ---- 3. Product Spotlight: the photo on a tilting card over light rays,
  // with callout lines pointing at it, swiping between products. ----
  const product = {
    deco: 'none', transition: { type: 'cut', dur: 0 }, motion: { zoom: [1, 1.05] },
    draw(ctx, d, seg, t, segs) {
      const u = unit(d);
      const glow = acc(d, '#38bdf8');
      const local = t - seg.start;
      const dur = seg.end - seg.start;
      const item = d.photos[seg.photo] || {};
      const prev = prevOf(d, segs, seg);
      // Dark stage with a glow and turning rays.
      const bg = ctx.createRadialGradient(d.w / 2, d.h * 0.4, 0, d.w / 2, d.h * 0.4, Math.max(d.w, d.h) * 0.8);
      bg.addColorStop(0, tint(glow, -0.55)); bg.addColorStop(1, '#05070d');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, d.w, d.h);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(d.w / 2, d.h * 0.4); ctx.rotate(t * 0.15);
      for (let i = 0; i < 12; i += 1) {
        ctx.rotate(Math.PI / 6);
        ctx.fillStyle = `${glow}14`;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-u * 6, -d.h); ctx.lineTo(u * 6, -d.h); ctx.fill();
      }
      ctx.restore();
      const cw = wide(d) ? d.h * 0.62 : d.w * 0.78;
      const ch = cw * 1.08;
      const cx = wide(d) ? d.w * 0.34 : d.w / 2;
      const cy = wide(d) ? d.h * 0.48 : d.h * 0.4;
      const card = (img, offsetX, alpha, s) => {
        if (!img) return;
        const tilt = Math.sin(t * 1.2) * 0.04;
        ctx.save();
        ctx.globalAlpha *= alpha;
        ctx.translate(cx + offsetX, cy); ctx.transform(1, tilt * 0.5, tilt, 1, 0, 0); ctx.scale(s, s);
        ctx.shadowColor = `${glow}88`; ctx.shadowBlur = u * 8; ctx.shadowOffsetY = u * 3;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.roundRect(-cw / 2, -ch / 2, cw, ch, u * 3); ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.beginPath(); ctx.roundRect(-cw / 2 + u, -ch / 2 + u, cw - u * 2, ch - u * 2, u * 2.4); ctx.clip();
        coverAt(ctx, img, -cw / 2 + u, -ch / 2 + u, cw - u * 2, ch - u * 2, 1 + 0.05 * clamp(local / dur, 0, 1));
        ctx.restore();
      };
      const swap = prev && prev.img !== item.img ? ease(local / 0.45) : 1;
      if (swap < 1) card(prev.img, -d.w * swap, 1 - swap, 1);
      const rise = seg.kind === 'intro' ? ease(local / 0.8) : 1;
      card(item.img, d.w * (1 - swap), 1, 0.85 + 0.15 * rise);
      const tx = wide(d) ? d.w * 0.74 : d.w / 2;
      const maxWidth = wide(d) ? d.w * 0.42 : d.w - u * 10;
      const ty = wide(d) ? d.h * 0.3 : cy + ch / 2 + u * 7;
      if (seg.kind === 'intro') {
        pill(ctx, d.badge || 'New arrival', { x: tx, y: ty, size: u * 2.8, bg: glow, color: '#000', font: F.sans, weight: 800, align: 'center', spacing: 0.12 });
        write(ctx, d.title, { x: tx, y: ty + u * 8, size: u * 7, weight: 800, font: headFont(d, F.sans), align: 'center', maxWidth, maxLines: 2, alpha: ease((local - 0.4) / 0.5) });
        write(ctx, d.subtitle, { x: tx, y: ty + u * 17, size: u * 3.4, weight: 500, font: F.jost, color: 'rgba(255,255,255,.8)', align: 'center', maxWidth, maxLines: 2, alpha: ease((local - 0.7) / 0.5) });
        return;
      }
      if (seg.kind === 'outro') { ctaBox(ctx, d, local, glow); return; }
      // Callouts: dots on the card with lines to the feature labels.
      const callout = (value, side, at, py) => {
        if (!value) return;
        const p = clamp((local - at) / 0.4, 0, 1);
        if (p <= 0) return;
        const dotX = cx + side * cw * 0.18;
        const dotY = cy + py * ch;
        const endX = wide(d) ? dotX + side * u * 12 : cx + side * (cw / 2 + u * 2);
        const endY = dotY - u * 6;
        ctx.save();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1, u * 0.3);
        ctx.beginPath(); ctx.moveTo(dotX, dotY);
        const mx = dotX + (endX - dotX) * Math.min(1, p * 2);
        const my = dotY + (endY - dotY) * Math.min(1, p * 2);
        ctx.lineTo(mx, my); ctx.stroke();
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(dotX, dotY, u * (1 + 0.3 * Math.sin(local * 6)), 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        if (p > 0.5) pill(ctx, value, { x: endX, y: endY - u * 3, size: u * 2.4, bg: 'rgba(255,255,255,.95)', color: '#0b1222', font: F.sans, weight: 800, align: side > 0 ? 'right' : 'left', spacing: 0.04, alpha: ease((p - 0.5) * 2), maxWidth: d.w * 0.5 });
      };
      callout(item.label, -1, 0.3, -0.18);
      callout(item.line, 1, 0.6, 0.15);
      write(ctx, item.head, { x: tx, y: ty, size: u * (wide(d) ? 6 : 7), weight: 800, font: headFont(d, F.sans), align: 'center', maxWidth, maxLines: 2, alpha: ease((local - 0.2) / 0.4) });
      ctx.fillStyle = glow;
      ctx.fillRect(tx - u * 6 * ease((local - 0.4) / 0.4), ty - u * 1.6, u * 12 * ease((local - 0.4) / 0.4), Math.max(2, u * 0.5));
    },
    chrome() {},
  };

  // ---- 4. Before / After: a slider sweeps across the photo, from a flat
  // "before" look to the bright "after". Pairs of photos are used as real
  // before and after when the photo count is even. ----
  const compare = {
    deco: 'none', transition: { type: 'cut', dur: 0 }, motion: { zoom: [1, 1.05] },
    draw(ctx, d, seg, t) {
      const u = unit(d);
      const mint = acc(d, '#22d3ee');
      const local = t - seg.start;
      const dur = seg.end - seg.start;
      const n = d.photos.length;
      const pairs = n >= 2 && n % 2 === 0;
      const i = seg.photo;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, d.w, d.h);
      const labelChip = (text, x, align, bg, color) => pill(ctx, text, { x, y: u * 6, size: u * 2.8, bg, color, font: F.impact, weight: 400, align, radius: u * 0.6, spacing: 0.08 });
      if (seg.kind === 'intro' || seg.kind === 'outro') {
        coverAt(ctx, d.photos[seg.photo]?.img, 0, 0, d.w, d.h, 1.05);
        ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, 0, d.w, d.h);
        if (seg.kind === 'intro') {
          blockText(ctx, d, d.subtitle || 'See the difference', { x: d.w / 2, y: d.h * 0.4, size: u * 8, font: headFont(d, F.impact), bg: '#000', color: '#fff', align: 'center', maxWidth: d.w - u * 10, maxLines: 3, wipe: local / 0.3 });
          pill(ctx, `${d.title}`, { x: d.w / 2, y: d.h * 0.62, size: u * 3, bg: mint, color: '#000', font: F.impact, weight: 400, align: 'center', radius: u * 0.6, spacing: 0.06 });
        } else ctaBox(ctx, d, local, mint);
        return;
      }
      if (pairs && i % 2 === 1) {
        // The "after" photo of a pair, held with its caption.
        const item = d.photos[i];
        coverAt(ctx, item.img, 0, 0, d.w, d.h, 1 + 0.08 * clamp(local / dur, 0, 1));
        gradient(ctx, d, [[0.55, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.75)']]);
        labelChip('After ✓', d.w - u * 6, 'right', mint, '#000');
        blockText(ctx, d, item.head || d.photos[i - 1]?.head, { x: u * 6, y: d.h - u * 14, anchor: 'bottom', size: u * 7.5, font: headFont(d, F.impact), bg: '#000', color: '#fff', maxWidth: d.w - u * 12, maxLines: 3, wipe: local / 0.3 });
        if (item.line) pill(ctx, item.line, { x: u * 6, y: d.h - u * 12.5, size: u * 2.8, bg: mint, color: '#000', font: F.impact, weight: 400, radius: u * 0.6 });
        return;
      }
      const before = d.photos[i];
      const after = pairs ? d.photos[i + 1] : before;
      const sweep = 1 - ease(clamp((local - 0.5) / Math.max(0.8, dur * 0.55), 0, 1));
      const edge = d.w * sweep;
      // After underneath, before on the left of the line.
      coverAt(ctx, after?.img, 0, 0, d.w, d.h, 1.05);
      if (!pairs) grade(ctx, 0, 0, d.w, d.h, 0, 0, 0.3);
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, edge, d.h); ctx.clip();
      coverAt(ctx, before?.img, 0, 0, d.w, d.h, 1.05);
      if (!pairs) grade(ctx, 0, 0, d.w, d.h, 0.85, 0.25, 0);
      ctx.restore();
      // The slider handle.
      ctx.fillStyle = '#fff';
      ctx.fillRect(edge - u * 0.3, 0, u * 0.6, d.h);
      ctx.beginPath(); ctx.arc(edge, d.h / 2, u * 4, 0, Math.PI * 2); ctx.fill();
      write(ctx, '‹ ›', { x: edge, y: d.h / 2 - u * 2.6, size: u * 4, weight: 700, font: F.sans, color: '#000', align: 'center', maxWidth: u * 8, maxLines: 1, shadow: false });
      if (edge > u * 20) labelChip('Before', u * 6, 'left', '#000', '#fff');
      if (edge < d.w - u * 20) labelChip('After', d.w - u * 6, 'right', mint, '#000');
      if (!pairs && sweep < 0.05) {
        gradient(ctx, d, [[0.55, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.75)']]);
        blockText(ctx, d, before?.head, { x: u * 6, y: d.h - u * 14, anchor: 'bottom', size: u * 7.5, font: headFont(d, F.impact), bg: '#000', color: '#fff', maxWidth: d.w - u * 12, maxLines: 3 });
      } else if (before?.label) {
        pill(ctx, before.label, { x: d.w / 2, y: d.h - u * 16, size: u * 3, bg: '#000', color: '#fff', font: F.impact, weight: 400, align: 'center', radius: u * 0.6, spacing: 0.06 });
      }
    },
    chrome() {},
  };

  // ---- 5. Customer Love: photo card, five stars popping one by one and the
  // customer's words in a quote bubble. Only for real reviews. ----
  const review = {
    deco: 'none', transition: { type: 'cut', dur: 0 }, motion: { zoom: [1, 1.05] },
    draw(ctx, d, seg, t) {
      const u = unit(d);
      const pink = acc(d, '#f472b6');
      const local = t - seg.start;
      const item = d.photos[seg.photo] || {};
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, d.w, d.h);
      if (item.img) { ctx.save(); ctx.globalAlpha *= 0.55; coverAt(ctx, blurOf(item.img), 0, 0, d.w, d.h, 1.2); ctx.restore(); }
      ctx.fillStyle = `${tint(pink, 0.8)}cc`; ctx.fillRect(0, 0, d.w, d.h);
      const pw = wide(d) ? d.h * 0.6 : d.w * 0.84;
      const ph = wide(d) ? pw : pw * 1.05;
      const px = wide(d) ? d.w * 0.06 : (d.w - pw) / 2;
      const py = wide(d) ? (d.h - ph) / 2 : d.h * 0.07;
      const lift = (1 - ease(local / 0.5)) * u * 4;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.2)'; ctx.shadowBlur = u * 5;
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(px - u, py - u + lift, pw + u * 2, ph + u * 2, u * 3); ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.beginPath(); ctx.roundRect(px, py + lift, pw, ph, u * 2.4); ctx.clip();
      coverAt(ctx, item.img, px, py + lift, pw, ph, 1.04);
      ctx.restore();
      const bx = wide(d) ? px + pw + u * 6 : u * 6;
      const bw = wide(d) ? d.w - bx - u * 6 : d.w - u * 12;
      const by = wide(d) ? d.h * 0.2 : py + ph + u * 6;
      if (seg.kind === 'intro' || seg.kind === 'outro') {
        if (seg.kind === 'outro') { ctaBox(ctx, d, local, pink); return; }
        write(ctx, d.subtitle || 'Loved by our customers', { x: bx + bw / 2, y: by, size: u * 6.4, weight: 800, font: headFont(d, F.sans), color: '#1f1235', align: 'center', maxWidth: bw, maxLines: 2, shadow: false, alpha: ease(local / 0.5) });
        write(ctx, d.title, { x: bx + bw / 2, y: by + u * 16, size: u * 3.6, weight: 700, font: F.sans, color: tint(pink, -0.45), align: 'center', upper: true, spacing: 0.12, maxWidth: bw, maxLines: 1, shadow: false });
        return;
      }
      // Stars.
      for (let s = 0; s < 5; s += 1) {
        const pop = popIn(local, 0.25 + s * 0.12);
        if (pop <= 0) continue;
        ctx.save();
        ctx.translate(bx + bw / 2 + (s - 2) * u * 6.4, by + u * 2.5); ctx.scale(pop, pop);
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        for (let k = 0; k < 10; k += 1) { const a = -Math.PI / 2 + (k * Math.PI) / 5; const rr = k % 2 ? u * 1.2 : u * 2.8; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      // Quote bubble.
      const qy = by + u * 7;
      const appear = ease((local - 0.9) / 0.5);
      ctx.save();
      ctx.globalAlpha *= appear;
      const qh = write(ctx, item.head, { x: bx + bw / 2, y: qy + u * 5, size: u * 5.2, weight: 700, font: F.sans, color: '#1f1235', align: 'center', maxWidth: bw - u * 8, maxLines: 4, shadow: false, measure: true });
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.roundRect(bx, qy, bw, qh + u * 10, u * 3); ctx.fill();
      ctx.beginPath(); ctx.moveTo(bx + bw / 2 - u * 3, qy); ctx.lineTo(bx + bw / 2, qy - u * 2.5); ctx.lineTo(bx + bw / 2 + u * 3, qy); ctx.fill();
      ctx.restore();
      write(ctx, '“', { x: bx + u * 3, y: qy - u * 2, size: u * 10, weight: 800, font: F.serif, color: pink, maxWidth: u * 10, maxLines: 1, shadow: false, alpha: appear });
      write(ctx, item.head, { x: bx + bw / 2, y: qy + u * 5, size: u * 5.2, weight: 700, font: F.sans, color: '#1f1235', align: 'center', maxWidth: bw - u * 8, maxLines: 4, shadow: false, alpha: appear });
      const who = [item.label, item.line].filter(Boolean).join(' · ');
      write(ctx, who ? `— ${who}` : '', { x: bx + bw / 2, y: qy + qh + u * 12, size: u * 3, weight: 700, font: F.sans, color: tint(pink, -0.45), align: 'center', maxWidth: bw, maxLines: 1, shadow: false, alpha: ease((local - 1.3) / 0.5) });
    },
    chrome() {},
  };

  // ---- 6. Top 5 Countdown: big numbers slam in counting down, each photo
  // whips in from the side with motion blur. ----
  const countdown = {
    deco: 'none', transition: { type: 'cut', dur: 0 }, motion: { zoom: [1, 1.08] },
    draw(ctx, d, seg, t, segs) {
      const u = unit(d);
      const hot = acc(d, '#a3e635');
      const local = t - seg.start;
      const dur = seg.end - seg.start;
      const item = d.photos[seg.photo] || {};
      const prev = prevOf(d, segs, seg);
      const count = segs.filter((s) => s.kind === 'photo').length;
      ctx.fillStyle = '#0b0b0f'; ctx.fillRect(0, 0, d.w, d.h);
      if (seg.kind === 'intro') {
        coverAt(ctx, item.img, 0, 0, d.w, d.h, 1.1);
        ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, 0, d.w, d.h);
        const slam = Math.max(1, 2 - ease(local / 0.35));
        ctx.save(); ctx.translate(d.w / 2, d.h * 0.4); ctx.scale(slam, slam); ctx.translate(-d.w / 2, -d.h * 0.4);
        write(ctx, `Top ${count}`, { x: d.w / 2, y: d.h * 0.28, size: u * 16, weight: 400, font: F.impact, color: hot, align: 'center', upper: true, maxWidth: d.w - u * 8, maxLines: 1 });
        ctx.restore();
        blockText(ctx, d, d.subtitle || `Reasons to choose ${d.title}`, { x: d.w / 2, y: d.h * 0.5, size: u * 5.4, font: headFont(d, F.impact), bg: '#fff', color: '#000', align: 'center', maxWidth: d.w - u * 10, maxLines: 3, wipe: (local - 0.4) / 0.3 });
        return;
      }
      if (seg.kind === 'outro') { coverAt(ctx, item.img, 0, 0, d.w, d.h, 1.08); ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(0, 0, d.w, d.h); ctaBox(ctx, d, local, hot); return; }
      // Whip pan in.
      const whip = clamp(local / 0.3, 0, 1);
      const dx = d.w * (1 - ease(whip));
      if (prev && whip < 1) coverAt(ctx, prev.img, 0, 0, d.w, d.h, 1.08, dx - d.w, 0);
      for (let j = 3; j >= 1 && whip < 1; j -= 1) {
        ctx.save(); ctx.globalAlpha *= 0.2; coverAt(ctx, item.img, 0, 0, d.w, d.h, 1.08, dx + j * u * 8, 0); ctx.restore();
      }
      coverAt(ctx, item.img, 0, 0, d.w, d.h, 1.08 + 0.06 * clamp(local / dur, 0, 1), dx, 0);
      gradient(ctx, d, [[0, 'rgba(0,0,0,.4)'], [0.35, 'rgba(0,0,0,0)'], [0.6, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.8)']]);
      // The number.
      const number = count - (seg.index || 0);
      const pop = popIn(local, 0.25);
      if (pop > 0) {
        ctx.save();
        ctx.translate(u * 16, d.h * 0.18); ctx.rotate(-0.12 * (1 - Math.min(1, pop))); ctx.scale(pop, pop);
        ctx.fillStyle = hot; ctx.beginPath(); ctx.arc(0, 0, u * 10, 0, Math.PI * 2); ctx.fill();
        write(ctx, `#${number}`, { x: 0, y: -u * 6.4, size: u * 11, weight: 400, font: F.impact, color: '#000', align: 'center', maxWidth: u * 20, maxLines: 1, shadow: false });
        ctx.restore();
      }
      if (item.label) pill(ctx, item.label, { x: d.w - u * 6, y: d.h * 0.16, size: u * 2.8, bg: '#fff', color: '#000', font: F.impact, weight: 400, align: 'right', radius: u * 0.6, spacing: 0.06, alpha: ease((local - 0.4) / 0.3) });
      blockText(ctx, d, item.head, { x: u * 6, y: d.h - u * 15, anchor: 'bottom', size: u * (wide(d) ? 6.6 : 8), font: headFont(d, F.impact), bg: hot, color: '#000', maxWidth: d.w - u * 12, maxLines: 3, wipe: (local - 0.45) / 0.3 });
      if (item.line) write(ctx, item.line, { x: u * 6, y: d.h - u * 13, size: u * 3.4, weight: 600, font: F.jost, maxWidth: d.w - u * 12, maxLines: 2, alpha: ease((local - 0.7) / 0.3) });
      // Progress dots.
      for (let k = 0; k < count; k += 1) {
        ctx.fillStyle = k <= (seg.index || 0) ? hot : 'rgba(255,255,255,.35)';
        ctx.beginPath(); ctx.arc(d.w / 2 + (k - (count - 1) / 2) * u * 3, d.h - u * 5, u * 0.9, 0, Math.PI * 2); ctx.fill();
      }
    },
    chrome() {},
  };

  // ---- 7. Story Ad: the look of a social story: progress bars, profile row,
  // tilted text stickers, an emoji, a poll sticker and a swipe-up ending. ----
  const STORY_EMOJI = ['🔥', '😍', '✨', '💯', '🎉', '👌'];
  const story = {
    deco: 'none', transition: { type: 'cut', dur: 0 }, motion: { zoom: [1, 1.08] },
    draw(ctx, d, seg, t, segs) {
      const u = unit(d);
      const grad = acc(d, '#e1306c');
      const local = t - seg.start;
      const dur = seg.end - seg.start;
      const item = d.photos[seg.photo] || {};
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, d.w, d.h);
      coverAt(ctx, item.img, 0, 0, d.w, d.h, 1 + 0.08 * clamp(local / dur, 0, 1));
      gradient(ctx, d, [[0, 'rgba(0,0,0,.45)'], [0.2, 'rgba(0,0,0,0)'], [0.75, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.55)']]);
      // Progress bars and profile row.
      const n = segs.length;
      const gap = u * 0.8;
      const bw = (d.w - u * 6 - gap * (n - 1)) / n;
      segs.forEach((s, i) => {
        const fill = clamp((t - s.start) / (s.end - s.start), 0, 1);
        ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.roundRect(u * 3 + i * (bw + gap), u * 2.5, bw, u * 0.6, u * 0.3); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(u * 3 + i * (bw + gap), u * 2.5, Math.max(0.1, bw * fill), u * 0.6, u * 0.3); ctx.fill();
      });
      const ring = ctx.createLinearGradient(u * 3, u * 5, u * 10, u * 12);
      ring.addColorStop(0, '#feda75'); ring.addColorStop(0.5, grad); ring.addColorStop(1, '#4f5bd5');
      ctx.fillStyle = ring; ctx.beginPath(); ctx.arc(u * 7, u * 8.6, u * 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(u * 7, u * 8.6, u * 2.6, 0, Math.PI * 2); ctx.fill();
      write(ctx, (d.title || 'S').charAt(0).toUpperCase(), { x: u * 7, y: u * 6.9, size: u * 3, weight: 800, font: F.sans, align: 'center', maxWidth: u * 6, maxLines: 1, shadow: false });
      write(ctx, d.title, { x: u * 11.5, y: u * 6.4, size: u * 2.6, weight: 700, font: F.sans, maxWidth: d.w * 0.55, maxLines: 1 });
      write(ctx, 'Sponsored', { x: u * 11.5, y: u * 9.4, size: u * 2, weight: 500, font: F.sans, color: 'rgba(255,255,255,.8)', maxWidth: d.w * 0.4, maxLines: 1 });
      const sticker = (value, x, y, angle, at, bg, color, size) => {
        if (!value) return;
        const pop = popIn(local, at);
        if (pop <= 0) return;
        ctx.save();
        ctx.translate(x, y); ctx.rotate(angle); ctx.scale(pop, pop);
        ctx.font = `800 ${size}px ${F.sans}`;
        const lines = wrap(ctx, value, d.w * 0.7, 3);
        const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + size * 1.2;
        const h = lines.length * size * 1.2 + size * 0.7;
        ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, size * 0.4); ctx.fill();
        ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        lines.forEach((l, i) => ctx.fillText(l, 0, -h / 2 + size * 0.35 + i * size * 1.2));
        ctx.restore();
      };
      if (seg.kind === 'intro') {
        sticker(d.subtitle || d.title, d.w / 2, d.h * 0.45, -0.04, 0.3, '#fff', '#111', u * 5.6);
        sticker(d.badge || 'New ✨', d.w * 0.62, d.h * 0.58, 0.08, 0.6, grad, '#fff', u * 3.4);
        return;
      }
      if (seg.kind === 'outro') {
        sticker(d.closing, d.w / 2, d.h * 0.42, -0.03, 0.2, '#fff', '#111', u * 5.6);
        const bounce = Math.abs(Math.sin(local * 4)) * u * 2;
        write(ctx, '⌃', { x: d.w / 2, y: d.h - u * 24 - bounce, size: u * 7, weight: 800, font: F.sans, align: 'center', maxWidth: u * 10, maxLines: 1 });
        pill(ctx, d.contact ? `Tap to call · ${d.contact}` : 'Tap to order', { x: d.w / 2, y: d.h - u * 16, size: u * 3, bg: '#fff', color: '#111', font: F.sans, weight: 800, align: 'center', spacing: 0.02, maxWidth: d.w * 0.9 });
        // Reply box like a story.
        ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = Math.max(1, u * 0.25);
        ctx.beginPath(); ctx.roundRect(u * 4, d.h - u * 8, d.w - u * 8, u * 5.4, u * 2.7); ctx.stroke();
        write(ctx, 'Send message', { x: u * 7, y: d.h - u * 6.6, size: u * 2.4, weight: 500, font: F.sans, maxWidth: d.w * 0.5, maxLines: 1 });
        return;
      }
      const idx = seg.index || 0;
      sticker(item.head, d.w / 2, d.h * (idx % 2 ? 0.3 : 0.64), idx % 2 ? 0.05 : -0.05, 0.25, idx % 2 ? grad : '#fff', idx % 2 ? '#fff' : '#111', u * 5.2);
      sticker(item.line || item.label, d.w * (idx % 2 ? 0.34 : 0.66), d.h * (idx % 2 ? 0.42 : 0.76), idx % 2 ? -0.08 : 0.08, 0.6, '#111', '#fff', u * 3);
      // An emoji that bounces in.
      const ep = popIn(local, 0.9);
      if (ep > 0) {
        ctx.save();
        ctx.translate(d.w * (idx % 2 ? 0.78 : 0.22), d.h * (idx % 2 ? 0.22 : 0.54)); ctx.scale(ep, ep); ctx.rotate(Math.sin(local * 4) * 0.15);
        ctx.font = `${u * 9}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(STORY_EMOJI[idx % STORY_EMOJI.length], 0, 0);
        ctx.restore();
      }
      // A poll sticker on the second scene.
      if (idx === 1) {
        const pp = popIn(local, 1.2);
        if (pp > 0) {
          const pw = d.w * 0.64;
          const px = (d.w - pw) / 2;
          const py = d.h * 0.5;
          ctx.save(); ctx.translate(d.w / 2, py); ctx.scale(pp, pp); ctx.translate(-d.w / 2, -py);
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(px, py, pw, u * 17, u * 2.5); ctx.fill();
          write(ctx, 'Would you try it? 👀', { x: d.w / 2, y: py + u * 2, size: u * 3, weight: 800, font: F.sans, color: '#111', align: 'center', maxWidth: pw - u * 4, maxLines: 1, shadow: false });
          ['Yes! 😍', 'Wow 🔥'].forEach((opt, k) => {
            const oy = py + u * 7 + k * u * 5;
            const fill = ease((local - 1.6 - k * 0.2) / 0.8) * (k ? 0.45 : 0.8);
            ctx.fillStyle = '#eee'; ctx.beginPath(); ctx.roundRect(px + u * 2, oy, pw - u * 4, u * 4, u * 2); ctx.fill();
            ctx.fillStyle = `${grad}88`; ctx.beginPath(); ctx.roundRect(px + u * 2, oy, Math.max(u * 4, (pw - u * 4) * fill), u * 4, u * 2); ctx.fill();
            write(ctx, opt, { x: px + u * 4, y: oy + u * 0.7, size: u * 2.4, weight: 700, font: F.sans, color: '#111', maxWidth: pw, maxLines: 1, shadow: false });
          });
          ctx.restore();
        }
      }
    },
    chrome() {},
  };

  // ---- 8. Cinematic Luxury: letterbox bars, slow drift, light leaks, film
  // grain, spaced serif titles and long dissolves. ----
  const cinema = {
    deco: 'none', transition: { type: 'cut', dur: 0 }, motion: { zoom: [1.04, 1.16] },
    draw(ctx, d, seg, t, segs) {
      const u = unit(d);
      const gold = acc(d, '#e9c46a');
      const local = t - seg.start;
      const dur = seg.end - seg.start;
      const item = d.photos[seg.photo] || {};
      const prev = prevOf(d, segs, seg);
      const fade = prev && prev.img !== item.img ? ease(local / 1.1) : 1;
      const drift = (img, p, a) => { ctx.save(); ctx.globalAlpha *= a; coverAt(ctx, img, 0, 0, d.w, d.h, 1.04 + 0.12 * p, (p - 0.5) * u * 4, -p * u * 2); ctx.restore(); };
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, d.w, d.h);
      if (prev && fade < 1) drift(prev.img, 1, 1);
      drift(item.img, clamp(local / dur, 0, 1), fade);
      grade(ctx, 0, 0, d.w, d.h, 0.15, 0.12, 0.18);
      // Light leak sweeping across.
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const lx = ((t * 0.12) % 1.6 - 0.3) * d.w;
      const leak = ctx.createRadialGradient(lx, d.h * 0.3, 0, lx, d.h * 0.3, d.w * 0.7);
      leak.addColorStop(0, 'rgba(255,140,60,.35)'); leak.addColorStop(1, 'rgba(255,60,90,0)');
      ctx.fillStyle = leak; ctx.fillRect(0, 0, d.w, d.h);
      ctx.restore();
      const vig = ctx.createRadialGradient(d.w / 2, d.h / 2, Math.min(d.w, d.h) * 0.35, d.w / 2, d.h / 2, Math.max(d.w, d.h) * 0.75);
      vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,.55)');
      ctx.fillStyle = vig; ctx.fillRect(0, 0, d.w, d.h);
      grain(ctx, d, t, 0.25);
      // Letterbox bars slide in at the start.
      const bar = d.h * (wide(d) ? 0.08 : 0.1) * ease(t / 1.2);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, d.w, bar); ctx.fillRect(0, d.h - bar, d.w, bar);
      const appear = ease((local - 0.5) / 0.9);
      const y = d.h - bar - u * (wide(d) ? 16 : 22);
      const spaced = (value, yy, size, color, a, spacing) => write(ctx, value, { x: d.w / 2, y: yy, size, weight: 600, font: F.serif, color, align: 'center', upper: true, spacing, maxWidth: d.w * 0.86, maxLines: 2, alpha: a });
      if (seg.kind === 'intro') {
        spaced(d.title, d.h * 0.42, u * 6.4, '#fff', ease((local - 0.6) / 1), 0.12 + 0.08 * ease(local / 2.5));
        write(ctx, d.subtitle, { x: d.w / 2, y: d.h * 0.42 + u * 10, size: u * 3.6, weight: 600, italic: true, font: headFont(d, F.serif), color: gold, align: 'center', maxWidth: d.w * 0.8, maxLines: 2, alpha: ease((local - 1.1) / 0.8) });
      } else if (seg.kind === 'outro') {
        spaced(d.closing, d.h * 0.42, u * 5.6, '#fff', appear, 0.14);
        if (d.contact) spaced(d.contact, d.h * 0.42 + u * 10, u * 3, gold, ease((local - 0.9) / 0.8), 0.2);
        const out = clamp((local - (dur - 1.2)) / 1.2, 0, 1);
        if (out > 0) { ctx.fillStyle = `rgba(0,0,0,${out})`; ctx.fillRect(0, 0, d.w, d.h); }
      } else {
        spaced(item.label, y - u * 5, u * 2.4, gold, appear, 0.36);
        write(ctx, item.head, { x: d.w / 2, y, size: u * (wide(d) ? 6 : 7.4), weight: 600, font: headFont(d, F.serif), color: '#fff', align: 'center', maxWidth: d.w * 0.84, maxLines: 2, alpha: appear });
        write(ctx, item.line, { x: d.w / 2, y: y + u * 10, size: u * 3, weight: 400, italic: true, font: F.serif, color: 'rgba(255,255,255,.85)', align: 'center', maxWidth: d.w * 0.8, maxLines: 1, alpha: ease((local - 1) / 0.8) });
      }
    },
    chrome() {},
  };

  // ---- 9. Kinetic Text: split screen of photo and colour block; the words
  // pop in one by one, the last one highlighted. Panels swap sides. ----
  const kinetic = {
    deco: 'none', transition: { type: 'cut', dur: 0 }, motion: { zoom: [1, 1.08] },
    draw(ctx, d, seg, t) {
      const u = unit(d);
      const block = acc(d, '#6d28d9');
      const local = t - seg.start;
      const dur = seg.end - seg.start;
      const item = d.photos[seg.photo] || {};
      const flip = (seg.index || 0) % 2 === 1;
      const head = seg.kind === 'intro' ? (d.subtitle || d.title) : seg.kind === 'outro' ? d.closing : item.head;
      ctx.fillStyle = block; ctx.fillRect(0, 0, d.w, d.h);
      // Photo panel slides in.
      const slideIn = ease(local / 0.35);
      const isWide = wide(d);
      const panel = isWide ? { w: d.w * 0.5, h: d.h } : { w: d.w, h: d.h * 0.56 };
      const px = isWide ? (flip ? d.w * 0.5 : 0) + (flip ? 1 : -1) * (1 - slideIn) * panel.w : 0;
      const py = isWide ? 0 : (flip ? d.h - panel.h : 0) + (flip ? 1 : -1) * (1 - slideIn) * panel.h;
      if (seg.kind !== 'intro') {
        ctx.save(); ctx.beginPath(); ctx.rect(px, py, panel.w, panel.h); ctx.clip();
        coverAt(ctx, item.img, px, py, panel.w, panel.h, 1 + 0.08 * clamp(local / dur, 0, 1));
        ctx.restore();
      }
      // Text area.
      const area = seg.kind === 'intro' ? { x: u * 6, y: d.h * 0.28, w: d.w - u * 12 } : isWide
        ? { x: (flip ? 0 : d.w * 0.5) + u * 5, y: d.h * 0.24, w: d.w * 0.5 - u * 10 }
        : { x: u * 6, y: (flip ? 0 : panel.h) + u * 12, w: d.w - u * 12 };
      const size = u * (seg.kind === 'intro' ? 13 : isWide ? 8 : 11);
      ctx.save();
      ctx.font = `400 ${size}px ${headFont(d, F.impact)}`;
      const list = words(String(head || '').toUpperCase());
      let x = area.x;
      let y = area.y;
      list.forEach((word, i) => {
        const w = ctx.measureText(word).width;
        if (x > area.x && x + w > area.x + area.w) { x = area.x; y += size * 1.05; }
        const pop = popIn(local, 0.25 + i * 0.16);
        if (pop > 0) {
          const last = i === list.length - 1;
          ctx.save();
          ctx.translate(x + w / 2, y + size / 2); ctx.scale(pop, pop); ctx.translate(-(x + w / 2), -(y + size / 2));
          if (last) { ctx.fillStyle = '#fde047'; ctx.fillRect(x - size * 0.1, y - size * 0.02, w + size * 0.2, size * 1.04); }
          ctx.fillStyle = last ? '#000' : '#fff'; ctx.textBaseline = 'top';
          ctx.fillText(word, x, y + size * 0.05);
          ctx.restore();
        }
        x += w + size * 0.28;
      });
      ctx.restore();
      const after = y + size * 1.3;
      if (seg.kind === 'intro') write(ctx, d.title, { x: area.x, y: after, size: u * 3.6, weight: 600, font: F.jost, color: 'rgba(255,255,255,.9)', upper: true, spacing: 0.16, maxWidth: area.w, maxLines: 1, alpha: ease((local - 0.9) / 0.4) });
      else if (seg.kind === 'outro') {
        if (d.contact) pill(ctx, `📞 ${d.contact}`, { x: area.x, y: after, size: u * 3.2, bg: '#fde047', color: '#000', font: F.sans, weight: 800, spacing: 0.02, alpha: ease((local - 0.8) / 0.4) });
      } else {
        if (item.label) pill(ctx, item.label, { x: area.x, y: area.y - u * 6, size: u * 2.4, bg: 'rgba(0,0,0,.35)', color: '#fff', font: F.jost, weight: 600, spacing: 0.2, maxWidth: area.w });
        write(ctx, item.line, { x: area.x, y: after, size: u * 3.4, weight: 500, font: F.jost, color: 'rgba(255,255,255,.92)', maxWidth: area.w, maxLines: 2, alpha: ease((local - 0.25 - list.length * 0.16) / 0.4) });
      }
    },
    chrome() {},
  };

  // ---- 10. Grand Opening / Event: spotlight beams, a ribbon, confetti
  // bursts and the date, time and venue as chips. ----
  const event = {
    deco: 'none', transition: { type: 'cut', dur: 0 }, motion: { zoom: [1, 1.08] },
    draw(ctx, d, seg, t, segs) {
      const u = unit(d);
      const gold = acc(d, '#fbbf24');
      const ribbon = '#dc2626';
      const local = t - seg.start;
      const dur = seg.end - seg.start;
      const item = d.photos[seg.photo] || {};
      const prev = prevOf(d, segs, seg);
      const fade = prev && prev.img !== item.img ? ease(local / 0.5) : 1;
      ctx.fillStyle = '#05050a'; ctx.fillRect(0, 0, d.w, d.h);
      if (prev && fade < 1) coverAt(ctx, prev.img, 0, 0, d.w, d.h, 1.08);
      ctx.save(); ctx.globalAlpha *= fade; coverAt(ctx, item.img, 0, 0, d.w, d.h, 1 + 0.08 * clamp(local / dur, 0, 1)); ctx.restore();
      ctx.fillStyle = 'rgba(0,0,10,.45)'; ctx.fillRect(0, 0, d.w, d.h);
      // Two sweeping spotlights.
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const [bx, phase] of [[d.w * 0.15, 0], [d.w * 0.85, Math.PI]]) {
        const a = Math.sin(t * 0.9 + phase) * 0.35;
        ctx.save(); ctx.translate(bx, d.h); ctx.rotate(a);
        const g = ctx.createLinearGradient(0, 0, 0, -d.h);
        g.addColorStop(0, `${gold}55`); g.addColorStop(1, `${gold}00`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(-u * 2, 0); ctx.lineTo(u * 2, 0); ctx.lineTo(u * 18, -d.h * 1.1); ctx.lineTo(-u * 18, -d.h * 1.1); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      const chips = (y) => {
        (d.details || []).slice(0, 3).forEach((line, i) => {
          const p = ease((local - 0.6 - i * 0.25) / 0.4);
          if (p > 0) pill(ctx, line, { x: d.w / 2, y: y + i * u * 6.4 + (1 - p) * u * 3, size: u * 2.8, bg: 'rgba(255,255,255,.95)', color: '#111', font: F.sans, weight: 800, align: 'center', spacing: 0.02, alpha: p, maxWidth: d.w * 0.9 });
        });
      };
      const ribbonBand = (text, y) => {
        const p = ease(local / 0.4);
        ctx.save();
        ctx.translate(d.w / 2, y); ctx.rotate(-0.05);
        ctx.fillStyle = ribbon; ctx.fillRect(-d.w * 0.6 * p, -u * 4.5, d.w * 1.2 * p, u * 9);
        ctx.fillStyle = gold; ctx.fillRect(-d.w * 0.6 * p, -u * 4.5, d.w * 1.2 * p, u * 0.6); ctx.fillRect(-d.w * 0.6 * p, u * 3.9, d.w * 1.2 * p, u * 0.6);
        ctx.restore();
        if (p > 0.6) write(ctx, text, { x: d.w / 2, y: y - u * 3.2, size: u * 5.6, weight: 400, font: F.impact, color: '#fff', align: 'center', upper: true, spacing: 0.06, maxWidth: d.w * 0.9, maxLines: 1, alpha: ease((p - 0.6) / 0.4) });
      };
      const colors = [gold, '#ffffff', ribbon, '#60a5fa', '#34d399'];
      if (seg.kind === 'intro') {
        ribbonBand(d.badge || 'Grand opening', d.h * 0.22);
        write(ctx, d.title, { x: d.w / 2, y: d.h * 0.36, size: u * 8, weight: 400, font: headFont(d, F.impact), color: gold, align: 'center', upper: true, maxWidth: d.w * 0.88, maxLines: 2, alpha: ease((local - 0.5) / 0.5) });
        write(ctx, d.subtitle, { x: d.w / 2, y: d.h * 0.52, size: u * 3.8, weight: 700, font: F.sans, align: 'center', maxWidth: d.w * 0.86, maxLines: 2, alpha: ease((local - 0.8) / 0.5) });
        chips(d.h * 0.64);
        confettiBurst(ctx, d, local - 0.4, colors);
        return;
      }
      if (seg.kind === 'outro') {
        ribbonBand(d.closing, d.h * 0.3);
        chips(d.h * 0.42);
        if (d.contact) pill(ctx, `📞 ${d.contact}`, { x: d.w / 2, y: d.h * 0.66, size: u * 3.4, bg: gold, color: '#000', font: F.sans, weight: 800, align: 'center', alpha: ease((local - 1.2) / 0.4) });
        confettiBurst(ctx, d, local - 0.2, colors);
        return;
      }
      if (item.label) pill(ctx, item.label, { x: d.w / 2, y: d.h * 0.14, size: u * 2.8, bg: ribbon, color: '#fff', font: F.impact, weight: 400, align: 'center', radius: u * 0.6, spacing: 0.08, alpha: ease((local - 0.2) / 0.3) });
      write(ctx, item.head, { x: d.w / 2, y: d.h * 0.66, size: u * (wide(d) ? 6.4 : 7.6), weight: 400, font: headFont(d, F.impact), color: '#fff', align: 'center', upper: true, maxWidth: d.w * 0.88, maxLines: 2, alpha: ease((local - 0.3) / 0.4) });
      if (item.line) pill(ctx, item.line, { x: d.w / 2, y: d.h * 0.66 + u * 18, size: u * 2.8, bg: gold, color: '#000', font: F.sans, weight: 800, align: 'center', alpha: ease((local - 0.6) / 0.4), maxWidth: d.w * 0.9 });
    },
    chrome() {},
  };

  const LAYOUTS = { playful, luxe, bold, fresh, clean, editor, beat, parallax, stack, slide, frame: golden, invite, sale, product, compare, review, countdown, story, cinema, kinetic, event };

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
    fonts: [`600 40px ${F.round}`, `700 40px ${F.round}`, `600 40px ${F.serif}`, `italic 600 40px ${F.serif}`, `400 40px ${F.jost}`, `500 40px ${F.jost}`, `600 40px ${F.jost}`, `400 40px ${F.impact}`, `700 40px ${F.sans}`, `800 40px ${F.sans}`, `700 40px ${F.play}`, `400 40px ${F.script}`],
    fontsUrl: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,600;1,600&family=Jost:wght@400;500;600&family=Anton&family=Poppins:wght@700;800&family=Playfair+Display:wght@700&family=Great+Vibes&family=Noto+Sans+Telugu:wght@600;800&family=Noto+Sans+Devanagari:wght@600;800&display=swap',
  };
  if (typeof window !== 'undefined') window.SiteCraftStyles = api;
})();
