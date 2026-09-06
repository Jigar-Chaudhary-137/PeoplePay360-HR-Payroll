import { attendanceAPI } from './api';

function formatAttendanceRecord(r) {
  if (!r) return r;
  const empName = r.first_name && r.last_name 
    ? `${r.first_name} ${r.last_name}`.trim() 
    : (r.employee_name || 'Employee');
  return {
    ...r,
    employee_name: empName,
    employee_code: r.employee_code || r.emp_code || '',
    department: r.department_name || r.department || 'General',
    avatar: r.avatar_url || r.avatar || null,
    manager_name: r.manager_name || 'Manager'
  };
}

export const attendanceService = {
  /**
   * Fetch attendance list with search, date, employee, and status filters directly from DB
   */
  async getAttendanceList(filters = {}) {
    const cleanParams = {};
    if (filters.search && typeof filters.search === 'string' && filters.search.trim()) {
      cleanParams.search = filters.search.trim();
    }
    if (filters.date && typeof filters.date === 'string' && filters.date.trim()) {
      cleanParams.date = filters.date.trim();
    }
    if (filters.employee_id && String(filters.employee_id).trim() && filters.employee_id !== 'All' && filters.employee_id !== 'all') {
      cleanParams.employee_id = String(filters.employee_id).trim();
    }
    if (filters.status && filters.status !== 'All' && filters.status !== 'all' && typeof filters.status === 'string' && filters.status.trim()) {
      cleanParams.status = filters.status.trim();
    }

    const res = await attendanceAPI.getAll(cleanParams);
    const list = Array.isArray(res?.data) 
      ? res.data 
      : (Array.isArray(res) ? res : (Array.isArray(res?.data?.data) ? res.data.data : []));
    const formatted = list.map(formatAttendanceRecord);
    return {
      success: true,
      data: formatted,
      total: formatted.length
    };
  },

  /**
   * Fetch a single attendance record by ID directly from DB
   */
  async getAttendanceById(id) {
    const res = await attendanceAPI.getById(id);
    const data = res.data || res;
    if (!data) {
      return { success: false, error: 'Attendance record not found' };
    }
    return { success: true, data: formatAttendanceRecord(data) };
  },

  /**
   * Create a new attendance manual entry (HR authorized)
   */
  async createAttendanceRecord(recordData) {
    const payload = {
      employee_id: recordData.employee_id,
      date: recordData.date || new Date().toISOString().split('T')[0],
      check_in: recordData.check_in || null,
      check_out: recordData.check_out || null,
      break_hours: recordData.break_hours !== undefined ? Number(recordData.break_hours) : 1.0,
      status: recordData.status || 'Present',
      notes: recordData.notes || null
    };
    const res = await attendanceAPI.create(payload);
    return { success: true, data: formatAttendanceRecord(res.data || res) };
  },

  /**
   * Update / correct an existing attendance record
   */
  async updateAttendanceRecord(id, updateData) {
    const payload = {
      check_in: updateData.check_in,
      check_out: updateData.check_out,
      break_hours: updateData.break_hours,
      status: updateData.status,
      notes: updateData.correction_reason || updateData.notes
    };
    const res = await attendanceAPI.update(id, payload);
    return { success: true, data: formatAttendanceRecord(res.data || res) };
  },

  /**
   * Quick Check-In action with real GPS coordinates
   */
  async checkIn(user, locationData = {}) {
    const payload = {
      employee_id: user?.employee_id || user?.id,
      ...locationData
    };
    const res = await attendanceAPI.checkIn(payload);
    return { success: true, data: formatAttendanceRecord(res.data || res) };
  },

  /**
   * Quick Check-Out action
   */
  async checkOut(user) {
    const payload = {
      employee_id: user?.employee_id || user?.id
    };
    const res = await attendanceAPI.checkOut(payload);
    return { success: true, data: formatAttendanceRecord(res.data || res) };
  }
};

export default attendanceService;
