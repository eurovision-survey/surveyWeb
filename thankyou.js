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
  navigator.clipboard.writeText(userId).then(() => {
    const copyBtn = document.getElementById("copy-btn");
    const originalTitle = copyBtn.title;
    // Feedback visual al usuario
    copyBtn.title = "¡Copiado!";
    copyBtn.innerHTML = "✅";
    setTimeout(() => {
      copyBtn.title = originalTitle;
      copyBtn.innerHTML = "📋";
    }, 2000);
  }).catch(err => {
    console.error("Error al copiar:", err);
  });
}

function getCookie(name) {
  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const [key, value] = cookie.split("=");
    if (key === name) return value;
  }
  return null;
}
