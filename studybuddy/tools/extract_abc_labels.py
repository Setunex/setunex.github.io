#!/usr/bin/env python3
"""Extract ABC word list from abc-adventure-fullscreen.html and write CSV.

Usage: python extract_abc_labels.py
"""
from pathlib import Path
import re
import csv

ROOT = Path(__file__).resolve().parent.parent
HTML = ROOT / 'abc-adventure-fullscreen.html'
OUT = ROOT / 'abc_labels.csv'

if not HTML.exists():
    print('ERROR: html file not found at', HTML)
    raise SystemExit(1)

txt = HTML.read_text(encoding='utf-8')

# Find pairs like ['Apple', '🍎']
pattern = re.compile(r"\[\s*'([^']+)'\s*,\s*'([^']+)'\s*\]")
matches = pattern.findall(txt)

words = [m[0] for m in matches]
unique = sorted(dict.fromkeys(words))

with OUT.open('w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(['word'])
    for wd in unique:
        w.writerow([wd])

print(f'Wrote {len(unique)} unique words to {OUT}')
