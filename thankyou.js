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
    displayBlock.textContent = "Ha habido un error con el código";
    inlineSpan.textContent = "desconocido";
  }
});
