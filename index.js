// 🌐 Language definitions
const languages = [
  { lang: "cat", label: "Català", flag: "flags/cat.svg" },
  { lang: "ara", label: "Aranés", flag: "flags/ara.svg" },
  { lang: "spa", label: "Castellano", flag: "flags/es.svg" },
  { lang: "eng", label: "English", flag: "flags/uk.svg" },
  { lang: "esp", label: "Esperanto", flag: "flags/esp.svg" },
  { lang: "esk", label: "Euskara", flag: "flags/esk.svg" },
  { lang: "gal", label: "Galego", flag: "flags/gal.svg" },
  { lang: "ptg", label: "Português", flag: "flags/ptg.svg" }
];

let currentTexts = {};
let currentLang = getCookie("lang") || "cat";

const languageSelect = document.getElementById("language");
const greetingEl = document.getElementById("greeting");
const titleEl = document.getElementById("title");
const startBtn = document.getElementById("start");

// 🍪 Cookie functions (copied from Google Sheet.js)
function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  const cookies = document.cookie.split('; ');
  for (const cookie of cookies) {
    const [key, value] = cookie.split('=');
    if (key === name) return value;
  }
  return null;
}

// Populate dropdown
function populateLanguageDropdown() {
  languages.forEach(({ lang, label }) => {
    const option = document.createElement("option");
    option.value = lang;
    option.textContent = label;
    if (lang === currentLang) option.selected = true;
    languageSelect.appendChild(option);
  });
}

// Fetch language JSON
async function loadLanguageTexts(lang) {
  const url = `https://raw.githubusercontent.com/eurovision-survey/surveyWeb/refs/heads/main/texts_${lang}.json`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    currentTexts = data;
    applyTexts();
  } catch (err) {
    console.error(`Error loading language JSON for ${lang}:`, err);
  }
}

// Set texts to DOM
function applyTexts() {
  greetingEl.textContent = currentTexts.greeting || "Welcome!";
  startBtn.textContent = currentTexts.start_button || "Start";
  titleEl.textContent = currentTexts.greeting_title || "Eurovision";
}

// Language switch
languageSelect.addEventListener("change", (e) => {
  currentLang = e.target.value;
  setCookie("lang", currentLang, 7);
  loadLanguageTexts(currentLang);
});

// Redirect button
startBtn.addEventListener("click", () => {
  window.location.href = "GoogleSheet.html";
});

// Init
populateLanguageDropdown();
loadLanguageTexts(currentLang);
