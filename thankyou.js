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
    displayBlock.textContent = `Tu código identificador es: ${userId}`;
    inlineSpan.textContent = userId;
  } else {
    displayBlock.textContent = "No se encontró el código del usuario.";
    inlineSpan.textContent = "desconocido";
  }
});
