import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, AlertCircle } from 'lucide-react';
import { MOCK_EMPLOYEE_LIST } from '../../data/attendanceMockData';
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
    if (record) {
      // Extract time part from datetime strings if present
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
      const defaultEmp = MOCK_EMPLOYEE_LIST[0];
      setFormData({
        employee_id: defaultEmp.id,
        employee_name: defaultEmp.name,
        employee_code: defaultEmp.code,
        department: defaultEmp.department,
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
    const emp = MOCK_EMPLOYEE_LIST.find((item) => item.id === empId);
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
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.75rem',
          width: '100%',
          maxWidth: '34rem',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
              {isEdit ? 'Manual Attendance Correction' : 'New Attendance Record'}
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>
              {isEdit
                ? `Authorized correction for ${formData.employee_name}`
                : 'Create a manual attendance entry for an employee'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: '0.375rem',
              borderRadius: '0.375rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {/* Employee Select */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
              Employee <span style={{ color: '#EF4444' }}>*</span>
            </label>
            {isEdit ? (
              <div
                style={{
                  padding: '0.625rem 0.875rem',
                  backgroundColor: '#F1F5F9',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#1E293B',
                  fontWeight: 500
                }}
              >
                {formData.employee_name} ({formData.employee_code}) - {formData.department}
              </div>
            ) : (
              <select
                name="employee_id"
                value={formData.employee_id}
                onChange={handleEmployeeChange}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.875rem',
                  outline: 'none',
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A'
                }}
              >
                {MOCK_EMPLOYEE_LIST.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.code}) - {emp.department}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date & Status Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                Date <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: `1px solid ${errors.date ? '#EF4444' : '#CBD5E1'}`,
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
              {errors.date && <span style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '0.25rem', display: 'block' }}>{errors.date}</span>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                Status <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.875rem',
                  outline: 'none',
                  backgroundColor: '#FFFFFF'
                }}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                  Check In Time
                </label>
                <input
                  type="time"
                  name="check_in"
                  value={formData.check_in}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
                  Check Out Time
                </label>
                <input
                  type="time"
                  name="check_out"
                  value={formData.check_out}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${errors.check_out ? '#EF4444' : '#CBD5E1'}`,
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                />
                {errors.check_out && <span style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '0.25rem', display: 'block' }}>{errors.check_out}</span>}
              </div>
            </div>
          )}

          {/* Overtime */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
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
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #CBD5E1',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Correction Reason */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '0.375rem' }}>
              Correction Reason / Audit Notes {isEdit && <span style={{ color: '#EF4444' }}>*</span>}
            </label>
            <textarea
              name="correction_reason"
              rows={3}
              value={formData.correction_reason}
              onChange={handleChange}
              placeholder="Provide reason for manual attendance correction or creation..."
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                border: `1px solid ${errors.correction_reason ? '#EF4444' : '#CBD5E1'}`,
                fontSize: '0.875rem',
                outline: 'none',
                resize: 'vertical'
              }}
            />
            {errors.correction_reason && (
              <span style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '0.25rem', display: 'block' }}>
                {errors.correction_reason}
              </span>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#475569',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '0.5rem',
                border: 'none',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                opacity: loading ? 0.7 : 1
              }}
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
