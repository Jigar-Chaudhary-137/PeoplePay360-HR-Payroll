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
    <div className="space-y-6 pb-6 text-[#17151F]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E5EF]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#17151F]">
              Working Schedules
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F1ECFF] text-[#6C3FF5] border border-[#DDD9E8] font-bold">
              {schedules.length} Schedules
            </span>
          </div>
          <p className="text-sm text-[#625E6E] mt-0.5">
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
            <div key={s.id} className="glass-card p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-[#17151F] text-base">{s.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-[#625E6E] mt-0.5 font-medium">
                    <span>{s.company || 'Enterprise'}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-[#6C3FF5]">
                      <Globe size={12} />
                      {s.timezone || 'Asia/Kolkata'}
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-[#F1ECFF] border border-[#DDD9E8] text-[#6C3FF5] font-bold text-xs shrink-0 font-mono">
                  {s.hours_per_week}h / wk
                </span>
              </div>

              <div className="space-y-2 pt-3 border-t border-[#E7E5EF]">
                <div className="flex items-center justify-between text-xs font-bold text-[#918C9F] uppercase tracking-wider">
                  <span>Shift Days</span>
                  <span className="text-[#625E6E] font-medium">{s.days_per_week} Days Active</span>
                </div>

                <div className="space-y-1.5">
                  {(s.days || []).map((d) => (
                    <div key={d.id || d.day_name} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-[#F8F8FC] border border-[#DDD9E8]">
                      <span className="font-semibold text-[#17151F]">{d.day_name}</span>
                      <span className="text-[#625E6E] font-mono text-[11px]">{d.start_time?.slice(0, 5)} - {d.end_time?.slice(0, 5)}</span>
                      <span className="font-bold text-[#6C3FF5]">{d.work_hours} hrs</span>
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
