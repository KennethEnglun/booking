import axios from 'axios';
import { API_BASE_URL } from '../config.js';

// 創建 axios 實例
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器
api.interceptors.request.use(
  (config) => {
    // 可以在此添加認證 token
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 響應攔截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// 預約相關 API
export const bookingAPI = {
  // 創建預約
  create: (bookingData) => api.post('/bookings', bookingData),
  
  // 獲取所有預約
  getAll: () => api.get('/bookings'),
  
  // 獲取特定預約
  getById: (id) => api.get(`/bookings/${id}`),
  
  // 更新預約
  update: (id, bookingData) => api.put(`/bookings/${id}`, bookingData),
  
  // 刪除預約
  delete: (id) => api.delete(`/bookings/${id}`),
  
  // 檢查時間衝突
  checkConflict: (venue, date, startTime, endTime) => 
    api.post('/bookings/check-conflict', { venue, date, startTime, endTime }),
};

// 用戶相關 API
export const userAPI = {
  // 獲取當前用戶
  getCurrentUser: () => api.get('/auth/me'),
  
  // 登入
  login: (credentials) => api.post('/auth/login', credentials),
  
  // 登出
  logout: () => api.post('/auth/logout'),
};

export default api; 