import { timeOffAPI, employeeAPI } from './api';

function formatRequest(r) {
  if (!r) return r;
  const empName = r.first_name && r.last_name 
    ? `${r.first_name} ${r.last_name}`.trim() 
    : (r.employee_name || 'Employee');

  const rawStatus = r.status || 'Pending';
  let displayStatus = rawStatus;
  if (rawStatus === 'Pending') displayStatus = 'To Approve';
  else if (rawStatus === 'Rejected') displayStatus = 'Refused';

  const leaveType = r.time_off_type_name || r.leave_type || 'Paid Leave';

  return {
    ...r,
    id: r.id,
    employee_id: r.employee_id,
    employee_name: empName,
    employee_code: r.employee_code || r.emp_code || '',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    department: r.department_name || r.department || 'General',
    manager_name: r.approver_name || r.manager_name || 'HR Manager',
    is_team_member: true,
    leave_type: leaveType,
    time_off_type_id: r.time_off_type_id,
    start_date: r.start_date,
    end_date: r.end_date,
    duration: Number(r.days_requested || r.duration || 1),
    days_requested: Number(r.days_requested || r.duration || 1),
    status: displayStatus,
    raw_status: rawStatus,
    approver_name: r.approver_email || r.approver_name || 'HR Manager',
    approver_id: r.approver_id,
    allocation_used: r.allocation_used || `${leaveType} 2026`,
    reason: r.reason || '',
    refusal_reason: r.rejection_reason || r.refusal_reason || null,
    created_at: r.created_at || new Date().toISOString()
  };
}

function formatType(t) {
  if (!t) return t;
  const isReqAlloc = Boolean(t.requires_allocation);
  const isActive = t.is_active !== undefined ? Boolean(t.is_active) : true;
  return {
    ...t,
    id: t.id,
    name: t.name,
    code: t.code || (t.name ? t.name.slice(0, 4).toUpperCase() : 'TYPE'),
    unit: t.unit || 'Days',
    requires_allocation: isReqAlloc ? 'Required' : 'No',
    requires_allocation_display: isReqAlloc ? 'Yes' : 'No',
    requires_allocation_bool: isReqAlloc,
    approval: t.requires_approval ? 'Manager' : 'None',
    status: isActive ? 'Active' : 'Inactive',
    is_active: isActive,
    active_display: isActive ? 'True' : 'False',
    payroll_work_entry: 'Leave Work Entry',
    display_color: t.display_color || 'Blue',
    color_hex: t.color_hex || '#3B82F6',
    notes: t.notes || ''
  };
}

export const timeOffService = {
  /**
   * Get Time Off Requests list from backend DB
   */
  async getRequests(filters = {}) {
    const queryParams = {};
    if (filters.employee_id) queryParams.employee_id = filters.employee_id;
    if (filters.status && filters.status !== 'All') {
      if (filters.status === 'To Approve') queryParams.status = 'Pending';
      else if (filters.status === 'Refused') queryParams.status = 'Rejected';
      else queryParams.status = filters.status;
    }

    const res = await timeOffAPI.getRequests(queryParams);
    const rawList = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    let result = rawList.map(formatRequest);

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

    if (filters.leave_type && filters.leave_type !== 'All') {
      result = result.filter(
        (r) => r.leave_type.toLowerCase() === filters.leave_type.toLowerCase()
      );
    }

    if (filters.startDate) {
      result = result.filter((r) => r.start_date >= filters.startDate);
    }

    if (filters.endDate) {
      result = result.filter((r) => r.end_date <= filters.endDate);
    }

    return { success: true, data: result, total: result.length };
  },

  /**
   * Get single Time Off Request by ID
   */
  async getRequestById(id) {
    const res = await timeOffAPI.getRequests();
    const rawList = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    const found = rawList.find((r) => String(r.id) === String(id));
    if (!found) {
      return { success: false, error: 'Time off request not found' };
    }
    return { success: true, data: formatRequest(found) };
  },

  /**
   * Create a new Time Off Request in backend DB
   */
  async createRequest(payload) {
    const res = await timeOffAPI.createRequest(payload);
    return {
      success: true,
      data: formatRequest(res.data || res),
      message: 'Time off request submitted successfully and is pending approval.'
    };
  },

  /**
   * Approve a request (HR Manager / Admin action)
   */
  async approveRequest(id, notes = '') {
    const res = await timeOffAPI.approveRequest(id, { notes });
    return {
      success: true,
      data: formatRequest(res.data || res),
      message: res.message || 'Time off request approved successfully.'
    };
  },

  /**
   * Refuse / Reject a request
   */
  async refuseRequest(id, refusalReason = '') {
    const res = await timeOffAPI.rejectRequest(id, {
      rejection_reason: refusalReason,
      notes: refusalReason
    });
    return {
      success: true,
      data: formatRequest(res.data || res),
      message: res.message || 'Time off request refused.'
    };
  },

  /**
   * Fetch Leave Types from backend DB
   */
  async getLeaveTypes() {
    const res = await timeOffAPI.getTypes();
    const list = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    return list.map(formatType);
  },

  /**
   * Fetch Allocation for Employee and Leave Type
   */
  getAllocationBalance(employeeId, leaveTypeName) {
    if (leaveTypeName === 'Unpaid Leave') {
      return {
        allocated: 0,
        used: 0,
        remaining: 0,
        allocation_name: 'None (Unpaid)',
        is_paid: false
      };
    }
    return {
      allocated: 20,
      used: 2,
      remaining: 18,
      allocation_name: `${leaveTypeName} 2026`,
      is_paid: true
    };
  },

  /**
   * Fetch Employees for selection in dropdowns
   */
  async getEmployees() {
    const res = await employeeAPI.getAll();
    const list = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    return list.map((e) => ({
      id: e.id,
      name: `${e.first_name} ${e.last_name}`.trim(),
      code: e.employee_code,
      department: e.department_name || 'General',
      manager: 'HR Manager'
    }));
  },

  /**
   * Fetch Time Off Types with search & status filters from backend DB
   */
  async getTimeOffTypes(filters = {}) {
    const res = await timeOffAPI.getTypes();
    const rawList = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    let result = rawList.map(formatType);

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (t) =>
          (t.name && t.name.toLowerCase().includes(q)) ||
          (t.code && t.code.toLowerCase().includes(q)) ||
          (t.unit && t.unit.toLowerCase().includes(q))
      );
    }

    if (filters.status && filters.status !== 'All') {
      result = result.filter(
        (t) => t.status.toLowerCase() === filters.status.toLowerCase()
      );
    }

    return { success: true, data: result, total: result.length };
  },

  /**
   * Fetch single Time Off Type by ID from backend DB
   */
  async getTimeOffTypeById(id) {
    const res = await timeOffAPI.getTypeById(id);
    const item = res.data || res;
    if (!item) {
      return { success: false, error: 'Time off type not found' };
    }
    return { success: true, data: formatType(item) };
  },

  /**
   * Create a new Time Off Type in backend DB
   */
  async createTimeOffType(payload) {
    const body = {
      name: payload.name,
      unit: payload.unit || 'Days',
      requires_allocation: payload.requires_allocation === 'Required' || payload.requires_allocation === 'Yes' || Boolean(payload.requires_allocation_bool),
      requires_approval: true
    };
    const res = await timeOffAPI.createType(body);
    const created = formatType(res.data || res);
    return {
      success: true,
      data: created,
      message: `Time off type "${created.name}" created successfully.`
    };
  },

  /**
   * Update an existing Time Off Type in backend DB
   */
  async updateTimeOffType(id, payload) {
    const body = {
      name: payload.name,
      unit: payload.unit,
      requires_allocation: payload.requires_allocation !== undefined
        ? (payload.requires_allocation === 'Required' || payload.requires_allocation === 'Yes' || Boolean(payload.requires_allocation))
        : undefined,
      requires_approval: true,
      is_active: payload.is_active !== undefined
        ? Boolean(payload.is_active)
        : (payload.status !== undefined ? payload.status === 'Active' : undefined)
    };
    const res = await timeOffAPI.updateType(id, body);
    const updated = formatType(res.data || res);
    return {
      success: true,
      data: updated,
      message: `Time off type "${updated.name}" updated successfully.`
    };
  },

  /**
   * Toggle Active / Inactive status of a Time Off Type in backend DB
   */
  async toggleTimeOffTypeStatus(id) {
    const curr = await timeOffAPI.getTypeById(id);
    const item = curr.data || curr;
    const nextIsActive = !item.is_active;
    const res = await timeOffAPI.updateType(id, { is_active: nextIsActive });
    const updated = formatType(res.data || res);
    return {
      success: true,
      data: updated,
      message: `Status updated to ${nextIsActive ? 'Active' : 'Inactive'}.`
    };
  }
};

export default timeOffService;
