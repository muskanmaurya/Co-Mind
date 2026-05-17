const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

function getAuthHeader(token){
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, { method='GET', body, token } = {}){
  const headers = { 'Content-Type': 'application/json', ...getAuthHeader(token) }
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch(e) { data = text }
  if (!res.ok) throw { status: res.status, body: data }
  return data
}

export const auth = {
  signup: (payload) => request('/auth/signup', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
}

export const notes = {
  list: (token, qs='') => request(`/notes${qs ? '?'+qs : ''}`, { token }),
  create: (token, body) => request('/notes', { method: 'POST', body, token }),
  get: (id, token) => request(`/notes/${id}`, { token }),
  update: (id, token, body) => request(`/notes/${id}`, { method: 'PATCH', body, token }),
  remove: (id, token) => request(`/notes/${id}`, { method: 'DELETE', token }),
  search: (q, token) => request(`/notes/search?q=${encodeURIComponent(q)}`, { token }),
  generateSummary: (id, token) => request(`/notes/${id}/generate-summary`, { method: 'POST', token }),
}

export const shared = {
  get: (shareId) => request(`/shared/${shareId}`),
  toggleVisibility: (id, token, body) => request(`/shared/${id}/visibility`, { method: 'PATCH', token, body }),
}

export const dashboard = {
  insights: (token) => request('/dashboard/insights', { token }),
}

export default { auth, notes, shared, dashboard }
