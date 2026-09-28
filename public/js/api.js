const API = "/api";

function getToken() {
  return localStorage.getItem("civic_token");
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("civic_user"));
  } catch {
    return null;
  }
}

function saveAuth(data) {
  localStorage.setItem("civic_token", data.token);
  localStorage.setItem("civic_user", JSON.stringify(data.user));
}

function logout() {
  localStorage.removeItem("civic_token");
  localStorage.removeItem("civic_user");
  window.location.href = "/";
}

async function request(url, options = {}) {
  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (getToken()) {
    headers.Authorization = `Bearer ${getToken()}`;
  }

  const response = await fetch(`${API}${url}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

function requireLogin(admin = false) {
  const user = getUser();

  if (!user || !getToken()) {
    window.location.href = "/pages/login.html";
    return null;
  }

  if (admin && user.role !== "admin") {
    window.location.href = "/pages/dashboard.html";
    return null;
  }

  return user;
}

window.civicAPI = {
  request,
  getUser,
  getToken,
  saveAuth,
  logout,
  requireLogin
};
