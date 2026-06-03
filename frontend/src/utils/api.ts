import axios from 'axios'
import type { Survey, SurveyResponse, Statistics, Answer } from '@/types'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.response.use(
  response => response.data,
  error => {
    const message = error.response?.data?.detail || error.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)

export const surveyApi = {
  list: async () => api.get<Survey[]>('/surveys'),

  get: async (id: string) => api.get<Survey>(`/surveys/${id}`),

  create: async (data: Partial<Survey>) => api.post<Survey>('/surveys', data),

  update: async (id: string, data: Partial<Survey>) => api.put<Survey>(`/surveys/${id}`, data),

  delete: async (id: string) => api.delete(`/surveys/${id}`),

  publish: async (id: string) => api.post<Survey>(`/surveys/${id}/publish`),

  close: async (id: string) => api.post<Survey>(`/surveys/${id}/close`),

  validate: async (id: string) => api.post<{ canFill: boolean; reason?: string }>(`/surveys/${id}/validate`),

  submitResponse: async (id: string, answers: Answer[]) => api.post<SurveyResponse>(`/surveys/${id}/responses`, { answers }),

  getResponses: async (id: string) => api.get<SurveyResponse[]>(`/surveys/${id}/responses`),

  getStatistics: async (id: string) => api.get<Statistics>(`/surveys/${id}/statistics`)
}

export default api
