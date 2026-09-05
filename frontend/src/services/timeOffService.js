import { INITIAL_TIME_OFF_REQUESTS, INITIAL_TIME_OFF_TYPES, MOCK_LEAVE_TYPES, MOCK_ALLOCATIONS, MOCK_EMPLOYEES } from '../data/timeOffMockData';
import { timeOffAPI } from './api';

// In-memory local state store for persistent mock interactions
let localRequestsStore = [...INITIAL_TIME_OFF_REQUESTS];
let localTimeOffTypesStore = [...INITIAL_TIME_OFF_TYPES];

export const timeOffService = {
  /**
   * Get Time Off Requests list with filtering
   * Filters supported:
   * - search (matches employee name, code, department, reason)
   * - status ('All', 'To Approve', 'Approved', 'Refused', 'Cancelled')
   * - leave_type (Leave type name)
   * - startDate & endDate (Date range filter)
   * - myTeamOnly (Boolean to show only team members)
   * - employee_id (Optional filter by employee)
   */
  async getRequests(filters = {}) {
    try {
      // If backend API returns data, use it
      const res = await timeOffAPI.getRequests(filters);
      if (res && res.data && res.data.length > 0) {
        return { success: true, data: res.data };
      }
    } catch (e) {
      // Fallback gracefully to mock data
    }

    let result = [...localRequestsStore];

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (r) =>
          (r.employee_name && r.employee_name.toLowerCase().includes(q)) ||
          (r.employee_code && r.employee_code.toLowerCase().includes(q)) ||
          (r.department && r.department.toLowerCase().includes(q)) ||
          (r.leave_type && r.leave_type.toLowerCase().includes(q)) ||
          (r.reason && r.reason.toLowerCase().includes(q))
      );
    }

    if (filters.status && filters.status !== 'All') {
      result = result.filter(
        (r) => r.status.toLowerCase() === filters.status.toLowerCase()
      );
    }

    if (filters.leave_type && filters.leave_type !== 'All') {
      result = result.filter(
        (r) => r.leave_type.toLowerCase() === filters.leave_type.toLowerCase()
      );
    }

    if (filters.myTeamOnly) {
      result = result.filter((r) => r.is_team_member === true);
    }

    if (filters.employee_id) {
      result = result.filter(
        (r) => String(r.employee_id) === String(filters.employee_id)
      );
    }

    if (filters.startDate) {
      result = result.filter((r) => r.start_date >= filters.startDate);
    }

    if (filters.endDate) {
      result = result.filter((r) => r.end_date <= filters.endDate);
    }

    // Sort newest first
    result.sort((a, b) => new Date(b.created_at || b.start_date) - new Date(a.created_at || a.start_date));

    // Simulated short delay
    await new Promise((resolve) => setTimeout(resolve, 150));
    return { success: true, data: result, total: result.length };
  },

  /**
   * Get single Time Off Request by ID
   */
  async getRequestById(id) {
    try {
      const res = await timeOffAPI.getRequests({ id });
      if (res && res.data) {
        const found = Array.isArray(res.data) ? res.data.find(r => String(r.id) === String(id)) : res.data;
        if (found) return { success: true, data: found };
      }
    } catch (e) {
      // Fallback
    }

    const request = localRequestsStore.find((r) => String(r.id) === String(id));
    await new Promise((resolve) => setTimeout(resolve, 120));

    if (!request) {
      return { success: false, error: 'Time off request not found' };
    }

    return { success: true, data: request };
  },

  /**
   * Create a new Time Off Request (Mock / API)
   */
  async createRequest(payload) {
    try {
      const res = await timeOffAPI.createRequest(payload);
      if (res && res.data) {
        return { success: true, data: res.data, message: 'Time off request submitted successfully.' };
      }
    } catch (e) {
      // Fallback to mock create
    }

    const employee = MOCK_EMPLOYEES.find((e) => String(e.id) === String(payload.employee_id)) || {
      id: payload.employee_id || 1,
      name: payload.employee_name || 'Aarav Mehta',
      code: 'EMP001',
      department: 'Finance',
      manager: 'Sara Khan'
    };

    // Calculate duration in days
    const start = new Date(payload.start_date);
    const end = new Date(payload.end_date);
    const diffTime = Math.abs(end - start);
    const calculatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const duration = payload.duration || calculatedDays || 1;

    const newRecord = {
      id: Date.now(),
      employee_id: Number(payload.employee_id) || 1,
      employee_name: payload.employee_name || employee.name,
      employee_code: payload.employee_code || employee.code,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      department: payload.department || employee.department,
      manager_name: payload.manager_name || employee.manager,
      is_team_member: true,
      leave_type: payload.leave_type || 'Paid Time Off',
      start_date: payload.start_date,
      end_date: payload.end_date,
      duration: duration,
      status: 'To Approve',
      approver_name: employee.manager || 'Sara Khan',
      approver_id: 2,
      allocation_used: payload.leave_type === 'Unpaid Leave' ? 'None (Unpaid)' : `${payload.leave_type} 2026`,
      reason: payload.reason || '',
      refusal_reason: null,
      created_at: new Date().toISOString()
    };

    localRequestsStore = [newRecord, ...localRequestsStore];
    await new Promise((resolve) => setTimeout(resolve, 200));

    return {
      success: true,
      data: newRecord,
      message: 'Time off request submitted successfully and is pending approval.'
    };
  },

  /**
   * Approve a request (HR Manager / Admin action)
   */
  async approveRequest(id, notes = '') {
    try {
      const res = await timeOffAPI.approveRequest(id, { notes });
      if (res) {
        return { success: true, message: 'Time off request approved successfully.' };
      }
    } catch (e) {
      // Fallback to local store update
    }

    const index = localRequestsStore.findIndex((r) => String(r.id) === String(id));
    if (index === -1) {
      return { success: false, error: 'Request not found' };
    }

    localRequestsStore[index] = {
      ...localRequestsStore[index],
      status: 'Approved',
      approver_name: 'Priya Patel (HR Manager)',
      approved_at: new Date().toISOString()
    };

    await new Promise((resolve) => setTimeout(resolve, 150));
    return {
      success: true,
      data: localRequestsStore[index],
      message: `Request for ${localRequestsStore[index].employee_name} has been approved.`
    };
  },

  /**
   * Refuse / Reject a request (Requires refusal reason)
   */
  async refuseRequest(id, refusalReason = '') {
    try {
      const res = await timeOffAPI.rejectRequest(id, { notes: refusalReason });
      if (res) {
        return { success: true, message: 'Time off request refused.' };
      }
    } catch (e) {
      // Fallback to local store update
    }

    const index = localRequestsStore.findIndex((r) => String(r.id) === String(id));
    if (index === -1) {
      return { success: false, error: 'Request not found' };
    }

    localRequestsStore[index] = {
      ...localRequestsStore[index],
      status: 'Refused',
      refusal_reason: refusalReason || 'Refused by HR Manager',
      approver_name: 'Priya Patel (HR Manager)',
      refused_at: new Date().toISOString()
    };

    await new Promise((resolve) => setTimeout(resolve, 150));
    return {
      success: true,
      data: localRequestsStore[index],
      message: `Request for ${localRequestsStore[index].employee_name} has been refused.`
    };
  },

  /**
   * Fetch Leave Types
   */
  getLeaveTypes() {
    return MOCK_LEAVE_TYPES;
  },

  /**
   * Fetch Mock Allocation for Employee and Leave Type
   */
  getAllocationBalance(employeeId, leaveTypeName) {
    const empAllocations = MOCK_ALLOCATIONS[employeeId] || MOCK_ALLOCATIONS[1];
    if (leaveTypeName === 'Unpaid Leave') {
      return {
        allocated: 0,
        used: 0,
        remaining: 0,
        allocation_name: 'None (Unpaid)',
        is_paid: false
      };
    }
    return (
      empAllocations[leaveTypeName] || {
        allocated: 20,
        used: 4,
        remaining: 16,
        allocation_name: `${leaveTypeName} 2026`,
        is_paid: true
      }
    );
  },

  /**
   * Fetch Employees for selection in dropdowns
   */
  getEmployees() {
    return MOCK_EMPLOYEES;
  },

  /**
   * Fetch Time Off Types with search & status filters
   */
  async getTimeOffTypes(filters = {}) {
    let result = [...localTimeOffTypesStore];

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (t) =>
          (t.name && t.name.toLowerCase().includes(q)) ||
          (t.code && t.code.toLowerCase().includes(q)) ||
          (t.unit && t.unit.toLowerCase().includes(q)) ||
          (t.approval && t.approval.toLowerCase().includes(q)) ||
          (t.payroll_work_entry && t.payroll_work_entry.toLowerCase().includes(q)) ||
          (t.requires_allocation && t.requires_allocation.toLowerCase().includes(q))
      );
    }

    if (filters.status && filters.status !== 'All') {
      result = result.filter(
        (t) => t.status.toLowerCase() === filters.status.toLowerCase()
      );
    }

    // Simulated short delay
    await new Promise((resolve) => setTimeout(resolve, 150));
    return { success: true, data: result, total: result.length };
  },

  /**
   * Fetch single Time Off Type by ID
   */
  async getTimeOffTypeById(id) {
    const item = localTimeOffTypesStore.find((t) => String(t.id) === String(id));
    await new Promise((resolve) => setTimeout(resolve, 120));

    if (!item) {
      return { success: false, error: 'Time off type not found' };
    }

    return { success: true, data: item };
  },

  /**
   * Create a new Time Off Type
   */
  async createTimeOffType(payload) {
    const colorMap = {
      Blue: '#3B82F6',
      Emerald: '#10B981',
      Violet: '#8B5CF6',
      Amber: '#F59E0B',
      Rose: '#F43F5E',
      Slate: '#64748B'
    };

    const is_active = payload.is_active !== undefined ? Boolean(payload.is_active) : (payload.status === 'Active');
    const display_color = payload.display_color || 'Blue';

    const newItem = {
      id: Date.now(),
      name: payload.name || 'New Time Off Type',
      code: payload.code || (payload.name ? payload.name.slice(0, 4).toUpperCase() : 'TYPE'),
      unit: payload.unit || 'Days',
      requires_allocation: payload.requires_allocation || (payload.requires_allocation_bool ? 'Required' : 'No'),
      requires_allocation_display: (payload.requires_allocation === 'Required' || payload.requires_allocation === 'Yes' || payload.requires_allocation_bool) ? 'Yes' : 'No',
      approval: payload.approval || 'Manager',
      status: is_active ? 'Active' : 'Inactive',
      is_active: is_active,
      active_display: is_active ? 'True' : 'False',
      payroll_work_entry: payload.payroll_work_entry || 'Leave Work Entry',
      display_color: display_color,
      color_hex: colorMap[display_color] || '#3B82F6',
      notes: payload.notes || ''
    };

    localTimeOffTypesStore = [...localTimeOffTypesStore, newItem];
    await new Promise((resolve) => setTimeout(resolve, 200));

    return {
      success: true,
      data: newItem,
      message: `Time off type "${newItem.name}" created successfully.`
    };
  },

  /**
   * Update an existing Time Off Type
   */
  async updateTimeOffType(id, payload) {
    const index = localTimeOffTypesStore.findIndex((t) => String(t.id) === String(id));
    if (index === -1) {
      return { success: false, error: 'Time off type not found' };
    }

    const colorMap = {
      Blue: '#3B82F6',
      Emerald: '#10B981',
      Violet: '#8B5CF6',
      Amber: '#F59E0B',
      Rose: '#F43F5E',
      Slate: '#64748B'
    };

    const current = localTimeOffTypesStore[index];
    const is_active = payload.is_active !== undefined
      ? Boolean(payload.is_active)
      : (payload.status !== undefined ? payload.status === 'Active' : current.is_active);

    const display_color = payload.display_color || current.display_color;
    const reqAlloc = payload.requires_allocation !== undefined ? payload.requires_allocation : current.requires_allocation;

    const updatedItem = {
      ...current,
      name: payload.name !== undefined ? payload.name : current.name,
      code: payload.code !== undefined ? payload.code : current.code,
      unit: payload.unit !== undefined ? payload.unit : current.unit,
      requires_allocation: reqAlloc,
      requires_allocation_display: (reqAlloc === 'Required' || reqAlloc === 'Yes') ? 'Yes' : 'No',
      approval: payload.approval !== undefined ? payload.approval : current.approval,
      status: is_active ? 'Active' : 'Inactive',
      is_active: is_active,
      active_display: is_active ? 'True' : 'False',
      payroll_work_entry: payload.payroll_work_entry !== undefined ? payload.payroll_work_entry : current.payroll_work_entry,
      display_color: display_color,
      color_hex: colorMap[display_color] || current.color_hex,
      notes: payload.notes !== undefined ? payload.notes : current.notes
    };

    localTimeOffTypesStore[index] = updatedItem;
    await new Promise((resolve) => setTimeout(resolve, 180));

    return {
      success: true,
      data: updatedItem,
      message: `Time off type "${updatedItem.name}" updated successfully.`
    };
  },

  /**
   * Toggle Active / Inactive status of a Time Off Type
   */
  async toggleTimeOffTypeStatus(id) {
    const index = localTimeOffTypesStore.findIndex((t) => String(t.id) === String(id));
    if (index === -1) {
      return { success: false, error: 'Time off type not found' };
    }

    const current = localTimeOffTypesStore[index];
    const nextIsActive = !current.is_active;

    localTimeOffTypesStore[index] = {
      ...current,
      is_active: nextIsActive,
      status: nextIsActive ? 'Active' : 'Inactive',
      active_display: nextIsActive ? 'True' : 'False'
    };

    await new Promise((resolve) => setTimeout(resolve, 150));
    return {
      success: true,
      data: localTimeOffTypesStore[index],
      message: `Status updated to ${nextIsActive ? 'Active' : 'Inactive'}.`
    };
  }
};
