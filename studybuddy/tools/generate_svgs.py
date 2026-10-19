#!/usr/bin/env python3
"""Generate simple programmatic SVG assets for each ABC word.

Produces SVGs under `Cards/assets/generated/` and a mapping CSV `Cards/abc_mapping.csv`.
"""
from pathlib import Path
import csv
import re
import html

ROOT = Path(__file__).resolve().parent.parent
HTML = ROOT / 'abc-adventure-fullscreen.html'
LABELS_CSV = ROOT / 'abc_labels.csv'
OUT_DIR = ROOT / 'assets' / 'generated'
MAPPING_CSV = ROOT / 'abc_mapping.csv'

OUT_DIR.mkdir(parents=True, exist_ok=True)

def extract_pairs_from_html(txt):
    pattern = re.compile(r"\[\s*'([^']+)'\s*,\s*'([^']+)'\s*\]")
    return {m[0]: m[1] for m in pattern.findall(txt)}

def sanitize(name):
    s = name.lower()
    s = re.sub(r"[^a-z0-9]+", '-', s)
    s = re.sub(r"-+", '-', s).strip('-')
    if not s:
        s = 'item'
    return s

def svg_for(word, letter, emoji_char):
    # Colors and layout
    bg = '#fffdf8'
    circle = '#ff8fb1'
    text_color = '#3a3355'
    emoji_font = 'Segoe UI Emoji, Noto Color Emoji, Apple Color Emoji, sans-serif'
    word_esc = html.escape(word)
    # Use emoji if available; otherwise use the letter glyph
    center_text = html.escape(emoji_char) if emoji_char else letter
    # SVG 400x420
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="420" viewBox="0 0 400 420" role="img" aria-label="{word_esc}">
  <rect width="100%" height="100%" fill="{bg}" rx="24"/>
  <circle cx="200" cy="150" r="120" fill="{circle}" />
  <text x="200" y="170" text-anchor="middle" font-family="{emoji_font}" font-size="140" dominant-baseline="middle">{center_text}</text>
  <text x="200" y="330" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="{text_color}" font-weight="700">{word_esc}</text>
</svg>
'''

def main():
    if not HTML.exists():
        print('ERROR: HTML file not found at', HTML)
        return

    htmltxt = HTML.read_text(encoding='utf-8')
    pairs = extract_pairs_from_html(htmltxt)

    # Read labels list (fallback to keys from pairs)
    labels = []
    if LABELS_CSV.exists():
        with LABELS_CSV.open(newline='', encoding='utf-8') as f:
            r = csv.reader(f)
            next(r, None)
            for row in r:
                if row:
                    labels.append(row[0])
    else:
        labels = sorted(pairs.keys())

    rows = []
    for wd in labels:
        emoji = pairs.get(wd, '')
        letter = wd[0].upper() if wd else '?'
        fname = sanitize(wd) + '.svg'
        outp = OUT_DIR / fname
        outp.write_text(svg_for(wd, letter, emoji), encoding='utf-8')
        rows.append((wd, str(outp.relative_to(ROOT)), emoji))

    with MAPPING_CSV.open('w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['word', 'svg', 'emoji'])
        for r in rows:
            w.writerow(r)

    print(f'Generated {len(rows)} SVGs in {OUT_DIR} and mapping {MAPPING_CSV}')

if __name__ == '__main__':
    main()
