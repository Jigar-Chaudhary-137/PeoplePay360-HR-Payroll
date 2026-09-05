import React, { useState, useEffect } from 'react';
import { employeeAPI, userAPI, scheduleAPI } from '../../services/api';
import { Modal } from '../../components/common/CommonUI';
import { useNotify } from '../../context/NotificationContext';

export function EmployeeFormModal({ isOpen, onClose, employee, onSuccess }) {
  const { showToast } = useNotify();
  const isEditing = !!employee;

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    gender: 'Male',
    date_of_birth: '',
    joining_date: new Date().toISOString().split('T')[0],
    department_id: '',
    job_position_id: '',
    employment_status: 'active',
    working_schedule_id: '',
    bank_name: '',
    bank_account_no: '',
    bank_ifsc: '',
    pan_number: '',
    create_user_account: true,
    user_role: 'Employee'
  });

  const [departments, setDepartments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load departments & schedules
    userAPI.getDepartments().then((res) => setDepartments(res.data || []));
    scheduleAPI.getAll().then((res) => setSchedules(res.data || []));

    if (employee) {
      setFormData({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        gender: employee.gender || 'Male',
        date_of_birth: employee.date_of_birth ? employee.date_of_birth.split('T')[0] : '',
        joining_date: employee.joining_date ? employee.joining_date.split('T')[0] : new Date().toISOString().split('T')[0],
        department_id: employee.department_id || '',
        job_position_id: employee.job_position_id || '',
        employment_status: employee.employment_status || 'active',
        working_schedule_id: employee.working_schedule_id || '',
        bank_name: employee.bank_name || '',
        bank_account_no: employee.bank_account_no || '',
        bank_ifsc: employee.bank_ifsc || '',
        pan_number: employee.pan_number || '',
        create_user_account: false,
        user_role: employee.user_role || 'Employee'
      });
    }
  }, [employee]);

  const selectedDeptPositions = departments.find((d) => String(d.id) === String(formData.department_id))?.positions || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        await employeeAPI.update(employee.id, formData);
        showToast('Employee updated successfully', 'success');
      } else {
        await employeeAPI.create(formData);
        showToast('Employee created successfully', 'success');
      }
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Employee (${employee.emp_code})` : 'New Employee Registration'}
      subtitle="Fill in employment master and banking disbursement parameters"
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Basic Personal Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="form-label">First Name *</label>
            <input
              type="text"
              required
              className="form-input"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Last Name *</label>
            <input
              type="text"
              required
              className="form-input"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Work Email *</label>
            <input
              type="email"
              required
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="form-label">Phone Number</label>
            <input
              type="text"
              className="form-input"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Gender</label>
            <select
              className="form-select"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="form-label">Date of Birth</label>
            <input
              type="date"
              className="form-input"
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            />
          </div>
        </div>

        {/* Department & Job Position */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-white/5">
          <div>
            <label className="form-label">Joining Date *</label>
            <input
              type="date"
              required
              className="form-input"
              value={formData.joining_date}
              onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Department</label>
            <select
              className="form-select"
              value={formData.department_id}
              onChange={(e) => setFormData({ ...formData, department_id: e.target.value, job_position_id: '' })}
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Job Position</label>
            <select
              className="form-select"
              value={formData.job_position_id}
              onChange={(e) => setFormData({ ...formData, job_position_id: e.target.value })}
            >
              <option value="">Select Position</option>
              {selectedDeptPositions.map((p) => (
                <option key={p.id} value={p.id}>{p.title} ({p.grade})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Employment Status</label>
            <select
              className="form-select"
              value={formData.employment_status}
              onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="probation">Probation</option>
              <option value="on_notice">On Notice</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
          <div>
            <label className="form-label">Working Schedule</label>
            <select
              className="form-select"
              value={formData.working_schedule_id}
              onChange={(e) => setFormData({ ...formData, working_schedule_id: e.target.value })}
            >
              <option value="">Select Schedule</option>
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.hours_per_week}h/wk)</option>
              ))}
            </select>
          </div>
        </div>

        {/* Banking Details */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          <p className="font-semibold text-slate-300">Banking & Statutory Information</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="form-label">Bank Name</label>
              <input
                type="text"
                placeholder="e.g. HDFC Bank"
                className="form-input"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Account Number</label>
              <input
                type="text"
                placeholder="Account No"
                className="form-input"
                value={formData.bank_account_no}
                onChange={(e) => setFormData({ ...formData, bank_account_no: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">IFSC Code</label>
              <input
                type="text"
                placeholder="IFSC"
                className="form-input"
                value={formData.bank_ifsc}
                onChange={(e) => setFormData({ ...formData, bank_ifsc: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">PAN / Tax ID</label>
              <input
                type="text"
                placeholder="PAN"
                className="form-input"
                value={formData.pan_number}
                onChange={(e) => setFormData({ ...formData, pan_number: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* User Account creation if new employee */}
        {!isEditing && (
          <div className="pt-2 border-t border-white/5 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.create_user_account}
                onChange={(e) => setFormData({ ...formData, create_user_account: e.target.checked })}
                className="rounded border-slate-700 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-slate-200 font-medium">Create User Login Account (Default Pwd: Password@123)</span>
            </label>

            {formData.create_user_account && (
              <div>
                <label className="form-label">Assigned Role</label>
                <select
                  className="form-select"
                  value={formData.user_role}
                  onChange={(e) => setFormData({ ...formData, user_role: e.target.value })}
                >
                  <option value="Employee">Employee (Self-Service)</option>
                  <option value="HR Manager">HR Manager</option>
                  <option value="HR Payroll User">HR Payroll User</option>
                  <option value="HR Payroll Admin">HR Payroll Admin</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : isEditing ? 'Update Employee' : 'Create Employee'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
