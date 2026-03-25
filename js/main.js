/* =========================================================
   main.js - TTG Friends
   ========================================================= */

// -- 1. DATE & FOOTER -------------------------------------
const now    = new Date();
const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const months = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

document.getElementById('hero-day').textContent       = String(now.getDate()).padStart(2,'0');
document.getElementById('hero-weekday').textContent   = days[now.getDay()];
document.getElementById('hero-monthyear').textContent = `${months[now.getMonth()]} ${now.getFullYear()}`;
document.getElementById('footer-copy').textContent    = `(c) ${now.getFullYear()} TTG Friends`;


// -- 2. LIVE CLOCK ----------------------------------------
function updateClock() {
  const t  = new Date();
  const hh = String(t.getHours()).padStart(2,'0');
  const mm = String(t.getMinutes()).padStart(2,'0');
  const ss = String(t.getSeconds()).padStart(2,'0');
  const el = document.getElementById('live-clock');
  if (el) el.textContent = `${hh}:${mm}:${ss}`;
}
updateClock();
setInterval(updateClock, 1000);


// -- 3. DAILY QUOTE ---------------------------------------
const quotes = [
  "A great marriage is not when the perfect couple comes together, but when an imperfect couple learns to enjoy their differences.",
  "The best thing to hold onto in life is each other.",
  "A happy marriage is a long conversation that always seems too short.",
  "In all the world, there is no heart for me like yours. In all the world, there is no love for you like mine.",
  "Two souls with but a single thought, two hearts that beat as one.",
  "A successful marriage requires falling in love many times — always with the same person.",
  "To love is nothing. To be loved is something. But to love and be loved — that's everything.",
  "The real act of marriage takes place in the heart, not in the ballroom or church or synagogue.",
];

function dayOfYear(d) {
  return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
}

const quoteEl = document.getElementById('hero-quote');
if (quoteEl) quoteEl.textContent = quotes[dayOfYear(now) % quotes.length];


// -- 4. TODAY'S UPDATES FEED ------------------------------
function pad(n) { return String(n).padStart(2,'0'); }
const todayKey = `${pad(now.getDate())}-${pad(now.getMonth()+1)}`;

const feedData = {
  "25-03": [
    { tag:"Wedding", text:"Stylo weds Shuba — Two wonderful souls unite today in Tuticorin. Thala Thanga Guys send their warmest congratulations and heartfelt blessings! 💍🎊", icon:"💒" },
    { tag:"Wishes",  text:"May your home be filled with love, laughter, and the joy of togetherness. Wishing the newlyweds a lifetime of happiness! 💛🌸", icon:"💕" },
    { tag:"Today",   text:"From Thala Thanga Guys — A toast to the most beautiful couple! Here's to forever, to your laughter, and to your love story just beginning. 🥂", icon:"🎉" },
  ],
};

const fallbackFeed = [
  { tag:"TTG", text:"Every day is a new story. TTG Friends are here to celebrate life's best moments together!", icon:"🌟" },
];

const feedItems = feedData[todayKey] || fallbackFeed;
const feedEl   = document.getElementById('event-feed');

if (feedEl) {
  feedItems.forEach((item, i) => {
    const card = document.createElement('article');
    card.className = 'feed-card';
    card.innerHTML = `
      <div class="feed-year">${item.icon} ${item.tag}</div>
      <div class="feed-text">${item.text}</div>
    `;
    feedEl.appendChild(card);
  });
}


// -- 5. PHOTO LIGHTBOX ------------------------------------
const lightbox  = document.getElementById('lightbox');
const lbImg     = document.getElementById('lightbox-img');
const lbTitle   = document.getElementById('lb-title');
const lbWishes  = document.getElementById('lb-wishes');
const lbLoc     = document.getElementById('lb-location');
const lbClose   = document.getElementById('lightbox-close');
const lbBackdrop= document.getElementById('lightbox-backdrop');

function openLightbox(card) {
  lbImg.src        = card.dataset.img;
  lbImg.alt        = card.dataset.title;
  lbTitle.textContent   = card.dataset.title;
  lbWishes.textContent  = card.dataset.wishes;
  lbLoc.textContent     = card.dataset.location;
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
  lbImg.src = '';
}

document.querySelectorAll('.photo-card').forEach(card => {
  card.style.cursor = 'pointer';
  card.addEventListener('click', () => openLightbox(card));
});

if (lbClose)   lbClose.addEventListener('click', closeLightbox);
if (lbBackdrop)lbBackdrop.addEventListener('click', closeLightbox);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLightbox();
});
