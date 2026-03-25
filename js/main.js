/* =========================================================
   main.js – Powers the "Today Doodle" page
   ========================================================= */

// ── 1. DATE & FOOTER ──────────────────────────────────────
const now   = new Date();
const days  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const months= ['January','February','March','April','May','June',
               'July','August','September','October','November','December'];

document.getElementById('date-day').textContent =
  String(now.getDate()).padStart(2, '0');

document.getElementById('date-month-year').textContent =
  `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getFullYear()}`;

document.getElementById('footer-year').textContent =
  `© ${now.getFullYear()} Ganesh`;


// ── 2. DAILY QUOTE (rotates by day-of-year) ───────────────
const quotes = [
  "Every day is a new beginning. Take a deep breath and start again.",
  "Make today so awesome that yesterday gets jealous.",
  "The secret of getting ahead is getting started.",
  "Smile in the mirror. Do that every morning and you'll start to see a big difference in your life.",
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
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}

document.getElementById('date-quote').textContent =
  '"' + quotes[dayOfYear(now) % quotes.length] + '"';


// ── 3. ON THIS DAY – EVENTS ──────────────────────────────
//  Key: "DD-MM" → array of {year, text}
const historyData = {
  "01-01": [{year:"2000",text:"The world celebrated the Y2K millennium without major computer failures."},
            {year:"1863",text:"US President Lincoln signs the Emancipation Proclamation."}],
  "14-04": [{year:"1912",text:"RMS Titanic strikes an iceberg and sinks the following morning."},
            {year:"1865",text:"President Abraham Lincoln is shot at Ford's Theatre."}],
  "20-07": [{year:"1969",text:"Apollo 11 Moon Landing – Neil Armstrong takes humanity's first steps on the Moon."},
            {year:"1976",text:"NASA's Viking 1 spacecraft lands on Mars."}],
  "12-04": [{year:"1961",text:"Yuri Gagarin becomes the first human to travel in outer space."},
            {year:"1981",text:"First Space Shuttle mission (STS-1) launches from Kennedy Space Center."}],
  "09-11": [{year:"1989",text:"The Berlin Wall falls, reuniting East and West Germany."},
            {year:"1918",text:"World War I ends as Germany signs an armistice."}],
  "04-07": [{year:"1776",text:"The United States Declaration of Independence is adopted by the Congress."},
            {year:"1997",text:"Mars Pathfinder lands on Mars, deploying Sojourner rover."}],
  "25-03": [{year:"1807",text:"The Slave Trade Act 1807 abolishes the slave trade in the British Empire."},
            {year:"1655",text:"Christiaan Huygens discovers Titan, Saturn's largest moon."},
            {year:"1436",text:"Construction of Florence Cathedral (Brunelleschi's Dome) is completed."}],
};

function pad(n) { return String(n).padStart(2, '0'); }
const todayKey = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}`;

// Fallback events if today has no entry
const fallbackEvents = [
  {year:"1928",text:"Alexander Fleming discovers penicillin, revolutionising medicine."},
  {year:"1969",text:"The Internet's precursor, ARPANET, sends its first message."},
  {year:"1990",text:"The Hubble Space Telescope is launched aboard Space Shuttle Discovery."},
  {year:"2004",text:"Mark Zuckerberg launches "The Facebook" from his Harvard dorm room."},
  {year:"2007",text:"Apple unveils the first iPhone, changing mobile computing forever."},
  {year:"1953",text:"Watson and Crick publish their discovery of the double helix structure of DNA."},
];

const events = historyData[todayKey] || fallbackEvents;

const eventsGrid = document.getElementById('events-grid');
events.forEach(ev => {
  const card = document.createElement('div');
  card.className = 'event-card';
  card.innerHTML = `<div class="event-year">${ev.year}</div>
                    <div class="event-desc">${ev.text}</div>`;
  eventsGrid.appendChild(card);
});

// Always show at least 4 cards (pad with fallbacks)
if (events.length < 4) {
  const extras = fallbackEvents.filter(f => !events.find(e => e.year === f.year));
  extras.slice(0, 4 - events.length).forEach(ev => {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.innerHTML = `<div class="event-year">${ev.year}</div>
                      <div class="event-desc">${ev.text}</div>`;
    eventsGrid.appendChild(card);
  });
}


// ── 4. ACTIVITIES ────────────────────────────────────────
const weekdayActivities = [
  {icon:"🧘",text:"10-minute morning meditation or deep breathing"},
  {icon:"📖",text:"Read one article or book chapter"},
  {icon:"🚶",text:"Walk for 20 minutes – fresh air, clear mind"},
  {icon:"✍️",text:"Write 3 things you're grateful for today"},
  {icon:"💧",text:"Drink at least 8 glasses of water"},
  {icon:"📱",text:"Call or text someone you haven't spoken to in a while"},
];

const weekendActivities = [
  {icon:"🍳",text:"Cook a new recipe you've been meaning to try"},
  {icon:"📷",text:"Take a photo walk – capture something beautiful"},
  {icon:"🌿",text:"Spend time in nature: a park, garden, or trail"},
  {icon:"🎨",text:"Create something: draw, paint, write, or craft"},
  {icon:"🎲",text:"Play a board game or puzzle with family/friends"},
  {icon:"🛁",text:"Have a relaxing self-care evening"},
];

const isWeekend = now.getDay() === 0 || now.getDay() === 6;
const todayActivities = isWeekend ? weekendActivities : weekdayActivities;

const actList = document.getElementById('activity-list');
todayActivities.forEach(act => {
  const li = document.createElement('li');
  li.innerHTML = `<span class="act-icon">${act.icon}</span><span>${act.text}</span>`;
  actList.appendChild(li);
});
