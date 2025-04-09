function getCookie(name) {
  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const [key, value] = cookie.split("=");
    if (key === name) return value;
  }
  return null;
}

document.addEventListener("DOMContentLoaded", async () => {
  const userId = getCookie("userId") || "desconocido";
  const displayBlock = document.getElementById("user-id-display");
  const inlineSpan = document.getElementById("user-id-inline");
  const copyBtn = document.getElementById("copy-btn");

  if (displayBlock) displayBlock.textContent = userId;
  if (inlineSpan) inlineSpan.textContent = userId;

  // Cargar textos desde JSON
  try {
    const res = await fetch("texts_cat.json");
    const TEXTS = await res.json();

    // Insertar textos dinámicos
    document.getElementById("thankyou-title").textContent = TEXTS.thankyou_title;
    document.getElementById("thankyou-code-label").textContent = TEXTS.thankyou_code_label;
    copyBtn.innerHTML = TEXTS.thankyou_copy_icon;
    copyBtn.title = TEXTS.thankyou_copy_button;
    document.getElementById("spreadsheet-button").textContent = TEXTS.thankyou_spreadsheet_button;

    document.getElementById("instructions-title").textContent = TEXTS.thankyou_instructions_title;
    document.getElementById("step-1").textContent = TEXTS.thankyou_instruction_1;
    document.getElementById("step-2").textContent = TEXTS.thankyou_instruction_2;
    document.getElementById("step-3").textContent = TEXTS.thankyou_instruction_3;
    document.getElementById("step-4").textContent = TEXTS.thankyou_instruction_4;
    document.getElementById("step-5").innerHTML = `${TEXTS.thankyou_instruction_5} <strong><span id="user-id-inline">${userId}</span></strong>.`;
    document.getElementById("step-6").textContent = TEXTS.thankyou_instruction_6;

  } catch (error) {
    console.error("Error cargando textos:", error);
  }

  // Evento de copiar
  copyBtn.addEventListener("click", () => copiar(userId, copyBtn));
});

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
  const originalIcon = "📋";
  const doneIcon = "✅";
  const originalTitle = boton.title;
  boton.title = "¡Copiado!";
  boton.innerHTML = doneIcon;
  setTimeout(() => {
    boton.title = originalTitle;
    boton.innerHTML = originalIcon;
  }, 4000);
}
