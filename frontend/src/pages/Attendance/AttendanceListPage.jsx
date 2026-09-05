import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Plus, Search, Filter, Calendar, User, 
  RotateCcw, CheckCircle2, Clock, AlertTriangle, ArrowLeft
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

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(employeeId || '');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Data & Modal State
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
        setRecords(res.data || []);
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
        <div className="glass-card p-4 flex items-center justify-between border-sky-500/30 bg-sky-950/20">
          <div className="flex items-center gap-3 text-sm text-sky-200 font-medium">
            <User size={18} className="text-sky-400" />
            <span>
              Showing attendance history for <strong className="text-white font-bold">{currentFilteredEmployee.name}</strong> ({currentFilteredEmployee.code})
            </span>
          </div>
          <Link to="/attendance" className="btn-secondary btn-sm flex items-center gap-1.5">
            <ArrowLeft size={14} />
            <span>All Employees</span>
          </Link>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2.5">
            Attendance Tracking
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              GPS Verified
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time check-in, check-out, geofence radius verification, and worked hours proration
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
            <span>New Punch Entry</span>
          </button>
        )}
      </div>

      {/* Quick Check-In Widget (Live punch) */}
      <QuickCheckInWidget onSuccess={fetchAttendance} />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Records" value={totalCount} icon={Clock} color="sky" />
        <StatCard title="Present Today" value={presentCount} icon={CheckCircle2} color="emerald" />
        <StatCard title="Late Arrivals" value={lateCount} icon={AlertTriangle} color="amber" />
        <StatCard title="Absences Recorded" value={absentCount} icon={User} color="rose" />
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search attendance by employee..."
            className="form-input pl-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={15} className="absolute left-3 top-3 text-slate-400" />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <input
            type="date"
            className="form-input text-xs w-auto"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />

          {!employeeId && (
            <select
              className="form-select text-xs w-auto"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">All Staff</option>
              {MOCK_EMPLOYEE_LIST.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          )}

          <select
            className="form-select text-xs w-auto"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Half Day">Half Day</option>
            <option value="Absent">Absent</option>
          </select>

          {hasActiveFilters && (
            <button onClick={handleClearFilters} className="btn-secondary btn-sm flex items-center gap-1">
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Attendance Table */}
      <div className="glass-card overflow-hidden">
        <AttendanceTable records={records} loading={loading} />
      </div>

      {/* Correction Modal */}
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
