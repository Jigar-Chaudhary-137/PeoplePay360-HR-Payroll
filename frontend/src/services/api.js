import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for centralized error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  switchDemoRole: (targetRole) => api.post('/auth/switch-demo-role', { targetRole })
};

export const employeeAPI = {
  getAll: (params) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`)
};

export const contractAPI = {
  getAll: (params) => api.get('/contracts', { params }),
  getById: (id) => api.get(`/contracts/${id}`),
  create: (data) => api.post('/contracts', data),
  update: (id, data) => api.put(`/contracts/${id}`, data)
};

export const scheduleAPI = {
  getAll: () => api.get('/schedules'),
  getById: (id) => api.get(`/schedules/${id}`),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.put(`/schedules/${id}`, data)
};

export const attendanceAPI = {
  getAll: (params) => api.get('/attendance', { params }),
  getToday: () => api.get('/attendance/today'),
  checkIn: (data) => api.post('/attendance/check-in', data),
  checkOut: (data) => api.post('/attendance/check-out', data),
  manualCorrection: (id, data) => api.put(`/attendance/${id}/correction`, data)
};

export const timeOffAPI = {
  getTypes: () => api.get('/time-off/types'),
  getAllocations: (params) => api.get('/time-off/allocations', { params }),
  setAllocation: (data) => api.post('/time-off/allocations', data),
  getRequests: (params) => api.get('/time-off/requests', { params }),
  createRequest: (data) => api.post('/time-off/requests', data),
  approveRequest: (id, data) => api.patch(`/time-off/requests/${id}/approve`, data),
  rejectRequest: (id, data) => api.patch(`/time-off/requests/${id}/reject`, data)
};

export const salaryAPI = {
  getStructures: () => api.get('/salary/structures'),
  getStructureById: (id) => api.get(`/salary/structures/${id}`),
  createStructure: (data) => api.post('/salary/structures', data),
  getRules: () => api.get('/salary/rules'),
  createRule: (data) => api.post('/salary/rules', data),
  updateRule: (id, data) => api.put(`/salary/rules/${id}`, data)
};

export const payrunAPI = {
  getEligibleEmployees: (params) => api.get('/payruns/eligible-employees', { params }),
  getAll: (params) => api.get('/payruns', { params }),
  getById: (id) => api.get(`/payruns/${id}`),
  create: (data) => api.post('/payruns', data),
  compute: (id) => api.post(`/payruns/${id}/compute`),
  validate: (id) => api.post(`/payruns/${id}/validate`),
  markPaid: (id) => api.post(`/payruns/${id}/mark-paid`)
};

export const payslipAPI = {
  getAll: (params) => api.get('/payslips', { params }),
  getById: (id) => api.get(`/payslips/${id}`),
  getPDFUrl: (id) => `/api/payslips/${id}/pdf`,
  sendEmail: (id) => api.post(`/payslips/${id}/send`),
  bulkSendEmail: (payrunId) => api.post('/payslips/bulk-send', { payrun_id: payrunId })
};

export const dashboardAPI = {
  getMetrics: (params) => api.get('/dashboard', { params })
};

export const aiAPI = {
  ask: (question) => api.post('/ai/ask', { question })
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all')
};

export const userAPI = {
  getAll: () => api.get('/users'),
  getDepartments: () => api.get('/users/departments'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data)
};

export default api;
