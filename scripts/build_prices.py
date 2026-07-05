#!/usr/bin/env python3
"""Bake trailer prices into static HTML.

Source of truth:
  1. If env var SHEET_CSV_URL is set: fetch the published-to-web Google Sheet CSV,
     validate it, and update data/prices.json to match.
  2. Otherwise (or if the fetch fails validation): use data/prices.json as-is.

Then render every file under templates/ (which contain {{TOKEN}} placeholders)
into the same relative path at the repo root. The live site is always pure
static HTML - no client-side fetching.

IMPORTANT FOR EDITORS: the files listed under templates/ are the SOURCE for
their counterparts at the repo root. Edit the template, not the root file -
the nightly build overwrites root files from templates.

Exits non-zero (deploy blocked) on any validation failure or leftover token.
"""
import csv
import io
import json
import os
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATES = os.path.join(ROOT, "templates")
PRICES_JSON = os.path.join(ROOT, "data", "prices.json")

TRAILERS = ("utility", "dump", "enclosed")
# Sanity bounds: a Sheet typo like 950 instead of 95 must not go live.
BOUNDS = {"day": (20, 300), "week": (100, 2000), "month": (400, 6000)}


def fail(msg):
    print(f"PRICE BUILD FAILED: {msg}", file=sys.stderr)
    sys.exit(1)


def validate(prices):
    for t in TRAILERS:
        if t not in prices:
            fail(f"missing trailer '{t}'")
        for period, (lo, hi) in BOUNDS.items():
            v = prices[t].get(period)
            if not isinstance(v, int):
                fail(f"{t}.{period} is not a whole number: {v!r}")
            if not lo <= v <= hi:
                fail(f"{t}.{period}={v} outside sane range {lo}-{hi} - refusing to publish")
        if not prices[t]["day"] < prices[t]["week"] < prices[t]["month"]:
            fail(f"{t}: expected day < week < month, got {prices[t]}")


def from_sheet(url):
    with urllib.request.urlopen(url, timeout=30) as r:
        text = r.read().decode("utf-8-sig")
    rows = list(csv.DictReader(io.StringIO(text)))
    if not rows:
        fail("sheet CSV is empty")
    prices = {}
    for row in rows:
        row = {(k or "").strip().lower(): (v or "").strip() for k, v in row.items()}
        name = row.get("trailer", "").lower()
        if name not in TRAILERS:
            continue
        try:
            prices[name] = {p: int(row[p].replace("$", "").replace(",", "")) for p in ("day", "week", "month")}
        except (KeyError, ValueError) as e:
            fail(f"bad row for '{name}': {e} (need numeric day, week, month columns)")
    return prices


def main():
    url = os.environ.get("SHEET_CSV_URL", "").strip()
    if url:
        print(f"Fetching prices from Google Sheet...")
        prices = from_sheet(url)
        validate(prices)
        with open(PRICES_JSON, "w", encoding="utf-8", newline="\n") as f:
            json.dump(prices, f, indent=2)
            f.write("\n")
        print("Sheet OK - data/prices.json updated.")
    else:
        print("SHEET_CSV_URL not set - using committed data/prices.json.")
        with open(PRICES_JSON, encoding="utf-8") as f:
            prices = json.load(f)
        validate(prices)

    tokens = {}
    for t in TRAILERS:
        for p in ("day", "week", "month"):
            v = prices[t][p]
            tokens[f"{t.upper()}_{p.upper()}"] = f"{v:,}"       # display: 1,700
            tokens[f"{t.upper()}_{p.upper()}_RAW"] = str(v)      # JS/schema: 1700

    rendered = 0
    for dirpath, _, files in os.walk(TEMPLATES):
        for name in files:
            src = os.path.join(dirpath, name)
            rel = os.path.relpath(src, TEMPLATES)
            with open(src, encoding="utf-8") as f:
                content = f.read()
            for k, v in tokens.items():
                content = content.replace("{{" + k + "}}", v)
            if "{{" in content:
                line = next(l for l in content.splitlines() if "{{" in l)
                fail(f"unresolved token in {rel}: {line.strip()[:120]}")
            dest = os.path.join(ROOT, rel)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            with open(dest, "w", encoding="utf-8", newline="\n") as f:
                f.write(content)
            rendered += 1

    print(f"Rendered {rendered} files. Prices: " + ", ".join(
        f"{t} ${prices[t]['day']}/{prices[t]['week']}/{prices[t]['month']}" for t in TRAILERS))


if __name__ == "__main__":
    main()
