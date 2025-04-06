function getCookie(name) {
  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const [key, value] = cookie.split("=");
    if (key === name) return value;
  }
  return null;
}

document.addEventListener("DOMContentLoaded", () => {
  const userId = getCookie("userId");
  const displayBlock = document.getElementById("user-id-display");
  const inlineSpan = document.getElementById("user-id-inline");

  if (userId) {
    displayBlock.textContent = userId;
    inlineSpan.textContent = userId;
  } else {
    displayBlock.textContent = "desconocido";
    inlineSpan.textContent = "desconocido";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const userId = getCookie("userId");
  const displayBlock = document.getElementById("user-id-display");
  const inlineSpan = document.getElementById("user-id-inline"); // si lo utilizas en otras partes
  const copyBtn = document.getElementById("copy-btn");

  if (userId) {
    displayBlock.textContent = userId;
    if(inlineSpan) {
      inlineSpan.textContent = userId;
    }
  } else {
    displayBlock.textContent = "desconocido";
    if(inlineSpan) {
      inlineSpan.textContent = "desconocido";
    }
  }

  // Registrar evento para copiar
  copyBtn.addEventListener("click", copiar);
});

function copiar() {
  const userId = document.getElementById("user-id-display").textContent;
  const copyBtn = document.getElementById("copy-btn");

  // Intentar usar Clipboard API moderna
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(userId).then(() => {
      mostrarFeedback(copyBtn);
    }).catch(err => {
      console.error("Error al copiar con Clipboard API:", err);
      copiarAlternativo(userId, copyBtn);
    });
  } else {
    // Fallback para entornos no seguros o navegadores sin soporte
    copiarAlternativo(userId, copyBtn);
  }
}

function copiarAlternativo(texto, copyBtn) {
  const input = document.createElement("input");
  input.value = texto;
  document.body.appendChild(input);
  input.select();
  try {
    const exito = document.execCommand("copy");
    if (exito) {
      mostrarFeedback(copyBtn);
    } else {
      console.warn("execCommand falló");
    }
  } catch (err) {
    console.error("Error al usar execCommand:", err);
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


function getCookie(name) {
  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const [key, value] = cookie.split("=");
    if (key === name) return value;
  }
  return null;
}
