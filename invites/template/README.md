# Birthday invitation template

1. Edit `details.json` (name, date, venue, parents, tagline, colours...).
2. Run:  `python3 make_invite.py`  (or `python3 make_invite.py my.json out_dir`)
3. Get `output/invite_<n>.png` (static cards) and `output/invite_video_bgm.mp4`.

- `bgm`: `"auto"` = generated melody, or a path to your own mp3/m4a/wav (relative to this folder).
- Photos live in `assets/1..7.webp` (1=Ganesha, 2=cake, 3=vehicle, 4=police, 5=doctor, 6=family, 7=parents). Replace with new 1130x2000 images of the same frame to customise; scene order is set in `scenes()`.
- Text auto-shrinks to fit. Fonts: FreeSerif (no Telugu glyphs; pass another font path in `FONTS` for Telugu).
- Requires Pillow, numpy, ffmpeg.
