import axios from 'axios'
import { useAuth } from '@clerk/clerk-react'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 10000,
})

export function useApi() {
  const { getToken } = useAuth()
  const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? '/api',
    timeout: 10000,
  })
  client.interceptors.request.use(async (config) => {
    const token = await getToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })
  return client
}
