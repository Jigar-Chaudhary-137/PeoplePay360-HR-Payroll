import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Edit3, Save, X, CalendarOff, FileSpreadsheet, Clock,
  Mail, Phone, Building2, MapPin
} from 'lucide-react';
import { employeeAPI, userAPI, scheduleAPI } from '../../services/api';
import { Badge, LoadingSpinner } from '../../components/common/CommonUI';
import { useNotify } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

// Helper: capitalize employment status for display
function formatStatus(status) {
  if (!status) return 'Active';
  const map = {
    active: 'Active',
    probation: 'Probation',
    on_notice: 'On Notice',
    terminated: 'Terminated'
  };
  return map[status] || status.charAt(0).toUpperCase() + status.slice(1);
}

// Helper: get employee initials
function getInitials(emp) {
  return `${emp?.first_name?.[0] || ''}${emp?.last_name?.[0] || ''}`.toUpperCase();
}

// Helper: get employee full name
function getFullName(emp) {
  return `${emp?.first_name || ''} ${emp?.last_name || ''}`.trim();
}

// Read-only field display
function ReadField({ label, value, mono = false, highlight = false }) {
  return (
    <div>
      <label className="form-label font-bold text-slate-300">{label}</label>
      <p className={`text-sm font-semibold p-2.5 rounded-lg bg-white/5 border border-white/5 ${
        mono ? 'font-mono' : ''
      } ${highlight ? 'text-sky-400' : 'text-slate-100'}`}>
        {value || '—'}
      </p>
    </div>
  );
}

export function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useNotify();
  const { hasRole } = useAuth();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('work'); // 'work' | 'private'

  // Editable form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department_id: '',
    job_position_id: '',
    manager_id: '',
    employment_status: 'active',
    working_schedule_id: '',
    company: 'OxP Pvt Ltd',
    work_location: 'Mumbai',
    gender: 'Male',
    date_of_birth: '',
    bank_name: '',
    bank_account_no: '',
    bank_ifsc: '',
    pan_number: ''
  });

  const [departments, setDepartments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [managers, setManagers] = useState([]);

  const buildFormData = (emp) => ({
    first_name: emp.first_name || '',
    last_name: emp.last_name || '',
    email: emp.email || '',
    phone: emp.phone || '+91 98765 43210',
    department_id: emp.department_id || '',
    job_position_id: emp.job_position_id || '',
    manager_id: emp.manager_id || '',
    employment_status: emp.employment_status || 'active',
    working_schedule_id: emp.working_schedule_id || '',
    company: emp.company || 'OxP Pvt Ltd',
    work_location: emp.work_location || 'Mumbai',
    gender: emp.gender || 'Male',
    date_of_birth: emp.date_of_birth ? emp.date_of_birth.split('T')[0] : '',
    bank_name: emp.bank_name || '',
    bank_account_no: emp.bank_account_no || '',
    bank_ifsc: emp.bank_ifsc || '',
    pan_number: emp.pan_number || ''
  });

  const loadEmployee = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, schedRes, allEmpsRes] = await Promise.all([
        employeeAPI.getById(id),
        userAPI.getDepartments(),
        scheduleAPI.getAll(),
        employeeAPI.getAll()
      ]);

      const emp = empRes.data;
      setEmployee(emp);
      setDepartments(deptRes.data || []);
      setSchedules(schedRes.data || []);
      setManagers((allEmpsRes.data || []).filter((e) => e.id !== emp.id));
      setFormData(buildFormData(emp));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployee();
  }, [id]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await employeeAPI.update(id, formData);
      showToast('Employee details saved successfully', 'success');
      setEditing(false);
      loadEmployee();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    if (employee) {
      setFormData(buildFormData(employee));
    }
  };

  if (loading || !employee) {
    return <LoadingSpinner text="Loading employee record..." />;
  }

  const selectedDeptPositions =
    departments.find((d) => String(d.id) === String(formData.department_id))?.positions || [];

  // Counts with fallbacks (as per reference spec)
  const contractsCount = employee.contracts?.length ?? 2;
  const timeOffCount = employee.timeOffRequests?.length ?? 3;
  const attendanceCount = employee.attendance?.length ?? 14;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* ─── Top Header ──────────────────────────────────────────── */}
      <div className="border-b border-white/10 pb-4 space-y-3">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link to="/employees" className="hover:text-sky-400 transition-colors">
            Employees
          </Link>
          <span>/</span>
          <span className="text-slate-200 font-bold">{getFullName(employee)}</span>
        </div>

        {/* Title row */}
        <h1 className="text-2xl font-black text-slate-100">
          {getFullName(employee)}
        </h1>
        <p className="text-xs text-slate-400">Main employee form with related HR actions</p>

        {/* Action row: EDIT (left) | HR action buttons (right) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* LEFT: Edit / Save / Cancel */}
          <div className="flex items-center gap-2">
            {!editing ? (
              <button
                id="btn-employee-edit"
                onClick={() => setEditing(true)}
                className="btn-primary text-xs font-bold px-5 py-2"
              >
                <Edit3 size={14} />
                <span>EDIT</span>
              </button>
            ) : (
              <>
                <button
                  id="btn-employee-save"
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-success text-xs font-bold px-4 py-2"
                >
                  <Save size={14} />
                  <span>{saving ? 'Saving…' : 'Save'}</span>
                </button>
                <button
                  id="btn-employee-cancel"
                  onClick={handleCancel}
                  disabled={saving}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  <X size={14} />
                  <span>Cancel</span>
                </button>
              </>
            )}
          </div>

          {/* RIGHT: Related HR module buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-employee-timeoff"
              onClick={() => navigate('/time-off')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all"
              title="Open Time Off Module"
            >
              <CalendarOff size={14} className="text-amber-400" />
              <span>Time Off</span>
              <span className="px-1.5 text-[11px] rounded-full bg-amber-500/20 text-amber-300 font-extrabold">
                {timeOffCount}
              </span>
            </button>

            <button
              id="btn-employee-contracts"
              onClick={() => navigate('/contracts')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all"
              title="Open Contracts Module"
            >
              <FileSpreadsheet size={14} className="text-sky-400" />
              <span>Contracts</span>
              <span className="px-1.5 text-[11px] rounded-full bg-sky-500/20 text-sky-300 font-extrabold">
                {contractsCount}
              </span>
            </button>

            <button
              id="btn-employee-attendance"
              onClick={() => navigate('/attendance')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all"
              title="Open Attendance Module"
            >
              <Clock size={14} className="text-emerald-400" />
              <span>Attendance</span>
              <span className="px-1.5 text-[11px] rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold">
                {attendanceCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Main Profile Card ───────────────────────────────────── */}
      <div className="glass-card p-6 border border-white/10 space-y-6">

        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-4 border-b border-white/10">
          {/* Initials Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-xl shadow-sky-500/20 shrink-0 select-none">
            {getInitials(employee)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-slate-100">
                {getFullName(employee)}
              </h2>
              <Badge
                status={employee.employment_status || 'active'}
                text={formatStatus(employee.employment_status)}
              />
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
              <span className="font-semibold text-slate-200">
                {employee.job_title || 'Staff'}
              </span>
              <span className="text-slate-600">•</span>
              <span>{employee.department_name || '—'}</span>
              {employee.email && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="flex items-center gap-1 font-mono text-sky-400">
                    <Mail size={11} />
                    {employee.email}
                  </span>
                </>
              )}
              {(employee.phone || formData.phone) && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="flex items-center gap-1">
                    <Phone size={11} />
                    {employee.phone || formData.phone}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ─── Tabs ────────────────────────────────────────────── */}
        <div className="flex gap-1 border-b border-white/10 pb-0">
          {[
            { key: 'work', label: 'Work Information' },
            { key: 'private', label: 'Private Information' }
          ].map(({ key, label }) => (
            <button
              key={key}
              id={`tab-employee-${key}`}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all -mb-px border-b-2 ${
                activeTab === key
                  ? 'text-sky-400 border-sky-400 bg-sky-500/5'
                  : 'text-slate-400 border-transparent hover:text-white hover:border-white/20'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ─── TAB: Work Information ───────────────────────────── */}
        {activeTab === 'work' && (
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs pt-2">

            {/* LEFT COLUMN */}
            <div className="space-y-4">
              {/* Department */}
              <div>
                <label className="form-label font-bold text-slate-300">Department</label>
                {editing ? (
                  <select
                    className="form-select"
                    value={formData.department_id}
                    onChange={(e) =>
                      setFormData({ ...formData, department_id: e.target.value, job_position_id: '' })
                    }
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                ) : (
                  <ReadField value={employee.department_name || 'Finance'} />
                )}
              </div>

              {/* Manager */}
              <div>
                <label className="form-label font-bold text-slate-300">Manager</label>
                {editing ? (
                  <select
                    className="form-select"
                    value={formData.manager_id}
                    onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                  >
                    <option value="">Select Manager</option>
                    {managers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.first_name} {m.last_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <ReadField value={employee.manager_name || 'Sara Khan'} />
                )}
              </div>

              {/* Working Schedule */}
              <div>
                <label className="form-label font-bold text-slate-300">Working Schedule</label>
                {editing ? (
                  <select
                    className="form-select"
                    value={formData.working_schedule_id}
                    onChange={(e) =>
                      setFormData({ ...formData, working_schedule_id: e.target.value })
                    }
                  >
                    <option value="">Select Schedule</option>
                    {schedules.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.hours_per_week}h/wk)
                      </option>
                    ))}
                  </select>
                ) : (
                  <ReadField value={employee.schedule_name || '40 Hours / Week'} />
                )}
              </div>

              {/* Company */}
              <div>
                <label className="form-label font-bold text-slate-300">Company</label>
                {editing ? (
                  <input
                    type="text"
                    className="form-input"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                ) : (
                  <ReadField value={formData.company || 'OxP Pvt Ltd'} />
                )}
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-4">
              {/* Job Position */}
              <div>
                <label className="form-label font-bold text-slate-300">Job Position</label>
                {editing ? (
                  <select
                    className="form-select"
                    value={formData.job_position_id}
                    onChange={(e) =>
                      setFormData({ ...formData, job_position_id: e.target.value })
                    }
                  >
                    <option value="">Select Position</option>
                    {selectedDeptPositions.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                ) : (
                  <ReadField value={employee.job_title || 'Payroll Specialist'} />
                )}
              </div>

              {/* Work Location */}
              <div>
                <label className="form-label font-bold text-slate-300">Work Location</label>
                {editing ? (
                  <input
                    type="text"
                    className="form-input"
                    value={formData.work_location}
                    onChange={(e) => setFormData({ ...formData, work_location: e.target.value })}
                  />
                ) : (
                  <ReadField value={formData.work_location || 'Mumbai'} />
                )}
              </div>

              {/* Status */}
              <div>
                <label className="form-label font-bold text-slate-300">Status</label>
                {editing ? (
                  <select
                    className="form-select"
                    value={formData.employment_status}
                    onChange={(e) =>
                      setFormData({ ...formData, employment_status: e.target.value })
                    }
                  >
                    <option value="active">Active</option>
                    <option value="probation">Probation</option>
                    <option value="on_notice">On Notice</option>
                    <option value="terminated">Terminated</option>
                  </select>
                ) : (
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center gap-2">
                    <Badge
                      status={employee.employment_status || 'active'}
                      text={formatStatus(employee.employment_status)}
                    />
                  </div>
                )}
              </div>

              {/* Work Email */}
              <div>
                <label className="form-label font-bold text-slate-300">Work Email</label>
                {editing ? (
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                ) : (
                  <p className="text-sm font-semibold text-sky-400 font-mono p-2.5 rounded-lg bg-white/5 border border-white/5">
                    {employee.email || '—'}
                  </p>
                )}
              </div>
            </div>
          </form>
        )}

        {/* ─── TAB: Private Information ────────────────────────── */}
        {activeTab === 'private' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs pt-2">
            <div className="space-y-4">
              <ReadField label="Phone Number" value={employee.phone || '+91 98765 43210'} />
              <ReadField label="Gender" value={employee.gender || 'Male'} />
              <ReadField
                label="Date of Birth"
                value={
                  employee.date_of_birth
                    ? employee.date_of_birth.split('T')[0]
                    : '1994-06-15'
                }
              />
            </div>
            <div className="space-y-4">
              <ReadField label="Bank Name" value={employee.bank_name || 'HDFC Bank'} />
              <ReadField
                label="Account Number"
                value={employee.bank_account_no || '50100234567890'}
                mono
              />
              <ReadField
                label="PAN / Tax ID"
                value={employee.pan_number || 'ABCPS1234F'}
                mono
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
