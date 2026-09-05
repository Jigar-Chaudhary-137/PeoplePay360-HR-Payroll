import React, { useState, useEffect } from 'react';
import { Clock, Plus, Calendar, Globe, CalendarDays } from 'lucide-react';
import { scheduleAPI } from '../../services/api';
import { LoadingSpinner, EmptyState } from '../../components/common/CommonUI';
import { ScheduleFormModal } from './ScheduleFormModal';
import { useNotify } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export function ScheduleList() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const { showToast } = useNotify();
  const { hasRole } = useAuth();

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const res = await scheduleAPI.getAll();
      setSchedules(res.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">
              Working Schedules
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
              {schedules.length} Schedules
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Weekly working hour models, daily shift boundaries, and attendance baselines
          </p>
        </div>

        {hasRole('HR Manager', 'Admin') && (
          <button onClick={() => setModalOpen(true)} className="btn-primary text-xs px-3.5 py-2 self-start sm:self-auto">
            <Plus size={15} />
            <span>New Schedule</span>
          </button>
        )}
      </div>

      {/* Schedules Cards Grid */}
      {loading ? (
        <LoadingSpinner text="Loading working schedules..." />
      ) : schedules.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No working schedules configured"
          description="Create weekly schedules to define working hours for employee attendance and contracts."
          actionText={hasRole('HR Manager', 'Admin') ? "Create Schedule" : null}
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {schedules.map((s) => (
            <div key={s.id} className="card p-5 space-y-4 hover:border-blue-300 transition-all shadow-2xs hover:shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-base font-heading">{s.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 font-medium">
                    <span>{s.company || 'Enterprise'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Globe size={12} />
                      {s.timezone || 'Asia/Kolkata'}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs shrink-0">
                  {s.hours_per_week}h / wk
                </span>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider font-heading">
                  <span>Shift Days</span>
                  <span className="text-slate-700 font-medium">{s.days_per_week} Days Active</span>
                </div>

                <div className="space-y-1.5">
                  {(s.days || []).map((d) => (
                    <div key={d.id || d.day_name} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="font-semibold text-slate-800">{d.day_name}</span>
                      <span className="text-slate-500 font-mono text-[11px]">{d.start_time?.slice(0, 5)} - {d.end_time?.slice(0, 5)}</span>
                      <span className="font-bold text-blue-600">{d.work_hours} hrs</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <ScheduleFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadSchedules}
      />
    </div>
  );
}
