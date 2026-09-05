import React, { useState, useEffect } from 'react';
import { Clock, Plus, Globe, CalendarDays, CheckCircle2, ShieldCheck } from 'lucide-react';
import { scheduleAPI } from '../../services/api';
import { LoadingSpinner, EmptyState } from '../../components/common/CommonUI';
import { ScheduleFormModal } from './ScheduleFormModal';
import { useNotify } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

function getScheduleFullWeek(schedule) {
  if (!schedule) return [];

  const configuredDaysMap = new Map();
  (schedule.days || []).forEach((d) => {
    const dayKey = (d.day_of_week || d.day_name || '').trim();
    if (dayKey) {
      configuredDaysMap.set(dayKey.toLowerCase(), d);
    }
  });

  return DAYS_OF_WEEK.map((dayName) => {
    const configured = configuredDaysMap.get(dayName.toLowerCase());

    if (configured) {
      const startTime = configured.start_time ? configured.start_time.slice(0, 5) : '09:00';
      const endTime = configured.end_time ? configured.end_time.slice(0, 5) : '18:00';
      const hours = Number(configured.calculated_hours || configured.work_hours || 8);
      const breakHours = Number(configured.break_hours || 1);

      return {
        day: dayName,
        isActive: true,
        startTime,
        endTime,
        hours,
        breakHours,
        shiftName: startTime === '09:00' ? 'General Day Shift' : 'Flexible Core Shift'
      };
    }

    // Default inactive weekend day
    return {
      day: dayName,
      isActive: false,
      startTime: null,
      endTime: null,
      hours: 0,
      breakHours: 0,
      shiftName: 'Weekend Off / Rest Day'
    };
  });
}

export function ScheduleList() {
  const [schedules, setSchedules] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const { showToast } = useNotify();
  const { hasRole } = useAuth();

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const res = await scheduleAPI.getAll();
      const list = res.data || [];
      setSchedules(list);
      if (list.length > 0 && !selectedId) {
        setSelectedId(list[0].id);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const activeSchedule = schedules.find((s) => s.id === selectedId) || schedules[0];
  const weekDays = getScheduleFullWeek(activeSchedule);
  const activeDaysCount = weekDays.filter((d) => d.isActive).length;
  const offDaysCount = 7 - activeDaysCount;
  const firstActiveDay = weekDays.find((d) => d.isActive);

  return (
    <div className="space-y-6 pb-8 text-[#17151F]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E5EF]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="page-title text-2xl sm:text-3xl font-extrabold text-[#17151F] font-heading">
              Working Schedule
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              Active Baseline
            </span>
          </div>
          <p className="text-sm text-[#625E6E] mt-1">
            Weekly working hour model, daily shift boundaries, and automated attendance proration
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Schedule Switcher if multiple models exist */}
          {schedules.length > 1 && (
            <div className="flex items-center gap-1 p-1 bg-[#F1ECFF] rounded-xl border border-[#DDD9E8]">
              {schedules.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedId(s.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    s.id === activeSchedule?.id
                      ? 'bg-white text-[#6D28D9] shadow-xs'
                      : 'text-[#6B7280] hover:text-[#17151F]'
                  }`}
                >
                  {s.name.includes('Standard') ? 'Standard Model' : 'Flexible Model'}
                </button>
              ))}
            </div>
          )}

          {hasRole('HR Manager', 'Admin') && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="btn-primary text-xs px-4 py-2.5 shadow-sm shrink-0"
            >
              <Plus size={16} />
              <span>New Schedule</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Viewport */}
      {loading ? (
        <LoadingSpinner text="Loading working schedule..." />
      ) : !activeSchedule ? (
        <EmptyState
          icon={CalendarDays}
          title="No working schedules configured"
          description="Create a weekly schedule to define working hours for employee attendance and contracts."
          actionText={hasRole('HR Manager', 'Admin') ? 'Create Schedule' : null}
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="glass-card p-6 sm:p-8 rounded-2xl bg-white border-[#DDD9E8] shadow-xs space-y-6">
          {/* Card Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
            <div className="flex items-start gap-4">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#F3E8FF] to-[#FAF7FF] text-[#6D28D9] border border-[#DDD9E8] flex items-center justify-center shrink-0 shadow-xs">
                <Clock size={26} />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#17151F] font-heading">
                    {activeSchedule.name}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Primary Model
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B7280] font-medium">
                  <span>{activeSchedule.company || 'PeoplePay360 Global'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-[#6D28D9]">
                    <Globe size={13} />
                    {activeSchedule.timezone || 'Asia/Kolkata'} (IST)
                  </span>
                  <span>•</span>
                  <span>5 Working Days, 2 Rest Days</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start lg:self-center">
              <span className="px-4 py-2 rounded-xl bg-[#F3E8FF] border border-[#DDD9E8] text-[#6D28D9] font-extrabold text-base font-mono shadow-2xs">
                {activeSchedule.hours_per_week || 40}h / week
              </span>
            </div>
          </div>

          {/* Metric Highlights Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 p-4 rounded-xl bg-[#FAF9FD] border border-[#E5E7EB]">
            <div className="text-center p-2">
              <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                Weekly Hours
              </div>
              <div className="text-xl font-extrabold text-[#17151F] font-heading mt-1">
                {activeSchedule.hours_per_week || 40} hrs
              </div>
              <div className="text-[11px] text-[#9CA3AF] mt-0.5">8.0 hrs / working day</div>
            </div>

            <div className="text-center p-2 border-l border-[#E5E7EB]">
              <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                Working Days
              </div>
              <div className="text-xl font-extrabold text-emerald-600 font-heading mt-1">
                {activeDaysCount} Days
              </div>
              <div className="text-[11px] text-[#9CA3AF] mt-0.5">Monday – Friday</div>
            </div>

            <div className="text-center p-2 sm:border-l border-[#E5E7EB]">
              <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                Rest Days
              </div>
              <div className="text-xl font-extrabold text-[#6B7280] font-heading mt-1">
                {offDaysCount} Days
              </div>
              <div className="text-[11px] text-[#9CA3AF] mt-0.5">Saturday & Sunday</div>
            </div>

            <div className="text-center p-2 border-l border-[#E5E7EB]">
              <div className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider">
                Standard Shift
              </div>
              <div className="text-base font-extrabold text-[#6D28D9] font-mono mt-1">
                {firstActiveDay ? `${firstActiveDay.startTime} - ${firstActiveDay.endTime}` : '09:00 - 18:00'}
              </div>
              <div className="text-[11px] text-[#9CA3AF] mt-0.5">1 hr meal break</div>
            </div>
          </div>

          {/* Professional 7-Day Schedule Table */}
          <div className="overflow-hidden rounded-xl border border-[#E5E7EB] shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8F7FC] border-b border-[#E5E7EB] text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                    <th className="py-3.5 px-6">Day</th>
                    <th className="py-3.5 px-6">Working Hours</th>
                    <th className="py-3.5 px-6">Shift</th>
                    <th className="py-3.5 px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F0F5] text-sm">
                  {weekDays.map((item) => (
                    <tr
                      key={item.day}
                      className={
                        item.isActive
                          ? 'hover:bg-[#FAF7FF] transition-colors bg-white'
                          : 'bg-[#FAF9FC]/60 hover:bg-[#F5F4F9] transition-colors'
                      }
                    >
                      <td className="py-4 px-6">
                        <span
                          className={`font-bold text-sm sm:text-base ${
                            item.isActive ? 'text-[#17151F]' : 'text-[#9CA3AF]'
                          }`}
                        >
                          {item.day}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        {item.isActive ? (
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-sm font-semibold text-[#1F2937]">
                              {item.startTime} - {item.endTime}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-lg bg-[#F3E8FF] text-[#6D28D9] font-bold text-xs font-mono border border-[#DDD9E8]">
                              {item.hours} hrs
                            </span>
                            <span className="text-xs text-[#6B7280] hidden sm:inline">
                              ({item.breakHours}h break)
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#9CA3AF] font-mono text-sm font-medium">—</span>
                        )}
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`font-medium text-sm ${
                            item.isActive ? 'text-[#374151]' : 'text-[#9CA3AF] italic'
                          }`}
                        >
                          {item.shiftName}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        {item.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Off
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Information */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-[#6B7280]">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>
                Configured as the organizational baseline for employee contract working hours and automated leave deductions.
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[#6D28D9] font-medium shrink-0">
              <ShieldCheck size={14} />
              <span>Full-Time Contract Standard</span>
            </div>
          </div>
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

export default ScheduleList;
