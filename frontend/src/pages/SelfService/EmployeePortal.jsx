import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock, LogIn, LogOut, CalendarOff, FileText, Download,
  CheckCircle2, CreditCard, DollarSign, Plus, User, ArrowRight
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
    <div className="space-y-6 pb-8 text-[#17151F]">
      {/* Welcome Banner */}
      <div className="glass-card p-6 bg-gradient-to-r from-[#F1ECFF] via-white to-[#F8F5FF] border-[#DDD9E8] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-[#6C3FF5]">Employee Self-Service Portal</span>
            <h1 className="text-2xl xl:text-3xl font-bold text-[#17151F] mt-1">
              Welcome back, {user?.first_name} {user?.last_name}
            </h1>
            <p className="text-sm text-[#625E6E] mt-1">
              Code: <strong className="text-[#6C3FF5] font-mono">{user?.emp_code}</strong> • Role: <strong className="text-[#17151F]">{user?.role}</strong> • Department: <strong className="text-[#17151F]">{user?.department_name || 'General Operations'}</strong>
            </p>
          </div>

          <button onClick={() => setLeaveModalOpen(true)} className="btn-primary text-sm self-start md:self-auto">
            <Plus size={16} />
            <span>Apply For Leave</span>
          </button>
        </div>
      </div>

      {/* Top Grid: Punch In Card & Latest Payslip Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendance Punch Card */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E7E5EF] pb-3.5">
            <div className="flex items-center gap-2 font-bold text-[#17151F] text-base">
              <Clock size={18} className="text-[#6C3FF5]" />
              <span>Daily Attendance Punch</span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#F8F8FC] text-[#625E6E] border border-[#DDD9E8] font-mono">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#F8F8FC] border border-[#DDD9E8] space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#625E6E]">Today's Check-In:</span>
              <span className="font-bold text-[#17151F] font-mono">
                {todayStatus?.check_in ? todayStatus.check_in.split(' ')[1] || todayStatus.check_in.split('T')[1]?.slice(0, 5) : 'Not Punched'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#625E6E]">Today's Check-Out:</span>
              <span className="font-bold text-[#17151F] font-mono">
                {todayStatus?.check_out ? todayStatus.check_out.split(' ')[1] || todayStatus.check_out.split('T')[1]?.slice(0, 5) : 'In Progress'}
              </span>
            </div>
            {todayStatus?.worked_hours > 0 && (
              <div className="flex items-center justify-between text-sm pt-2.5 border-t border-[#E7E5EF]">
                <span className="text-[#625E6E] font-medium">Total Shift Hours:</span>
                <span className="font-bold text-[#6C3FF5] font-mono">{todayStatus.worked_hours} Hours</span>
              </div>
            )}
          </div>

          <div className="pt-2">
            {!todayStatus?.check_in ? (
              <button
                onClick={handleCheckIn}
                disabled={punchLoading}
                className="btn-success w-full py-3 text-sm flex items-center justify-center gap-2"
              >
                <LogIn size={18} />
                <span>Punch Check-In</span>
              </button>
            ) : !todayStatus?.check_out ? (
              <button
                onClick={handleCheckOut}
                disabled={punchLoading}
                className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
              >
                <LogOut size={18} />
                <span>Punch Check-Out</span>
              </button>
            ) : (
              <div className="text-center p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 size={18} />
                <span>Shift Completed for Today</span>
              </div>
            )}
          </div>
        </div>

        {/* Latest Payslip Summary Card */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E7E5EF] pb-3.5">
            <div className="flex items-center gap-2 font-bold text-[#17151F] text-base">
              <DollarSign size={18} className="text-emerald-600" />
              <span>Latest Salary Disbursement</span>
            </div>
            {latestPayslip && <Badge status={latestPayslip.status} />}
          </div>

          {latestPayslip ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#625E6E] font-semibold block">Period: {latestPayslip.period_month}</span>
                  <span className="text-2xl font-black text-emerald-700">
                    ₹{Number(latestPayslip.net_salary).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-right text-xs text-[#625E6E] space-y-0.5">
                  <p>Gross: <strong className="text-[#17151F]">₹{Number(latestPayslip.gross_salary).toLocaleString('en-IN')}</strong></p>
                  <p className="text-rose-600">Deductions: <strong className="text-rose-600">₹{Number(latestPayslip.total_deductions).toLocaleString('en-IN')}</strong></p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <Link to={`/payslips/${latestPayslip.id}`} className="btn-secondary text-xs py-2.5 flex-1 text-center justify-center">
                  View Full Breakdown
                </Link>
                <a
                  href={payslipAPI.getPDFUrl(latestPayslip.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary text-xs py-2.5 flex-1 text-center justify-center"
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </a>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#625E6E] py-8 text-center">No finalized payslips available yet.</p>
          )}
        </div>
      </div>

      {/* Leave Balances Grid */}
      <div className="space-y-3.5">
        <h3 className="font-bold text-[#17151F] text-base">My Leave Balances (2026)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {allocations.map((al) => (
            <div key={al.id} className="glass-card p-5 space-y-2.5 border-l-4" style={{ borderColor: al.type_color || '#6C3FF5' }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#625E6E] uppercase tracking-wider">{al.type_name}</p>
                <span className="text-xs text-[#918C9F] font-medium">Total: {al.allocated_days}d</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#17151F]">{al.remaining_days}</span>
                <span className="text-xs text-[#625E6E] font-medium">days available</span>
              </div>
              <div className="w-full bg-[#E7E5EF] h-2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(al.remaining_days / (al.allocated_days || 1)) * 100}%`,
                    backgroundColor: al.type_color || '#6C3FF5'
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
