function showToast(message, type = "success") {
  let toast = document.getElementById("toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.style.cssText = `
      position:fixed;right:20px;bottom:20px;z-index:9999;
      padding:14px 18px;border-radius:12px;background:#183126;
      color:white;box-shadow:0 12px 30px rgba(0,0,0,.15);
      font-weight:700;max-width:340px;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.background = type === "error" ? "#a62d2d" : "#16834d";

  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.remove(), 3000);
}
