import React, { useState, useEffect } from 'react';
import { timeOffAPI, employeeAPI } from '../../services/api';
import { Modal } from '../../components/common/CommonUI';
import { useNotify } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export function TimeOffRequestModal({ isOpen, onClose, onSuccess }) {
  const { showToast } = useNotify();
  const { user } = useAuth();

  const [types, setTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [allocations, setAllocations] = useState([]);

  const [selectedEmpId, setSelectedEmpId] = useState(user?.employee_id || '');
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [requestedAmount, setRequestedAmount] = useState(1);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    timeOffAPI.getTypes().then((res) => {
      setTypes(res.data || []);
      if (res.data?.[0]) setSelectedTypeId(res.data[0].id);
    });

    if (user?.role !== 'Employee') {
      employeeAPI.getAll().then((res) => setEmployees(res.data || []));
    }
  }, [user]);

  useEffect(() => {
    if (selectedEmpId) {
      timeOffAPI.getAllocations({ employee_id: selectedEmpId, year: 2026 }).then((res) => {
        setAllocations(res.data || []);
      });
    }
  }, [selectedEmpId]);

  // Selected type allocation balance
  const activeType = types.find((t) => String(t.id) === String(selectedTypeId));
  const activeAlloc = allocations.find((a) => String(a.time_off_type_id) === String(selectedTypeId));
  const remainingDays = activeAlloc ? Number(activeAlloc.remaining_days) : 0;

  // Auto-compute requested days from date range
  const handleDateChange = (start, end) => {
    if (start && end) {
      const d1 = new Date(start);
      const d2 = new Date(end);
      const diff = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);
      setRequestedAmount(diff);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTypeId || !startDate || !endDate || !reason) {
      showToast('All fields are required', 'error');
      return;
    }

    if (activeType?.requires_allocation && requestedAmount > remainingDays) {
      showToast(`Cannot request ${requestedAmount} days. Only ${remainingDays} days remaining for ${activeType.name}.`, 'error');
      return;
    }

    setLoading(true);
    try {
      await timeOffAPI.createRequest({
        employee_id: selectedEmpId,
        time_off_type_id: selectedTypeId,
        start_date: startDate,
        end_date: endDate,
        requested_amount: requestedAmount,
        reason
      });
      showToast('Leave request submitted successfully', 'success');
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
      title="Request Time Off"
      subtitle="Submit formal leave request for HR review and balance deduction"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {user?.role !== 'Employee' && (
          <div>
            <label className="form-label">Employee</label>
            <select
              className="form-select"
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
            >
              <option value="">Select Employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.emp_code})</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="form-label">Time Off Type *</label>
          <select
            className="form-select"
            value={selectedTypeId}
            onChange={(e) => setSelectedTypeId(e.target.value)}
          >
            {types.map((t) => (
              <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
            ))}
          </select>
        </div>

        {/* Live Balance indicator */}
        {activeType?.requires_allocation && (
          <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-500/30 flex items-center justify-between">
            <span className="text-slate-300">Available Balance:</span>
            <span className="text-sm font-extrabold text-sky-400">{remainingDays} Days Available</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="form-label">Start Date *</label>
            <input
              type="date"
              required
              className="form-input"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                handleDateChange(e.target.value, endDate);
              }}
            />
          </div>
          <div>
            <label className="form-label">End Date *</label>
            <input
              type="date"
              required
              className="form-input"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                handleDateChange(startDate, e.target.value);
              }}
            />
          </div>
          <div>
            <label className="form-label">Requested Days *</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              required
              className="form-input font-bold text-slate-100"
              value={requestedAmount}
              onChange={(e) => setRequestedAmount(Number(e.target.value))}
            />
          </div>
        </div>

        <div>
          <label className="form-label">Reason for Time Off *</label>
          <textarea
            rows={3}
            required
            placeholder="Please specify reason for absence..."
            className="form-textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
