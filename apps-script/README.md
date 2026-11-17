# Leaders Hub (Google Apps Script)

Server side of the Leaders Hub. It runs in the Apps Script project attached to the inventory Google
Sheet, not on this website.

The form itself lives on the website (`leaders.html`, `leaders.js`, `leaders.css`). It sends each
request to this script's `doPost` without a Google sign-in, so the Google account a device is signed
into can't block it (embedding Google's page did, which caused blank boxes).

- `Code.gs` – `doPost` entry point, password check, materials requests, feedback/attendance (with photos), Archive & Purge menu

## Updating the live form

1. Paste the changed file(s) into the Apps Script editor (Extensions → Apps Script from the sheet) and save.
2. **Deploy → Manage deployments → ✏️ → Version: New version → Deploy.**
   Don't use "New deployment": that creates a new URL and the website would still point at the old one.
3. Keep **Who has access** set to **Anyone**, or the form shows up blank on some devices.

The password is stored in **Project Settings → Script Properties → `FORM_PASSWORD`**, never in this code.

Session photos from the feedback form are saved to a **Leaders Hub Photos** Google Drive folder next to the sheet
(its ID is kept in the Script Property `PHOTO_FOLDER_ID`). After adding or moving this script, run the function
**`setupPhotoFolder`** once from the editor (choose it in the toolbar's function menu → **Run** → allow access)
so the script is allowed to use Google Drive.
