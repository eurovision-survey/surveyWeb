const urlText = "https://raw.githubusercontent.com/eurovision-survey/surveyWeb/refs/heads/main/texts_cat.json";
let TEXTS = {}; // Objeto global

fetch(urlText)
  .then((res) => res.json())
  .then((data) => {
    TEXTS = data;
    applyTexts();
  })
  .catch((err) => console.error("Error carregant texts:", err));

function getCookie(name) {
  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const [key, value] = cookie.split("=");
    if (key === name) return value;
  }
  return null;
}

function requireElement(id) {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Elemento con ID "${id}" no encontrado en el DOM.`);
  }
  return el;
}

function applyTexts() {
  const userId = getCookie("userId") || "desconocido";

  const displayBlock = requireElement("user-id-display");
  displayBlock.textContent = userId;

  const inlineSpan = document.getElementById("user-id-inline");
  if (inlineSpan) inlineSpan.textContent = userId;

  const copyBtn = requireElement("copy-btn");
  copyBtn.innerHTML = TEXTS.thankyou_copy_icon;
  copyBtn.title = TEXTS.thankyou_copy_button;
  copyBtn.addEventListener("click", () => copiar(userId, copyBtn));

  requireElement("thankyou-title").textContent = TEXTS.thankyou_title;
  requireElement("thankyou-code-label").textContent = TEXTS.thankyou_code_label;
  requireElement("spreadsheet-button").textContent = TEXTS.thankyou_spreadsheet_button;
  requireElement("instructions-title").textContent = TEXTS.thankyou_instructions_title;
  requireElement("step-1").textContent = TEXTS.thankyou_instruction_1;
  requireElement("step-2").textContent = TEXTS.thankyou_instruction_2;
  requireElement("step-3").textContent = TEXTS.thankyou_instruction_3;
  requireElement("step-4").textContent = TEXTS.thankyou_instruction_4;
  requireElement("step-5").innerHTML = `${TEXTS.thankyou_instruction_5} <strong><span id="user-id-inline">${userId}</span></strong>.`;
  requireElement("step-6").textContent = TEXTS.thankyou_instruction_6;
}

function copiar(userId, copyBtn) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(userId).then(() => {
      mostrarFeedback(copyBtn);
    }).catch(() => {
      copiarAlternativo(userId, copyBtn);
    });
  } else {
    copiarAlternativo(userId, copyBtn);
  }
}

function copiarAlternativo(texto, copyBtn) {
  const input = document.createElement("input");
  input.value = texto;
  document.body.appendChild(input);
  input.select();
  try {
    document.execCommand("copy");
    mostrarFeedback(copyBtn);
  } catch (err) {
    console.error("Error al copiar:", err);
  }
  document.body.removeChild(input);
}

function mostrarFeedback(boton) {
  const originalTitle = boton.title;
  boton.title = "¡Copiado!";
  boton.innerHTML = "✅";
  setTimeout(() => {
    boton.title = originalTitle;
    boton.innerHTML = "📋";
  }, 4000);
}
