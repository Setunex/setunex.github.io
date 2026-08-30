/**
 * Kutumb Connect CSV Builder — Google Sheets Apps Script.
 *
 * SETUP (one time):
 * 1. Create a Google Sheet with two tabs: "Settings" and "Directory".
 * 2. In "Settings": B1 = CommunityCode (short fixed code, e.g. BPL),
 *    B2 = RegionCode (optional, e.g. GJ — leave blank if you don't split by
 *    district/state). Never change CommunityCode once you start importing;
 *    changing it makes the app treat your data as a brand new community.
 * 3. In "Directory" row 1, paste the header from directory-headers.csv
 *    (Family#, NamePrefix, FirstName, ... EMail).
 * 4. Fill one row per person. Put the SAME number in "Family#" for every
 *    member of one family (1, 1, 1, 1, 2, 2, 2, ...). Keep that number
 *    stable across future edits — it becomes each family's permanent ID.
 * 5. Extensions > Apps Script, paste this file, save, reload the Sheet.
 * 6. Use the new "Kutumb Connect" menu > "Export CSV for import".
 *
 * The exported file is saved to Google Drive (same folder as this Sheet) and
 * its link is shown in a dialog — download it from there and import it into
 * the Kutumb Connect app.
 */

const SETTINGS_SHEET = "Settings";
const DIRECTORY_SHEET = "Directory";
const REQUIRED_COLUMNS = ["FirstName", "Surname", "Relationship", "Gender"];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Kutumb Connect")
    .addItem("Export CSV for import", "exportCsv")
    .addToUi();
}

function exportCsv() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const settingsSheet = ss.getSheetByName(SETTINGS_SHEET);
  const directorySheet = ss.getSheetByName(DIRECTORY_SHEET);
  if (!settingsSheet || !directorySheet) {
    ui.alert(
      `Missing "${SETTINGS_SHEET}" or "${DIRECTORY_SHEET}" tab. See the setup notes at the top of this script.`
    );
    return;
  }

  const communityCode = String(settingsSheet.getRange("B1").getValue()).trim();
  const regionCode = String(settingsSheet.getRange("B2").getValue()).trim();
  if (!communityCode) {
    ui.alert("Settings!B1 (CommunityCode) is required.");
    return;
  }

  const values = directorySheet.getDataRange().getValues();
  const header = values[0].map((h) => String(h).trim());
  const rows = values
    .slice(1)
    .filter((row) => row.some((cell) => String(cell).trim() !== ""));

  const familyCol = header.indexOf("Family#");
  if (familyCol === -1) {
    ui.alert('Directory sheet is missing the "Family#" column.');
    return;
  }

  const missingRequired = [];
  rows.forEach((row, i) => {
    REQUIRED_COLUMNS.forEach((col) => {
      const idx = header.indexOf(col);
      if (idx === -1 || String(row[idx]).trim() === "") {
        missingRequired.push(`Row ${i + 2}: missing ${col}`);
      }
    });
    if (String(row[familyCol]).trim() === "") {
      missingRequired.push(`Row ${i + 2}: missing Family#`);
    }
  });
  if (missingRequired.length) {
    ui.alert(
      `Fix these rows before exporting:\n\n${missingRequired
        .slice(0, 20)
        .join("\n")}`
    );
    return;
  }

  // Export column order: our identity columns first, then everything from
  // the Directory sheet except the helper "Family#" column.
  const outHeader = ["CommunityCode", "RegionCode", "FamilyId"].concat(
    header.filter((h) => h !== "Family#")
  );

  const outRows = rows.map((row) => {
    const familyId = `${regionCode || communityCode}-F${String(
      row[familyCol]
    ).trim()}`;
    const rest = header
      .map((h, idx) => (h === "Family#" ? null : row[idx]))
      .filter((_, idx) => header[idx] !== "Family#");
    return [communityCode, regionCode, familyId].concat(rest);
  });

  const csv = [outHeader].concat(outRows).map(toCsvLine).join("\r\n");

  const fileName = `${communityCode}${
    regionCode ? "-" + regionCode : ""
  }-contacts-${today()}.csv`;
  const folder = getSpreadsheetFolder(ss);
  const file = folder.createFile(fileName, csv, MimeType.CSV);

  ui.alert(
    `Exported ${
      outRows.length
    } people.\n\nSaved to Google Drive as "${fileName}".\nOpen it from Drive and download/share it: ${file.getUrl()}`
  );
}

function toCsvLine(cells) {
  return cells
    .map((cell) => {
      const value = cell === null || cell === undefined ? "" : String(cell);
      return /[",\r\n]/.test(value)
        ? '"' + value.replace(/"/g, '""') + '"'
        : value;
    })
    .join(",");
}

function today() {
  return Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyyMMdd"
  );
}

function getSpreadsheetFolder(ss) {
  const file = DriveApp.getFileById(ss.getId());
  const parents = file.getParents();
  return parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
}
