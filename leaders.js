// Leaders Hub form (only loaded on leaders.html).
// Requests go straight to the Apps Script web app (apps-script/Code.gs → doPost) without any Google
// sign-in attached, so the Google account a device is signed into can't block the form.

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbysDq5um3VDU4LjH4Bnhhw3-myMZpQP-RjdVgUwbBjKF1cj2Ygu3Jdu3scMWyQJ2uEZ/exec';

// Schools shown in both dropdowns. The value must match the school's tab name in the sheet exactly.
const SCHOOLS = [
    ['Sifton', 'Sifton'],
    ['Emerald', 'Emerald'],
    ['Mill Plain k-2 ', 'Mill Plain K-2'],
    ['Mill Plain 3-5', 'Mill Plain 3-5'],
    ['CV', 'CV'],
    ['Pioneer', 'Pioneer'],
    ['Harmony 3-5', 'Harmony 3-5'],
    ['Har K-2', 'Har K-2'],
    ['Illahee Orr', 'Illahee Orr'],
    ['Illahee Boehi', 'Illahee Boehi'],
    ['Burnt Bridge Creek', 'Burnt Bridge Creek'],
    ['Spanish STEM', 'Spanish STEM']
];

let leaderPassword = ''; // Sent with every submission so the server can re-check it
const $ = id => document.getElementById(id);
const experimentsContainer = $('experimentsContainer');
const namesList = $('namesList');

// Sends { action, payload } to the script and returns its result.
// No custom headers and credentials: 'omit', so the browser sends it as a plain anonymous request.
async function callScript(action, payload) {
    let response;
    try {
        response = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action, payload }), credentials: 'omit' });
    } catch (err) {
        throw new Error('Could not reach the spreadsheet. Check your internet connection and try again.');
    }
    if (!response.ok) throw new Error(`The spreadsheet server returned an error (${response.status}). Please try again.`);
    return (await response.json()).result;
}

function clone(id) {
    return $(id).content.firstElementChild.cloneNode(true);
}

function setStatus(el, ok, message) {
    el.className = 'status ' + (ok ? 'ok' : 'err');
    el.textContent = message;
}

// Disables a submit button while a request is running, then restores its label
async function busy(btn, task) {
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Processing...';
    try { return await task(); } finally { btn.disabled = false; btn.textContent = label; }
}

// Shows exactly what was sent, so the leader can double-check it. `items` is a list of [heading, [detail lines]].
function showSummary(box, title, items) {
    box.innerHTML = '';
    const h = document.createElement('h3');
    h.textContent = title;
    const list = document.createElement('ul');
    items.forEach(([heading, lines]) => {
        const li = document.createElement('li');
        li.textContent = heading;
        const sub = document.createElement('ul');
        lines.forEach(line => {
            const subLi = document.createElement('li');
            subLi.textContent = line;
            sub.appendChild(subLi);
        });
        li.appendChild(sub);
        list.appendChild(li);
    });
    box.append(h, list);
    box.hidden = false;
}

// --- Who is submitting? (name pop-up + device details, recorded in the sheet's Submission Log) ---

// A random ID saved in this browser, so the log shows when submissions come from the same device
function deviceId() {
    try {
        let id = localStorage.getItem('uhs-device-id');
        if (!id) {
            id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
            localStorage.setItem('uhs-device-id', id);
        }
        return id;
    } catch (err) {
        return 'unavailable (private browsing?)';
    }
}

// A readable summary like "Chrome on ChromeOS" or "Safari on iPhone"
function describeDevice(ua) {
    const os = /CrOS/.test(ua) ? 'ChromeOS'
        : /iPhone/.test(ua) ? 'iPhone'
        : /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) ? 'iPad'
        : /Android/.test(ua) ? 'Android'
        : /Windows/.test(ua) ? 'Windows'
        : /Macintosh/.test(ua) ? 'Mac'
        : /Linux/.test(ua) ? 'Linux' : 'Unknown device';
    const browser = /Edg\//.test(ua) ? 'Edge'
        : /OPR\//.test(ua) ? 'Opera'
        : /CriOS|Chrome\//.test(ua) ? 'Chrome'
        : /FxiOS|Firefox\//.test(ua) ? 'Firefox'
        : /Safari\//.test(ua) ? 'Safari' : 'Unknown browser';
    return `${browser} on ${os}`;
}

function clientInfo() {
    let timeZone = '';
    try { timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (err) {}
    return {
        device: describeDevice(navigator.userAgent),
        screen: `${screen.width}×${screen.height} @${window.devicePixelRatio || 1}x`,
        language: navigator.language,
        timeZone,
        deviceId: deviceId(),
        userAgent: navigator.userAgent
    };
}

// Shows the pop-up and resolves with the typed full name, or null if the leader pressed Cancel / Esc
function askForName() {
    const dialog = $('nameDialog'), form = $('nameForm'), input = $('submitterName'), error = $('nameError');
    input.value = '';
    error.textContent = '';
    return new Promise(resolve => {
        const finish = name => {
            form.removeEventListener('submit', onSubmit);
            $('nameCancel').removeEventListener('click', onCancel);
            dialog.removeEventListener('cancel', onCancel);
            dialog.close();
            resolve(name);
        };
        const onSubmit = e => {
            e.preventDefault();
            const name = input.value.replace(/\s+/g, ' ').trim();
            if (name.split(' ').length < 2) {
                error.textContent = 'Please enter your first and last name.';
                input.focus();
                return;
            }
            finish(name);
        };
        const onCancel = e => { e.preventDefault(); finish(null); };
        form.addEventListener('submit', onSubmit);
        $('nameCancel').addEventListener('click', onCancel);
        dialog.addEventListener('cancel', onCancel); // Esc key
        dialog.showModal();
        input.focus();
    });
}

// --- Unlock screen ---
$('lockScreen').addEventListener('submit', async e => {
    e.preventDefault();
    const pw = $('pwInput').value;
    const lockStatus = $('lockStatus');
    lockStatus.textContent = '';
    try {
        const ok = await busy($('unlockBtn'), () => callScript('verifyPassword', { password: pw, client: clientInfo() }));
        if (ok === true) {
            leaderPassword = pw;
            $('lockScreen').hidden = true;
            $('hub').hidden = false;
        } else {
            setStatus(lockStatus, false, typeof ok === 'string' ? ok : 'Incorrect password.');
            $('pwInput').select();
        }
    } catch (err) {
        setStatus(lockStatus, false, err.message);
    }
});

// --- Tabs ---
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => {
            const selected = t === tab;
            t.setAttribute('aria-selected', selected);
            $(t.dataset.panel).hidden = !selected;
        });
    });
});

// --- Materials request ---
function addMaterial(card) {
    card.querySelector('.materials-list').appendChild(clone('materialTemplate'));
}

function addExperiment() {
    const card = clone('experimentTemplate');
    addMaterial(card);
    experimentsContainer.appendChild(card);
}

$('addExpBtn').addEventListener('click', addExperiment);

// One listener handles every card's add/remove buttons
experimentsContainer.addEventListener('click', e => {
    const button = e.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    const card = button.closest('.experiment-card');
    if (action === 'add-material') {
        addMaterial(card);
    } else if (action === 'remove-row') {
        if (card.querySelectorAll('.material-row').length > 1) button.parentElement.remove();
        else alert('Each experiment needs at least one material!');
    } else if (action === 'remove-card') {
        if (experimentsContainer.children.length > 1) card.remove();
        else alert('You must request materials for at least one experiment!');
    }
});

// Enter never submits by accident: in an experiment name it jumps to the first material,
// in a material row it adds a new row
$('requestForm').addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
    e.preventDefault();
    const card = e.target.closest('.experiment-card');
    if (!card) return;
    if (e.target.classList.contains('exp-name')) {
        card.querySelector('.mat-name').focus();
    } else {
        addMaterial(card);
        const names = card.querySelectorAll('.mat-name');
        names[names.length - 1].focus();
    }
});

$('requestForm').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const status = $('status');
    const submittedBy = await askForName();
    if (!submittedBy) return;
    $('summary').hidden = true;

    const payload = {
        schoolName: form.schoolName.value,
        password: leaderPassword,
        submittedBy,
        client: clientInfo(),
        experiments: Array.from(experimentsContainer.children, card => ({
            name: card.querySelector('.exp-name').value,
            materials: Array.from(card.querySelectorAll('.material-row'), row => ({
                name: row.querySelector('.mat-name').value,
                qty: row.querySelector('.mat-qty').value,
                notes: row.querySelector('.mat-notes').value
            }))
        }))
    };

    try {
        const res = await busy($('submitBtn'), () => callScript('processForm', payload));
        if (res !== 'Success') return setStatus(status, false, res);
        setStatus(status, true, 'Success! Data sorted into the spreadsheet.');
        showSummary($('summary'), `Submitted for ${payload.schoolName}:`, payload.experiments.map(exp => [
            exp.name,
            exp.materials.filter(m => m.name.trim()).map(m => `${m.name} — ${m.qty}` + (m.notes ? ` (${m.notes})` : ''))
        ]).concat([['Submitted by', [submittedBy]]]));
        // Start fresh: clear the school and go back to one empty experiment
        form.reset();
        experimentsContainer.innerHTML = '';
        addExperiment();
    } catch (err) {
        setStatus(status, false, err.message);
    }
});

// --- Feedback / attendance ---
const MAX_PHOTOS = 10;
let photos = []; // { data: base64 JPEG (sent to the script), url: preview }

// Phone photos are 3–5 MB each, so they're shrunk to at most 1600 px and re-saved as JPEG before uploading
// (a few hundred KB each). Re-saving also drops hidden details such as GPS location.
function shrinkPhoto(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const src = URL.createObjectURL(file);
        img.onload = () => {
            const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.naturalWidth * scale);
            canvas.height = Math.round(img.naturalHeight * scale);
            canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(src);
            const url = canvas.toDataURL('image/jpeg', 0.8);
            resolve({ url, data: url.split(',')[1] });
        };
        img.onerror = () => { URL.revokeObjectURL(src); reject(new Error(`Couldn't read "${file.name}".`)); };
        img.src = src;
    });
}

function renderPhotos() {
    const box = $('photoPreviews');
    box.innerHTML = '';
    photos.forEach((photo, i) => {
        const thumb = document.createElement('div');
        thumb.className = 'photo-thumb';
        const img = document.createElement('img');
        img.src = photo.url;
        img.alt = `Photo ${i + 1}`;
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'hbtn hbtn-remove';
        remove.textContent = '✕';
        remove.setAttribute('aria-label', `Remove photo ${i + 1}`);
        remove.addEventListener('click', () => { photos.splice(i, 1); renderPhotos(); });
        thumb.append(img, remove);
        box.appendChild(thumb);
    });
    const btn = $('addPhotosBtn');
    btn.disabled = photos.length >= MAX_PHOTOS;
    btn.textContent = photos.length ? `📷 Add More Photos (${photos.length}/${MAX_PHOTOS})` : '📷 Add Photos';
}

$('addPhotosBtn').addEventListener('click', () => $('fbPhotos').click());

$('fbPhotos').addEventListener('change', async e => {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    e.target.value = ''; // so picking the same photo again still triggers this
    const room = MAX_PHOTOS - photos.length;
    if (files.length > room) alert(`Only ${MAX_PHOTOS} photos per submission, so the first ${room} were added.`);
    const btn = $('addPhotosBtn');
    btn.disabled = true;
    btn.textContent = 'Preparing photos...';
    for (const file of files.slice(0, room)) {
        try { photos.push(await shrinkPhoto(file)); } catch (err) { alert(err.message); }
    }
    renderPhotos();
});

function addName() {
    const row = clone('nameTemplate');
    namesList.appendChild(row);
    return row.querySelector('input');
}

function todayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function resetFeedbackForm() {
    $('feedbackForm').reset();
    $('fbDate').value = todayString();
    namesList.innerHTML = '';
    addName();
    photos = [];
    renderPhotos();
}

$('addNameBtn').addEventListener('click', () => addName().focus());

namesList.addEventListener('click', e => {
    const button = e.target.closest('[data-action="remove-name"]');
    if (!button) return;
    if (namesList.children.length > 1) button.parentElement.remove();
    else alert('Please list at least one person!');
});

// Enter in a name box adds the next person instead of submitting
$('feedbackForm').addEventListener('keydown', e => {
    if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
    e.preventDefault();
    if (e.target.classList.contains('person-name')) addName().focus();
});

$('feedbackForm').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const status = $('fbStatus');
    const submittedBy = await askForName();
    if (!submittedBy) return;
    $('fbSummary').hidden = true;

    const payload = {
        password: leaderPassword,
        submittedBy,
        client: clientInfo(),
        schoolName: form.schoolName.value,
        sessionDate: form.sessionDate.value,
        attendees: Array.from(namesList.querySelectorAll('.person-name'), i => i.value),
        wentWell: form.wentWell.value,
        didntGoWell: form.didntGoWell.value,
        improve: form.improve.value,
        photos: photos.map(p => ({ data: p.data }))
    };

    try {
        const res = await busy($('fbSubmitBtn'), () => callScript('submitFeedback', payload));
        if (res !== 'Success') return setStatus(status, false, res);
        setStatus(status, true, 'Thank you! Feedback saved to the spreadsheet.');
        const names = payload.attendees.filter(n => n.trim());
        showSummary($('fbSummary'), `Feedback for ${payload.schoolName} (${payload.sessionDate}):`, [
            [`Attendance (${names.length})`, names],
            ['What went well', [payload.wentWell]],
            ["What didn't go well", [payload.didntGoWell]],
            ['How can we improve', [payload.improve]],
            ...(payload.photos.length ? [['Photos', [`${payload.photos.length} uploaded`]]] : []),
            ['Submitted by', [submittedBy]]
        ]);
        resetFeedbackForm();
    } catch (err) {
        setStatus(status, false, err.message);
    }
});

// --- Start-up ---
document.querySelectorAll('.school-select').forEach(select => {
    select.innerHTML = '<option value="" disabled selected>Select a location...</option>';
    SCHOOLS.forEach(([value, label]) => select.add(new Option(label, value)));
});
resetFeedbackForm();
addExperiment(); // Start with one experiment card
