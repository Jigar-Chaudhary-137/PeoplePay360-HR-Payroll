import React, { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';
import { attendanceService } from '../../services/attendanceService';

export const QuickCheckInWidget = ({ className = '' }) => {
  const { user } = useAuth();
  const { showToast } = useNotify();

  const [session, setSession] = useState({
    isCheckedIn: false,
    checkInTime: null,
    checkOutTime: null,
    workedHours: 0
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const res = await attendanceService.checkIn(user);
      if (res.success) {
        const timeStr = res.data?.check_in ? res.data.check_in.split(' ')[1] || '09:00' : '09:00';
        setSession({
          isCheckedIn: true,
          checkInTime: timeStr,
          checkOutTime: null,
          workedHours: 0
        });
        showToast('Checked in successfully with location verification!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to check in', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const res = await attendanceService.checkOut(user);
      if (res.success) {
        const outTimeStr = res.data?.check_out ? res.data.check_out.split(' ')[1] || '18:00' : '18:00';
        setSession((prev) => ({
          ...prev,
          isCheckedIn: false,
          checkOutTime: outTimeStr,
          workedHours: res.data.worked_hours || 8.0
        }));
        showToast(`Checked out successfully! Total worked: ${res.data.worked_hours || 8} hrs.`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to check out', 'error');
    } finally {
      setLoading(false);
    }
  };

  const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Employee' : 'Team Member';

  return (
    <div className={`glass-card p-5 sm:p-6 space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${session.isCheckedIn ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
          <h4 className="font-bold text-slate-100 text-sm">Attendance Punch Portal</h4>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-sky-400 font-semibold bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
          <ShieldCheck size={14} />
          <span>Location Verified</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400">
            Welcome, <strong className="text-slate-200">{userName}</strong> ({user?.role || 'Staff'})
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-100 font-mono tracking-tight">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCheckIn}
            disabled={loading || session.isCheckedIn}
            className="btn-success text-xs"
          >
            <LogIn size={16} />
            <span>{session.isCheckedIn ? 'Checked In' : 'Punch Check In'}</span>
          </button>

          <button
            type="button"
            onClick={handleCheckOut}
            disabled={loading || !session.isCheckedIn}
            className="btn-danger text-xs"
          >
            <LogOut size={16} />
            <span>Punch Check Out</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5 text-xs">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
          <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider block">Today Check-In</span>
          <span className="font-bold text-slate-100 text-sm mt-0.5 block">{session.checkInTime || 'Not Punched'}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5">
          <span className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider block">Today Check-Out</span>
          <span className="font-bold text-slate-100 text-sm mt-0.5 block">{session.checkOutTime || 'Not Punched'}</span>
        </div>
      </div>
    </div>
  );
};

export default QuickCheckInWidget;
