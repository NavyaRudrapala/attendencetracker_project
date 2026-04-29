import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};
export const studentsAPI  = { getAll: () => api.get('/students') };
export const attendanceAPI = { mark: (d) => api.post('/attendance/mark', d) };
export const marksAPI     = { add: (d) => api.post('/marks', d) };
export default api;
