#!/usr/bin/env python3
"""Birthday invitation generator.

Usage:  python3 make_invite.py [details.json] [output_dir]

Reads details.json and produces:
  - invite_<n>.png      static invitations (one per photo in assets/)
  - invite_video.mp4    typewriter-text video (silent)
  - invite_video_bgm.mp4  same video with background music
Needs: Pillow, numpy, ffmpeg.
"""
import json, os, subprocess, sys, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
DETAILS = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'details.json')
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'output')
ASSETS = os.path.join(HERE, 'assets')
FONTS = '/usr/share/fonts/truetype/freefont/'
os.makedirs(OUT, exist_ok=True)

D = json.load(open(DETAILS, encoding='utf-8'))
def hexc(h): h = h.lstrip('#'); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
C = {k: hexc(v) for k, v in D.get('colors', {}).items()}
GOLD, PINK, DARK = C.get('gold', (139, 90, 18)), C.get('pink', (176, 60, 100)), C.get('dark', (90, 50, 20))
BI, B, I = 'FreeSerifBoldItalic.ttf', 'FreeSerifBold.ttf', 'FreeSerifItalic.ttf'

def font(name, size): return ImageFont.truetype(FONTS + name, size)
def fit(draw, text, name, size, max_w):
    """Shrink font until the text fits inside max_w pixels."""
    while size > 16 and draw.textlength(text, font=font(name, size)) > max_w: size -= 2
    return font(name, size)

# ---------------------------------------------------------------- static invites
# y where the empty cream area starts, per photo (assets/<n>.webp, 1130x2000)
CREAM_Y = {'2': 1290, '3': 1190, '4': 1190, '5': 1190, '6': 1190, '7': 1190}

def static_invites():
    for k, y0 in CREAM_Y.items():
        p = os.path.join(ASSETS, k + '.webp')
        if not os.path.exists(p): continue
        im = Image.open(p).convert('RGB'); W, H = im.size; d = ImageDraw.Draw(im)
        def c(t, y, name, size, col, mw=760):
            f = fit(d, t, name, size, mw); d.text(((W - d.textlength(t, font=f)) / 2, y), t, font=f, fill=col)
        c('Happy ' + D['birthday_label'], y0, BI, 58, GOLD)
        c(D['baby_name'], y0 + 72, B, 80, PINK)
        d.line([(W * .32, y0 + 180), (W * .68, y0 + 180)], fill=GOLD, width=3)
        c(' '.join(D['tagline']), y0 + 200, I, 34, DARK)
        c(f"Date: {D['date_short']}  |  Time: {D['time_short']}", y0 + 275, B, 34, DARK)
        for i, line in enumerate(D['venue']):
            c(('Venue: ' if i == 0 else '') + line, y0 + 330 + 42 * i, B, 34, DARK)
        c('With Love,', y0 + 445, I, 34, GOLD)
        c(D['parents'], y0 + 485, BI, 42, PINK, 640)
        im.save(os.path.join(OUT, f'invite_{k}.png'))

# ---------------------------------------------------------------- video
W, H, FPS, CPS, FADE, HOLD = 1080, 1920, 30, 14, 0.5, 2.2
def scenes():
    s = [
        ('1', [(D['opening_line'], BI, 60, GOLD)]),
        ('2', [('Happy ' + D['birthday_label'], BI, 84, GOLD)]),
        ('3', [(D['baby_name'], B, 112, PINK)]),
        ('4', [(t, I, 58, DARK) for t in D['tagline']]),
        ('5', [(D['date'], B, 58, DARK), (D['time'], B, 58, PINK)]),
        ('6', [('Venue', BI, 52, GOLD)] + [(t, B, 60, DARK) for t in D['venue']]),
    ]
    last = [(D['closing_line'], BI, 92, PINK), ('With Love,', I, 48, GOLD), (D['parents'], BI, 56, DARK)]
    if D.get('grandparents'): last.append(('Grandparents: ' + D['grandparents'], I, 40, GOLD))
    s.append(('7', last))
    return s

def video(path):
    enc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
        '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', path],
        stdin=subprocess.PIPE)
    prev = None; probe = ImageDraw.Draw(Image.new('RGB', (10, 10)))
    for k, lines in scenes():
        base = Image.open(os.path.join(ASSETS, k + '.webp')).convert('RGB').resize((W, H))
        items = [(t, fit(probe, t, n, s, 800), col, s) for t, n, s, col in lines]
        total = sum(len(t) for t, *_ in items)
        dur = FADE + total / CPS + HOLD + (1.5 if k == '7' else 0)
        gaps = [int(s * 1.45) for *_, s in items]; y0 = 1480 - sum(gaps) // 2
        for i in range(int(dur * FPS)):
            t = i / FPS; im = base.copy(); d = ImageDraw.Draw(im)
            typed = max(0, int((t - FADE * .5) * CPS)); y = y0
            for (txt, fo, col, s), g in zip(items, gaps):
                part = txt[:max(0, min(len(txt), typed))]; typed -= len(txt)
                if part: d.text(((W - d.textlength(txt, font=fo)) / 2, y), part, font=fo, fill=col)
                y += g
            if prev is not None and t < FADE: im = Image.blend(prev, im, t / FADE)
            enc.stdin.write(im.tobytes())
        prev = im
    enc.stdin.close(); enc.wait()

# ---------------------------------------------------------------- music
def synth_bgm(path, dur):
    SR = 44100; N = int(SR * dur); out = np.zeros(N)
    def tone(f, start, length, amp, dec):
        n = int(SR * length); t = np.arange(n) / SR
        w = sum(a * np.sin(2 * np.pi * f * (i + 1) * t) for i, a in enumerate((1, .5, .25, .12)))
        e = np.exp(-dec * t) * np.minimum(1, t / .005); s = int(start * SR); en = min(N, s + n)
        out[s:en] += amp * (w * e)[:en - s]
    sc = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 784.0]  # Mohanam
    mel = [4,5,4,3,2,3,4,2, 4,5,6,5,4,3,2,0, 2,3,4,3,2,0,1,0, 3,4,5,4,3,2,1,0]
    t0, i = 1.0, 0
    while t0 < dur - 4:
        n = mel[i % len(mel)]; tone(sc[n], t0, 2.5, .22, 2.2)
        if i % 4 == 0: tone(sc[n] / 2, t0, 3.0, .12, 1.2)
        t0 += .6 * (1.5 if i % 8 == 7 else 1); i += 1
    t = np.arange(N) / SR
    out += .05 * (np.sin(2 * np.pi * 130.81 * t) + .6 * np.sin(2 * np.pi * 196 * t)) * (.7 + .3 * np.sin(2 * np.pi * .1 * t))
    out /= np.abs(out).max() * 1.1; out *= np.minimum(1, np.minimum(t / 2, (dur - t) / 3))
    w = wave.open(path, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out * 32767).astype('<i2').tobytes()); w.close()

def mux(silent, final):
    dur = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', silent]))
    bgm = D.get('bgm', 'auto')
    if bgm == 'auto':
        bgm = os.path.join(OUT, '_bgm.wav'); synth_bgm(bgm, dur); af = 'aecho=0.8:0.6:60|120:0.35|0.2'
    else:
        bgm = bgm if os.path.isabs(bgm) else os.path.join(HERE, bgm)
        af = f'afade=t=in:d=2,afade=t=out:st={dur-3}:d=3'
    subprocess.check_call(['ffmpeg', '-y', '-loglevel', 'error', '-i', silent, '-i', bgm, '-af', af,
        '-c:v', 'copy', '-c:a', 'aac', '-t', str(dur), final])

if __name__ == '__main__':
    static_invites()
    silent = os.path.join(OUT, 'invite_video.mp4'); video(silent)
    mux(silent, os.path.join(OUT, 'invite_video_bgm.mp4'))
    print('Done ->', OUT)
