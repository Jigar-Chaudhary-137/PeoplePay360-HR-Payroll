import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Plus, Search, Filter, Calendar, User, 
  RotateCcw, CheckCircle2, Clock, AlertTriangle, UserX, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';
import { attendanceService } from '../../services/attendanceService';
import { MOCK_EMPLOYEE_LIST } from '../../data/attendanceMockData';
import AttendanceTable from '../../components/attendance/AttendanceTable';
import ManualCorrectionModal from '../../components/attendance/ManualCorrectionModal';
import QuickCheckInWidget from '../../components/attendance/QuickCheckInWidget';
import { StatCard } from '../../components/common/CommonUI';

export function AttendanceListPage() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { showToast } = useNotify();

  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(employeeId || '');
  const [selectedStatus, setSelectedStatus] = useState('All');

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  useEffect(() => {
    if (employeeId) {
      setSelectedEmployee(employeeId);
    }
  }, [employeeId]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const res = await attendanceService.getAttendanceList({
        search,
        date: selectedDate,
        employee_id: selectedEmployee,
        status: selectedStatus
      });
      if (res.success) {
        setRecords(res.data);
      } else {
        showToast(res.error || 'Failed to load attendance records', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Error loading attendance', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [search, selectedDate, selectedEmployee, selectedStatus]);

  const handleClearFilters = () => {
    setSearch('');
    setSelectedDate('');
    setSelectedEmployee(employeeId || '');
    setSelectedStatus('All');
  };

  const hasActiveFilters = Boolean(
    search || selectedDate || (selectedEmployee && !employeeId) || (selectedStatus && selectedStatus !== 'All')
  );

  const canManageAttendance = hasRole('Admin', 'HR Manager', 'HR Payroll Admin', 'HR Payroll User');

  const totalCount = records.length;
  const presentCount = records.filter((r) => r.status === 'Present').length;
  const lateCount = records.filter((r) => r.status === 'Late').length;
  const absentCount = records.filter((r) => r.status === 'Absent').length;

  const currentFilteredEmployee = MOCK_EMPLOYEE_LIST.find((e) => String(e.id) === String(selectedEmployee));

  return (
    <div className="space-y-6">
      {/* Context Banner */}
      {employeeId && currentFilteredEmployee && (
        <div className="glass-card p-4 flex items-center justify-between border-sky-500/30 bg-sky-500/10">
          <div className="flex items-center gap-3 text-sm text-sky-300">
            <User size={18} className="text-sky-400" />
            <span>
              Showing attendance logs for <strong className="text-white">{currentFilteredEmployee.name}</strong> ({currentFilteredEmployee.code})
            </span>
          </div>
          <Link
            to="/attendance"
            className="text-xs font-bold text-sky-400 hover:text-sky-300 inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            <span>View All Staff</span>
          </Link>
        </div>
      )}

      {/* Quick Punch Widget */}
      <QuickCheckInWidget onSuccess={fetchAttendance} />

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2.5">
            Attendance Logs &amp; GPS Verification
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
              {totalCount} Logs
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time check-in, check-out, geofencing verification, and worked hours computation
          </p>
        </div>

        {canManageAttendance && (
          <button
            type="button"
            onClick={() => {
              setEditingRecord(null);
              setIsModalOpen(true);
            }}
            className="btn-primary text-xs"
          >
            <Plus size={16} />
            <span>Manual Entry</span>
          </button>
        )}
      </div>

      {/* Quick Stat Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Logs" value={totalCount} icon={Clock} color="sky" />
        <StatCard title="Present" value={presentCount} icon={CheckCircle2} color="emerald" />
        <StatCard title="Late Arrivals" value={lateCount} icon={AlertTriangle} color="amber" />
        <StatCard title="Absent" value={absentCount} icon={UserX} color="rose" />
      </div>

      {/* Main Table Card & Filters */}
      <div className="glass-card p-5 space-y-4">
        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search employee or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-10 text-xs"
            />
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-input text-xs w-auto"
            />

            {!employeeId && (
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="form-select text-xs w-auto"
              >
                <option value="">All Employees</option>
                {MOCK_EMPLOYEE_LIST.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.code})
                  </option>
                ))}
              </select>
            )}

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="form-select text-xs w-auto"
            >
              <option value="All">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Half Day">Half Day</option>
              <option value="Absent">Absent</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn-secondary text-xs"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Component */}
        <AttendanceTable records={records} loading={loading} />
      </div>

      {/* Manual Correction Modal */}
      <ManualCorrectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        record={editingRecord}
        onSuccess={fetchAttendance}
      />
    </div>
  );
}

export default AttendanceListPage;
