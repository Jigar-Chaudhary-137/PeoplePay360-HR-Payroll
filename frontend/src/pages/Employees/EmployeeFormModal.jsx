import React, { useState, useEffect } from 'react';
import { Key, Copy, Check, Eye, EyeOff, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
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
    user_role: 'Employee'
  });

  const [departments, setDepartments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [showPassword, setShowPassword] = useState(true);

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
        user_role: employee.user_role || 'Employee'
      });
    } else {
      setFormData({
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
        user_role: 'Employee'
      });
    }
    setCreatedCredentials(null);
    setCopiedField(null);
    setShowPassword(true);
  }, [employee, isOpen]);

  const handleClose = () => {
    setCreatedCredentials(null);
    setCopiedField(null);
    setShowPassword(true);
    onClose();
  };

  const copyToClipboard = async (text, field) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2500);
    } catch (err) {
      showToast('Failed to copy to clipboard', 'error');
    }
  };

  const selectedDeptPositions = departments.find((d) => String(d.id) === String(formData.department_id))?.positions || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        await employeeAPI.update(employee.id, formData);
        showToast('Employee updated successfully', 'success');
        if (onSuccess) onSuccess();
        handleClose();
      } else {
        const res = await employeeAPI.create(formData);
        showToast('Employee created successfully', 'success');
        if (res?.data?.login_credentials) {
          setCreatedCredentials({
            ...res.data.login_credentials,
            employee_name: `${formData.first_name} ${formData.last_name}`.trim(),
            employee_code: res.data.employee_code || ''
          });
          if (onSuccess) onSuccess();
        } else {
          if (onSuccess) onSuccess();
          handleClose();
        }
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        createdCredentials
          ? 'Employee Account Credentials'
          : isEditing
          ? `Edit Employee (${employee?.emp_code || ''})`
          : 'New Employee Registration'
      }
      subtitle={
        createdCredentials
          ? 'A user login account has been automatically provisioned for this employee.'
          : 'Fill in employment master and banking disbursement parameters'
      }
      maxWidth={createdCredentials ? 'max-w-lg' : 'max-w-3xl'}
    >
      {createdCredentials ? (
        <div className="space-y-4 text-xs">
          {/* Success Banner */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="font-bold text-emerald-950 text-sm">Account Created Successfully</p>
              <p className="text-emerald-700 text-xs">
                {createdCredentials.employee_name} ({createdCredentials.employee_code}) &bull; Role: <strong>{createdCredentials.role || 'Employee'}</strong>
              </p>
            </div>
          </div>

          {/* Credentials Display Box */}
          <div className="space-y-3 p-4 rounded-xl bg-[#FAF7FF] border border-[#DDD9E8]">
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#625E6E] uppercase tracking-wider">Login Email</label>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-[#DDD9E8] shadow-2xs">
                <span className="font-mono font-medium text-xs text-[#17151F] select-all">{createdCredentials.email}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(createdCredentials.email, 'email')}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#6C3FF5] hover:text-[#5B2FD1] bg-[#FAF7FF] hover:bg-[#F3E8FF] rounded-md transition-colors border border-[#DDD9E8] cursor-pointer"
                  title="Copy email"
                >
                  {copiedField === 'email' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{copiedField === 'email' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Temporary Password Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#625E6E] uppercase tracking-wider">Temporary Password</label>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-[#DDD9E8] shadow-2xs">
                <span className="font-mono font-bold text-xs text-[#6C3FF5] tracking-wider select-all">
                  {showPassword ? createdCredentials.temporary_password : '••••••••••••'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-[#625E6E] hover:text-[#17151F] rounded hover:bg-[#FAF7FF] transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(createdCredentials.temporary_password, 'password')}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[#6C3FF5] hover:text-[#5B2FD1] bg-[#FAF7FF] hover:bg-[#F3E8FF] rounded-md transition-colors border border-[#DDD9E8] cursor-pointer"
                    title="Copy password"
                  >
                    {copiedField === 'password' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    <span>{copiedField === 'password' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Security Alert Notice */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-900">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-xs text-amber-950">First-Time Login Requirement</p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Please share these credentials securely with the employee. The employee should change this temporary password after their first login.
              </p>
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex justify-end pt-3 border-t border-[#E7E5EF]">
            <button
              type="button"
              onClick={handleClose}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <CheckCircle2 size={15} />
              <span>Done (I have copied these credentials)</span>
            </button>
          </div>
        </div>
      ) : (
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

        {/* Automated Account Provisioning Notice */}
        {!isEditing && (
          <div className="pt-2 border-t border-[#E7E5EF] space-y-2">
            <div className="p-3.5 rounded-xl bg-[#FAF7FF] border border-[#DDD9E8] flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#6C3FF5]/10 text-[#6C3FF5] shrink-0 mt-0.5">
                <Key size={16} />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-xs text-[#17151F]">Automated Employee Login Account</p>
                <p className="text-[11px] text-[#625E6E] leading-relaxed">
                  A user login account with the <strong className="text-[#6C3FF5] font-semibold">Employee</strong> role will be automatically created using the work email above. A secure temporary password will be generated and revealed upon submission.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-[#E7E5EF]">
          <button type="button" onClick={handleClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : isEditing ? 'Update Employee' : 'Create Employee'}
          </button>
        </div>
      </form>
      )}
    </Modal>
  );
}
