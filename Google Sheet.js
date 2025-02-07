const scriptURL = 'https://script.google.com/macros/s/AKfycby1xhFxDOqvCE9Ksha90_vHR9HDLY3R376WP3NbkSMM21bSHoop5SR_bCeAioSk3wPX/exec';
const form = document.forms['contact-form'];

form.addEventListener('submit', e => {
  e.preventDefault();
  fetch(scriptURL, { method: 'POST', body: new FormData(form)})
    .then(response => alert("Thank you! Form is submitted"))
    .then(() => { window.location.reload(); })
    .catch(error => console.error('Error!', error.message));
});

// Variables
let participantsData = [];
let currentIndex = 0;

// Mostrar informació del participant actual
function displayParticipant(index) {
  const participant = participantsData.countries[index];
  const infoContainer = document.getElementById('info'); // Obtener contenedor de la info

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
    // Carregar dades dels participants
    const participantResponse = await fetch("https://raw.githubusercontent.com/eurovision-survey/surveyWeb/refs/heads/main/participants2024.json");
    if (!participantResponse.ok) {
      throw new Error('No s\'ha pogut carregar el fitxer de participants');
    }
    participantsData = await participantResponse.json();
    displayParticipant(currentIndex); // Mostrar primer participant

    // Carregar dades dels ítems de valoració
    const response = await fetch("https://raw.githubusercontent.com/eurovision-survey/surveyWeb/refs/heads/main/questions.json");
    if (!response.ok) {
      throw new Error('No s\'ha pogut carregar el fitxer de valoració');
    }
    const data = await response.json();
    generateRatingItems(data); // Generar ítems de valoració
  } catch (error) {
    console.error("Error carregant dades:", error);
  }
}

//Crear els sliders
/*function generateRatingItems(data) {
  const formContainer = document.getElementById('sliders');
  if (data && data.questions && Array.isArray(data.questions)) {
    data.questions.forEach((question, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.classList.add('item');
      itemDiv.setAttribute('data-id', index + 1);

      const itemTitle = document.createElement('p');
      itemTitle.classList.add('item-title');
      itemTitle.textContent = question['item-title'];

      const itemDescription = document.createElement('p');
      itemDescription.classList.add('item-description');
      itemDescription.textContent = question['item-description'];

      const sliderContainer = document.createElement('div');
      sliderContainer.classList.add('slider-container');

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.classList.add('slider');
      slider.name = question['item-name'];
      slider.min = 1;
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
      itemDiv.appendChild(itemDescription);
      itemDiv.appendChild(sliderContainer);

      formContainer.appendChild(itemDiv);
    });

  } else {
    console.error("Format JSON incorrecte");
  }
}*/
function generateRatingItems(data) {
  const formContainer = document.getElementById('sliders');
  if (data && data.questions && Array.isArray(data.questions)) {
    data.questions.forEach((question, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.classList.add('item');
      itemDiv.setAttribute('data-id', index + 1);

      const itemTitle = document.createElement('p');
      itemTitle.classList.add('item-title');
      itemTitle.textContent = question['item-title'];

      const itemDescription = document.createElement('p');
      itemDescription.classList.add('item-description');
      itemDescription.textContent = question['item-description'];

      const sliderContainer = document.createElement('div');
      sliderContainer.classList.add('slider-container');

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.classList.add('slider');
      slider.name = question['item-name'];
      slider.min = 1;
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
      itemDiv.appendChild(itemDescription);
      itemDiv.appendChild(sliderContainer);

      formContainer.appendChild(itemDiv);
    });
  } else {
    console.error("Format JSON incorrecte");
  }
}

// Cargar datos al cargar la página
window.onload = loadData;