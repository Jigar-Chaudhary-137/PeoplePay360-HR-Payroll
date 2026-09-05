import React, { useState, useEffect } from 'react';
import { Clock, Plus } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2.5">
            Working Schedules
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
              {schedules.length} Schedules
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Weekly working hour models, daily shift boundaries, and attendance baselines
          </p>
        </div>

        {hasRole('HR Manager', 'Admin') && (
          <button onClick={() => setModalOpen(true)} className="btn-primary text-xs">
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
          icon={Clock}
          title="No working schedules configured"
          description="Create weekly schedules to define working hours for employee attendance and contracts."
          actionText={hasRole('HR Manager', 'Admin') ? "Create Schedule" : null}
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {schedules.map((s) => (
            <div key={s.id} className="glass-card p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-100 text-base">{s.name}</h3>
                  <p className="text-xs text-slate-400">{s.company} • {s.timezone}</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-sky-950 border border-sky-500/30 text-sky-400 font-extrabold text-xs">
                  {s.hours_per_week} hrs/wk
                </span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Shift Days ({s.days_per_week} Days)</p>
                {(s.days || []).map((d) => (
                  <div key={d.id || d.day_name} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-white/5">
                    <span className="font-semibold text-slate-200">{d.day_name}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{d.start_time.slice(0, 5)} - {d.end_time.slice(0, 5)}</span>
                    <span className="font-bold text-sky-400">{d.work_hours}h</span>
                  </div>
                ))}
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
