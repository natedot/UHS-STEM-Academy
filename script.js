// Mobile hamburger menu (loaded with `defer` on every page, so the DOM is ready)
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

function setMenu(open) {
    hamburger.classList.toggle('active', open);
    navMenu.classList.toggle('active', open);
    document.body.classList.toggle('no-scroll', open);
}

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => setMenu(!navMenu.classList.contains('active')));

    // Close the menu when a link is tapped
    navMenu.addEventListener('click', e => {
        if (e.target.closest('a')) setMenu(false);
    });
}

// Home page: photo slideshow that slides to the next photo every few seconds
const slideshow = document.getElementById('slideshow');
const slides = slideshow ? slideshow.querySelectorAll('.slides img') : [];
if (slides.length > 1) {
    const track = slideshow.querySelector('.slides');
    const dots = document.createElement('div');
    dots.className = 'slide-dots';
    let current = 0;
    let timer;
    let hovering = false;
    let pageLoaded = false;

    // Only the photo after the current one is fetched ahead of time, so visitors who don't stay don't download them all
    const preload = i => {
        const img = slides[i % slides.length];
        if (!img.dataset.src) return;
        img.srcset = img.dataset.srcset;
        img.src = img.dataset.src;
        delete img.dataset.src;
    };

    function showSlide(i) {
        current = (i + slides.length) % slides.length;
        track.style.transform = `translateX(-${current * 100}%)`;
        dots.querySelectorAll('button').forEach((d, n) => d.setAttribute('aria-current', n === current));
        preload(current); // in case someone jumps straight to a photo with the dots
        if (pageLoaded) preload(current + 1);
    }

    function restartTimer() {
        clearInterval(timer);
        // Skip turns while the tab is in the background
        if (!hovering) timer = setInterval(() => { if (!document.hidden) showSlide(current + 1); }, 4000);
    }

    slides.forEach((img, n) => {
        const dot = document.createElement('button');
        dot.setAttribute('aria-label', `Show photo ${n + 1}`);
        dot.addEventListener('click', () => { showSlide(n); restartTimer(); });
        dots.appendChild(dot);
    });
    slideshow.appendChild(dots);

    // Previous / next arrows on the sides (they fade in when hovering over the photos)
    [['prev', 'Previous photo', '\u2039', -1], ['next', 'Next photo', '\u203A', 1]].forEach(([cls, label, symbol, step]) => {
        const arrow = document.createElement('button');
        arrow.className = `slide-arrow ${cls}`;
        arrow.setAttribute('aria-label', label);
        arrow.textContent = symbol;
        arrow.addEventListener('click', () => { showSlide(current + step); restartTimer(); });
        slideshow.appendChild(arrow);
    });

    // Swipe left/right on phones to change photo (ignored if the finger mostly moved up/down to scroll)
    let touchStart = null;
    slideshow.addEventListener('touchstart', e => { touchStart = e.touches[0]; }, { passive: true });
    slideshow.addEventListener('touchend', e => {
        if (!touchStart) return;
        const dx = e.changedTouches[0].clientX - touchStart.clientX;
        const dy = e.changedTouches[0].clientY - touchStart.clientY;
        touchStart = null;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { showSlide(current + (dx < 0 ? 1 : -1)); restartTimer(); }
    });

    // Pause while the mouse is over the photos
    slideshow.addEventListener('mouseenter', () => { hovering = true; clearInterval(timer); });
    slideshow.addEventListener('mouseleave', () => { hovering = false; restartTimer(); });

    window.addEventListener('load', () => { pageLoaded = true; preload(current + 1); });

    showSlide(0);
    restartTimer();
}

// Home page: Google Calendar is heavy, so it only loads once the visitor scrolls close to it
const calendars = document.querySelectorAll('iframe[data-src]');
const loadCalendar = frame => { frame.src = frame.dataset.src; frame.removeAttribute('data-src'); };
if ('IntersectionObserver' in window) {
    const watcher = new IntersectionObserver(entries => entries.forEach(e => {
        if (e.isIntersecting) { loadCalendar(e.target); watcher.unobserve(e.target); }
    }));
    calendars.forEach(frame => watcher.observe(frame));
} else {
    calendars.forEach(loadCalendar);
}

// ---------------------------------------------------------------------------------------------
// Visit Log: every page records the first visit per browser session in the sheet's "Visit Log" tab
// (IP address, device details, page). The Leaders Hub also uses these for its Submission Log.
// ---------------------------------------------------------------------------------------------

// The Apps Script web app (apps-script/Code.gs → doPost). If it's ever redeployed with a new URL, change it here.
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbysDq5um3VDU4LjH4Bnhhw3-myMZpQP-RjdVgUwbBjKF1cj2Ygu3Jdu3scMWyQJ2uEZ/exec';

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

// The browser can't see its own public IP address, so it asks ipify (a free lookup service), once per page.
// If that's blocked or slow (3 seconds), the logs just say "unavailable".
let ipLookup; // started the first time it's needed, then reused
function ipAddress() {
    ipLookup = ipLookup || Promise.race([
        fetch('https://api.ipify.org?format=json', { credentials: 'omit' }).then(r => r.json()).then(d => d.ip),
        new Promise(resolve => setTimeout(() => resolve('unavailable'), 3000))
    ]).catch(() => 'unavailable');
    return ipLookup;
}

async function clientInfo() {
    let timeZone = '';
    try { timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (err) {}
    return {
        ip: await ipAddress(),
        device: describeDevice(navigator.userAgent),
        screen: `${screen.width}×${screen.height} @${window.devicePixelRatio || 1}x`,
        language: navigator.language,
        timeZone,
        deviceId: deviceId(),
        userAgent: navigator.userAgent
    };
}

// Runs after the page has finished loading so it never slows the page down
async function logVisit() {
    const page = document.title.split('|').pop().trim();
    try {
        const key = 'uhs-visit-' + page;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, '1');
    } catch (err) { /* private browsing: log anyway */ }
    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            credentials: 'omit',
            body: JSON.stringify({ action: 'logVisit', payload: { page, referrer: document.referrer, client: await clientInfo() } })
        });
    } catch (err) { /* never bother the visitor if logging fails */ }
}

if (document.readyState === 'complete') logVisit();
else window.addEventListener('load', logVisit);
