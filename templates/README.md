# Price templates — EDIT THESE, NOT THE ROOT FILES

Every file in this folder is the SOURCE for its counterpart at the repo root
(same relative path). Prices appear as `{{TOKENS}}` (e.g. `{{ENCLOSED_DAY}}`).

The nightly GitHub Action (`.github/workflows/sync-prices.yml`) reads prices
from the Google Sheet (or `data/prices.json`), renders these templates, and
OVERWRITES the root files. Any edit made directly to a root file that has a
template here will be wiped on the next sync — make content edits in the
template instead.

Tokens: `{UTILITY|DUMP|ENCLOSED}_{DAY|WEEK|MONTH}` (display, comma-formatted)
and `..._RAW` (no commas, for JavaScript/schema).
