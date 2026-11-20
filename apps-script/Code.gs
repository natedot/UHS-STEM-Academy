// School tabs keep headers in rows 1-5; requests start on this row
const FIRST_DATA_ROW = 6;
const NUM_COLS = 5; // Timestamp, Experiment, Material, Qty, Notes

// Feedback / attendance submissions all go to one tab (header in row 1)
const FEEDBACK_SHEET = "Feedback";
const FEEDBACK_HEADERS = ["Timestamp", "School", "Session Date", "Attendance", "# Attended", "What Went Well", "What Didn't Go Well", "How Can We Improve", "Photos", "Submitted By"];

// Every submission (and every wrong password) is recorded here with who sent it and from what device.
// Archive & Purge never clears this tab, so it's a permanent record.
const LOG_SHEET = "Submission Log";
const LOG_HEADERS = ["Timestamp", "Action", "School", "Submitted By", "Details", "Device", "Screen", "Language", "Time Zone", "Device ID", "Browser Info (full)"];

// Session photos are saved in Google Drive (in a folder next to this spreadsheet), one sub-folder per school + date.
// The Feedback row links to that sub-folder.
const PHOTO_FOLDER_NAME = "Leaders Hub Photos";
const MAX_PHOTOS = 10;

/**
 * The Leaders Hub form on the website sends its requests here as JSON: { action, payload }.
 * The website sends them without any Google sign-in, so whatever Google account a device is
 * signed into can't block the form.
 */
function doPost(e) {
  const handlers = { verifyPassword, processForm, submitFeedback };
  let result;
  try {
    const request = JSON.parse(e.postData.contents);
    result = handlers[request.action] ? handlers[request.action](request.payload) : "Error: Unknown request.";
  } catch (error) {
    result = "Error: " + error.toString();
  }
  return ContentService.createTextOutput(JSON.stringify({ result: result }))
      .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Compares a password against the FORM_PASSWORD Script Property.
 * Set it in: Project Settings (gear icon) -> Script Properties.
 */
function checkPassword_(pw) {
  const real = PropertiesService.getScriptProperties().getProperty('FORM_PASSWORD');
  return !!real && pw === real;
}

/** Called when a leader presses Unlock on the Leaders Hub. Wrong passwords are recorded in the Submission Log. */
function verifyPassword(payload) {
  const isObject = payload !== null && typeof payload === "object";
  const ok = checkPassword_(isObject ? payload.password : payload);
  if (!ok) withLock_(() => logEvent_("Wrong password", "", "", "", isObject ? payload.client : null));
  return ok;
}

/**
 * Makes text from the website safe to put in a cell: limits its length, and stops Sheets from treating
 * text that starts with = + - @ as a formula (formulas typed into a form could be used to leak data).
 */
function clean_(value, maxLength) {
  let text = String(value == null ? "" : value).slice(0, maxLength || 2000);
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return text;
}

/** A first and last name, cleaned up, or "" if what was typed isn't one */
function fullName_(value) {
  const name = String(value == null ? "" : value).replace(/\s+/g, " ").trim();
  return name.split(" ").length >= 2 && name.length <= 80 ? clean_(name) : "";
}

/** Returns the Submission Log tab, creating and formatting it the first time */
function getLogSheet_(ss) {
  let sheet = ss.getSheetByName(LOG_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(LOG_SHEET);
    sheet.getRange(1, 1, 1, LOG_HEADERS.length).setValues([LOG_HEADERS])
        .setFontWeight("bold").setBackground("#333333").setFontColor("white");
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, 4, 150);
    sheet.setColumnWidth(5, 220);
    sheet.setColumnWidth(6, 200);
  }
  return sheet;
}

/** Adds one row to the Submission Log. `client` is the device info the website sends (see leaders.js → clientInfo). */
function logEvent_(action, school, submittedBy, details, client) {
  const c = client && typeof client === "object" ? client : {};
  appendRows_(getLogSheet_(SpreadsheetApp.getActiveSpreadsheet()), [[
    new Date(), action, clean_(school, 100), submittedBy, clean_(details, 500),
    clean_(c.device, 200), clean_(c.screen, 50), clean_(c.language, 50), clean_(c.timeZone, 80),
    clean_(c.deviceId, 80), clean_(c.userAgent, 500)
  ]], 2);
}

/** Makes sure the sheet has at least `lastRow` rows (setValues can't grow a sheet like appendRow can) */
function ensureRows_(sheet, lastRow) {
  const max = sheet.getMaxRows();
  if (lastRow > max) sheet.insertRowsAfter(max, lastRow - max);
}

/** Writes rows below the last filled row (never above `minRow`), holding a lock so simultaneous submissions don't collide */
function appendRows_(sheet, rows, minRow) {
  const startRow = Math.max(sheet.getLastRow() + 1, minRow);
  ensureRows_(sheet, startRow + rows.length - 1);
  sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    return fn();
  } catch (error) {
    return "Error: " + error.toString();
  } finally {
    lock.releaseLock();
  }
}

/** Materials request form */
function processForm(data) {
  // Re-check the password on every submission so the form can't be bypassed
  if (!checkPassword_(data.password)) {
    return "Error: Incorrect password. Please reload the page and log in again.";
  }
  if (!data.schoolName) return "Error: Please select a school.";
  const submittedBy = fullName_(data.submittedBy);
  if (!submittedBy) return "Error: Please enter your first and last name.";

  const timestamp = new Date();
  const rows = [];
  data.experiments.forEach(exp => {
    exp.materials.forEach(mat => {
      if (String(mat.name).trim() !== "") rows.push([timestamp, clean_(exp.name, 200), clean_(mat.name, 200), clean_(mat.qty, 100), clean_(mat.notes)]);
    });
  });
  if (rows.length === 0) return "Error: No materials were entered.";

  return withLock_(() => {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(data.schoolName);

    // Auto-build the tab if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(data.schoolName);
      sheet.getRange(1, 1, 1, NUM_COLS)
          .setValues([["Timestamp", "Experiment Name", "Material Name", "Quantity", "Notes"]])
          .setFontWeight("bold");
    }

    // Never above row 6, so Archive & Purge always picks it up
    appendRows_(sheet, rows, FIRST_DATA_ROW);
    logEvent_("Materials request", data.schoolName, submittedBy,
        rows.length + " material(s): " + rows.map(r => r[2]).join(", "), data.client);
    return "Success";
  });
}

/** Returns the Feedback tab, creating and formatting it the first time */
function getFeedbackSheet_(ss) {
  let sheet = ss.getSheetByName(FEEDBACK_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(FEEDBACK_SHEET);
    sheet.getRange(1, 1, 1, FEEDBACK_HEADERS.length).setValues([FEEDBACK_HEADERS])
        .setFontWeight("bold").setBackground("#D31145").setFontColor("white");
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, 3, 130);
    sheet.setColumnWidth(4, 220);
    sheet.setColumnWidth(5, 90);
    sheet.setColumnWidths(6, 3, 280);
    sheet.setColumnWidths(9, 2, 140);
    sheet.getRange("D:H").setWrap(true);
  } else {
    // Feedback tab made by an older version: add any header that's missing (Photos, Submitted By)
    const current = sheet.getRange(1, 1, 1, FEEDBACK_HEADERS.length).getValues()[0];
    FEEDBACK_HEADERS.forEach((header, i) => {
      if (current[i] === "") {
        sheet.getRange(1, i + 1).setValue(header).setFontWeight("bold").setBackground("#D31145").setFontColor("white");
        sheet.setColumnWidth(i + 1, 140);
      }
    });
  }
  return sheet;
}

/** The "Leaders Hub Photos" folder: created next to this spreadsheet the first time, then remembered */
function getPhotoRootFolder_() {
  const props = PropertiesService.getScriptProperties();
  const savedId = props.getProperty("PHOTO_FOLDER_ID");
  if (savedId) {
    try { return DriveApp.getFolderById(savedId); } catch (e) { /* folder was deleted: make a new one */ }
  }
  const parents = DriveApp.getFileById(SpreadsheetApp.getActiveSpreadsheet().getId()).getParents();
  const parent = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
  const folder = parent.createFolder(PHOTO_FOLDER_NAME);
  props.setProperty("PHOTO_FOLDER_ID", folder.getId());
  return folder;
}

/**
 * Run this once from the Apps Script editor after adding photo support: it asks for permission to use
 * Google Drive and creates the photo folder. The folder's link appears in the Execution log.
 */
function setupPhotoFolder() {
  Logger.log("Photo folder: " + getPhotoRootFolder_().getUrl());
}

/** Saves the photos (base64 JPEGs from the website) and returns a link formula for the Feedback row */
function savePhotos_(photos, schoolName, sessionDate) {
  const root = getPhotoRootFolder_();
  const folderName = sessionDate + " — " + schoolName;
  const existing = root.getFoldersByName(folderName);
  const folder = existing.hasNext() ? existing.next() : root.createFolder(folderName);
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "HHmmss");
  const toSave = photos.slice(0, MAX_PHOTOS);
  toSave.forEach((photo, i) => {
    const bytes = Utilities.base64Decode(String(photo.data));
    folder.createFile(Utilities.newBlob(bytes, "image/jpeg", folderName + " " + stamp + "-" + (i + 1) + ".jpg"));
  });
  return '=HYPERLINK("' + folder.getUrl() + '", "📷 ' + toSave.length + ' photo(s)")';
}

/** Feedback / attendance form */
function submitFeedback(data) {
  if (!checkPassword_(data.password)) {
    return "Error: Incorrect password. Please reload the page and log in again.";
  }
  if (!data.schoolName) return "Error: Please select a school.";
  const submittedBy = fullName_(data.submittedBy);
  if (!submittedBy) return "Error: Please enter your first and last name.";

  const names = data.attendees.map(n => String(n).trim()).filter(n => n !== "").map(n => clean_(n, 100));
  if (names.length === 0) return "Error: Please enter at least one name for attendance.";

  // Photos are saved first (outside the lock, since uploading takes a few seconds)
  let photoLink = "";
  if (Array.isArray(data.photos) && data.photos.length > 0) {
    try {
      photoLink = savePhotos_(data.photos, data.schoolName, data.sessionDate);
    } catch (error) {
      return "Error saving photos: " + error.toString();
    }
  }

  return withLock_(() => {
    const sheet = getFeedbackSheet_(SpreadsheetApp.getActiveSpreadsheet());
    appendRows_(sheet, [[
      new Date(), clean_(data.schoolName, 100), clean_(data.sessionDate, 20), names.join(", "), names.length,
      clean_(data.wentWell), clean_(data.didntGoWell), clean_(data.improve), photoLink, submittedBy
    ]], 2);
    logEvent_("Feedback", data.schoolName, submittedBy,
        names.length + " attended" + (photoLink ? ", " + Math.min(data.photos.length, MAX_PHOTOS) + " photo(s)" : ""), data.client);
    return "Success";
  });
}

/**
 * Creates a custom menu in Google Sheets when opened
 */
function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('🛠️ Leaders Hub Admin')
      .addItem('Archive & Purge Session Data', 'archiveAndPurge')
      .addToUi();
}

/**
 * Archives data with 4-level dropdowns: Session -> School -> Experiment/Feedback -> Materials/Feedback details
 */
function archiveAndPurge() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const tz = Session.getScriptTimeZone();

  // 1. Confirm with the user
  const confirmResponse = ui.alert('Confirm Archive & Purge',
    'Are you sure you want to archive this session? This will move all materials and feedback to the Archive tab and clear the school and Feedback tabs.',
    ui.ButtonSet.YES_NO);
  if (confirmResponse !== ui.Button.YES) return;

  // 2. Prompt for Session Date (defaults to today if left blank)
  const sessionPrompt = ui.prompt('Archive Session', 'Enter the Session Date/Name (e.g., "10/24/2026" or "Fall Session 1"):', ui.ButtonSet.OK_CANCEL);
  if (sessionPrompt.getSelectedButton() !== ui.Button.OK) return;
  const sessionName = sessionPrompt.getResponseText().trim() ||
      Utilities.formatDate(new Date(), tz, "MM/dd/yyyy");

  // 3. Gather all data FIRST before touching the archive
  const schools = {};   // schoolName -> { sheet, numRows, experiments: {expName: [rows]}, feedback: [rows] }
  const schoolFor = name => (schools[name] = schools[name] || { experiments: {}, feedback: [] });

  for (const sheet of ss.getSheets()) {
    const sheetName = sheet.getName();

    // Skip non-school tabs
    if (sheetName === "Archive" || sheetName === "ORDER" || sheetName === FEEDBACK_SHEET || sheetName === LOG_SHEET || sheetName.includes("Template")) continue;

    const lastRow = sheet.getLastRow();
    if (lastRow < FIRST_DATA_ROW) continue; // No materials requested here

    const numRows = lastRow - FIRST_DATA_ROW + 1;
    const experiments = {};
    for (const row of sheet.getRange(FIRST_DATA_ROW, 1, numRows, NUM_COLS).getValues()) {
      const expName = row[1];
      if (!expName || expName.toString().trim() === "") continue;
      (experiments[expName] = experiments[expName] || []).push(row);
    }

    if (Object.keys(experiments).length > 0) {
      Object.assign(schoolFor(sheetName), { sheet, numRows, experiments });
    }
  }

  const feedbackSheet = ss.getSheetByName(FEEDBACK_SHEET);
  const feedbackRange = feedbackSheet && feedbackSheet.getLastRow() >= 2
      ? feedbackSheet.getRange(2, 1, feedbackSheet.getLastRow() - 1, FEEDBACK_HEADERS.length)
      : null;
  const feedbackRows = feedbackRange ? feedbackRange.getValues() : [];
  // The Photos column holds a link formula; read the formula itself so the link carries over to the archive
  const feedbackFormulas = feedbackRange ? feedbackRange.getFormulas() : [];
  feedbackRows.forEach((row, i) => {
    if (row[1] && row[1].toString().trim() !== "") {
      schoolFor(row[1].toString()).feedback.push({ row: row, photos: feedbackFormulas[i][8] || row[8] });
    }
  });

  const schoolNames = Object.keys(schools);
  if (schoolNames.length === 0) {
    ui.alert("Notice", "No new requests or feedback were found.", ui.ButtonSet.OK);
    return;
  }

  // 4. Setup Archive Sheet Layout
  const archiveSheet = ss.getSheetByName("Archive") || ss.insertSheet("Archive", 0);

  // Force the +/- toggle buttons to be at the TOP of the group
  try { archiveSheet.setRowGroupControlPosition(SpreadsheetApp.GroupControlTogglePosition.BEFORE); } catch (e) {}

  archiveSheet.getRange(1, 1, 1, 6).setValues([["Session Date", "School / Teacher", "Experiment", "Material", "Qty", "Notes"]])
    .setFontWeight("bold")
    .setBackground("#D31145") // UHS Red
    .setFontColor("white");
  archiveSheet.setFrozenRows(1);
  archiveSheet.setColumnWidth(1, 150);
  archiveSheet.setColumnWidth(2, 180);
  archiveSheet.setColumnWidth(3, 200);

  // 5. Build every archive row in memory, tracking which rows are headers and which ranges become dropdown groups
  const startRow = archiveSheet.getLastRow() + 1;
  const rows = [];
  const sessionHeaders = [], schoolHeaders = [], expHeaders = [], feedbackHeaders = [];
  const groups = []; // [firstRow, lastRow] pairs, each gets one extra level of nesting

  const addRow = (values, headerList) => {
    const rowNum = startRow + rows.length;
    rows.push(values);
    if (headerList) headerList.push(`A${rowNum}:F${rowNum}`);
    return rowNum;
  };
  const lastAdded = () => startRow + rows.length - 1;
  const asText = v => v instanceof Date ? Utilities.formatDate(v, tz, "MM/dd/yyyy") : String(v);

  const sessionRow = addRow(["📅 " + sessionName, "", "", "Click '+' to view schools ➔", "", ""], sessionHeaders);
  for (const name of schoolNames) {
    const school = schools[name];
    const schoolRow = addRow(["", "🏫 " + name, "", "Click '+' to view experiments & feedback ➔", "", ""], schoolHeaders);

    for (const exp in school.experiments) {
      const expRow = addRow(["", "", "🧪 " + clean_(exp, 200), "Click '+' to view materials ➔", "", ""], expHeaders);
      // clean_ again: Sheets hides the protective ' when values are read back
      for (const mat of school.experiments[exp]) addRow(["", "", "", clean_(mat[2]), clean_(mat[3]), clean_(mat[4])]);
      groups.push([expRow + 1, lastAdded()]);                       // Level 4: materials
    }

    for (const { row: fb, photos } of school.feedback) {
      // fb = [Timestamp, School, Session Date, Attendance, # Attended, Went Well, Didn't Go Well, Improve, Photos, Submitted By]
      const fbRow = addRow(["", "", "📝 Feedback " + asText(fb[2] || fb[0]), "Click '+' to view feedback ➔", "", ""], feedbackHeaders);
      addRow(["", "", "", "Attendance (" + fb[4] + ")", clean_(fb[3]), ""]);
      addRow(["", "", "", "What went well", clean_(fb[5]), ""]);
      addRow(["", "", "", "What didn't go well", clean_(fb[6]), ""]);
      addRow(["", "", "", "How can we improve", clean_(fb[7]), ""]);
      if (photos) addRow(["", "", "", "Photos", photos, ""]);
      if (fb[9]) addRow(["", "", "", "Submitted by", clean_(fb[9]), ""]);
      groups.push([fbRow + 1, lastAdded()]);                        // Level 4: feedback details
    }
    groups.push([schoolRow + 1, lastAdded()]);                      // Level 3: everything for this school
  }
  groups.push([sessionRow + 1, lastAdded()]);                       // Level 2: all schools

  // 6. Write all rows and formatting in a handful of calls
  ensureRows_(archiveSheet, lastAdded());
  archiveSheet.getRange(startRow, 1, rows.length, 6).setValues(rows);
  archiveSheet.getRangeList(sessionHeaders).setBackground("#333333").setFontColor("white").setFontWeight("bold");
  archiveSheet.getRangeList(schoolHeaders).setBackground("#cccccc").setFontColor("black").setFontWeight("bold");
  if (expHeaders.length) archiveSheet.getRangeList(expHeaders).setBackground("#f3f3f3").setFontColor("black").setFontWeight("bold");
  if (feedbackHeaders.length) archiveSheet.getRangeList(feedbackHeaders).setBackground("#fff2cc").setFontColor("black").setFontWeight("bold");

  // 7. Create the multi-level dropdown nesting
  try {
    for (const [first, last] of groups) archiveSheet.getRange(`${first}:${last}`).shiftRowGroupDepth(1);
  } catch (e) {
    // Catch max-depth errors quietly
  }

  // 8. Purge the processed data from the school tabs and the Feedback tab
  for (const name of schoolNames) {
    const school = schools[name];
    if (!school.sheet) continue; // Feedback-only school
    school.sheet.getRange(FIRST_DATA_ROW, 1, school.numRows, NUM_COLS).clearContent();
    school.sheet.getRange("D1").clearContent(); // Clears the typed session date
  }
  if (feedbackRows.length) feedbackSheet.getRange(2, 1, feedbackRows.length, FEEDBACK_HEADERS.length).clearContent();

  // 9. Neatly collapse all dropdowns
  archiveSheet.collapseAllRowGroups();
  ui.alert("Success!", `Data for "${sessionName}" archived successfully.`, ui.ButtonSet.OK);
}
