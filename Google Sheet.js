const scriptURL = 'https://script.google.com/macros/s/AKfycby1xhFxDOqvCE9Ksha90_vHR9HDLY3R376WP3NbkSMM21bSHoop5SR_bCeAioSk3wPX/exec';
const form = document.forms['contact-form'];

// Function to generate a unique ID
function generateUniqueId() {
  return `${Math.random().toString(36).substring(2)}-${Date.now().toString(36)}`;
}

// Function to set a cookie
function setCookie(name, value, days) {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
}

// Function to get a cookie
function getCookie(name) {
  const cookies = document.cookie.split('; ');
  for (const cookie of cookies) {
    const [key, value] = cookie.split('=');
    if (key === name) return value;
  }
  return null;
}

// Assign or retrieve user ID
let userId = getCookie('userId');
if (!userId) {
  userId = generateUniqueId();
  setCookie('userId', userId, 365);
  console.log(`New userId generated: ${userId}`);
} else {
  console.log(`Existing userId retrieved: ${userId}`);
}

// Retrieve last viewed participant index
let currentIndex = parseInt(getCookie('participantIndex')) || 0;
console.log(`Loaded participant index from cookie: ${currentIndex}`);

form.addEventListener('submit', async e => {
  e.preventDefault();
  console.log('Form submitted');

  // Get the country name from the header
  const countryNameElement = document.querySelector('.country-name span');
  if (!countryNameElement) {
    console.error('Country name element not found!');
    return;
  }
  const countryName = countryNameElement.textContent;
  console.log(`Submitting for country: ${countryName}`);

  // Create a new FormData object
  const formData = new FormData();

  // Add the user ID and country name as the first items
  formData.append('user-id', userId);
  formData.append('country-name', countryName);

  // Append the rest of the form data
  for (const [key, value] of new FormData(form)) {
    formData.append(key, value);
  }

  try {
    console.log('Sending data to Google Sheets');
    await fetch(scriptURL, { method: 'POST', body: formData });
    
    // Move to the next participant or finish the survey
    currentIndex++;
    console.log(`Moving to next participant: ${currentIndex}`);
    setCookie('participantIndex', currentIndex, 365); // Store progress in cookie
    
    if (currentIndex < participantsData.countries.length) {
      displayParticipant(currentIndex);
      form.reset();
    } else {
      console.log('Survey completed. Redirecting to thank you page.');
      setCookie('participantIndex', 0, 365); // Reset progress when finished
      window.location.href = 'thankyou.html'; // Redirect to Thank You page
    }
  } catch (error) {
    console.error('Error submitting form!', error.message);
  }
});

// Variables
let participantsData = [];

// Mostrar informació del participant actual
function displayParticipant(index) {
  console.log(`Displaying participant at index: ${index}`);
  if (!participantsData.countries || index >= participantsData.countries.length) {
    console.error('Invalid participant index or data not loaded');
    return;
  }
  const participant = participantsData.countries[index];
  const infoContainer = document.getElementById('info');
  
  if (!infoContainer) {
    console.error('Info container not found');
    return;
  }

  // Construir l'URL de la bandera utilitzant el codi del país (ex: SWE)
  const flagUrl = `https://raw.githubusercontent.com/eurovision-survey/surveyWeb/refs/heads/main/flags/${participant['item-countryCode']}.svg`;

  // Crear la estructura HTML
  infoContainer.innerHTML = `
    <img src="${flagUrl}" alt="Bandera de ${participant['item-countryName']}" class="country-flag">
    <div id="participant">
      <p class="song-name"><h1 class="song-title">${participant['item-song']}</h1></p>
      <p class="performer-name">Intérprete: <span>${participant['item-singer']}</span></p>
      <p class="country-name">País: <span>${participant['item-countryName']}</span></p>
    </div>
  `;
}

// Carregar els ítems de valoració i participants des dels fitxers JSON
async function loadData() {
  try {
    console.log('Loading participants data');
    const participantResponse = await fetch("https://raw.githubusercontent.com/eurovision-survey/surveyWeb/refs/heads/main/participants2024.json");
    if (!participantResponse.ok) {
      throw new Error('No s\'ha pogut carregar el fitxer de participants');
    }
    participantsData = await participantResponse.json();
    console.log('Participants data loaded', participantsData);
    displayParticipant(currentIndex);
  } catch (error) {
    console.error("Error carregant dades:", error);
  }
}

// Cargar datos al cargar la página
window.onload = loadData;
