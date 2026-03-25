/* =========================================================
   main.js - TTG Friends
   ========================================================= */

// -- 1. DATE & FOOTER -------------------------------------
const now    = new Date();
const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const months = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

document.getElementById('hero-day').textContent       = String(now.getDate()).padStart(2, '0');
document.getElementById('hero-weekday').textContent   = days[now.getDay()];
document.getElementById('hero-monthyear').textContent = `${months[now.getMonth()]} ${now.getFullYear()}`;
document.getElementById('footer-copy').textContent    = `(c) ${now.getFullYear()} TTG Friends`;


// -- 2. LIVE CLOCK ----------------------------------------
function updateClock() {
  const t = new Date();
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
  "Every day is a new beginning. Take a deep breath and start again.",
  "Make today so awesome that yesterday gets jealous.",
  "The secret of getting ahead is getting started.",
  "Smile in the mirror. Do that every morning and you'll see a big difference.",
  "Your only limit is your mind.",
  "Dream big. Work hard. Stay humble.",
  "Today is a perfect day to be happy.",
  "Opportunities don't happen. You create them.",
  "Go the extra mile. It's never crowded.",
  "Push yourself, because no one else is going to do it for you.",
  "Little things make big days.",
  "It's going to be hard, but hard is not impossible.",
  "Don't wait for opportunity. Create it.",
  "Sometimes we're tested not to show our weaknesses, but to discover our strengths.",
  "The key to success is to focus on goals, not obstacles.",
];

function dayOfYear(d) {
  return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
}

const quoteEl = document.getElementById('hero-quote');
if (quoteEl) quoteEl.textContent = '"' + quotes[dayOfYear(now) % quotes.length] + '"';


// -- 4. TODAY'S EVENTS FEED (left column) -----------------
//  Key: "DD-MM" -> array of {year, text, icon?}
const feedData = {
  "25-03": [
    { year:"2026", text:"Happy Ugadi & Gudi Padwa! Wishing all TTG Friends a joyful, prosperous New Year filled with love and laughter. 🌸🎊", icon:"🎉" },
    { year:"2026", text:"Together we celebrate — every moment shared with friends becomes a lifetime memory. Cheers TTG Friends! 💛", icon:"✨" },
    { year:"1807", text:"The Slave Trade Act 1807 abolished the slave trade across the British Empire." },
    { year:"1655", text:"Christiaan Huygens discovers Titan, Saturn's largest moon." },
    { year:"1436", text:"Construction of Florence Cathedral's iconic Brunelleschi Dome is completed." },
  ],
};

const fallbackFeed = [
  { year:"History", text:"On this day, many remarkable events shaped the world as we know it today." },
  { year:"1928", text:"Alexander Fleming discovers penicillin, revolutionising medicine." },
  { year:"1969", text:"The Internet's precursor ARPANET sends its first message." },
  { year:"1990", text:"The Hubble Space Telescope launches aboard Space Shuttle Discovery." },
  { year:"2007", text:"Apple unveils the first iPhone, forever changing mobile computing." },
  { year:"1953", text:"Watson and Crick publish their discovery of the DNA double helix structure." },
];

function pad(n) { return String(n).padStart(2,'0'); }
const todayKey  = `${pad(now.getDate())}-${pad(now.getMonth()+1)}`;
const feedItems = feedData[todayKey] || fallbackFeed;

const feedEl = document.getElementById('event-feed');
if (feedEl) {
  feedItems.forEach(item => {
    const card = document.createElement('article');
    card.className = 'feed-card';
    card.innerHTML = `
      <div class="feed-year">${item.year}</div>
      <div class="feed-text">${item.icon ? item.icon + ' ' : ''}${item.text}</div>
    `;
    feedEl.appendChild(card);
  });
}


// -- 5. ON THIS DAY (sidebar) -----------------------------
const historyData = {
  "25-03": [
    { year:"1436", text:"Brunelleschi's Dome completed in Florence." },
    { year:"1655", text:"Titan (Saturn's moon) discovered by Huygens." },
    { year:"1807", text:"UK abolishes the slave trade." },
  ],
};

const fallbackHistory = [
  { year:"1969", text:"ARPANET sends its first message." },
  { year:"1928", text:"Fleming discovers penicillin." },
  { year:"2004", text:"Facebook launches from Harvard dorm." },
];

const historyItems = historyData[todayKey] || fallbackHistory;
const historyEl    = document.getElementById('history-list');

if (historyEl) {
  historyItems.forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <span class="history-year">${item.year}</span>
      <span class="history-text">${item.text}</span>
    `;
    historyEl.appendChild(div);
  });
}


// -- 6. THINGS TO DO (sidebar) ----------------------------
const weekdayTodos = [
  { icon:"🧘", text:"10-min morning meditation" },
  { icon:"📖", text:"Read one article or chapter" },
  { icon:"🚶", text:"20-minute walk" },
  { icon:"✍️", text:"Write 3 things you're grateful for" },
  { icon:"💧", text:"Drink 8 glasses of water" },
  { icon:"📱", text:"Call someone you haven't spoken to in a while" },
];

const weekendTodos = [
  { icon:"🍳", text:"Cook a new recipe" },
  { icon:"📷", text:"Take a photo walk" },
  { icon:"🌿", text:"Spend time in nature" },
  { icon:"🎨", text:"Create something: draw, paint or write" },
  { icon:"🎲", text:"Play a game with family or friends" },
  { icon:"🛁", text:"Enjoy a relaxing self-care evening" },
];

const isWeekend = now.getDay() === 0 || now.getDay() === 6;
const todoItems = isWeekend ? weekendTodos : weekdayTodos;
const todoEl    = document.getElementById('todo-list');

if (todoEl) {
  todoItems.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="todo-icon">${item.icon}</span><span>${item.text}</span>`;
    todoEl.appendChild(li);
  });
}


// -- 7. PHOTO EMPTY STATE ---------------------------------
// Hide the empty state placeholder if real photo cards exist
const photoGrid  = document.getElementById('photo-grid');
const photoEmpty = document.getElementById('photo-empty');
if (photoGrid && photoEmpty) {
  const realCards = photoGrid.querySelectorAll('.photo-card');
  if (realCards.length > 0) photoEmpty.style.display = 'none';
}
