import React, { useState, useEffect } from 'react';
import { Modal } from '../common/CommonUI';
import { Calendar, User, FileText, Info, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { timeOffService } from '../../services/timeOffService';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';

export default function RequestTimeOffModal({
  isOpen,
  onClose,
  onSuccess
}) {
  const { user } = useAuth();
  const { showToast } = useNotify();

  const employees = timeOffService.getEmployees();
  const leaveTypes = timeOffService.getLeaveTypes();

  // Form State
  const [employeeId, setEmployeeId] = useState('1');
  const [leaveType, setLeaveType] = useState('Paid Time Off');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [calculatedDays, setCalculatedDays] = useState(0);

  // Status & Validation State
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [allocationInfo, setAllocationInfo] = useState(null);

  // Initialize defaults when modal opens
  useEffect(() => {
    if (isOpen) {
      // Find matching employee or default to 1
      const initialEmp = employees.find(e => e.name === `${user?.first_name} ${user?.last_name}`) || employees[0];
      setEmployeeId(String(initialEmp.id));
      setLeaveType('Paid Time Off');
      
      // Default to today or tomorrow
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
      setReason('');
      setErrors({});
    }
  }, [isOpen, user]);

  // Recalculate duration whenever start/end dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end < start) {
        setCalculatedDays(0);
        setErrors(prev => ({ ...prev, endDate: 'End date cannot be earlier than start date.' }));
      } else {
        const diffTime = Math.abs(end - start);
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setCalculatedDays(days);
        setErrors(prev => {
          const updated = { ...prev };
          delete updated.endDate;
          return updated;
        });
      }
    } else {
      setCalculatedDays(0);
    }
  }, [startDate, endDate]);

  // Update allocation preview whenever employee or leaveType changes
  useEffect(() => {
    if (employeeId && leaveType) {
      const info = timeOffService.getAllocationBalance(Number(employeeId), leaveType);
      setAllocationInfo(info);
    }
  }, [employeeId, leaveType]);

  const validate = () => {
    const errs = {};
    if (!employeeId) errs.employeeId = 'Employee is required.';
    if (!leaveType) errs.leaveType = 'Leave type is required.';
    if (!startDate) errs.startDate = 'Start date is required.';
    if (!endDate) errs.endDate = 'End date is required.';
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      errs.endDate = 'End date cannot be earlier than start date.';
    }
    if (!reason.trim()) {
      errs.reason = 'Please provide a reason for the request.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const selectedEmp = employees.find(e => String(e.id) === String(employeeId));
      const payload = {
        employee_id: Number(employeeId),
        employee_name: selectedEmp ? selectedEmp.name : 'Aarav Mehta',
        employee_code: selectedEmp ? selectedEmp.code : 'EMP001',
        department: selectedEmp ? selectedEmp.department : 'Engineering',
        manager_name: selectedEmp ? selectedEmp.manager : 'Sara Khan',
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        duration: calculatedDays,
        reason: reason.trim()
      };

      const res = await timeOffService.createRequest(payload);
      if (res.success) {
        showToast(res.message || 'Time off request created successfully!', 'success');
        if (onSuccess) onSuccess();
        onClose();
      } else {
        showToast(res.error || 'Failed to submit request', 'error');
      }
    } catch (err) {
      showToast(err.message || 'An error occurred while creating request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={submitting ? undefined : onClose}
      title="Request Time Off"
      subtitle="Submit a new time off request for manager approval"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Employee & Leave Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label text-xs">
              Employee <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className={`form-select text-xs pl-8 ${errors.employeeId ? 'border-rose-500' : ''}`}
                disabled={submitting}
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.code}) - {emp.department}
                  </option>
                ))}
              </select>
              <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            {errors.employeeId && <p className="text-[11px] text-rose-400 mt-1">{errors.employeeId}</p>}
          </div>

          <div>
            <label className="form-label text-xs">
              Time Off Type <span className="text-rose-400">*</span>
            </label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className={`form-select text-xs ${errors.leaveType ? 'border-rose-500' : ''}`}
              disabled={submitting}
            >
              {leaveTypes.map((type) => (
                <option key={type.id} value={type.name}>
                  {type.name} {type.is_paid ? '(Paid)' : '(Unpaid)'}
                </option>
              ))}
            </select>
            {errors.leaveType && <p className="text-[11px] text-rose-400 mt-1">{errors.leaveType}</p>}
          </div>
        </div>

        {/* Dynamic Allocation Balance Card */}
        {allocationInfo && (
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Info size={14} className="text-sky-400" />
                Allocation Status: <span className="text-sky-400">{allocationInfo.allocation_name}</span>
              </span>
              {allocationInfo.is_paid ? (
                <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Paid Allocation
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 font-bold bg-slate-500/10 px-2 py-0.5 rounded border border-slate-500/20">
                  Unpaid (No Balance Consumed)
                </span>
              )}
            </div>

            {allocationInfo.is_paid ? (
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Allocated</span>
                  <span className="font-bold text-slate-100 text-sm">{allocationInfo.allocated} Days</span>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Used</span>
                  <span className="font-bold text-amber-400 text-sm">{allocationInfo.used} Days</span>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.03] border border-white/5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Remaining</span>
                  <span className="font-extrabold text-emerald-400 text-sm">{allocationInfo.remaining} Days</span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic pt-0.5">
                This type of leave does not consume any paid leave allocation balance.
              </p>
            )}
          </div>
        )}

        {/* Row 2: Dates & Calculated Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
          <div>
            <label className="form-label text-xs">
              Start Date <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`form-input text-xs ${errors.startDate ? 'border-rose-500' : ''}`}
                disabled={submitting}
              />
            </div>
            {errors.startDate && <p className="text-[11px] text-rose-400 mt-1">{errors.startDate}</p>}
          </div>

          <div>
            <label className="form-label text-xs">
              End Date <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`form-input text-xs ${errors.endDate ? 'border-rose-500' : ''}`}
                disabled={submitting}
              />
            </div>
            {errors.endDate && <p className="text-[11px] text-rose-400 mt-1">{errors.endDate}</p>}
          </div>

          <div>
            <label className="form-label text-xs">Calculated Duration</label>
            <div className="h-[38px] px-3.5 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-between text-xs font-bold text-slate-100">
              <span className="flex items-center gap-1.5 text-slate-400 font-normal">
                <Clock size={13} className="text-sky-400" />
                Duration:
              </span>
              <span className="text-sky-400 text-sm">
                {calculatedDays} {calculatedDays === 1 ? 'Day' : 'Days'}
              </span>
            </div>
          </div>
        </div>

        {/* Row 3: Reason */}
        <div>
          <label className="form-label text-xs">
            Reason for Time Off <span className="text-rose-400">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (errors.reason) setErrors(prev => ({ ...prev, reason: '' }));
            }}
            placeholder="Please provide details about the request (e.g., Family vacation, doctor appointment, recovery)..."
            className={`form-textarea text-xs ${errors.reason ? 'border-rose-500' : ''}`}
            disabled={submitting}
          />
          {errors.reason && <p className="text-[11px] text-rose-400 mt-1">{errors.reason}</p>}
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="btn-secondary text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || calculatedDays <= 0}
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            {submitting ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle size={14} />
            )}
            <span>{submitting ? 'Submitting...' : 'Submit Request'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
