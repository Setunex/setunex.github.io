#!/usr/bin/env python3
"""Map ABC labels to OpenMoji SVGs using OpenMoji metadata.

Outputs `abc_mapping_openmoji.csv` with columns: word, openmoji_url, match_type, annotation
"""
from pathlib import Path
import csv
import json
import re
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
LABELS_CSV = ROOT / 'abc_labels.csv'
OUT_CSV = ROOT / 'abc_mapping_openmoji.csv'

# OpenMoji metadata URL (raw JSON)
OPENMOJI_JSON = 'https://raw.githubusercontent.com/hfg-gmuend/openmoji/master/data/openmoji.json'
JSDELIVR_TEMPLATE = 'https://cdn.jsdelivr.net/gh/hfg-gmuend/openmoji@master/color/svg/{hexcode}.svg'

def load_labels():
    labels = []
    with LABELS_CSV.open(encoding='utf-8') as f:
        r = csv.reader(f)
        next(r, None)
        for row in r:
            if row:
                labels.append(row[0])
    return labels

def norm(s):
    return re.sub(r"[^a-z0-9]+"," ", s.lower()).strip()

def fetch_openmoji():
    print('Fetching OpenMoji metadata...')
    with urllib.request.urlopen(OPENMOJI_JSON) as r:
        return json.load(r)

def build_entries(data):
    entries = []
    for entry in data:
        anno = entry.get('annotation','')
        hexcode = entry.get('hexcode')
        tags = entry.get('tags', []) or []
        entries.append({'hex': hexcode, 'annotation': anno, 'tags': tags})
    return entries

def score_match(label_norm, entry):
    anno = norm(entry['annotation'])
    tags = [norm(t) for t in entry.get('tags', [])]
    if label_norm == anno:
        return 100
    if label_norm in anno:
        return 80
    # token matches
    for t in label_norm.split():
        if t in tags:
            return 70
        if t == anno:
            return 90
        if t in anno:
            return 60
    return 0

def find_best(label, entries):
    k = norm(label)
    best = (None, None, 'none', 0)
    for e in entries:
        sc = score_match(k, e)
        if sc > best[3]:
            best = (e['hex'], e['annotation'], 'openmoji', sc)
            if sc >= 100:
                break
    return best[0], best[1], best[2] + ('|score'+str(best[3]) if best[3] else '')

def main():
    labels = load_labels()
    data = fetch_openmoji()
    entries = build_entries(data)
    rows = []
    for w in labels:
        hexcode, anno, mtype = find_best(w, entries)
        if hexcode:
            url = JSDELIVR_TEMPLATE.format(hexcode=hexcode)
        else:
            url = ''
        rows.append((w, url, mtype, anno or ''))

    with OUT_CSV.open('w', newline='', encoding='utf-8') as f:
        w = csv.writer(f)
        w.writerow(['word','openmoji_url','match_type','annotation'])
        for r in rows:
            w.writerow(r)

    print('Wrote', OUT_CSV)

if __name__ == '__main__':
    main()
