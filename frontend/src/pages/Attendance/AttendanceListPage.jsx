import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Plus, Search, Filter, Calendar, User, 
  RotateCcw, CheckCircle2, Clock, AlertTriangle, UserX, ArrowLeft,
  MapPin, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';
import { attendanceService } from '../../services/attendanceService';
import { employeeAPI } from '../../services/api';
import AttendanceTable from '../../components/attendance/AttendanceTable';
import ManualCorrectionModal from '../../components/attendance/ManualCorrectionModal';
import QuickCheckInWidget from '../../components/attendance/QuickCheckInWidget';
import { StatCard } from '../../components/common/CommonUI';

/**
 * Enterprise Attendance List Page (/attendance & /employees/:employeeId/attendance)
 */
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
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  useEffect(() => {
    if (employeeId) {
      setSelectedEmployee(employeeId);
    }
  }, [employeeId]);

  // Load real employees for dropdown
  useEffect(() => {
    employeeAPI.getAll()
      .then((res) => setEmployees(res.data || []))
      .catch(() => {});
  }, []);

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
  const presentCount = records.filter((r) => (r.status || '').toLowerCase() === 'present').length;
  const lateCount = records.filter((r) => (r.status || '').toLowerCase() === 'late').length;
  const absentCount = records.filter((r) => (r.status || '').toLowerCase() === 'absent').length;

  const currentFilteredEmployee = employees.find((e) => String(e.id) === String(selectedEmployee));

  return (
    <div className="space-y-6 pb-6">
      {/* Context Banner if filtering for specific employee */}
      {employeeId && currentFilteredEmployee && (
        <div className="card p-4 bg-blue-50/50 border-blue-200 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5 text-sm text-blue-900 font-medium">
            <User size={18} className="text-blue-600" />
            <span>
              Showing attendance history for <strong className="text-slate-900 font-bold">{currentFilteredEmployee.first_name} {currentFilteredEmployee.last_name}</strong> ({currentFilteredEmployee.emp_code})
            </span>
          </div>
          <Link
            to="/attendance"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>All Employees</span>
          </Link>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">
              Attendance & Time Tracking
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
              {totalCount} Logs
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time biometric punch records, working hours, and GPS location verification
          </p>
        </div>

        {canManageAttendance && (
          <button
            type="button"
            onClick={() => {
              setEditingRecord(null);
              setIsModalOpen(true);
            }}
            className="btn-primary text-xs px-3.5 py-2 self-start sm:self-auto"
          >
            <Plus size={15} />
            <span>Manual Entry</span>
          </button>
        )}
      </div>

      {/* Quick Check-In Widget (Live punch) */}
      <QuickCheckInWidget onSuccess={fetchAttendance} />

      {/* Quick Stat Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Logs"
          value={totalCount}
          subtitle="Filtered window"
          icon={Clock}
          color="sky"
        />
        <StatCard
          title="Present On-Duty"
          value={presentCount}
          subtitle="Punctual check-ins"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Late Arrivals"
          value={lateCount}
          subtitle="Grace period exceeded"
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="Recorded Absences"
          value={absentCount}
          subtitle="Unexcused / pending"
          icon={UserX}
          color="rose"
        />
      </div>

      {/* Filters Bar Card */}
      <div className="card p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 flex-wrap">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search by employee name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-9 text-xs py-2"
            />
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="form-input text-xs py-2 px-2.5 w-36"
              />
            </div>

            {/* Employee Filter */}
            {!employeeId && (
              <div className="flex items-center gap-2">
                <User size={15} className="text-slate-400" />
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="form-select text-xs py-2"
                >
                  <option value="">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.emp_code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-slate-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="form-select text-xs py-2"
              >
                <option value="All">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Half Day">Half Day</option>
                <option value="Absent">Absent</option>
              </select>
            </div>

            {/* Reset Filter Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn-secondary text-xs px-2.5 py-2 flex items-center gap-1.5"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="custom-table-container">
          <AttendanceTable
            records={records}
            loading={loading}
            onRowClick={(row) => navigate(`/attendance/${row.id}`)}
          />
        </div>

        {/* Footer Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>Displaying <strong>{records.length}</strong> attendance audit records</span>
          <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <ShieldCheck size={14} className="text-emerald-600" />
            Biometric & GPS Tracking Active
          </span>
        </div>
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
