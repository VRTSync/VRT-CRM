async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error = new Error(body.error || `Request failed: ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export const api = {
  me: () => request("/api/me"),
  logout: () => request("/auth/logout", { method: "POST" }),
  users: () => request("/api/users"),
  setUserRole: (id, role) =>
    request(`/api/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  customers: () => request("/api/customers"),
  customer: (id) => request(`/api/customers/${id}`),
  notes: (customerId) => request(`/api/notes?customerId=${customerId}`),
  createNote: (data) =>
    request("/api/notes", { method: "POST", body: JSON.stringify(data) }),
  contacts: (customerId) => request(`/api/contacts?customerId=${customerId}`),
};
