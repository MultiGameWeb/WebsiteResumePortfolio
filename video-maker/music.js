// Background music made in code, so there is no music file and nothing to
// license. A track is rendered with an OfflineAudioContext from a few simple
// layers (kick, snare, hats, bass, chords, melody) in a style with its own
// tempo, scale and feel. The same buffer is played in the preview, mixed into
// the recorded MP4 and written into the HTML video.
//
//   const buffer = await SiteCraftMusic.render(style, seconds, audioContext);
//   SiteCraftMusic.STYLES   -> { id: { name, bpm, ... } }
//   SiteCraftMusic.forTemplate(layoutId) -> the style that suits a template
(function () {
  'use strict';

  // Note names to frequencies (A4 = 440).
  const hz = (semitonesFromA4) => 440 * Math.pow(2, semitonesFromA4 / 12);
  const SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    // North Indian raag-style scale (Bhairavi-like) for the festive feel.
    raag: [0, 1, 4, 5, 7, 8, 11],
    pent: [0, 2, 4, 7, 9],
  };

  // root: semitones above A4 for the tonic (negative = below).
  const STYLES = {
    upbeat: { name: 'Upbeat', bpm: 124, root: -9, scale: 'major', prog: [0, 3, 4, 3], kick: 'four', snare: true, hats: 'eighth', bass: 'pump', chords: 'stab', lead: 'pluck', swing: 0, vol: 0.9 },
    energy: { name: 'Energy', bpm: 140, root: -12, scale: 'minor', prog: [0, 5, 3, 4], kick: 'four', snare: true, hats: 'sixteenth', bass: 'drive', chords: 'stab', lead: 'saw', swing: 0, vol: 0.95 },
    luxury: { name: 'Luxury', bpm: 84, root: -7, scale: 'minor', prog: [0, 5, 2, 4], kick: 'soft', snare: false, hats: 'light', bass: 'long', chords: 'pad', lead: 'bell', swing: 0.04, vol: 0.8 },
    festive: { name: 'Festive', bpm: 108, root: -5, scale: 'raag', prog: [0, 0, 3, 4], kick: 'dhol', snare: false, hats: 'shaker', bass: 'drone', chords: 'pad', lead: 'sitar', swing: 0.06, vol: 0.9 },
    chill: { name: 'Chill', bpm: 92, root: -4, scale: 'pent', prog: [0, 3, 2, 4], kick: 'soft', snare: false, hats: 'light', bass: 'long', chords: 'pad', lead: 'bell', swing: 0.08, vol: 0.75 },
  };

  // Which style suits which template.
  const FOR_LAYOUT = {
    sale: 'energy', beat: 'energy', countdown: 'energy', event: 'festive', story: 'upbeat', kinetic: 'upbeat', product: 'luxury', cinema: 'luxury',
    review: 'chill', compare: 'upbeat', playful: 'upbeat', luxe: 'luxury', bold: 'energy', fresh: 'chill', clean: 'chill', editor: 'upbeat',
    parallax: 'upbeat', stack: 'upbeat', slide: 'upbeat', frame: 'luxury', invite: 'festive',
  };
  const forTemplate = (layout) => FOR_LAYOUT[layout] || 'upbeat';

  // ---- Sound building blocks (all write into an OfflineAudioContext) ----

  function env(ctx, param, t, attack, hold, release, peak) {
    param.setValueAtTime(0.0001, t);
    param.linearRampToValueAtTime(peak, t + attack);
    param.setValueAtTime(peak, t + attack + hold);
    param.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
  }

  function tone(ctx, out, { t, freq, dur, type = 'sine', peak = 0.3, attack = 0.005, release = 0.2, detune = 0, filter }) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.detune.value = detune;
    env(ctx, gain.gain, t, attack, Math.max(0, dur - attack), release, peak);
    let node = osc;
    if (filter) {
      const f = ctx.createBiquadFilter();
      f.type = filter.type; f.frequency.value = filter.freq; f.Q.value = filter.q || 0.7;
      osc.connect(f); node = f;
    }
    node.connect(gain); gain.connect(out);
    osc.start(t); osc.stop(t + dur + release + 0.05);
  }

  function kick(ctx, out, t, peak = 0.9, soft = false) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(soft ? 120 : 160, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    env(ctx, gain.gain, t, 0.002, 0.02, soft ? 0.25 : 0.32, peak);
    osc.connect(gain); gain.connect(out);
    osc.start(t); osc.stop(t + 0.5);
  }

  function noiseBuffer(ctx) {
    if (ctx.__noise) return ctx.__noise;
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    ctx.__noise = buf;
    return buf;
  }

  function noise(ctx, out, { t, dur, peak, hp = 0, bp = 0, release = 0.05 }) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    const gain = ctx.createGain();
    env(ctx, gain.gain, t, 0.001, Math.max(0, dur - 0.001), release, peak);
    let node = src;
    if (hp) { const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; node.connect(f); node = f; }
    if (bp) { const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = bp; f.Q.value = 1.2; node.connect(f); node = f; }
    node.connect(gain); gain.connect(out);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + release + 0.05);
  }

  const snare = (ctx, out, t, peak = 0.35) => { noise(ctx, out, { t, dur: 0.1, peak, bp: 1800, release: 0.12 }); tone(ctx, out, { t, freq: 190, dur: 0.05, type: 'triangle', peak: peak * 0.6, release: 0.08 }); };
  const hat = (ctx, out, t, peak = 0.12, open = false) => noise(ctx, out, { t, dur: open ? 0.1 : 0.02, peak: peak * 0.55, hp: 6000, release: open ? 0.1 : 0.025 });

  // A plucked or bell-like lead note.
  function lead(ctx, out, kind, t, freq, dur, peak) {
    if (kind === 'bell') {
      tone(ctx, out, { t, freq, dur: 0.05, type: 'sine', peak, attack: 0.004, release: 1.1 });
      tone(ctx, out, { t, freq: freq * 2.01, dur: 0.03, type: 'sine', peak: peak * 0.35, attack: 0.004, release: 0.7 });
      tone(ctx, out, { t, freq: freq * 3.99, dur: 0.02, type: 'sine', peak: peak * 0.15, attack: 0.004, release: 0.4 });
    } else if (kind === 'sitar') {
      // Bright plucked string with a buzzing second voice, a hint of sitar.
      tone(ctx, out, { t, freq, dur: 0.04, type: 'sawtooth', peak: peak * 0.8, attack: 0.003, release: 0.6, filter: { type: 'lowpass', freq: 3200 } });
      tone(ctx, out, { t, freq: freq * 2, dur: 0.03, type: 'square', peak: peak * 0.25, attack: 0.003, release: 0.35, detune: 7 });
    } else if (kind === 'saw') {
      tone(ctx, out, { t, freq, dur, type: 'sawtooth', peak: peak * 0.7, attack: 0.01, release: 0.2, filter: { type: 'lowpass', freq: 2600 } });
    } else {
      tone(ctx, out, { t, freq, dur: 0.05, type: 'triangle', peak, attack: 0.003, release: 0.28 });
      tone(ctx, out, { t, freq: freq * 2, dur: 0.03, type: 'sine', peak: peak * 0.3, attack: 0.003, release: 0.18 });
    }
  }

  // ---- The track ----

  function chordFreqs(style, degree) {
    const scale = SCALES[style.scale];
    const note = (step) => {
      const octave = Math.floor(step / scale.length);
      return style.root + scale[((step % scale.length) + scale.length) % scale.length] + 12 * octave;
    };
    return [note(degree), note(degree + 2), note(degree + 4)].map(hz);
  }

  // A repeatable melody made of scale steps, chosen from the style and a seed
  // so the same video always gets the same tune.
  function melodyFor(style, bars, seed) {
    let s = seed || 1;
    const rand = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
    const scale = SCALES[style.scale];
    const steps = [];
    let pos = 0;
    for (let i = 0; i < 8; i += 1) {
      pos = Math.max(-2, Math.min(scale.length + 2, pos + Math.round((rand() - 0.5) * 4)));
      steps.push(rand() < 0.2 ? null : pos);
    }
    return steps;
  }

  function schedule(ctx, style, seconds, seed) {
    const master = ctx.createGain();
    master.gain.value = style.vol * 0.9;
    // A little glue: gentle compression so layers sit together.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.005; comp.release.value = 0.2;
    // A soft limiter after the compressor so loud styles never clip.
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3; limiter.knee.value = 0; limiter.ratio.value = 20; limiter.attack.value = 0.001; limiter.release.value = 0.08;
    const trim = ctx.createGain();
    trim.gain.value = 0.8;
    master.connect(comp); comp.connect(limiter); limiter.connect(trim); trim.connect(ctx.destination);

    const beat = 60 / style.bpm;
    const bar = beat * 4;
    const scale = SCALES[style.scale];
    const mel = melodyFor(style, 4, seed);
    const total = Math.ceil(seconds / bar) + 1;
    const swing = (i) => (i % 2 ? style.swing * beat : 0);
    const noteHz = (step) => {
      const octave = Math.floor(step / scale.length);
      return hz(style.root + 12 + scale[((step % scale.length) + scale.length) % scale.length] + 12 * octave);
    };

    for (let b = 0; b < total; b += 1) {
      const t0 = b * bar;
      if (t0 >= seconds) break;
      const degree = style.prog[b % style.prog.length];
      const quiet = b === 0 ? 0.55 : 1; // the first bar comes in softer
      const chord = chordFreqs(style, degree);
      // Chords.
      if (style.chords === 'pad') {
        for (const f of chord) {
          tone(ctx, master, { t: t0, freq: f, dur: bar * 0.95, type: 'sawtooth', peak: 0.05 * quiet, attack: 0.4, release: 0.7, filter: { type: 'lowpass', freq: 1100 } });
          tone(ctx, master, { t: t0, freq: f * 1.003, dur: bar * 0.95, type: 'triangle', peak: 0.05 * quiet, attack: 0.5, release: 0.7 });
        }
      } else {
        for (let k = 0; k < 4; k += 1) {
          const t = t0 + k * beat + swing(k);
          if (k % 2 === 1 || k === 0) for (const f of chord) tone(ctx, master, { t: t + beat * 0.5 * (k === 0 ? 0 : 1) * 0, freq: f, dur: beat * 0.3, type: 'square', peak: 0.04 * quiet, attack: 0.004, release: 0.12, filter: { type: 'lowpass', freq: 2200 } });
        }
      }
      // Bass.
      const bassHz = hz(style.root - 12 + scale[degree % scale.length]);
      if (style.bass === 'pump') {
        for (let k = 0; k < 8; k += 1) tone(ctx, master, { t: t0 + k * beat / 2 + swing(k), freq: bassHz, dur: beat * 0.35, type: 'sawtooth', peak: k % 2 ? 0.2 : 0.14, attack: 0.004, release: 0.1, filter: { type: 'lowpass', freq: 520 } });
      } else if (style.bass === 'drive') {
        for (let k = 0; k < 8; k += 1) tone(ctx, master, { t: t0 + k * beat / 2, freq: bassHz * (k === 3 || k === 6 ? 1.5 : 1), dur: beat * 0.4, type: 'sawtooth', peak: 0.2, attack: 0.003, release: 0.08, filter: { type: 'lowpass', freq: 640 } });
      } else if (style.bass === 'drone') {
        tone(ctx, master, { t: t0, freq: bassHz, dur: bar, type: 'sine', peak: 0.28 * quiet, attack: 0.1, release: 0.5 });
        tone(ctx, master, { t: t0, freq: bassHz * 1.5, dur: bar, type: 'sine', peak: 0.08 * quiet, attack: 0.2, release: 0.5 });
      } else {
        tone(ctx, master, { t: t0, freq: bassHz, dur: bar * 0.9, type: 'sine', peak: 0.3 * quiet, attack: 0.03, release: 0.4 });
      }
      // Drums.
      for (let k = 0; k < 4; k += 1) {
        const t = t0 + k * beat;
        if (b < 1 && style.kick !== 'dhol') continue; // a bar of build-up first
        if (style.kick === 'four') kick(ctx, master, t, 0.85);
        else if (style.kick === 'soft' && (k === 0 || k === 2)) kick(ctx, master, t, 0.5, true);
        else if (style.kick === 'dhol') {
          if (k === 0 || k === 2) kick(ctx, master, t, 0.7);
          if (k === 1 || k === 3) { kick(ctx, master, t + beat * 0.5, 0.45, true); noise(ctx, master, { t, dur: 0.05, peak: 0.12, bp: 900 }); }
        }
        if (style.snare && (k === 1 || k === 3)) snare(ctx, master, t, 0.3);
      }
      if (style.hats === 'eighth') for (let k = 0; k < 8; k += 1) hat(ctx, master, t0 + k * beat / 2 + swing(k) + (k % 2 ? 0 : 0), k % 2 ? 0.14 : 0.07, k % 4 === 3);
      else if (style.hats === 'sixteenth') for (let k = 0; k < 16; k += 1) hat(ctx, master, t0 + k * beat / 4, k % 4 === 2 ? 0.15 : 0.07);
      else if (style.hats === 'shaker') for (let k = 0; k < 8; k += 1) noise(ctx, master, { t: t0 + k * beat / 2 + swing(k), dur: 0.05, peak: 0.04, hp: 4500, release: 0.06 });
      else if (style.hats === 'light') for (let k = 0; k < 4; k += 1) hat(ctx, master, t0 + k * beat + beat / 2, 0.06);
      // Melody enters from the second bar.
      if (b >= 1) {
        for (let k = 0; k < 8; k += 1) {
          const step = mel[(b * 8 + k) % mel.length];
          if (step === null || (style.lead === 'bell' && k % 2 === 1 && k !== 7)) continue;
          lead(ctx, master, style.lead, t0 + k * beat / 2 + swing(k), noteHz(step + degree), beat * 0.45, 0.13 * quiet);
        }
      }
    }
    // A clean fade at the end.
    master.gain.setValueAtTime(style.vol * 0.9, Math.max(0, seconds - 1.4));
    master.gain.linearRampToValueAtTime(0.0001, seconds);
  }

  // Renders a track of the given length. `ctx` is only used for the sample
  // rate; the work happens in an OfflineAudioContext.
  async function render(styleId, seconds, ctx, seed = 7) {
    const style = STYLES[styleId] || STYLES.upbeat;
    const rate = ctx?.sampleRate || 44100;
    const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const length = Math.max(1, Math.ceil(seconds * rate));
    const offline = new Offline(2, length, rate);
    schedule(offline, style, seconds, seed);
    return offline.startRendering();
  }

  // The audio as a 16-bit WAV, for the HTML video (a data URL).
  function toWav(buffer) {
    const ch = buffer.numberOfChannels;
    const len = buffer.length;
    const rate = buffer.sampleRate;
    // Mono keeps the file small; the music is nearly mono anyway.
    const data = new Float32Array(len);
    for (let c = 0; c < ch; c += 1) { const src = buffer.getChannelData(c); for (let i = 0; i < len; i += 1) data[i] += src[i] / ch; }
    const out = new DataView(new ArrayBuffer(44 + len * 2));
    const w = (o, s) => { for (let i = 0; i < s.length; i += 1) out.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); out.setUint32(4, 36 + len * 2, true); w(8, 'WAVE'); w(12, 'fmt ');
    out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 1, true);
    out.setUint32(24, rate, true); out.setUint32(28, rate * 2, true); out.setUint16(32, 2, true); out.setUint16(34, 16, true);
    w(36, 'data'); out.setUint32(40, len * 2, true);
    for (let i = 0; i < len; i += 1) out.setInt16(44 + i * 2, Math.max(-1, Math.min(1, data[i])) * 32767, true);
    return out.buffer;
  }

  const api = { STYLES, forTemplate, render, toWav };
  if (typeof window !== 'undefined') window.SiteCraftMusic = api;
})();
