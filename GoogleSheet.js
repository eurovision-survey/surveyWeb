const scriptURL = 'https://script.google.com/macros/s/AKfycby1xhFxDOqvCE9Ksha90_vHR9HDLY3R376WP3NbkSMM21bSHoop5SR_bCeAioSk3wPX/exec';
const form = document.forms['contact-form'];
const urlText = "https://raw.githubusercontent.com/eurovision-survey/surveyWeb/refs/heads/main/texts_cat.json"
let TEXTS = {}; // Objeto global

fetch(urlText)
  .then((res) => res.json())
  .then((data) => {
    TEXTS = data;
    applyTexts(); // Llamamos a esta función para poblar la UI
  })
  .catch((err) => console.error("Error carregant texts:", err));

function applyTexts() {
  document.getElementById("form-version").textContent = TEXTS.form_version;
  document.getElementById("comment").placeholder = TEXTS.comment_placeholder;
  document.getElementById("submit").value = TEXTS.submit_button;
  // puedes seguir con más traducciones si agregas más IDs o clases
}


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
  setCookie('userId', userId, 1); //1 day cookie
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

  // Disable the submit button to prevent multiple clicks
  const submitButton = document.getElementById('submit');
  if (submitButton) {
    submitButton.classList.add('disabled'); // Add CSS class to disable the button
    submitButton.textContent = 'Submitting...'; // Change button text to indicate processing
  } else {
    console.error('Submit button not found!');
    return;
  }

  // Get the country name from the header
  const countryNameElement = document.querySelector('.country-name span');
  if (!countryNameElement) {
    console.error('Country name element not found!');
    if (submitButton) {
      submitButton.classList.remove('disabled'); // Re-enable the button if there's an error
      submitButton.textContent = 'Submit'; // Reset button text
    }
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
    setCookie('participantIndex', currentIndex, 3); // Store progress in cookie
    
    if (currentIndex < participantsData.countries.length) {
      displayParticipant(currentIndex);
      generateRatingItems(questionsData); // Reload sliders
      window.scrollTo({ top: 0, behavior: 'smooth' });
      form.reset();
    } else {
      console.log('Survey completed. Redirecting to thank you page.');
      setCookie('participantIndex', 0, 1); // Reset progress when finished
      window.location.href = 'thankyou.html'; // Redirect to Thank You page
    }
  } catch (error) {
    console.error('Error submitting form!', error.message);
  } finally {
    // Re-enable the submit button after the function completes
    if (submitButton) {
      submitButton.classList.remove('disabled'); // Remove CSS class to re-enable the button
      submitButton.textContent = 'Submit'; // Reset button text
    }
  }
});

// Variables
let participantsData = [];
let questionsData = [];

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
      <p class="performer-name">${TEXTS.label_performer}: <span>${participant['item-singer']}</span></p>
      <p class="country-name">${TEXTS.label_country}: <span>${participant['item-countryName']}</span></p>
    </div>
  `;
}

// Crear els sliders
function generateRatingItems(data) {
  const formContainer = document.getElementById('sliders');
  formContainer.innerHTML = '';
  
  if (data && Array.isArray(data)) {
    data.forEach((question, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.classList.add('item');
      itemDiv.setAttribute('data-id', index + 1);

      const itemTitle = document.createElement('p');
      itemTitle.classList.add('item-title');
      itemTitle.textContent = question.title;

      const itemDescription0 = document.createElement('p');
      itemDescription0.classList.add('item-description');
      itemDescription0.textContent = question.description_0;

      const itemDescription10 = document.createElement('p');
      itemDescription10.classList.add('item-description');
      itemDescription10.textContent = question.description_10;

      const sliderContainer = document.createElement('div');
      sliderContainer.classList.add('slider-container');

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.classList.add('slider');
      slider.name = question.name;
      slider.min = 0;
      slider.max = 10;
      slider.step = 0.25;
      slider.value = 5;

      const sliderValue = document.createElement('span');
      sliderValue.classList.add('slider-value');
      sliderValue.textContent = '5';

      slider.addEventListener('input', function () {
        sliderValue.textContent = slider.value;
      });

      sliderContainer.appendChild(slider);
      sliderContainer.appendChild(sliderValue);

      itemDiv.appendChild(itemTitle);
      itemDiv.appendChild(itemDescription0);
      itemDiv.appendChild(itemDescription10);
      itemDiv.appendChild(sliderContainer);

      formContainer.appendChild(itemDiv);
    });
  } else {
    console.error("Format JSON incorrecte");
  }
}

// Cargar datos al cargar la página
async function loadData() {
  try {
    console.log('Loading participants and questions data');
    const participantResponse = await fetch("https://raw.githubusercontent.com/eurovision-survey/surveyWeb/refs/heads/main/participants2024.json");
    /*const questionResponse = await fetch(urlText)
  .then((res) => res.json())
  .then((data) => {
    TEXTS = data;
    generateRatingItems(TEXTS.questions); // <- Reutilizas esto igual que antes
    applyTexts();
  });*/

    participantsData = await participantResponse.json();
    questionsData = TEXTS.questions;
    console.log(questionsData);
    displayParticipant(currentIndex);
    generateRatingItems(questionsData);
  } catch (error) {
    console.error("Error carregant dades:", error);
  }
}
window.onload = loadData;
