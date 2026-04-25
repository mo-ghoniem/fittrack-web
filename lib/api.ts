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
  leaderboard: (period = '30d', limit = 20, offset = 0) =>
    apiClient.get(`/stats/leaderboard?period=${period}&limit=${limit}&offset=${offset}`).then((r) => r.data),
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
  getToday: () =>
    apiClient.get('/assigned-workouts/today').then((r) => r.data),
  getPreviousResult: (title: string) =>
    apiClient.get('/assigned-workouts/my/previous-result', { params: { title } }).then((r) => r.data),
  getCoachResults: (date: string) =>
    apiClient.get('/assigned-workouts/coach/results', { params: { date } }).then((r) => r.data),
  getComments: (workoutId: string) =>
    apiClient.get(`/assigned-workouts/${workoutId}/comments`).then((r) => r.data),
  addComment: (workoutId: string, content: string) =>
    apiClient.post(`/assigned-workouts/${workoutId}/comments`, { content }).then((r) => r.data),
  logResult: (
    workoutId: string,
    dto: {
      result?: string;
      notes?: string;
      blockResults?: { blockIndex: number; result: string }[];
    },
  ) =>
    apiClient.patch(`/assigned-workouts/${workoutId}/result`, dto).then((r) => r.data),
  getVideoUploadUrl: (workoutId: string, fileName: string) =>
    apiClient
      .get(`/assigned-workouts/${workoutId}/video-upload-url`, { params: { fileName } })
      .then((r) => r.data as { uploadUrl: string; path: string }),
  saveVideoUrl: (workoutId: string, storagePath: string) =>
    apiClient
      .patch(`/assigned-workouts/${workoutId}/video`, { storagePath })
      .then((r) => r.data),
  getVideoViewUrl: (workoutId: string) =>
    apiClient
      .get(`/assigned-workouts/${workoutId}/video-view-url`)
      .then((r) => r.data as { viewUrl: string }),
};

export const coachingApi = {
  getMyAthletes: () => apiClient.get('/coaching/my-athletes').then((r) => r.data),
  addAthlete: (email: string) =>
    apiClient.post('/coaching/athletes', { email }).then((r) => r.data),
  removeAthlete: (relationshipId: string) =>
    apiClient.delete(`/coaching/${relationshipId}`).then((r) => r.data),
  updateAthleteNotes: (relationshipId: string, notes: string) =>
    apiClient.patch(`/coaching/${relationshipId}/notes`, { notes }).then((r) => r.data),
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
  duplicate: (id: string) => apiClient.post(`/templates/${id}/duplicate`).then((r) => r.data),
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

export const subscriptionsApi = {
  getPlans: () => apiClient.get('/subscriptions/plans').then((r) => r.data),
  createPlan: (dto: Record<string, unknown>) =>
    apiClient.post('/subscriptions/plans', dto).then((r) => r.data),
  getMy: () => apiClient.get('/subscriptions/my').then((r) => r.data),
  subscribe: (dto: { planId: string; paymentMethod: string }) =>
    apiClient.post('/subscriptions/subscribe', dto).then((r) => r.data),
  cancel: () => apiClient.delete('/subscriptions/cancel').then((r) => r.data),
  getHistory: () => apiClient.get('/subscriptions/history').then((r) => r.data),
  getAll: () => apiClient.get('/subscriptions/admin/all').then((r) => r.data),
};

export const messagesApi = {
  getThreads: () => apiClient.get('/messages/threads').then((r) => r.data),
  getConversation: (otherUserId: string, limit = 30) =>
    apiClient.get('/messages/conversation', { params: { otherUserId, limit } }).then((r) => r.data),
  send: (recipientId: string, content: string) =>
    apiClient.post('/messages', { recipientId, content }).then((r) => r.data),
  getUnreadCount: () =>
    apiClient.get('/messages/unread-count').then((r) => r.data as { count: number }),
};

export const progressPhotosApi = {
  list: (params?: { athleteId?: string }) =>
    apiClient.get('/progress-photos', { params }).then((r) => r.data),
  create: (dto: { url: string; caption?: string; takenAt?: string }) =>
    apiClient.post('/progress-photos', dto).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/progress-photos/${id}`),
};

export const trackedBenchmarksApi = {
  list: () => apiClient.get('/tracked-benchmarks').then((r) => r.data),
  create: (dto: Record<string, unknown>) =>
    apiClient.post('/tracked-benchmarks', dto).then((r) => r.data),
  update: (id: string, dto: Record<string, unknown>) =>
    apiClient.patch(`/tracked-benchmarks/${id}`, dto).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete(`/tracked-benchmarks/${id}`).then((r) => r.data),
  getOne: (id: string) =>
    apiClient.get(`/tracked-benchmarks/${id}`).then((r) => r.data),
  progress: (id: string) =>
    apiClient.get(`/tracked-benchmarks/${id}/progress`).then((r) => r.data),
  myProgress: () =>
    apiClient.get('/tracked-benchmarks/my-progress').then((r) => r.data),
  leaderboard: (id: string) =>
    apiClient.get(`/tracked-benchmarks/${id}/leaderboard`).then((r) => r.data),
  athleteProgress: (benchmarkId: string, athleteId: string) =>
    apiClient
      .get(`/tracked-benchmarks/${benchmarkId}/athlete/${athleteId}`)
      .then((r) => r.data),
};

export const nutritionApi = {
  getMeals: (params?: { date?: string; startDate?: string; endDate?: string }) =>
    apiClient.get('/nutrition/meals', { params }).then((r) => r.data),
  getDaily: (date?: string) =>
    apiClient.get('/nutrition/daily', { params: date ? { date } : {} }).then((r) => r.data),
  createMeal: (dto: Record<string, unknown>) =>
    apiClient.post('/nutrition/meals', dto).then((r) => r.data),
  deleteMeal: (id: string) => apiClient.delete(`/nutrition/meals/${id}`),
};
