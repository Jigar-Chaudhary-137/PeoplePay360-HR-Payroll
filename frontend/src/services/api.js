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
  switchDemoRole: (targetRole) => api.post('/auth/switch-demo-role', { targetRole }),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  verifyResetToken: (params) => api.get('/auth/verify-reset-token', { params })
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
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`)
};

export const attendanceAPI = {
  getAll: (params) => api.get('/attendance', { params }),
  getById: (id) => api.get(`/attendance/${id}`),
  getToday: () => api.get('/attendance/today'),
  create: (data) => api.post('/attendance', data),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  checkIn: (data) => api.post('/attendance/check-in', data),
  checkOut: (data) => api.post('/attendance/check-out', data),
  manualCorrection: (id, data) => api.put(`/attendance/${id}/correction`, data)
};

export const timeOffAPI = {
  getTypes: () => api.get('/time-off/types'),
  getTypeById: (id) => api.get(`/time-off/types/${id}`),
  createType: (data) => api.post('/time-off/types', data),
  updateType: (id, data) => api.put(`/time-off/types/${id}`, data),
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
  downloadPDF: async (id, filename) => {
    const token = localStorage.getItem('token');
    const res = await axios.get(`/api/payslips/${id}/pdf`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined
      },
      responseType: 'blob'
    });
    const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = blobUrl;
    a.setAttribute('download', filename || `payslip-${id}.pdf`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  },
  sendEmail: (id) => api.post(`/payslips/${id}/send`),
  bulkSendEmail: (payrunId) => api.post('/payslips/bulk-send', { payrun_id: payrunId })
};

export const dashboardAPI = {
  getMetrics: (params) => api.get('/dashboard', { params })
};

export const departmentAPI = {
  getAll: () => api.get('/departments'),
  getJobPositions: () => api.get('/departments/job-positions'),
  create: (data) => api.post('/departments', data)
};

export const workLocationAPI = {
  getAll: () => api.get('/work-locations'),
  getById: (id) => api.get(`/work-locations/${id}`),
  create: (data) => api.post('/work-locations', data),
  update: (id, data) => api.put(`/work-locations/${id}`, data),
  delete: (id) => api.delete(`/work-locations/${id}`)
};

export const auditLogAPI = {
  getAll: (params) => api.get('/audit-logs', { params })
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
