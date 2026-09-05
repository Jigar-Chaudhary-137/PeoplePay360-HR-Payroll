import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, AlertCircle } from 'lucide-react';
import { employeeAPI } from '../../services/api';
import { attendanceService } from '../../services/attendanceService';
import { useNotify } from '../../context/NotificationContext';

/**
 * Manual Attendance Entry & Correction Modal for Authorized HR
 */
export const ManualCorrectionModal = ({
  isOpen,
  onClose,
  record = null,
  onSuccess
}) => {
  const isEdit = Boolean(record && record.id);
  const { showToast } = useNotify();

  const [employeeList, setEmployeeList] = useState([]);

  const [formData, setFormData] = useState({
    employee_id: 1,
    employee_name: '',
    employee_code: '',
    department: '',
    date: new Date().toISOString().split('T')[0],
    check_in: '09:00',
    check_out: '18:00',
    status: 'Present',
    overtime_hours: 0,
    correction_reason: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && !record) {
      employeeAPI.getAll().then((res) => {
        const list = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
        const formatted = list.map(e => ({
          id: e.id,
          name: `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.email,
          code: e.employee_code || `EMP${e.id}`,
          department: e.department_name || 'General'
        }));
        setEmployeeList(formatted);
        if (formatted.length > 0) {
          setFormData(prev => ({
            ...prev,
            employee_id: formatted[0].id,
            employee_name: formatted[0].name,
            employee_code: formatted[0].code,
            department: formatted[0].department
          }));
        }
      }).catch(() => {});
    }
  }, [isOpen, record]);

  useEffect(() => {
    if (record) {
      const extractTime = (str) => {
        if (!str) return '';
        if (str.includes(' ')) return str.split(' ')[1].slice(0, 5);
        if (str.includes('T')) return str.split('T')[1].slice(0, 5);
        return str.slice(0, 5);
      };

      setFormData({
        employee_id: record.employee_id || 1,
        employee_name: record.employee_name || '',
        employee_code: record.employee_code || '',
        department: record.department || '',
        date: record.date || new Date().toISOString().split('T')[0],
        check_in: extractTime(record.check_in),
        check_out: extractTime(record.check_out),
        status: record.status || 'Present',
        overtime_hours: record.overtime_hours || 0,
        correction_reason: record.notes || ''
      });
    } else {
      setFormData({
        employee_id: employeeList[0]?.id || 1,
        employee_name: employeeList[0]?.name || '',
        employee_code: employeeList[0]?.code || '',
        department: employeeList[0]?.department || '',
        date: new Date().toISOString().split('T')[0],
        check_in: '09:00',
        check_out: '18:00',
        status: 'Present',
        overtime_hours: 0,
        correction_reason: ''
      });
    }
    setErrors({});
  }, [record, isOpen]);

  if (!isOpen) return null;

  const handleEmployeeChange = (e) => {
    const empId = Number(e.target.value);
    const emp = employeeList.find((item) => item.id === empId);
    if (emp) {
      setFormData((prev) => ({
        ...prev,
        employee_id: emp.id,
        employee_name: emp.name,
        employee_code: emp.code,
        department: emp.department
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    if (formData.status !== 'Absent') {
      if (formData.check_in && formData.check_out) {
        const start = new Date(`${formData.date}T${formData.check_in}`);
        const end = new Date(`${formData.date}T${formData.check_out}`);
        if (end <= start) {
          newErrors.check_out = 'Check out time must be later than check in time';
        }
      }
    }

    if (isEdit && !formData.correction_reason?.trim()) {
      newErrors.correction_reason = 'Correction reason is required for audit logs';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (isEdit) {
        const res = await attendanceService.updateAttendanceRecord(record.id, formData);
        if (res.success) {
          showToast('Attendance record updated successfully!', 'success');
          if (onSuccess) onSuccess(res.data);
          onClose();
        } else {
          showToast(res.error || 'Failed to update record', 'error');
        }
      } else {
        const res = await attendanceService.createAttendanceRecord(formData);
        if (res.success) {
          showToast('New attendance record created!', 'success');
          if (onSuccess) onSuccess(res.data);
          onClose();
        } else {
          showToast(res.error || 'Failed to create record', 'error');
        }
      }
    } catch (err) {
      showToast(err.message || 'An error occurred while saving', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isEdit ? 'Manual Attendance Correction' : 'New Attendance Record'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEdit
                ? `Authorized audit correction for ${formData.employee_name}`
                : 'Log a verified attendance entry for an employee'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Employee Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Employee <span className="text-rose-500">*</span>
            </label>
            {isEdit ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800">
                {formData.employee_name} ({formData.employee_code}) - {formData.department}
              </div>
            ) : (
              <select
                name="employee_id"
                value={formData.employee_id}
                onChange={handleEmployeeChange}
                className="form-select text-sm w-full"
              >
                {employeeList.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.code}) - {emp.department}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date & Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={`form-input text-sm w-full ${errors.date ? 'border-rose-500' : ''}`}
              />
              {errors.date && <span className="text-xs text-rose-600 mt-1 block font-medium">{errors.date}</span>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Status <span className="text-rose-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-select text-sm w-full"
              >
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Half Day">Half Day</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
          </div>

          {/* Check In & Check Out Row (disabled if status is Absent) */}
          {formData.status !== 'Absent' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Check In Time
                </label>
                <input
                  type="time"
                  name="check_in"
                  value={formData.check_in}
                  onChange={handleChange}
                  className="form-input text-sm w-full font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Check Out Time
                </label>
                <input
                  type="time"
                  name="check_out"
                  value={formData.check_out}
                  onChange={handleChange}
                  className={`form-input text-sm w-full font-mono ${errors.check_out ? 'border-rose-500' : ''}`}
                />
                {errors.check_out && <span className="text-xs text-rose-600 mt-1 block font-medium">{errors.check_out}</span>}
              </div>
            </div>
          )}

          {/* Overtime */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Overtime Hours
            </label>
            <input
              type="number"
              step="0.25"
              min="0"
              max="12"
              name="overtime_hours"
              value={formData.overtime_hours}
              onChange={handleChange}
              placeholder="0.00"
              className="form-input text-sm w-full"
            />
          </div>

          {/* Correction Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Correction Reason / Audit Notes {isEdit && <span className="text-rose-500">*</span>}
            </label>
            <textarea
              name="correction_reason"
              rows={3}
              value={formData.correction_reason}
              onChange={handleChange}
              placeholder="Provide reason for manual attendance correction or creation..."
              className={`form-textarea text-sm w-full ${errors.correction_reason ? 'border-rose-500' : ''}`}
            />
            {errors.correction_reason && (
              <span className="text-xs text-rose-600 mt-1 block font-medium">
                {errors.correction_reason}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-sm"
            >
              {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualCorrectionModal;
