import React, { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';
import { attendanceService } from '../../services/attendanceService';

/**
 * Reusable Quick Attendance Check-In / Check-Out Widget for Dashboard & Portal
 */
export const QuickCheckInWidget = ({ className = '', style = {} }) => {
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

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const str = String(timeStr).trim();
    const timePart = str.includes('T') ? str.split('T')[1].slice(0, 5) : (str.includes(' ') ? str.split(' ')[1].slice(0, 5) : str.slice(0, 5));
    return timePart;
  };

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync today's attendance session on mount
  useEffect(() => {
    let isMounted = true;
    attendanceService.getAttendanceList({ employee_id: user?.employee_id || user?.id })
      .then((res) => {
        if (!isMounted) return;
        const list = res.data || [];
        const todayRec = list[0];
        if (todayRec && todayRec.check_in) {
          setSession({
            isCheckedIn: !todayRec.check_out,
            checkInTime: formatTime(todayRec.check_in),
            checkOutTime: todayRec.check_out ? formatTime(todayRec.check_out) : null,
            workedHours: todayRec.worked_hours || 0
          });
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [user]);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const res = await attendanceService.checkIn(user);
      if (res.success) {
        const timeStr = res.data.check_in ? formatTime(res.data.check_in) : '09:00';
        setSession({
          isCheckedIn: true,
          checkInTime: timeStr,
          checkOutTime: null,
          workedHours: 0
        });
        showToast('Checked in successfully! Have a productive day.', 'success');
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
        const outTimeStr = res.data.check_out ? formatTime(res.data.check_out) : '18:00';
        setSession((prev) => ({
          ...prev,
          isCheckedIn: false,
          checkOutTime: outTimeStr,
          workedHours: res.data.worked_hours || 0
        }));
        showToast(`Checked out successfully! Total worked: ${res.data.worked_hours || 0} hrs.`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to check out', 'error');
    } finally {
      setLoading(false);
    }
  };

  const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || 'Employee' : 'Team Member';

  return (
    <div
      className={`quick-attendance-widget ${className}`}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        ...style
      }}
    >
      {/* Widget Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid #F1F5F9'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '0.5rem',
              height: '0.5rem',
              borderRadius: '50%',
              backgroundColor: session.isCheckedIn ? '#10B981' : session.checkOutTime ? '#64748B' : '#EF4444',
              boxShadow: session.isCheckedIn ? '0 0 0 3px rgba(16, 185, 129, 0.2)' : 'none'
            }}
          />
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Attendance Widget
          </h4>
        </div>

        <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
          {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Greeting & Time */}
      <div style={{ marginBottom: '1.25rem' }}>
        <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: 0 }}>
          Welcome back, <strong style={{ color: '#0F172A' }}>{userName}</strong>!
        </p>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.5rem' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.025em', fontFamily: 'monospace' }}>
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: session.isCheckedIn ? '#059669' : '#64748B' }}>
            {session.isCheckedIn ? '• Active Session' : session.checkOutTime ? '• Completed Today' : '• Not Punched'}
          </span>
        </div>
      </div>

      {/* Status Info Box */}
      <div
        style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '0.5rem',
          padding: '0.875rem',
          marginBottom: '1.25rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.75rem'
        }}
      >
        <div>
          <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
            Check In
          </span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: session.checkInTime ? '#0F172A' : '#94A3B8' }}>
            {session.checkInTime || '—'}
          </span>
        </div>

        <div>
          <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
            Check Out
          </span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: session.checkOutTime ? '#0F172A' : '#94A3B8' }}>
            {session.checkOutTime || '—'}
          </span>
        </div>
      </div>

      {/* Primary Action Button */}
      {session.isCheckedIn ? (
        <button
          type="button"
          onClick={handleCheckOut}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.625rem 1rem',
            borderRadius: '0.5rem',
            border: 'none',
            backgroundColor: '#DC2626',
            color: '#FFFFFF',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            boxShadow: '0 1px 2px 0 rgba(220, 38, 38, 0.2)',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = '#B91C1C';
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = '#DC2626';
          }}
        >
          <LogOut size={16} />
          <span>{loading ? 'Recording...' : 'Check Out'}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleCheckIn}
          disabled={loading || session.checkOutTime}
          style={{
            width: '100%',
            padding: '0.625rem 1rem',
            borderRadius: '0.5rem',
            border: 'none',
            backgroundColor: session.checkOutTime ? '#94A3B8' : '#2563EB',
            color: '#FFFFFF',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: loading || session.checkOutTime ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            boxShadow: session.checkOutTime ? 'none' : '0 1px 2px 0 rgba(37, 99, 235, 0.2)',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => {
            if (!loading && !session.checkOutTime) e.currentTarget.style.backgroundColor = '#1D4ED8';
          }}
          onMouseLeave={(e) => {
            if (!loading && !session.checkOutTime) e.currentTarget.style.backgroundColor = '#2563EB';
          }}
        >
          <LogIn size={16} />
          <span>
            {loading
              ? 'Recording...'
              : session.checkOutTime
              ? 'Punched Out for Today'
              : 'Check In'}
          </span>
        </button>
      )}
    </div>
  );
};

export default QuickCheckInWidget;
