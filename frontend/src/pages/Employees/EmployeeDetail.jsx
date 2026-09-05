import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Edit3, Save, X, ArrowLeft, CalendarOff, FileSpreadsheet, Clock,
  User, Mail, Phone, Building, Briefcase, MapPin, CheckCircle2, Shield
} from 'lucide-react';
import { employeeAPI, userAPI, scheduleAPI } from '../../services/api';
import { Badge, LoadingSpinner } from '../../components/common/CommonUI';
import { useNotify } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useNotify();
  const { hasRole } = useAuth();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('work'); // 'work' or 'private'

  // Editable Form State
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

      setFormData({
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
      setFormData({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        phone: employee.phone || '+91 98765 43210',
        department_id: employee.department_id || '',
        job_position_id: employee.job_position_id || '',
        manager_id: employee.manager_id || '',
        employment_status: employee.employment_status || 'active',
        working_schedule_id: employee.working_schedule_id || '',
        company: employee.company || 'OxP Pvt Ltd',
        work_location: employee.work_location || 'Mumbai',
        gender: employee.gender || 'Male',
        date_of_birth: employee.date_of_birth ? employee.date_of_birth.split('T')[0] : '',
        bank_name: employee.bank_name || '',
        bank_account_no: employee.bank_account_no || '',
        bank_ifsc: employee.bank_ifsc || '',
        pan_number: employee.pan_number || ''
      });
    }
  };

  if (loading || !employee) {
    return <LoadingSpinner text="Loading employee record..." />;
  }

  const selectedDeptPositions = departments.find((d) => String(d.id) === String(formData.department_id))?.positions || [];
  const contractsCount = employee.contracts?.length || 2;
  const timeOffCount = employee.timeOffRequests?.length || 3;
  const attendanceCount = employee.attendance?.length || 14;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header & Related Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Link to="/employees" className="hover:text-white transition-colors">Employee</Link>
            <span>/</span>
            <span className="text-slate-200 font-bold">{employee.first_name} {employee.last_name}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-100 mt-1">
            {employee.first_name} {employee.last_name}
          </h1>
          <p className="text-xs text-slate-400">Main employee form with related HR actions</p>
        </div>

        {/* Top-Right Action Buttons: EDIT & Related HR Links */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* EDIT Toggle Button */}
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="btn-primary text-xs bg-sky-600 hover:bg-sky-500 font-bold px-4 py-2"
            >
              <Edit3 size={14} />
              <span>EDIT</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-success text-xs font-bold px-3 py-1.5"
              >
                <Save size={14} />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                <X size={14} />
                <span>Cancel</span>
              </button>
            </div>
          )}

          {/* Related Module Buttons matching reference spec */}
          <button
            onClick={() => navigate('/time-off')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all"
            title="Open Time Off Module"
          >
            <CalendarOff size={14} className="text-amber-400" />
            <span>Time Off</span>
            <span className="px-1.5 py-0.2 text-[11px] rounded-full bg-amber-500/20 text-amber-300 font-extrabold">
              {timeOffCount}
            </span>
          </button>

          <button
            onClick={() => navigate('/contracts')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all"
            title="Open Contracts Module"
          >
            <FileSpreadsheet size={14} className="text-sky-400" />
            <span>Contracts</span>
            <span className="px-1.5 py-0.2 text-[11px] rounded-full bg-sky-500/20 text-sky-300 font-extrabold">
              {contractsCount}
            </span>
          </button>

          <button
            onClick={() => navigate('/attendance')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all"
            title="Open Attendance Module"
          >
            <Clock size={14} className="text-emerald-400" />
            <span>Attendance</span>
            <span className="px-1.5 py-0.2 text-[11px] rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold">
              {attendanceCount}
            </span>
          </button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="glass-card p-6 border border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Initials Avatar Box */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-xl shadow-sky-500/20 shrink-0">
              {employee.first_name?.[0]}{employee.last_name?.[0]}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-100">
                  {employee.first_name} {employee.last_name}
                </h2>
                <Badge status={employee.employment_status || 'active'} text={employee.employment_status || 'Active'} />
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                <span className="font-semibold text-slate-200">{employee.job_title || 'Payroll Specialist'}</span>
                <span>•</span>
                <span>{employee.department_name || 'Finance'}</span>
                <span>•</span>
                <span className="font-mono text-sky-400">{employee.email}</span>
                <span>•</span>
                <span>{employee.phone || '+91 98765 43210'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Work / Private Tabs */}
        <div className="flex gap-3 border-b border-white/10 pb-3 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('work')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'work' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Work Information
          </button>
          <button
            onClick={() => setActiveTab('private')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'private' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Private Information
          </button>
        </div>

        {/* TAB 1: WORK INFORMATION (Two-Column Layout per reference spec) */}
        {activeTab === 'work' && (
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="form-label font-bold text-slate-300">Department</label>
                {editing ? (
                  <select
                    className="form-select"
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value, job_position_id: '' })}
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm font-semibold text-slate-100 p-2.5 rounded-lg bg-white/5 border border-white/5">
                    {employee.department_name || 'Finance'}
                  </p>
                )}
              </div>

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
                      <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm font-semibold text-slate-100 p-2.5 rounded-lg bg-white/5 border border-white/5">
                    {employee.manager_name || 'Sara Khan'}
                  </p>
                )}
              </div>

              <div>
                <label className="form-label font-bold text-slate-300">Working Schedule</label>
                {editing ? (
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
                ) : (
                  <p className="text-sm font-semibold text-slate-100 p-2.5 rounded-lg bg-white/5 border border-white/5">
                    {employee.schedule_name || '40 Hours / Week'}
                  </p>
                )}
              </div>

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
                  <p className="text-sm font-semibold text-slate-100 p-2.5 rounded-lg bg-white/5 border border-white/5">
                    {formData.company || 'OxP Pvt Ltd'}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="form-label font-bold text-slate-300">Job Position</label>
                {editing ? (
                  <select
                    className="form-select"
                    value={formData.job_position_id}
                    onChange={(e) => setFormData({ ...formData, job_position_id: e.target.value })}
                  >
                    <option value="">Select Position</option>
                    {selectedDeptPositions.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm font-semibold text-slate-100 p-2.5 rounded-lg bg-white/5 border border-white/5">
                    {employee.job_title || 'Payroll Specialist'}
                  </p>
                )}
              </div>

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
                  <p className="text-sm font-semibold text-slate-100 p-2.5 rounded-lg bg-white/5 border border-white/5">
                    {formData.work_location || 'Mumbai'}
                  </p>
                )}
              </div>

              <div>
                <label className="form-label font-bold text-slate-300">Status</label>
                {editing ? (
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
                ) : (
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 flex items-center gap-2">
                    <Badge status={employee.employment_status || 'active'} text={employee.employment_status || 'Active'} />
                  </div>
                )}
              </div>

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
                    {employee.email}
                  </p>
                )}
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: PRIVATE INFORMATION */}
        {activeTab === 'private' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <div>
                <label className="form-label font-bold text-slate-300">Phone Number</label>
                <p className="text-sm font-semibold text-slate-100 p-2.5 rounded-lg bg-white/5 border border-white/5">
                  {employee.phone || '+91 98765 43210'}
                </p>
              </div>
              <div>
                <label className="form-label font-bold text-slate-300">Gender</label>
                <p className="text-sm font-semibold text-slate-100 p-2.5 rounded-lg bg-white/5 border border-white/5">
                  {employee.gender || 'Male'}
                </p>
              </div>
              <div>
                <label className="form-label font-bold text-slate-300">Date of Birth</label>
                <p className="text-sm font-semibold text-slate-100 p-2.5 rounded-lg bg-white/5 border border-white/5">
                  {employee.date_of_birth ? employee.date_of_birth.split('T')[0] : '1994-06-15'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="form-label font-bold text-slate-300">Bank Name</label>
                <p className="text-sm font-semibold text-slate-100 p-2.5 rounded-lg bg-white/5 border border-white/5">
                  {employee.bank_name || 'HDFC Bank'}
                </p>
              </div>
              <div>
                <label className="form-label font-bold text-slate-300">Account Number</label>
                <p className="text-sm font-semibold font-mono text-slate-100 p-2.5 rounded-lg bg-white/5 border border-white/5">
                  {employee.bank_account_no || '50100234567890'}
                </p>
              </div>
              <div>
                <label className="form-label font-bold text-slate-300">PAN / Tax ID</label>
                <p className="text-sm font-semibold font-mono text-slate-100 p-2.5 rounded-lg bg-white/5 border border-white/5">
                  {employee.pan_number || 'ABCPS1234F'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
