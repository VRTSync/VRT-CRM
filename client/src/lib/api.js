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
  getTasks: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.set(k, v);
    });
    const q = qs.toString();
    return request(`/api/tasks${q ? `?${q}` : ""}`);
  },
  createTask: (data) =>
    request("/api/tasks", { method: "POST", body: JSON.stringify(data) }),
  updateTask: (id, data) =>
    request(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  changeStage: (customerId, stage, reason) =>
    request(`/api/customers/${customerId}/stage`, {
      method: "POST",
      body: JSON.stringify({ stage, reason }),
    }),
  previewStageChange: (customerId, stage) =>
    request(`/api/customers/${customerId}/stage-preview`, {
      method: "POST",
      body: JSON.stringify({ stage }),
    }),
  getTemplates: () => request("/api/templates"),
  getTemplate: (id) => request(`/api/templates/${id}`),
  addTemplateItem: (templateId, data) =>
    request(`/api/templates/${templateId}/items`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateTemplateItem: (id, data) =>
    request(`/api/template-items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteTemplateItem: (id, confirm) =>
    request(`/api/template-items/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ confirm }),
    }),
};
