# UHS STEM Academy — Website & Leaders Hub

This repository is the **UHS STEM Academy website** (live at **https://www.uhsstem.org**) and the **Leaders Hub**,
the password-protected form student leaders use to request materials and submit session feedback.
Everything the Leaders Hub collects ends up in the **inventory Google Sheet**.

This README is the handbook for future leaders. You don't need to be a programmer to do most of what's in here:
changing names, photos, times and schools is mostly copy, paste and edit. Read **[The big picture](#1-the-big-picture)**
first, then jump to **[Common tasks](#6-common-tasks-step-by-step)** for step-by-step recipes.
For the job you'll do every month, see **[The monthly routine](#the-monthly-routine)**.

---

## Contents

- ⭐ [The monthly routine](#the-monthly-routine): what to do with the sheet each month
1. [The big picture](#1-the-big-picture)
2. [Accounts and access you need](#2-accounts-and-access-you-need)
3. [What every file does](#3-what-every-file-does)
4. [How the website gets published](#4-how-the-website-gets-published)
5. [How to make a change](#5-how-to-make-a-change)
6. [Common tasks (step by step)](#6-common-tasks-step-by-step)
7. [The Leaders Hub, in depth](#7-the-leaders-hub-in-depth)
8. [The inventory Google Sheet and Archive & Purge](#8-the-inventory-google-sheet-and-archive--purge)
9. [The Apps Script (the sheet's code)](#9-the-apps-script-the-sheets-code)
10. [Design, speed and code conventions](#10-design-speed-and-code-conventions)
11. [Privacy and safety rules](#11-privacy-and-safety-rules)
12. [Troubleshooting](#12-troubleshooting)
13. [Handoff checklist](#13-handoff-checklist)

---

## The monthly routine

Every month follows the same three-meeting cycle. The inventory sheet should be **empty and ready** before each
planning meeting, collect **materials** at the planning meeting, collect **feedback** at the session, then
**Archive & Purge** so it's empty again for next month.

```
 Before planning  ──►  Week 1: Planning meeting  ──►  Week 2: Experiment meeting  ──►  Week 3: Session  ──►  Archive & Purge
 sheet is clear        MATERIALS due that day         nothing to do in the sheet       FEEDBACK due          sheet clear again
```

### Before the planning meeting: make sure the sheet is clear

- [ ] Open the inventory sheet. Every **school tab** should be empty from **row 6 down**, and the **Feedback** tab
      should only have its header row.
- [ ] If last month's data is still there, it wasn't archived. Run **🛠️ Leaders Hub Admin → Archive & Purge Session Data**
      now (see [section 8](#8-the-inventory-google-sheet-and-archive--purge)), using last month's session date as the name.
- [ ] Check the **Archive** tab has last month's session in it.
- [ ] Make sure the Leaders Hub works: open **www.uhsstem.org/leaders.html**, unlock it, and check the school dropdown
      lists every school you're running this month. (Changes to schools: [section 6.3](#63-add-or-remove-a-school-everywhere).)
- [ ] Make sure every leader knows the current password.

### Week 1, planning meeting: materials are due that day

- [ ] Remind everyone at the start: **materials requests are due by the end of this meeting.**
- [ ] Each school's leaders submit through the Leaders Hub → **📦 Materials Request**: one submission per school,
      with every experiment and every material they'll need (quantities, and links in Notes if it needs ordering).
- [ ] Leaders should check the summary that appears after submitting. If something's wrong, they comment on the sheet
      (the Inventory Spreadsheet button on the Leaders Hub) so an inventory leader can fix it. Don't submit twice.
- [ ] **Before the meeting ends, check for submissions:** go through each school tab in the sheet and confirm it has
      rows from row 6 down. Any school tab still empty hasn't submitted. Find those leaders before everyone leaves.
- [ ] After the meeting, inventory uses the school tabs to pack boxes and order anything missing.

### Week 2, experiment meeting: nothing to do

- Leaders practice and test their experiments. **There's nothing to submit or check in the sheet this week.**
- (If a school realizes they forgot a material, they can still submit an extra Materials Request; it's added under
  their earlier rows.)

### Week 3, the session: feedback is due

- [ ] After each school's session, its leaders submit the Leaders Hub → **📝 Feedback / Attendance** form:
      everyone who helped (full names), what went well, what didn't, how to improve, and any photos.
- [ ] **Check for feedback:** open the **Feedback** tab. There should be a row for every school that had a session.
      Tip: click the **School** column → **Data → Sort sheet** (or **Create a filter**) to spot which schools are missing.
- [ ] Follow up with any school that hasn't submitted, until every school is in.

### Once everything is in: Archive & Purge

- [ ] When **every school has its materials and feedback in**, run **🛠️ Leaders Hub Admin → Archive & Purge Session Data**
      and name it after this session (e.g. `11/20/2026` or `November Session`). Full details: [section 8](#8-the-inventory-google-sheet-and-archive--purge).
- [ ] Check the **Archive** tab: the new session should be there with every school, its experiments, feedback and photo links.
- [ ] Check the school tabs (row 6 down) and the Feedback tab are empty again. **The sheet is now ready for next month's planning meeting.**

> **Don't archive early.** Archive & Purge clears the school tabs and Feedback tab. Anything submitted *after* you run
> it goes into next month's batch, so only run it once everyone's feedback is in. Photos are never deleted; they stay in
> the Leaders Hub Photos folder in Drive.

---

## 1. The big picture

There are four separate pieces, and they live in four different places:

```
 ┌───────────────────────────────┐        ┌─────────────────────────────┐
 │  WEBSITE  (this repository)   │        │  GOOGLE CALENDAR            │
 │  Hosted free by GitHub Pages  │◄───────│  Shown on the home page     │
 │  www.uhsstem.org              │ embed  │  (edit events in Google     │
 │                               │        │   Calendar, not here)       │
 │  Leaders Hub page has the     │        └─────────────────────────────┘
 │  password + forms             │
 └──────────────┬────────────────┘
                │  sends each form submission (no Google sign-in needed)
                ▼
 ┌───────────────────────────────┐        ┌─────────────────────────────┐
 │  APPS SCRIPT (Code.gs)        │ writes │  INVENTORY GOOGLE SHEET     │
 │  Lives inside the Google      ├───────►│  One tab per school,        │
 │  Sheet (Extensions → Apps     │        │  a Feedback tab, and an     │
 │  Script). Checks the password │        │  Archive tab                │
 └───────────────────────────────┘        └─────────────────────────────┘
```

- **The website** is plain HTML, CSS and JavaScript files. No frameworks, no build step, no database.
  GitHub Pages publishes whatever is on the `main` branch of this repository.
- **The Leaders Hub** (`leaders.html`) shows a password box. After unlocking, leaders pick one of two tabs:
  - **📦 Materials Request**: choose a school, list experiments and the materials each one needs.
  - **📝 Feedback / Attendance**: after a session, list who helped and what went well / badly / could improve,
    and optionally upload photos.
- **The Apps Script** is a small program attached to the Google Sheet. The website sends it each submission;
  it checks the password and writes the rows into the right tab.
- **The Google Sheet** is where inventory leaders work: each school has its own tab, feedback goes to a `Feedback`
  tab, and after each session someone runs **Archive & Purge** to move everything into a tidy, collapsible `Archive` tab.
- **Session photos** go into a **Leaders Hub Photos** folder in Google Drive (next to the sheet), one sub-folder per
  school and date. The Feedback row links to that sub-folder.

---

## 2. Accounts and access you need

| What | Where it lives | Who needs access | Notes |
|---|---|---|---|
| Website code | GitHub repository `natedot/UHS-STEM-Academy` | Anyone who edits the website | Ask the repository owner to add you as a collaborator (repo → Settings → Collaborators). |
| Website hosting | GitHub Pages (repo → Settings → Pages) | Repository owner | Free. Publishes the `main` branch. |
| Domain `www.uhsstem.org` | **Porkbun** (porkbun.com) | **Mr. Kelcey Burris** owns the account. See him for login info and renewal. | Registered Sept 2, 2026 for 2 years. **Must be renewed before Sept 2, 2028**, or the website goes offline. See [Handoff checklist](#13-handoff-checklist). |
| Inventory Google Sheet | Google Drive (link is on the Leaders Hub page) | Inventory leaders (edit), all leaders (comment) | The Apps Script is inside this sheet. |
| Apps Script + its deployment | Sheet → **Extensions → Apps Script** | The sheet owner | Runs as the account that deployed it. |
| Leader password | Apps Script → **Project Settings → Script Properties → `FORM_PASSWORD`** | Sheet owner | Never written in any code file. |
| Session photos | Google Drive folder **Leaders Hub Photos**, in the same Drive folder as the sheet | Share with leaders/advisors only | Photos of children: keep it private (not "anyone with the link"). |
| Google Calendar | Google Calendar (the club calendar) | Whoever schedules sessions | Events show up on the website automatically. |
| Instagram | @uhsstem | Social media leads | Linked in every page's footer. |

---

## 3. What every file does

```
uhsstem/
├── index.html          Home page: headline, photo slideshow, mission, calendars, dismissal times
├── leaders.html        Leaders Hub page: password screen + Materials and Feedback forms
├── leaders.js          The Leaders Hub's code: school list, form behaviour, sending to the Apps Script
├── leaders.css         The Leaders Hub's styles (only loaded on leaders.html)
├── contact.html        Contact page: dropdowns for STEM Advisors, Student Leaders, School Point People
├── branches.html       "Branches" page (linked from the bottom of the Contact page)
├── about-us.html       About Us page: currently empty and NOT linked in the menu (hidden on purpose)
├── style.css           Styles shared by every page (colours, header, buttons, slideshow, contact cards…)
├── script.js           Code shared by every page (phone menu, slideshow, calendars, Visit Log, SCRIPT_URL)
├── manifest.json       Lets people "Add to Home Screen" with the STEM icon
├── CNAME               Tells GitHub Pages the site's address is www.uhsstem.org. Don't delete.
├── _config.yml         Tells GitHub Pages not to publish the apps-script/ folder
├── images/
│   ├── logo.webp           Logo in the top-left of every page
│   ├── favicon-32.png      Tiny icon in the browser tab
│   ├── apple-touch-icon.png, icon-192.png, icon-512.png   Home-screen / app icons
│   ├── social-card.png     Preview image for the GitHub repository (Settings → Social preview)
│   ├── hero.webp, hero-600.webp   First slideshow photo (two sizes)
│   ├── slideshow/          Other slideshow photos (each in two sizes: name.webp and name-600.webp)
│   ├── team/               Contact-page photos (120 px)
│   └── branches/           Branches-page photos (400 px)
└── apps-script/
    ├── Code.gs         A COPY of the Apps Script code that runs inside the Google Sheet
    └── README.md       Short deploy notes for the Apps Script
```

> **Important:** `apps-script/` is a *copy* for safekeeping. Editing it here does **not** change the live script.
> The live code is inside the Google Sheet (see [section 9](#9-the-apps-script-the-sheets-code)).
> If you change one, paste the same change into the other so they stay in sync.

---

## 4. How the website gets published

1. Every page is just a file in this repository.
2. **GitHub Pages** watches the `main` branch. When anything on `main` changes, it republishes the site automatically.
3. Changes usually appear on www.uhsstem.org within **1–5 minutes**. You can watch progress under the repository's
   **Actions** tab ("pages build and deployment").
4. Browsers keep copies of files for a while. To see your change immediately, **hard refresh**:
   **Ctrl + Shift + R** (Windows/Chromebook) or **Cmd + Shift + R** (Mac).

### The `?v=` numbers (cache busting)

Every page loads the shared files like this:

```html
<link rel="stylesheet" href="style.css?v=2.2">
<script src="script.js?v=2.3" defer></script>
```

The `?v=` number doesn't do anything by itself, but **changing it forces every visitor's browser to download the new
file** instead of using an old saved copy. So:

- **When you edit `style.css` or `script.js`**: bump the number on **all five pages**
  (`index.html`, `leaders.html`, `contact.html`, `branches.html`, `about-us.html`), e.g. `v=2.2` → `v=2.3`.
- **When you edit `leaders.css` or `leaders.js`**: bump the number in `leaders.html` only.
- Editing an `.html` file needs no bump.

If you forget, some people will see the old version for a while, or a mix of old and new.

---

## 5. How to make a change

### Option A: In your browser on GitHub (easiest, good for text and names)

1. Open the file on github.com (for example `contact.html`).
2. Click the ✏️ **pencil** (Edit this file).
3. Make your change.
4. Click **Commit changes…**, write a short description (e.g. "Add Jordan to student leaders"), choose
   **Commit directly to the `main` branch**, and confirm.
5. Wait a few minutes and hard refresh the website.

To **upload images**: open the folder (e.g. `images/team`), click **Add file → Upload files**, drag them in, commit.

### Option B: On your computer (better for bigger changes)

1. Install [Git](https://git-scm.com/downloads) and an editor such as [VS Code](https://code.visualstudio.com/).
2. Clone the repository: `git clone https://github.com/natedot/UHS-STEM-Academy.git`
3. **Preview locally** before publishing. In the project folder run:
   ```
   python3 -m http.server 8000
   ```
   then open http://localhost:8000 in your browser. (Opening the `.html` files by double-clicking mostly works too.)
   The Leaders Hub form really submits to the live sheet even from your computer, so use obvious test data and delete it after.
4. When it looks right: `git add -A`, `git commit -m "describe your change"`, `git push`.

### Golden rules

- **Check your change on a phone-sized screen.** Most leaders use phones and school Chromebooks. In Chrome, press
  F12 then the phone icon to preview phone sizes.
- **One change at a time**, and check the live site after each.
- **If you break something**, nothing is lost: every past version is saved. On GitHub open the file → **History**
  to see and copy back an older version, or ask someone to revert the commit.
- **Two people editing at once can collide.** If git says there's a "merge conflict", look for lines like
  `<<<<<<<`, `=======`, `>>>>>>>` in the file. Keep the right version and **delete those marker lines**. Leftover
  markers will show up on the website.

---

## 6. Common tasks (step by step)

### 6.1 Add, change or remove a person on the Contact page

The Contact page (`contact.html`) has three dropdown sections. Each person is a "card" like this:

```html
<div class="contact-card">
    <img src="images/team/FirstLast.webp" alt="First Last" loading="lazy">
    <div>
        <h3>First Last</h3>
        <p>Email: <a href="mailto:lastfir000@student.evergreenps.org">lastfir000<wbr>@student.evergreenps.org</a></p>
        <p>Phone: <a href="tel:+13605551234">(360) 555-1234</a></p>
    </div>
</div>
```

- **To add someone:** copy an existing card inside the right section (`STEM Advisors` or `Student Leaders`), paste it, and change:
  - the photo file name and `alt` text,
  - the name in `<h3>`,
  - the email **twice**: once after `mailto:` and once as the visible text. In the visible text, keep `<wbr>`
    just before the `@`; it lets long emails wrap neatly on phones,
  - the phone **twice**: `tel:+1` followed by the 10 digits with no spaces, then the readable version.
- Advisors show **Location** instead of Phone. Just change that line's text.
- **To remove someone:** delete their whole card, from `<div class="contact-card">` to its matching `</div>`.
  You can also delete their photo from `images/team/`.

**Photos for contact cards:** square-ish, **120 × 120 px**, `.webp` format. To convert and shrink a phone photo,
use https://squoosh.app (free): open the photo, choose **WebP**, resize so the shorter side is 120, quality ~80,
download, and upload to `images/team/`. Name it `FirstLast.webp`. A full-size phone photo here would make the page
much slower to load.

### 6.2 Update School Point People

At the bottom of `contact.html`, each school is a dropdown:

```html
<details class="school-group">
    <summary>Harmony</summary>
    <ul class="point-list">
        <li class="lead"><span>School Point Person</span>Berklie Iverson</li>
        <li><span>K-2 Classroom</span>Selam Gobeze</li>
        <li><span>3-5 Classroom</span>Ani Korutla</li>
    </ul>
</details>
```

- Change names by editing the text after `</span>`.
- `class="lead"` makes the School Point Person bold. Small schools with one person just use
  `<li><span>Point Person</span>Name</li>`.
- Copy a whole `<details>…</details>` block to add a school; delete one to remove a school.

### 6.3 Add or remove a school (everywhere)

A school appears in several places. Update all of them:

1. **Google Sheet:** right-click an existing school tab (or the template tab) → **Duplicate**, then rename it.
   The tab name must match step 2 **exactly**, including capitals and spaces. Rows 1–5 are headers; requests go from row 6 down.
   To remove a school, first run **Archive & Purge** so nothing is lost, then delete its tab.
2. **Leaders Hub dropdown:** in `leaders.js`, edit the `SCHOOLS` list near the top:
   ```js
   const SCHOOLS = [
       ['Sifton', 'Sifton'],
       ['Mill Plain k-2 ', 'Mill Plain K-2'],
       ...
   ];
   ```
   Each line is `['exact tab name', 'what leaders see']`. Then bump `leaders.js?v=` in `leaders.html`.
3. **Contact page:** add or remove the school's point-people dropdown (6.2).
4. **Home page:** add or remove the school in the *Dismissal Information and Session Times* boxes (6.6).

> ⚠️ `'Mill Plain k-2 '` has a space at the end because the sheet tab is named that way. If you ever rename the tab,
> update the list to match, or requests will create a brand-new tab instead.

### 6.4 Change the leader password

1. Open the Google Sheet → **Extensions → Apps Script**.
2. Click the ⚙️ **Project Settings** (left side) → scroll to **Script Properties**.
3. Edit the value of `FORM_PASSWORD` → **Save**.

That's it: no redeploy needed, and it takes effect immediately. Tell leaders the new password in person or in a
private group chat. **Never** put the password in any file in this repository: the repository is public.

### 6.5 Slideshow photos on the home page

Each photo exists in **two sizes**: phones and Chromebooks download the small one, bigger screens the large one.

1. Prepare the photo with https://squoosh.app → **WebP**, quality ~78:
   - `session-8.webp`: **1000 px wide**
   - `session-8-600.webp`: **600 px wide**
2. **Before uploading, blur or crop out anything with children's names** (table signs, name tags, whiteboards).
   See [Privacy rules](#11-privacy-and-safety-rules).
3. Upload both to `images/slideshow/`.
4. In `index.html`, find the slideshow and copy one of the **non-first** `<img>` lines, changing the numbers:
   ```html
   <img data-src="images/slideshow/session-8.webp" data-srcset="images/slideshow/session-8-600.webp 600w, images/slideshow/session-8.webp 1000w" sizes="(max-width: 950px) 90vw, 560px" alt="Describe the photo" width="1000" height="667">
   ```
   - Use `data-src` / `data-srcset` (not `src`) for every photo **except the first**. That's what lets the page
     download each photo only when it's about to be shown.
   - Set `width`/`height` to the large file's real size.
   - Write a real `alt` description; screen readers read it aloud.
5. The order of the `<img>` lines is the order of the slideshow. The dots and arrows update automatically.

To remove a photo, delete its `<img>` line (and the two files).

### 6.6 Dismissal times / session times

These are the boxes at the bottom of `index.html` under **Dismissal Information and Session Times**
(`<section id="session-times">`). Each box is one time slot:

```html
<div class="time-card">
    <h3>12:30 - 1:30 PM</h3>
    <ul>
        <li>Harmony K-2</li>
        <li>Pioneer</li>
    </ul>
</div>
```

Change the time in `<h3>`, add or remove `<li>` lines for schools, or copy a whole `time-card` for a new time slot.
The schools arrange themselves into two columns automatically.

### 6.7 Calendar events

You **don't** edit the website for events. Add, move or delete them in the club's **Google Calendar**, and both
calendars on the home page (month view + event list) update automatically.

To show a **different** calendar: in Google Calendar → the calendar's **Settings → Integrate calendar**, copy the
embed URL, and in `index.html` replace the URL inside **both** `data-src="…"` attributes in the
`#calendar-section`. Keep `data-src`; the page loads the calendars only when someone scrolls to them.

The calendars are made dark by a colour-inverting trick in `style.css` (`.dark-calendar`), which is why event colours look a bit different.
On phones only the second calendar (the event list) is shown, because a month grid is too cramped to read on a small screen.

### 6.8 Other small edits

| Change | Where |
|---|---|
| Footer year (`© 2026`) | Bottom of each of the 5 `.html` files |
| Instagram link | Footer of each page (`social-link`) |
| Inventory Spreadsheet button link | `leaders.html`, the `<a … class="btn">Inventory Spreadsheet</a>` |
| Menu links | The `<nav>` near the top of each page. Update **all 5 pages** the same way. The current page's link has `aria-current="page"`, which underlines it red. |
| Show the About Us page | Write its content in `about-us.html`, then add `<li><a href="about-us.html">About Us</a></li>` to the menu on every page |
| Branches page text | `branches.html` (the "Contact: insert / Email: insert" lines still need filling in) |
| Colours | Top of `style.css` (`--primary-red` etc.) |

---

## 7. The Leaders Hub, in depth

### What a leader sees

1. Go to **www.uhsstem.org/leaders.html** → type the password → **Unlock**.
2. Choose a tab:
   - **📦 Materials Request**: pick the school; for each experiment type its name and add materials
     (name, quantity, optional notes/links). **+ Add Material** adds a row; **+ Add Another Experiment** adds a card.
     Pressing **Enter** in a material row also adds a new row (it never submits by accident).
   - **📝 Feedback / Attendance**: pick the school and date (defaults to today), type the full name of everyone who
     helped (**Enter** adds the next name), then the three questions. Optionally tap **📷 Add Photos** (up to 10;
     on phones this offers the camera or photo library). Each photo shows as a preview with an **X** to remove it.
3. **Submit**. A pop-up asks **"Who is submitting this?"**: they type their first and last name (one word isn't
   accepted) and press Submit. Cancel or Esc goes back without sending anything.
4. A green message and a summary of exactly what was sent (including who submitted it) appear; the form clears for the next one.

### What happens behind the scenes

1. `leaders.js` sends the data to the Apps Script's web address (`SCRIPT_URL` in `script.js`)
   as a small message like `{ "action": "processForm", "payload": { …the form… } }`.
2. In the Apps Script, `doPost` reads the `action` and runs the matching function:
   - `verifyPassword`: checks the password (used by the Unlock button),
   - `processForm`: writes materials into the school's tab, from row 6 down,
   - `submitFeedback`: saves any photos to Google Drive, then writes one row into the `Feedback` tab.
3. **Every submission includes the password**, and the script checks it again each time. So nobody can skip the
   lock screen and send data directly.
4. The script replies with `"Success"` or an error message, which the page shows.
5. **Every submission is recorded in the Submission Log** with the submitter's name, IP address and device details
   (see [section 8](#8-the-inventory-google-sheet-and-archive--purge)). Wrong passwords are logged too, and every
   page visit on the website goes in the **Visit Log** (from `script.js`, after the page has loaded). The IP address
   comes from a free lookup service (ipify) that the browser asks; if it's blocked, the logs say "unavailable".
6. **Text that starts with `=`, `+`, `-` or `@` is stored as plain text**, never as a formula, so nobody can
   slip a spreadsheet formula (which could leak data) into the sheet through a form.
7. **Photos are shrunk in the browser before uploading** (to at most 1600 px, JPEG). Phone photos are 3–5 MB each;
   after shrinking they're a few hundred KB, so uploads are quick on school Wi-Fi. Re-saving also removes hidden
   data such as the GPS location where the photo was taken.

### Why the form is built into the website (not embedded from Google)

The Leaders Hub used to show Google's own Apps Script page inside the website. On many devices it appeared as a
**blank box** or said **"Sorry, unable to open the file at this time"**, depending on which Google account the
browser was signed into (school Chromebooks were especially affected). Now the website sends the data **without
any Google sign-in** (`credentials: 'omit'` in `leaders.js`), so it works on every device and loads faster.

**Don't go back to embedding** the Apps Script page with an `<iframe>`. That brings the blank-box problem back.

---

## 8. The inventory Google Sheet and Archive & Purge

### Tabs

| Tab | What it holds |
|---|---|
| **One tab per school** (e.g. `Sifton`, `Mill Plain k-2 `) | Rows 1–5: headers (and a session date typed in cell **D1**). Row 6 down: requests, one material per row: *Timestamp · Experiment · Material · Quantity · Notes*. |
| A **Template** tab (any tab with "Template" in its name) | Blank layout to duplicate for new schools. Ignored by Archive & Purge. |
| **ORDER** | Ignored by Archive & Purge (used by inventory leaders for ordering). |
| **Feedback** | Created automatically the first time feedback is submitted: *Timestamp · School · Session Date · Attendance · # Attended · What Went Well · What Didn't Go Well · How Can We Improve · Photos · Submitted By*. The **Photos** cell is a link such as **📷 4 photo(s)** that opens that session's photo folder. |
| **Archive** | Created automatically by Archive & Purge. Past sessions, neatly grouped. |
| **Submission Log** | Created automatically. One row for every materials request, feedback submission and **wrong password**: *Timestamp · Action · School · Submitted By · Details · IP Address · Device · Screen · Language · Time Zone · Device ID · Browser Info*. **Never cleared** by Archive & Purge; it's the permanent record. |
| **Visit Log** | Created automatically. One row the first time someone opens each page of the website in a browser session (Home, Leaders Hub, Contact, Branches): *Timestamp · Page · IP Address · Came From · Device · Screen · Language · Time Zone · Device ID · Browser Info*. Also never cleared. Limited to 20 rows a minute and 1,000 a day so a bot can't flood it. Google Sheets holds about 10 million cells, so if it ever gets huge, delete old rows once a year. |

If someone requests materials for a school that has no tab yet, the script creates a basic tab for it.
It's better to duplicate the template tab yourself first so it has the proper header rows.

Leaders who made a mistake should **comment** on the sheet (the Leaders Hub page links to it); an inventory leader fixes it.

### Session photos (Google Drive)

Photos uploaded with feedback are saved as:

```
(the Drive folder the sheet is in)
└── Leaders Hub Photos/
    ├── 2026-11-06 — Pioneer/
    │   ├── 2026-11-06 — Pioneer 143015-1.jpg
    │   └── ...
    └── 2026-11-06 — Sifton/
```

- The folder is created automatically the first time. Its ID is remembered in the Script Property `PHOTO_FOLDER_ID`.
  If someone deletes the folder, a new one is made on the next upload.
- **Sharing:** share **Leaders Hub Photos** (once) with the leaders and advisors who should see the photos. If the
  sheet sits in a shared folder, the photos folder inherits that folder's sharing automatically.
- Photos are **not** deleted by Archive & Purge; they stay in Drive and the archive keeps the link.

### Archive & Purge (after every session)

When the sheet opens, a menu called **🛠️ Leaders Hub Admin** appears. After a session's materials are packed and
the feedback is in:

1. **🛠️ Leaders Hub Admin → Archive & Purge Session Data**.
2. Confirm **Yes**.
3. Type a session name or date (e.g. `10/24/2026` or `Fall Session 1`). Leave blank to use today's date.
4. The script:
   - copies every school's materials (rows 6+) and all `Feedback` rows into the **Archive** tab,
   - groups them as **📅 Session → 🏫 School → 🧪 Experiment (materials) / 📝 Feedback (attendance, answers and the photo link)**,
     with **+/-** buttons to expand and collapse,
   - **clears** rows 6+ and cell D1 on every school tab, and clears the Feedback tab (headers stay),
   - shows "Success!".

> The menu only appears for people with **edit** access to the sheet. If it's missing, reload the sheet.
> The first time someone runs it, Google asks them to authorize the script. Click through **Advanced → Go to …**
> to allow it.

---

## 9. The Apps Script (the sheet's code)

### Where it is

Open the inventory Google Sheet → **Extensions → Apps Script**. The project has:

- `Code.gs`: all the server code (a copy is in this repository at `apps-script/Code.gs`).

(Older versions also had an `Index.html` file and a `doGet` function for the previous embedded form. They're no
longer used and have been removed.)

### What's in `Code.gs`

| Function | What it does |
|---|---|
| `doPost(e)` | Entry point for the website's Leaders Hub. Reads `{action, payload}` and calls one of the three below. |
| `verifyPassword(payload)` | Returns true/false. Compares with the `FORM_PASSWORD` Script Property; logs wrong guesses. |
| `processForm(data)` | Materials request → rows in the school's tab (never above row 6). |
| `submitFeedback(data)` | Feedback/attendance → saves photos (if any), then one row in the `Feedback` tab. |
| `savePhotos_(…)` | Saves the uploaded photos into `Leaders Hub Photos/<date> — <school>/` and returns the link for the sheet. |
| `setupPhotoFolder()` | Run **once by hand** after setting up (or moving) the script: grants Google Drive permission and creates the photo folder. |
| `logEvent_(…)` | Adds a row to the **Submission Log** tab. |
| `logVisit(payload)` | Adds a row to the **Visit Log** tab when someone opens a page (rate-limited). |
| `clean_(text)` / `fullName_(text)` | Make form text safe for the sheet (length limit, no formulas) / check a first + last name. |
| `onOpen()` | Adds the **🛠️ Leaders Hub Admin** menu when the sheet opens. |
| `archiveAndPurge()` | The archive routine described above. |
| Helpers ending in `_` | Internal helpers: password check, writing rows, a lock so two submissions at the same moment don't overwrite each other. |

### Deploying a change (very important)

Saving the code is **not enough**: the website talks to a **deployment**, which is a frozen copy.

1. Edit and **save** (Ctrl/Cmd + S).
2. **Deploy → Manage deployments**.
3. Select the active deployment → ✏️ **Edit**.
4. **Version: New version** → **Deploy**.

Settings must stay:
- **Execute as: Me** (the owner): the script writes to the sheet using the owner's permission.
- **Who has access: Anyone**: otherwise leaders on other accounts get errors.

> ❌ **Don't** click **New deployment**: that creates a **new web address**, and the website would keep talking to
> the old one. If you ever must (for example after transferring ownership), copy the new `/exec` URL and paste it
> into `SCRIPT_URL` in `script.js`, then bump `script.js?v=` on all five pages.

### Quick health check

On any page of the website, open the browser console (**F12** or **Cmd + Option + J** → Console) and paste:

```js
fetch('PASTE_THE_SCRIPT_URL_HERE', { method: 'POST', credentials: 'omit',
  body: JSON.stringify({ action: 'verifyPassword', payload: 'wrong-password-test' }) })
  .then(r => r.json()).then(console.log, console.error);
```

`{result: false}` means the script is deployed and reachable. An error means the deployment is broken or not
updated. (Chrome may ask you to type `allow pasting` first.) This writes nothing to the sheet.

---

## 10. Design, speed and code conventions

**Look and feel:** dark theme, UHS red `#D31145`. Colours are CSS variables at the top of `style.css`
(`--primary-red`, `--dark-bg`, `--darker-bg`, `--silver`, …). Use them instead of typing colours.

**Speed (important for school Chromebooks):** the site was tuned to load fast. Please keep it that way:
- **Resize every image before uploading** (sizes above). A single phone photo can be 3–5 MB, heavier than the whole site.
- Slideshow photos after the first use `data-src` so they download only when needed.
- The Google Calendars load only when someone scrolls to them (the slowest part of the site).
- Page-specific code stays in its own files (`leaders.css`/`leaders.js`) so other pages don't download it.
- No frameworks or libraries: plain HTML/CSS/JS. Please don't add jQuery, Bootstrap, etc.

**Phones first:** most visitors use phones. When you change something, check it at phone width (F12 → phone icon) and keep these rules:
- Buttons and links people tap should be at least **44 px** tall/wide.
- Form boxes need **16 px** text on phones, or iPhones zoom in when someone taps them (already set in `leaders.css`).
- Nothing should make the page scroll sideways.
- On phones the header is one compact row with the ☰ menu button; the full-screen menu opens from it.
- The slideshow can be swiped left/right.

**Code conventions:**
- Shared styles → `style.css`; shared behaviour → `script.js`; Leaders Hub only → `leaders.css` / `leaders.js`.
- Leaders Hub buttons use the class `hbtn` (not `btn`) because `btn` is the red link-button style used across the site.
- Prefer CSS classes over `style="…"` attributes so a change in one place updates everywhere.
- Every page has the same `<head>`, header/menu and footer. If you change one, change all five.
- Comment anything non-obvious; the next person will thank you.

- Use CSS for spacing (classes like `intro`, `page-section`, `spaced-heading` in `style.css`), not stacks of `<br>` tags.

**Still to fill in:** the Branches page has "Contact: insert / Email: insert" placeholders and a blank Inventory photo
(`images/branches/Inventory.webp`).

---

## 11. Privacy and safety rules

This is a public website about working with elementary school children. Please follow these every time:

1. **No children's names or identifying details** in photos or text. Blur or crop table signs, name tags and
   whiteboards before uploading (two of the current slideshow photos have blurred name signs for this reason).
   Make sure photos follow the school/district photo-permission rules.
   Photos uploaded through the Leaders Hub stay **private in Google Drive**. Never set the **Leaders Hub Photos**
   folder to "Anyone with the link", and pick public website photos from it only after checking them.
2. **Never put passwords, API keys or private links in this repository.** It's public; anyone can read every
   file and its full history. The leader password lives only in the Apps Script's Script Properties.
3. **Think carefully about personal phone numbers.** The Contact page lists student leaders' cell numbers.
   Each person should agree to that, and consider listing school emails only.
4. **Sheet access:** give *edit* access only to inventory leaders; others can comment.
5. **The Submission Log and Visit Log are for accountability, not tracking.** What's recorded: name (submissions
   only), **IP address**, device/browser (e.g. "Chrome on ChromeOS"), screen size, language, time zone, a random
   **device ID** saved in that browser (to tell whether entries came from the same device), and the browser's full
   description. Every page of the website is logged (each page once per browser session).
   - **About the IP address:** Google Apps Script can't see it, so the browser looks it up from **ipify**
     (api.ipify.org), which means every visitor's IP is sent to that service. Because the browser reports
     it, a determined person can fake or block it, and on school Wi-Fi everyone shares the school's IP. Treat it as
     a clue, not proof. The **device ID** is usually more useful.
   - Only advisors and lead inventory leaders should look at the logs, and only if something goes wrong. Protect
     both tabs (right-click the tab → **Protect sheet**) so others can't edit them.

---

## 12. Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| My change isn't on the website | Wait 5 minutes, check the repo's **Actions** tab for a failed build, then hard refresh (Ctrl/Cmd + Shift + R). Did you commit to **`main`**? |
| Some people see the old styling/behaviour | You edited `style.css`/`script.js` (or `leaders.*`) without bumping `?v=` (section 4). |
| Strange `<<<<<<<` / `>>>>>>>` text on a page | Leftover merge-conflict markers. Delete those lines and keep the right version. |
| Leaders Hub: "Could not reach the spreadsheet" | No internet, or the Apps Script deployment is broken. Run the health check (section 9). |
| Leaders Hub: "Incorrect password" for everyone | Check `FORM_PASSWORD` in Script Properties (no extra spaces). |
| Feedback with photos: "Error saving photos: … authorization …" | The script was given photo support but nobody ran `setupPhotoFolder` once to grant Google Drive permission (section 9). |
| "Please enter your first and last name." | The name pop-up needs at least two words, e.g. "Jordan Smith". |
| Someone submitted something wrong or suspicious | Check the **Submission Log** tab: time, name, school, IP, device and device ID. The same device ID on several rows means the same browser/device; look it up in the **Visit Log** too. Many "Wrong password" rows in a row means someone is guessing. Change the password (6.4). |
| Leaders Hub: an error mentioning `doPost`, or the health check fails | The deployment wasn't updated, or "Who has access" isn't **Anyone**. Redeploy with **New version** (section 9). |
| Requests go to a new, strangely named tab | The school's value in `SCHOOLS` (`leaders.js`) doesn't exactly match the tab name (watch capitals and trailing spaces). |
| Archive & Purge menu missing | Reload the sheet; you need edit access. |
| Archive & Purge missed some rows | Rows above row 6 on a school tab are never archived (they're headers). Make sure the tab has the 5 header rows. |
| Calendar is blank | Scroll down to it (it loads on scroll). If still blank, the calendar's sharing must be **public** in Google Calendar settings. |
| Website completely down / "domain not found" | The domain may have expired: it's due for renewal **before Sept 2, 2028** on **Porkbun**. Ask **Mr. Kelcey Burris** (account owner) to check and renew. Also check repo → **Settings → Pages** shows `www.uhsstem.org`, and keep the `CNAME` file. |

---

## 13. Handoff checklist

For the outgoing lead, before graduating:

- [ ] **GitHub:** add the next leaders (and ideally a STEM advisor) as repository collaborators, or transfer the
      repository to an account/organization the club will keep (repo → Settings → *Transfer ownership*).
      A transferred repo keeps GitHub Pages working; re-check **Settings → Pages** afterwards.
- [ ] **Domain:** registered on **Porkbun**; the account belongs to **Mr. Kelcey Burris** (see him for login and renewal).
      Make sure the next leaders know the renewal deadline: **before Sept 2, 2028** (see [section 2](#2-accounts-and-access-you-need)).
- [ ] **Google Sheet + Apps Script:** the script currently runs **as the original creator's personal Google account**.
      If that account loses access or is deleted, the Leaders Hub stops working. Transfer ownership of the sheet to a
      long-term account (e.g. an advisor), then from that account: open **Extensions → Apps Script**, re-add the
      `FORM_PASSWORD` Script Property if missing, **Deploy → New deployment** (Web app, Execute as *Me*, Who has
      access *Anyone*), and put the new `/exec` URL into `SCRIPT_URL` in `script.js` (section 9). Run the health check.
- [ ] **Photos folder:** transfer ownership of the **Leaders Hub Photos** Drive folder along with the sheet. After moving
      the script to a new account, run `setupPhotoFolder` once from that account (section 9) and check the folder's sharing.
- [ ] **Google Calendar:** make sure the next leaders can add events.
- [ ] **Instagram:** pass on the login.
- [ ] **Password:** change `FORM_PASSWORD` for the new year (section 6.4).
- [ ] **Contact page:** update advisors, student leaders and school point people (6.1, 6.2).
- [ ] **Footer year** on all five pages.

For incoming leaders, in your first week:

- [ ] Get access to the repository, the sheet (edit), the calendar and Instagram.
- [ ] Put the domain renewal (**before Sept 2, 2028**, Porkbun, via Mr. Kelcey Burris) on the club calendar with a reminder a few months early.
- [ ] Make one tiny test edit (e.g. fix a typo) to learn the publish flow.
- [ ] Submit a test request in the Leaders Hub, find it in the sheet, then delete it.
- [ ] Read [Privacy and safety rules](#11-privacy-and-safety-rules).

Good luck, and keep inspiring the next generation of innovators! 🔬
