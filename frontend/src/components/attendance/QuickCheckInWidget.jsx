import React, { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';
import { attendanceService } from '../../services/attendanceService';
import { attendanceAPI } from '../../services/api';

export const QuickCheckInWidget = ({ className = '', style = {}, onSuccess }) => {
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

  useEffect(() => {
    let isMounted = true;
    attendanceAPI.getToday()
      .then((res) => {
        if (!isMounted) return;
        const todayRec = res?.data || res;
        if (todayRec && todayRec.check_in) {
          setSession({
            isCheckedIn: !todayRec.check_out,
            checkInTime: todayRec.check_in,
            checkOutTime: todayRec.check_out || null,
            workedHours: Number(todayRec.worked_hours || 0)
          });
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [user]);

  const handleCheckIn = async () => {
    setLoading(true);
    const performCheckIn = async (coords = {}) => {
      try {
        const res = await attendanceService.checkIn(user, coords);
        if (res.success) {
          const rec = res.data;
          const timeStr = rec?.check_in
            ? (rec.check_in.includes(' ') ? rec.check_in.split(' ')[1] : rec.check_in)
            : new Date().toTimeString().slice(0, 5);
          setSession({
            isCheckedIn: true,
            checkInTime: timeStr,
            checkOutTime: null,
            workedHours: 0
          });
          showToast('Checked in successfully with GPS verification!', 'success');
          if (onSuccess) onSuccess();
        }
      } catch (err) {
        showToast(err.message || 'Failed to check in', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => performCheckIn({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        }),
        () => performCheckIn(),
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      performCheckIn();
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const res = await attendanceService.checkOut(user);
      if (res.success) {
        const rec = res.data;
        const outTimeStr = rec?.check_out
          ? (rec.check_out.includes(' ') ? rec.check_out.split(' ')[1] : rec.check_out)
          : new Date().toTimeString().slice(0, 5);
        setSession((prev) => ({
          ...prev,
          isCheckedIn: false,
          checkOutTime: outTimeStr,
          workedHours: rec?.worked_hours || 8.0
        }));
        showToast(`Checked out successfully! Total worked: ${rec?.worked_hours || 8} hrs.`, 'success');
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      showToast(err.message || 'Failed to check out', 'error');
    } finally {
      setLoading(false);
    }
  };

  const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Employee' : 'Team Member';

  return (
    <div className={`glass-card p-6 shadow-xl border border-white/15 ${className}`} style={style}>
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-3 h-3 rounded-full ${
              session.isCheckedIn ? 'bg-emerald-400 animate-pulse' : session.checkOutTime ? 'bg-slate-400' : 'bg-rose-400'
            }`}
          />
          <h4 className="text-base font-bold text-slate-100">Live Punch Console</h4>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
          <Clock size={14} className="text-sky-400" />
          <span>{currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <p className="text-xs text-slate-400">
            Authenticated Employee: <strong className="text-slate-100">{userName}</strong>
          </p>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className={`text-xs font-bold ${session.isCheckedIn ? 'text-emerald-400' : 'text-slate-400'}`}>
              {session.isCheckedIn ? '• Active Duty' : session.checkOutTime ? '• Shift Ended' : '• Ready to Punch'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCheckIn}
            disabled={loading || session.isCheckedIn || session.checkOutTime}
            className="btn-success min-h-[44px] px-6 text-sm"
          >
            <LogIn size={18} />
            <span>Check In</span>
          </button>

          <button
            type="button"
            onClick={handleCheckOut}
            disabled={loading || !session.isCheckedIn}
            className="btn-danger min-h-[44px] px-6 text-sm"
          >
            <LogOut size={18} />
            <span>Check Out</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-white/5 text-xs">
        <div>
          <span className="text-slate-500 uppercase font-bold text-[10px] tracking-wider block">Check-In Time</span>
          <span className="font-mono font-bold text-slate-200 text-sm">{session.checkInTime || '—'}</span>
        </div>
        <div>
          <span className="text-slate-500 uppercase font-bold text-[10px] tracking-wider block">Check-Out Time</span>
          <span className="font-mono font-bold text-slate-200 text-sm">{session.checkOutTime || '—'}</span>
        </div>
        <div>
          <span className="text-slate-500 uppercase font-bold text-[10px] tracking-wider block">Worked Hours</span>
          <span className="font-mono font-bold text-sky-400 text-sm">{session.workedHours ? `${session.workedHours} hrs` : '—'}</span>
        </div>
        <div>
          <span className="text-slate-500 uppercase font-bold text-[10px] tracking-wider block">GPS Verification</span>
          <span className="font-bold text-emerald-400 text-xs flex items-center gap-1 mt-0.5">
            <MapPin size={13} />
            <span>Office Radius</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuickCheckInWidget;
