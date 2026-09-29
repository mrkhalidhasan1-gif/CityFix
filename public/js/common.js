function showToast(message, type = "success") {
  let toast = document.getElementById("toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `toast ${type}`;
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.remove(), 3000);
}

function showModal(title, content, actions = "") {
  let modal = document.getElementById("appModal");

  if (!modal) {
    modal = document.createElement("div");
    modal.id = "appModal";
    modal.className = "modal-backdrop";
    modal.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true">
        <button class="modal-close" onclick="closeModal()">×</button>
        <h2 id="modalTitle"></h2>
        <div id="modalContent"></div>
        <div id="modalActions" class="modal-actions"></div>
      </div>`;
    document.body.appendChild(modal);
  }

  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalContent").innerHTML = content;
  document.getElementById("modalActions").innerHTML = actions;
  modal.classList.add("show");
}

function closeModal() {
  const modal = document.getElementById("appModal");
  if (modal) modal.classList.remove("show");
}
