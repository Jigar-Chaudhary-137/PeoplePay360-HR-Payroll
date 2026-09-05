import { INITIAL_ATTENDANCE_RECORDS } from '../data/attendanceMockData';
import { attendanceAPI } from './api';

// In-memory local state for mock persistence across interactions
let localAttendanceStore = [...INITIAL_ATTENDANCE_RECORDS];

export const attendanceService = {
  /**
   * Fetch attendance list with search, date, employee, and status filters
   */
  async getAttendanceList(filters = {}) {
    try {
      // If backend API is available, try it first
      const res = await attendanceAPI.getAll(filters);
      if (res && res.data && res.data.length > 0) {
        return { success: true, data: res.data };
      }
    } catch (e) {
      // Fallback gracefully to mock data
    }

    // Mock filtering logic
    let result = [...localAttendanceStore];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.employee_name.toLowerCase().includes(q) ||
          r.employee_code.toLowerCase().includes(q) ||
          (r.department && r.department.toLowerCase().includes(q))
      );
    }

    if (filters.date) {
      result = result.filter((r) => r.date === filters.date);
    }

    if (filters.employee_id) {
      result = result.filter((r) => String(r.employee_id) === String(filters.employee_id));
    }

    if (filters.status && filters.status !== 'All') {
      result = result.filter(
        (r) => r.status.toLowerCase() === filters.status.toLowerCase()
      );
    }

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 150));
    return { success: true, data: result, total: result.length };
  },

  /**
   * Fetch a single attendance record by ID
   */
  async getAttendanceById(id) {
    try {
      const res = await attendanceAPI.getToday(); // or endpoint if available
      if (res && res.data && String(res.data.id) === String(id)) {
        return { success: true, data: res.data };
      }
    } catch (e) {
      // ignore fallback
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
    const record = localAttendanceStore.find((r) => String(r.id) === String(id));
    if (!record) {
      return { success: false, error: 'Attendance record not found' };
    }
    return { success: true, data: record };
  },

  /**
   * Create a new attendance manual entry (HR authorized)
   */
  async createAttendanceRecord(recordData) {
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Calculate worked hours if check-in and check-out present
    let worked_hours = 0;
    if (recordData.check_in && recordData.check_out) {
      const start = new Date(`${recordData.date}T${recordData.check_in}`);
      const end = new Date(`${recordData.date}T${recordData.check_out}`);
      if (!isNaN(start) && !isNaN(end) && end > start) {
        worked_hours = Number(((end - start) / (1000 * 60 * 60)).toFixed(2));
      }
    }

    const newRecord = {
      id: Date.now(),
      employee_id: recordData.employee_id || 1,
      employee_name: recordData.employee_name || 'Selected Employee',
      employee_code: recordData.employee_code || 'EMP999',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      department: recordData.department || 'General',
      manager_name: recordData.manager_name || 'Manager',
      date: recordData.date || new Date().toISOString().split('T')[0],
      check_in: recordData.check_in ? `${recordData.date} ${recordData.check_in}` : null,
      check_out: recordData.check_out ? `${recordData.date} ${recordData.check_out}` : null,
      worked_hours: recordData.worked_hours !== undefined ? Number(recordData.worked_hours) : worked_hours,
      overtime_hours: Number(recordData.overtime_hours || 0),
      status: recordData.status || 'Present',
      notes: recordData.notes || 'Manually created attendance entry.'
    };

    localAttendanceStore.unshift(newRecord);
    return { success: true, data: newRecord };
  },

  /**
   * Update / correct an existing attendance record
   */
  async updateAttendanceRecord(id, updateData) {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const index = localAttendanceStore.findIndex((r) => String(r.id) === String(id));
    if (index === -1) {
      return { success: false, error: 'Record to update not found' };
    }

    // Recalculate hours if times changed
    let worked_hours = updateData.worked_hours;
    if (worked_hours === undefined && updateData.check_in && updateData.check_out) {
      const date = updateData.date || localAttendanceStore[index].date;
      const start = new Date(`${date}T${updateData.check_in}`);
      const end = new Date(`${date}T${updateData.check_out}`);
      if (!isNaN(start) && !isNaN(end) && end > start) {
        worked_hours = Number(((end - start) / (1000 * 60 * 60)).toFixed(2));
      }
    }

    localAttendanceStore[index] = {
      ...localAttendanceStore[index],
      ...updateData,
      worked_hours: worked_hours !== undefined ? Number(worked_hours) : localAttendanceStore[index].worked_hours,
      notes: updateData.correction_reason
        ? `Corrected: ${updateData.correction_reason}`
        : localAttendanceStore[index].notes
    };

    return { success: true, data: localAttendanceStore[index] };
  },

  /**
   * Quick Check-In action
   */
  async checkIn(user) {
    try {
      await attendanceAPI.checkIn({});
    } catch (e) {
      // Mock fallback
    }

    await new Promise((resolve) => setTimeout(resolve, 150));
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    const dateStr = now.toISOString().split('T')[0];

    const record = {
      id: Date.now(),
      employee_id: user?.employee_id || user?.id || 1,
      employee_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : 'Current Employee',
      employee_code: user?.employee_code || 'EMP001',
      date: dateStr,
      check_in: `${dateStr} ${timeStr}`,
      check_out: null,
      worked_hours: 0,
      overtime_hours: 0,
      status: 'Present',
      notes: 'Checked in via Quick Attendance Widget.'
    };

    // Update in-memory today state
    const existingIndex = localAttendanceStore.findIndex(
      (r) => String(r.employee_id) === String(record.employee_id) && r.date === dateStr
    );
    if (existingIndex >= 0) {
      localAttendanceStore[existingIndex] = { ...localAttendanceStore[existingIndex], ...record };
    } else {
      localAttendanceStore.unshift(record);
    }

    return { success: true, data: record };
  },

  /**
   * Quick Check-Out action
   */
  async checkOut(user) {
    try {
      await attendanceAPI.checkOut({});
    } catch (e) {
      // Mock fallback
    }

    await new Promise((resolve) => setTimeout(resolve, 150));
    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 5);
    const dateStr = now.toISOString().split('T')[0];
    const empId = user?.employee_id || user?.id || 1;

    const existingIndex = localAttendanceStore.findIndex(
      (r) => String(r.employee_id) === String(empId) && r.date === dateStr
    );

    if (existingIndex >= 0) {
      const rec = localAttendanceStore[existingIndex];
      const checkInTime = rec.check_in ? new Date(rec.check_in) : new Date(now.getTime() - 8 * 3600 * 1000);
      const worked = Number(((now - checkInTime) / (1000 * 60 * 60)).toFixed(2));

      localAttendanceStore[existingIndex] = {
        ...rec,
        check_out: `${dateStr} ${timeStr}`,
        worked_hours: Math.max(0.5, worked),
        status: 'Present'
      };
      return { success: true, data: localAttendanceStore[existingIndex] };
    }

    const fallbackRecord = {
      id: Date.now(),
      employee_id: empId,
      employee_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Current Employee',
      employee_code: user?.employee_code || 'EMP001',
      date: dateStr,
      check_in: `${dateStr} 09:00`,
      check_out: `${dateStr} ${timeStr}`,
      worked_hours: 8.5,
      overtime_hours: 0,
      status: 'Present',
      notes: 'Completed session.'
    };
    localAttendanceStore.unshift(fallbackRecord);
    return { success: true, data: fallbackRecord };
  }
};

export default attendanceService;
