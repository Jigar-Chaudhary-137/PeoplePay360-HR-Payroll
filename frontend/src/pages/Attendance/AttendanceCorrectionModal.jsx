import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../../services/api';
import { Modal } from '../../components/common/CommonUI';
import { useNotify } from '../../context/NotificationContext';

export function AttendanceCorrectionModal({ isOpen, onClose, record, onSuccess }) {
  const { showToast } = useNotify();

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [breakHours, setBreakHours] = useState(1);
  const [status, setStatus] = useState('present');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (record) {
      setCheckIn(record.check_in ? record.check_in.replace('T', ' ').slice(0, 19) : '');
      setCheckOut(record.check_out ? record.check_out.replace('T', ' ').slice(0, 19) : '');
      setBreakHours(record.break_hours || 1);
      setStatus(record.status || 'present');
      setNotes(record.notes || '');
    }
  }, [record]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await attendanceAPI.manualCorrection(record.id, {
        check_in: checkIn,
        check_out: checkOut,
        break_hours: breakHours,
        status,
        notes
      });
      showToast('Attendance record corrected successfully', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!record) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Authorized Attendance Correction"
      subtitle={`Manual punch adjustment for ${record.first_name} ${record.last_name} on ${record.date.split('T')[0]}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Check-In Timestamp (YYYY-MM-DD HH:MM:SS) *</label>
            <input
              type="text"
              required
              className="form-input"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Check-Out Timestamp</label>
            <input
              type="text"
              className="form-input"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Break Duration (Hours)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              className="form-input"
              value={breakHours}
              onChange={(e) => setBreakHours(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Attendance Status</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="present">Present</option>
              <option value="half_day">Half Day</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>
        </div>

        <div>
          <label className="form-label">Correction Reason & Justification *</label>
          <textarea
            rows={2}
            required
            className="form-textarea"
            placeholder="e.g. Biometric machine sync failure / On-duty client visit"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : 'Apply Correction'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
