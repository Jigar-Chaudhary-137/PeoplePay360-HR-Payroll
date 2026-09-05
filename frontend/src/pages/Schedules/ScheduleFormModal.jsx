import React, { useState } from 'react';
import { scheduleAPI } from '../../services/api';
import { Modal } from '../../components/common/CommonUI';
import { useNotify } from '../../context/NotificationContext';

export function ScheduleFormModal({ isOpen, onClose, onSuccess }) {
  const { showToast } = useNotify();

  const [name, setName] = useState('');
  const [company, setCompany] = useState('PeoplePay360 Global');
  const [days, setDays] = useState([
    { day_of_week: 1, day_name: 'Monday', start_time: '09:00', end_time: '18:00', break_hours: 1 },
    { day_of_week: 2, day_name: 'Tuesday', start_time: '09:00', end_time: '18:00', break_hours: 1 },
    { day_of_week: 3, day_name: 'Wednesday', start_time: '09:00', end_time: '18:00', break_hours: 1 },
    { day_of_week: 4, day_name: 'Thursday', start_time: '09:00', end_time: '18:00', break_hours: 1 },
    { day_of_week: 5, day_name: 'Friday', start_time: '09:00', end_time: '18:00', break_hours: 1 }
  ]);
  const [loading, setLoading] = useState(false);

  // Real-time calculation of weekly hours
  const calculateTotalWeeklyHours = () => {
    return days.reduce((total, d) => {
      const [sh, sm] = d.start_time.split(':').map(Number);
      const [eh, em] = d.end_time.split(':').map(Number);
      const gross = Math.max(0, ((eh * 60 + em) - (sh * 60 + sm)) / 60);
      return total + Math.max(0, gross - (Number(d.break_hours) || 0));
    }, 0);
  };

  const handleDayChange = (index, field, value) => {
    const updated = [...days];
    updated[index][field] = value;
    setDays(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) {
      showToast('Please enter a schedule name', 'error');
      return;
    }

    setLoading(true);
    try {
      await scheduleAPI.create({ name, company, timezone: 'Asia/Kolkata', days });
      showToast('Working schedule created successfully', 'success');
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
      title="Create Working Schedule"
      subtitle="Configure daily work shifts and computed weekly hours"
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Schedule Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Flexible Tech 40-Hour"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Company</label>
            <input
              type="text"
              className="form-input"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>
        </div>

        {/* Weekly Hours Live Counter */}
        <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-500/30 flex items-center justify-between">
          <span className="font-semibold text-slate-200">Dynamically Calculated Weekly Hours:</span>
          <span className="text-xl font-extrabold text-sky-400">{calculateTotalWeeklyHours()} Hours / Week</span>
        </div>

        {/* Day-by-Day Configuration Table */}
        <div className="space-y-2">
          <p className="font-bold text-slate-300">Daily Shifts</p>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {days.map((d, index) => {
              const [sh, sm] = d.start_time.split(':').map(Number);
              const [eh, em] = d.end_time.split(':').map(Number);
              const gross = Math.max(0, ((eh * 60 + em) - (sh * 60 + sm)) / 60);
              const netHours = Math.max(0, gross - (Number(d.break_hours) || 0));

              return (
                <div key={d.day_name} className="grid grid-cols-5 gap-2 items-center p-2 rounded-lg bg-white/5 border border-white/5">
                  <span className="font-bold text-slate-200">{d.day_name}</span>
                  <div>
                    <input
                      type="time"
                      className="form-input py-1 text-xs"
                      value={d.start_time}
                      onChange={(e) => handleDayChange(index, 'start_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <input
                      type="time"
                      className="form-input py-1 text-xs"
                      value={d.end_time}
                      onChange={(e) => handleDayChange(index, 'end_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="4"
                      placeholder="Break (hr)"
                      className="form-input py-1 text-xs"
                      value={d.break_hours}
                      onChange={(e) => handleDayChange(index, 'break_hours', e.target.value)}
                    />
                  </div>
                  <span className="text-right font-bold text-sky-400">{netHours} hrs</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : 'Create Working Schedule'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
