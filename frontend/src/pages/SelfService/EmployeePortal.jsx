import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock, LogIn, LogOut, CalendarOff, FileText, Download,
  CheckCircle2, CreditCard, DollarSign, Plus, User
} from 'lucide-react';
import { attendanceAPI, timeOffAPI, payslipAPI, employeeAPI } from '../../services/api';
import { Badge, LoadingSpinner, StatCard } from '../../components/common/CommonUI';
import { TimeOffRequestModal } from '../TimeOff/TimeOffRequestModal';
import { useNotify } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export function EmployeePortal() {
  const { user } = useAuth();
  const { showToast } = useNotify();

  const [todayStatus, setTodayStatus] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [myPayslips, setMyPayslips] = useState([]);
  const [myProfile, setMyProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [todayRes, allocRes, psRes] = await Promise.all([
        attendanceAPI.getToday(),
        timeOffAPI.getAllocations({ employee_id: user?.employee_id, year: 2026 }),
        payslipAPI.getAll({ employee_id: user?.employee_id })
      ]);
      setTodayStatus(todayRes.data || null);
      setAllocations(allocRes.data || []);
      setMyPayslips(psRes.data || []);

      if (user?.employee_id) {
        const empRes = await employeeAPI.getById(user.employee_id);
        setMyProfile(empRes.data || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCheckIn = async () => {
    setPunchLoading(true);
    try {
      await attendanceAPI.checkIn({});
      showToast('Checked in successfully!', 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setPunchLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setPunchLoading(true);
    try {
      const res = await attendanceAPI.checkOut({});
      showToast(res.message, 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setPunchLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your self-service portal..." />;
  }

  const latestPayslip = myPayslips[0];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="glass-card p-6 bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/40 border-sky-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-wider text-sky-400">Employee Self-Service</span>
            <h1 className="text-2xl font-black text-slate-100 mt-0.5">
              Welcome, {user?.first_name} {user?.last_name}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Code: <strong className="text-slate-200 font-mono">{user?.emp_code}</strong> • Role: <strong className="text-slate-200">{user?.role}</strong> • Department: <strong className="text-slate-200">{user?.department_name}</strong>
            </p>
          </div>

          <button onClick={() => setLeaveModalOpen(true)} className="btn-primary text-xs">
            <Plus size={15} />
            <span>Apply For Leave</span>
          </button>
        </div>
      </div>

      {/* Top Grid: Punch In Card & Latest Payslip Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendance Punch Card */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2 font-bold text-slate-100 text-sm">
              <Clock size={18} className="text-sky-400" />
              <span>Daily Attendance Punch</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-white/5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Today's Check-In:</span>
              <span className="font-bold text-slate-100 font-mono text-sm">
                {todayStatus?.check_in ? todayStatus.check_in.split(' ')[1] || todayStatus.check_in.split('T')[1]?.slice(0, 5) : 'Not Punched'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Today's Check-Out:</span>
              <span className="font-bold text-slate-100 font-mono text-sm">
                {todayStatus?.check_out ? todayStatus.check_out.split(' ')[1] || todayStatus.check_out.split('T')[1]?.slice(0, 5) : 'In Progress'}
              </span>
            </div>
            {todayStatus?.worked_hours > 0 && (
              <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                <span className="text-slate-400">Total Worked:</span>
                <span className="font-extrabold text-sky-400">{todayStatus.worked_hours} Hours</span>
              </div>
            )}
          </div>

          <div className="pt-1">
            {!todayStatus?.check_in ? (
              <button
                onClick={handleCheckIn}
                disabled={punchLoading}
                className="btn-success w-full py-2.5"
              >
                <LogIn size={16} />
                <span>Punch Check-In</span>
              </button>
            ) : !todayStatus?.check_out ? (
              <button
                onClick={handleCheckOut}
                disabled={punchLoading}
                className="btn-primary w-full py-2.5"
              >
                <LogOut size={16} />
                <span>Punch Check-Out</span>
              </button>
            ) : (
              <div className="text-center p-2.5 rounded-lg bg-emerald-950/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle2 size={16} />
                <span>Shift Completed for Today</span>
              </div>
            )}
          </div>
        </div>

        {/* Latest Payslip Summary Card */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2 font-bold text-slate-100 text-sm">
              <DollarSign size={18} className="text-emerald-400" />
              <span>Latest Salary Disbursement</span>
            </div>
            {latestPayslip && <Badge status={latestPayslip.status} />}
          </div>

          {latestPayslip ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 to-slate-950 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">Period: {latestPayslip.period_month}</span>
                  <span className="text-2xl font-black text-emerald-400">
                    ₹{Number(latestPayslip.net_salary).toLocaleString()}
                  </span>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <p>Gross: ₹{Number(latestPayslip.gross_salary).toLocaleString()}</p>
                  <p className="text-rose-400">Deductions: ₹{Number(latestPayslip.total_deductions).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <Link to={`/payslips/${latestPayslip.id}`} className="btn-secondary text-xs flex-1 text-center">
                  View Full Breakdown
                </Link>
                <a
                  href={payslipAPI.getPDFUrl(latestPayslip.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary text-xs flex-1 text-center"
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </a>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No finalized payslips available yet.</p>
          )}
        </div>
      </div>

      {/* Leave Balances Grid */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-100 text-sm">My Leave Balances (2026)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {allocations.map((al) => (
            <div key={al.id} className="glass-card p-4 space-y-2 border-l-4" style={{ borderColor: al.type_color }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-300 uppercase">{al.type_name}</p>
                <span className="text-[11px] text-slate-400">Total: {al.allocated_days}d</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-100">{al.remaining_days}</span>
                <span className="text-xs text-slate-400">days available</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(al.remaining_days / al.allocated_days) * 100}%`,
                    backgroundColor: al.type_color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leave Modal */}
      <TimeOffRequestModal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
