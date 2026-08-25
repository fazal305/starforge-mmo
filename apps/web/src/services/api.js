const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return body;
}

export function register({ username, email, password }) {
  return request("/auth/register", { method: "POST", body: JSON.stringify({ username, email, password }) });
}

export function login({ username, password }) {
  return request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
}

export function fetchEmpire(token) {
  return request("/empire", { headers: { Authorization: `Bearer ${token}` } });
}
