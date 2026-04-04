import axios from 'axios';
import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach Supabase access token to every request
apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return config;
});

// ── API helpers ──────────────────────────────────────────

export const usersApi = {
  getMe: () => apiClient.get('/users/me').then((r) => r.data),
  updateProfile: (dto: Record<string, unknown>) =>
    apiClient.patch('/users/me', dto).then((r) => r.data),
};

export const exercisesApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/exercises', { params }).then((r) => r.data),
  getById: (id: string) => apiClient.get(`/exercises/${id}`).then((r) => r.data),
  create: (dto: Record<string, unknown>) =>
    apiClient.post('/exercises', dto).then((r) => r.data),
  update: (id: string, dto: Record<string, unknown>) =>
    apiClient.patch(`/exercises/${id}`, dto).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/exercises/${id}`),
  seed: () => apiClient.post('/exercises/seed').then((r) => r.data),
};

export const workoutsApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get('/workouts', { params }).then((r) => r.data),
  feed: (params?: Record<string, unknown>) =>
    apiClient.get('/workouts/feed', { params }).then((r) => r.data),
  getById: (id: string) => apiClient.get(`/workouts/${id}`).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/workouts/${id}`),
};

export const statsApi = {
  get: (period: '7d' | '30d' | '3m' | '1y' = '30d') =>
    apiClient.get(`/stats?period=${period}`).then((r) => r.data),
  leaderboard: (period = '30d') =>
    apiClient.get(`/stats/leaderboard?period=${period}`).then((r) => r.data),
};

export const benchmarkWodsApi = {
  list: () => apiClient.get('/benchmark-wods').then((r) => r.data),
  seed: () => apiClient.post('/benchmark-wods/seed').then((r) => r.data),
  logResult: (id: string, dto: Record<string, unknown>) =>
    apiClient.post(`/benchmark-wods/${id}/results`, dto).then((r) => r.data),
};

export const assignedWorkoutsApi = {
  getMyMonth: (month: string) =>
    apiClient.get('/assigned-workouts/my', { params: { month } }).then((r) => r.data),
  getMyDay: (date: string) =>
    apiClient.get('/assigned-workouts/my', { params: { date } }).then((r) => r.data),
};

export const coachingApi = {
  getMyAthletes: () => apiClient.get('/coaching/my-athletes').then((r) => r.data),
  addAthlete: (email: string) =>
    apiClient.post('/coaching/athletes', { email }).then((r) => r.data),
  removeAthlete: (relationshipId: string) =>
    apiClient.delete(`/coaching/${relationshipId}`).then((r) => r.data),
  getPending: () => apiClient.get('/coaching/pending').then((r) => r.data),
  acceptRequest: (requestId: string) =>
    apiClient.post(`/coaching/accept/${requestId}`).then((r) => r.data),
  rejectRequest: (requestId: string) =>
    apiClient.post(`/coaching/reject/${requestId}`).then((r) => r.data),
  // Invitation links
  generateInvitation: () =>
    apiClient.post('/coaching/invitations/generate').then((r) => r.data),
  getActiveInvitation: () =>
    apiClient.get('/coaching/invitations/current').then((r) => r.data),
  joinViaToken: (token: string) =>
    apiClient.post(`/coaching/join/${token}`).then((r) => r.data),
};

export const templatesApi = {
  list: () => apiClient.get('/templates').then((r) => r.data),
  create: (dto: Record<string, unknown>) =>
    apiClient.post('/templates', dto).then((r) => r.data),
  getById: (id: string) => apiClient.get(`/templates/${id}`).then((r) => r.data),
  update: (id: string, dto: Record<string, unknown>) =>
    apiClient.patch(`/templates/${id}`, dto).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/templates/${id}`).then((r) => r.data),
  // Workout days inside template
  addWorkout: (templateId: string, dto: Record<string, unknown>) =>
    apiClient.post(`/templates/${templateId}/workouts`, dto).then((r) => r.data),
  updateWorkout: (templateId: string, workoutId: string, dto: Record<string, unknown>) =>
    apiClient.patch(`/templates/${templateId}/workouts/${workoutId}`, dto).then((r) => r.data),
  removeWorkout: (templateId: string, workoutId: string) =>
    apiClient.delete(`/templates/${templateId}/workouts/${workoutId}`).then((r) => r.data),
  // Assign template to athletes
  assign: (templateId: string, dto: { athleteIds: string[]; startDate: string }) =>
    apiClient.post(`/templates/${templateId}/assign`, dto).then((r) => r.data),
};

export const dailyWodApi = {
  getToday: (date?: string) =>
    apiClient.get('/daily-wod/today', { params: date ? { date } : {} }).then((r) => r.data),
  getHistory: () => apiClient.get('/daily-wod/history').then((r) => r.data),
  create: (dto: Record<string, unknown>) =>
    apiClient.post('/daily-wod', dto).then((r) => r.data),
  getResults: (date: string) =>
    apiClient.get('/daily-wod/results', { params: { date } }).then((r) => r.data),
};

export const notificationsApi = {
  list: (params?: { limit?: number; page?: number; unreadOnly?: boolean }) =>
    apiClient.get('/notifications', { params }).then((r) => r.data),
  unreadCount: () =>
    apiClient.get('/notifications/unread-count').then((r) => r.data as { count: number }),
  markRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/read`),
  markAllRead: () =>
    apiClient.patch('/notifications/read-all'),
};
