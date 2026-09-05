import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, LogIn, LogOut, Search, Filter, Edit, CheckCircle } from 'lucide-react';
import { attendanceAPI } from '../../services/api';
import { Badge, LoadingSpinner, EmptyState } from '../../components/common/CommonUI';
import { AttendanceCorrectionModal } from './AttendanceCorrectionModal';
import { useNotify } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export function AttendanceList() {
  const [attendance, setAttendance] = useState([]);
  const [todayStatus, setTodayStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const { showToast } = useNotify();
  const { user, hasRole } = useAuth();

  const loadData = async () => {
    setLoading(true);
    try {
      const [attRes, todayRes] = await Promise.all([
        attendanceAPI.getAll({ date: dateFilter, status: statusFilter }),
        attendanceAPI.getToday()
      ]);
      setAttendance(attRes.data || []);
      setTodayStatus(todayRes.data || null);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateFilter, statusFilter]);

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

  return (
    <div className="space-y-6">
      {/* Header & Check In/Out Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2.5">
            Attendance Operations
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
              {attendance.length} Logs
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Biometric punch records, worked hours computation, and authorized corrections
          </p>
        </div>

        {/* Self Punch Card */}
        <div className="glass-card p-3.5 flex items-center gap-4">
          <div className="text-xs">
            <span className="text-slate-400 block">Today's Status:</span>
            <span className="font-bold text-slate-200">
              {todayStatus?.check_out
                ? `Completed (${todayStatus.worked_hours}h worked)`
                : todayStatus?.check_in
                ? `Punched In at ${todayStatus.check_in.split(' ')[1] || todayStatus.check_in.split('T')[1]?.slice(0, 5)}`
                : 'Not Punched Today'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!todayStatus?.check_in ? (
              <button
                onClick={handleCheckIn}
                disabled={punchLoading}
                className="btn-success text-xs py-1.5 px-3"
              >
                <LogIn size={14} />
                <span>Punch In</span>
              </button>
            ) : !todayStatus?.check_out ? (
              <button
                onClick={handleCheckOut}
                disabled={punchLoading}
                className="btn-primary text-xs py-1.5 px-3"
              >
                <LogOut size={14} />
                <span>Punch Out</span>
              </button>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 px-2 py-1 bg-emerald-950/40 rounded-lg border border-emerald-500/30">
                <CheckCircle size={14} />
                <span>Day Completed</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            type="date"
            className="form-input text-xs w-44"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
          <select
            className="form-select text-xs w-40"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="present">Present</option>
            <option value="half_day">Half Day</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="on_leave">On Leave</option>
          </select>
        </div>

        {(dateFilter || statusFilter) && (
          <button
            onClick={() => {
              setDateFilter('');
              setStatusFilter('');
            }}
            className="btn-secondary text-xs"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Logs Table */}
      {loading ? (
        <LoadingSpinner text="Loading attendance logs..." />
      ) : attendance.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No attendance records found"
          description="Try adjusting your filter criteria or use Punch In to register attendance."
        />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Worked Hours</th>
                  <th>Overtime</th>
                  <th>Status</th>
                  {hasRole('HR Manager', 'Admin') && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {attendance.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link
                        to={`/employees/${a.employee_id}`}
                        className="font-bold text-slate-100 hover:text-sky-400 transition-colors block text-sm"
                      >
                        {a.first_name} {a.last_name}
                      </Link>
                      <span className="text-[11px] text-slate-400">{a.emp_code} • {a.department_name}</span>
                    </td>
                    <td className="text-slate-200 font-semibold">{a.date.split('T')[0]}</td>
                    <td className="text-slate-300 font-mono text-xs">
                      {a.check_in ? (a.check_in.split(' ')[1] || a.check_in.split('T')[1]?.slice(0, 5)) : '-'}
                    </td>
                    <td className="text-slate-300 font-mono text-xs">
                      {a.check_out ? (a.check_out.split(' ')[1] || a.check_out.split('T')[1]?.slice(0, 5)) : '-'}
                    </td>
                    <td>
                      <span className="font-extrabold text-sky-400 text-sm">{a.worked_hours} hrs</span>
                      {a.break_hours > 0 && (
                        <span className="text-[10px] text-slate-500 block">Break: {a.break_hours}h</span>
                      )}
                    </td>
                    <td className="text-xs font-semibold text-emerald-400">
                      {Number(a.overtime_hours) > 0 ? `+${a.overtime_hours}h OT` : '-'}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Badge status={a.status} />
                        {a.is_manual_correction && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                            Edited
                          </span>
                        )}
                      </div>
                      {a.notes && <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">{a.notes}</p>}
                    </td>
                    {hasRole('HR Manager', 'Admin') && (
                      <td className="text-right">
                        <button
                          onClick={() => {
                            setEditingRecord(a);
                            setCorrectionModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-sky-400 transition-colors"
                          title="Authorized Correction"
                        >
                          <Edit size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Correction Modal */}
      <AttendanceCorrectionModal
        isOpen={correctionModalOpen}
        onClose={() => setCorrectionModalOpen(false)}
        record={editingRecord}
        onSuccess={loadData}
      />
    </div>
  );
}
