import axios from 'axios'

const BASE_URL = 'http://localhost:8001'

export const api = axios.create({
  baseURL: BASE_URL,
})

// Automatically attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const WS_URL = 'ws://localhost:8001'
