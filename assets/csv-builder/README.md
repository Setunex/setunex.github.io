# Kutumb Connect CSV builder (Google Sheets)

A Google Sheet + Apps Script so a non-technical community admin can prepare
and re-export the CSV this app imports, without touching a spreadsheet's raw
CSV export (which doesn't compute `FamilyId`/`CommunityCode` for you).

## Setup

1. Create a new Google Sheet with two tabs: `Settings` and `Directory`.
2. `Settings`: `B1` = your `CommunityCode` (short, fixed, e.g. `BPL` — never
   change it later, that's what tells the app "same community, new version").
   `B2` = `RegionCode` (optional; only needed if your community splits its
   directory by district/state).
3. `Directory` row 1: paste the header from [directory-headers.csv](directory-headers.csv).
4. One row per person. Give every member of one family the **same number**
   in `Family#` (1,1,1,1,2,2,2,...) and never change that number in later
   edits — it becomes that family's permanent ID.
5. Extensions ▸ Apps Script ▸ paste [CommunityContactsExport.gs](CommunityContactsExport.gs) ▸ Save ▸ reload the Sheet.
6. Menu **Kutumb Connect ▸ Export CSV for import** — validates required
   fields, computes `CommunityCode`/`RegionCode`/`FamilyId` for every row, and
   saves the CSV to the same Drive folder as the Sheet.

## Regions / large communities

If your community spans multiple districts/states, keep one Sheet **per
region**, each with the same `CommunityCode` but its own `RegionCode`.
Re-importing a region's CSV into the app only replaces that region — other
regions and other communities are untouched.

## Updating later

Just edit the same Sheet and export again. Same `CommunityCode`+`RegionCode`
= an upgrade of that data, not a duplicate. Family members quote their
`Family#`/`FamilyId` (shown in-app under their profile) plus their name when
asking the admin to update their details in the Sheet.
