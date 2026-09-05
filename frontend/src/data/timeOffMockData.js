/**
 * Realistic removable mock data for Time Off Requests module
 */

export const MOCK_LEAVE_TYPES = [
  { id: 1, name: 'Paid Time Off', code: 'PTO', is_paid: true, color: '#3B82F6', max_days: 24 },
  { id: 2, name: 'Sick Leave', code: 'SL', is_paid: true, color: '#10B981', max_days: 12 },
  { id: 3, name: 'Comp Off', code: 'COMP', is_paid: true, color: '#8B5CF6', max_days: 5 },
  { id: 4, name: 'Casual Leave', code: 'CL', is_paid: true, color: '#F59E0B', max_days: 10 },
  { id: 5, name: 'Unpaid Leave', code: 'UNPAID', is_paid: false, color: '#64748B', max_days: null }
];

export const INITIAL_TIME_OFF_TYPES = [
  {
    id: 1,
    name: 'Paid Time Off',
    code: 'PTO',
    unit: 'Days',
    requires_allocation: 'Required',
    requires_allocation_display: 'Yes',
    approval: 'Manager',
    status: 'Active',
    is_active: true,
    active_display: 'True',
    payroll_work_entry: 'Leave Work Entry',
    display_color: 'Blue',
    color_hex: '#3B82F6',
    notes: 'Standard annual leave. Balance comes from approved allocations.'
  },
  {
    id: 2,
    name: 'Sick Leave',
    code: 'SL',
    unit: 'Days',
    requires_allocation: 'No',
    requires_allocation_display: 'No',
    approval: 'Manager',
    status: 'Active',
    is_active: true,
    active_display: 'True',
    payroll_work_entry: 'Leave Work Entry',
    display_color: 'Emerald',
    color_hex: '#10B981',
    notes: 'Used for medical and illness-related absences. Medical certificate required for extended leaves exceeding 2 consecutive days.'
  },
  {
    id: 3,
    name: 'Comp Off',
    code: 'COMP',
    unit: 'Hours',
    requires_allocation: 'Required',
    requires_allocation_display: 'Yes',
    approval: 'Officer',
    status: 'Active',
    is_active: true,
    active_display: 'True',
    payroll_work_entry: 'Leave Work Entry',
    display_color: 'Violet',
    color_hex: '#8B5CF6',
    notes: 'Compensatory time off granted in exchange for verified overtime or weekend project support.'
  },
  {
    id: 4,
    name: 'Casual Leave',
    code: 'CL',
    unit: 'Days',
    requires_allocation: 'Required',
    requires_allocation_display: 'Yes',
    approval: 'Manager',
    status: 'Active',
    is_active: true,
    active_display: 'True',
    payroll_work_entry: 'Leave Work Entry',
    display_color: 'Amber',
    color_hex: '#F59E0B',
    notes: 'Short-duration leaves for personal, urgent, or unforeseen matters.'
  },
  {
    id: 5,
    name: 'Unpaid Leave',
    code: 'UNP',
    unit: 'Days',
    requires_allocation: 'No',
    requires_allocation_display: 'No',
    approval: 'Manager',
    status: 'Inactive',
    is_active: false,
    active_display: 'False',
    payroll_work_entry: 'Unpaid Work Entry',
    display_color: 'Slate',
    color_hex: '#64748B',
    notes: 'Leave without compensation when all allocated paid leave quotas are depleted.'
  }
];

export const MOCK_ALLOCATIONS = {
  1: { // Aarav Mehta
    'Paid Time Off': { allocated: 24, used: 6, remaining: 18, allocation_name: 'Paid Time Off 2026' },
    'Sick Leave': { allocated: 12, used: 2, remaining: 10, allocation_name: 'Sick Leave 2026' },
    'Comp Off': { allocated: 3, used: 0, remaining: 3, allocation_name: 'Comp Off Q3 2026' },
    'Casual Leave': { allocated: 10, used: 1, remaining: 9, allocation_name: 'Casual Leave 2026' }
  },
  2: { // Sara Khan
    'Paid Time Off': { allocated: 24, used: 4, remaining: 20, allocation_name: 'Paid Time Off 2026' },
    'Sick Leave': { allocated: 12, used: 3, remaining: 9, allocation_name: 'Sick Leave 2026' },
    'Comp Off': { allocated: 2, used: 1, remaining: 1, allocation_name: 'Comp Off Q3 2026' },
    'Casual Leave': { allocated: 10, used: 2, remaining: 8, allocation_name: 'Casual Leave 2026' }
  },
  3: { // John Dsouza
    'Paid Time Off': { allocated: 24, used: 8, remaining: 16, allocation_name: 'Paid Time Off 2026' },
    'Sick Leave': { allocated: 12, used: 1, remaining: 11, allocation_name: 'Sick Leave 2026' },
    'Comp Off': { allocated: 2, used: 0, remaining: 2, allocation_name: 'Comp Off Q3 2026' },
    'Casual Leave': { allocated: 10, used: 3, remaining: 7, allocation_name: 'Casual Leave 2026' }
  },
  4: { // Neha Patel
    'Paid Time Off': { allocated: 24, used: 5, remaining: 19, allocation_name: 'Paid Time Off 2026' },
    'Sick Leave': { allocated: 12, used: 4, remaining: 8, allocation_name: 'Sick Leave 2026' },
    'Comp Off': { allocated: 1, used: 0, remaining: 1, allocation_name: 'Comp Off Q3 2026' },
    'Casual Leave': { allocated: 10, used: 0, remaining: 10, allocation_name: 'Casual Leave 2026' }
  },
  5: { // Rahul Sharma
    'Paid Time Off': { allocated: 24, used: 10, remaining: 14, allocation_name: 'Paid Time Off 2026' },
    'Sick Leave': { allocated: 12, used: 2, remaining: 10, allocation_name: 'Sick Leave 2026' },
    'Comp Off': { allocated: 4, used: 1, remaining: 3, allocation_name: 'Comp Off Q3 2026' },
    'Casual Leave': { allocated: 10, used: 2, remaining: 8, allocation_name: 'Casual Leave 2026' }
  }
};

export const INITIAL_TIME_OFF_REQUESTS = [
  {
    id: 1,
    employee_id: 1,
    employee_name: 'Aarav Mehta',
    employee_code: 'EMP001',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    department: 'Finance',
    manager_name: 'Sara Khan',
    is_team_member: true,
    leave_type: 'Paid Time Off',
    start_date: '2026-09-12',
    end_date: '2026-09-14',
    duration: 3,
    status: 'Approved',
    approver_name: 'Sara Khan',
    approver_id: 2,
    allocation_used: 'Paid Time Off 2026',
    reason: 'Family vacation and personal travel.',
    refusal_reason: null,
    created_at: '2026-09-01T10:30:00Z'
  },
  {
    id: 2,
    employee_id: 2,
    employee_name: 'Sara Khan',
    employee_code: 'EMP002',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    department: 'Human Resources',
    manager_name: 'Vikram Malhotra',
    is_team_member: false,
    leave_type: 'Sick Leave',
    start_date: '2026-09-18',
    end_date: '2026-09-18',
    duration: 1,
    status: 'Approved',
    approver_name: 'Vikram Malhotra',
    approver_id: 7,
    allocation_used: 'Sick Leave 2026',
    reason: 'Dental appointment and recovery.',
    refusal_reason: null,
    created_at: '2026-09-02T09:15:00Z'
  },
  {
    id: 3,
    employee_id: 3,
    employee_name: 'John Dsouza',
    employee_code: 'EMP003',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    department: 'Engineering',
    manager_name: 'Rahul Sharma',
    is_team_member: true,
    leave_type: 'Comp Off',
    start_date: '2026-09-27',
    end_date: '2026-09-27',
    duration: 1,
    status: 'To Approve',
    approver_name: 'Rahul Sharma',
    approver_id: 5,
    allocation_used: 'Comp Off Q3 2026',
    reason: 'Comp off against weekend production release deployment.',
    refusal_reason: null,
    created_at: '2026-09-03T14:20:00Z'
  },
  {
    id: 4,
    employee_id: 4,
    employee_name: 'Neha Patel',
    employee_code: 'EMP004',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    department: 'Product',
    manager_name: 'Arjun Mehta',
    is_team_member: true,
    leave_type: 'Casual Leave',
    start_date: '2026-09-22',
    end_date: '2026-09-23',
    duration: 2,
    status: 'To Approve',
    approver_name: 'Arjun Mehta',
    approver_id: 1,
    allocation_used: 'Casual Leave 2026',
    reason: 'Attending family wedding ceremony.',
    refusal_reason: null,
    created_at: '2026-09-04T11:00:00Z'
  },
  {
    id: 5,
    employee_id: 5,
    employee_name: 'Rahul Sharma',
    employee_code: 'EMP005',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    department: 'Engineering',
    manager_name: 'Vikram Malhotra',
    is_team_member: false,
    leave_type: 'Unpaid Leave',
    start_date: '2026-09-29',
    end_date: '2026-09-30',
    duration: 2,
    status: 'Refused',
    approver_name: 'Vikram Malhotra',
    approver_id: 7,
    allocation_used: 'None (Unpaid)',
    reason: 'Extended personal leave.',
    refusal_reason: 'High priority Q3 delivery sprint during this period. Please reschedule.',
    created_at: '2026-09-02T16:45:00Z'
  }
];

export const MOCK_EMPLOYEES = [
  { id: 1, name: 'Aarav Mehta', code: 'EMP001', department: 'Finance', manager: 'Sara Khan' },
  { id: 2, name: 'Sara Khan', code: 'EMP002', department: 'Human Resources', manager: 'Vikram Malhotra' },
  { id: 3, name: 'John Dsouza', code: 'EMP003', department: 'Engineering', manager: 'Rahul Sharma' },
  { id: 4, name: 'Neha Patel', code: 'EMP004', department: 'Product', manager: 'Arjun Mehta' },
  { id: 5, name: 'Rahul Sharma', code: 'EMP005', department: 'Engineering', manager: 'Vikram Malhotra' }
];
