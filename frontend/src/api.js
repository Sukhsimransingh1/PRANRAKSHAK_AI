import axios from 'axios'

const BASE_URL = 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
})

api.interceptors.response.use(
  res => res.data,
  err => {
    const message =
      err.response?.data?.detail ||
      err.response?.data?.error ||
      err.message ||
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

// ── Patients ──────────────────────────────────────────────────────────────────

export const getPatients = () => api.get('/patients')

export const getPatient = (id) => api.get(`/patients/${id}`)

export const createPatient = (formData) =>
  api.post('/patients', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  })

export const rerunPrediction = (id, formData) =>
  api.post(`/patients/${id}/predict`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  })

// ── Alerts ───────────────────────────────────────────────────────────────────

export const getAlerts = () => api.get('/alerts')

// ── Copilot ──────────────────────────────────────────────────────────────────

export const askCopilot = (formData) =>
  api.post('/copilot', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 45000,
  })

// ── Health ───────────────────────────────────────────────────────────────────

export const getHealth = () => api.get('/health')