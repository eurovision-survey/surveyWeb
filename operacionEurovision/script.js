// Constants
const jsonURL = 'https://github.com/eurovision-survey/surveyWeb/blob/main/participants2024.json'; // Replace with the actual path to your JSON file
const scriptURL = 'https://script.google.com/macros/s/AKfycby1xhFxDOqvCE9Ksha90_vHR9HDLY3R376WP3NbkSMM21bSHoop5SR_bCeAioSk3wPX/exec';

// DOM Elements
const topBar = document.getElementById('top-bar');
const flagImage = document.getElementById('flag');
const countryName = document.getElementById('country-name');
const singer = document.getElementById('singer');
const song = document.getElementById('song');
const slidersContainer = document.getElementById('sliders-container');
const commentBox = document.getElementById('comment');
const form = document.getElementById('survey-form');

// Global Variables
let contestants = [];
let currentContestantIndex = 0;

// Fetch Contestant Data
async function fetchContestants() {
  try {
    const response = await fetch(jsonURL);
    const data = await response.json();
    contestants = data.countries;
    displayContestant(currentContestantIndex);
    generateSliders();
  } catch (error) {
    console.error('Error fetching contestant data:', error);
  }
}

// Display Contestant Information
function displayContestant(index) {
  const contestant = contestants[index];
  console.log(contestant)
  flagImage.src = `https://raw.githubusercontent.com/eurovision-survey/surveyWeb/refs/heads/main/flags/${contestant["countryCode"]}.svg`;
  countryName.textContent = contestant['item-countryName'];
  singer.textContent = `Singer: ${contestant['item-singer']}`;
  song.textContent = `Song: ${contestant['item-song']}`;
}

// Generate Sliders
function generateSliders() {
  slidersContainer.innerHTML = ''; // Clear existing sliders
  for (let i = 1; i <= 10; i++) {
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'slider-container';

    const label = document.createElement('label');
    label.textContent = `Topic ${i}:`;
    sliderContainer.appendChild(label);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '1';
    slider.max = '10';
    slider.step = '0.25';
    slider.value = '5';
    slider.className = 'slider';
    sliderContainer.appendChild(slider);

    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'slider-value';
    valueDisplay.textContent = '5.00';
    sliderContainer.appendChild(valueDisplay);

    // Update value display in real-time
    slider.addEventListener('input', () => {
      valueDisplay.textContent = parseFloat(slider.value).toFixed(2);
    });

    slidersContainer.appendChild(sliderContainer);
  }
}

// Handle Form Submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Collect Data
  const formData = new FormData(form);
  const sliderValues = Array.from(document.querySelectorAll('.slider')).map(slider => slider.value);
  const comment = commentBox.value;

  // Prepare Data for Google Sheets
  const data = {
    contestant: contestants[currentContestantIndex]['item-countryName'],
    ...sliderValues.reduce((acc, value, index) => {
      acc[`topic_${index + 1}`] = value;
      return acc;
    }, {}),
    comment: comment,
  };

  // Send Data to Google Sheets
  try {
    await fetch(scriptURL, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    alert('Thank you! Your response has been submitted.');

    // Move to Next Contestant
    currentContestantIndex = (currentContestantIndex + 1) % contestants.length;
    displayContestant(currentContestantIndex);
    form.reset(); // Reset sliders and comment box
    window.scrollTo(0, 0); // Scroll to top
  } catch (error) {
    console.error('Error submitting form:', error);
  }
});

// Initialize
fetchContestants();