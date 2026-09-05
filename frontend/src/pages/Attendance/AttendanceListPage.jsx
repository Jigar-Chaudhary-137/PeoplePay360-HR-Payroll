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

/**
 * Page 1: Attendance List Page (/attendance & /employees/:employeeId/attendance)
 */
export function AttendanceListPage() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { showToast } = useNotify();

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(''); // Default can be all or today
  const [selectedEmployee, setSelectedEmployee] = useState(employeeId || '');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Data & Modal State
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // If opened with employeeId route parameter, initialize filter
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

  // Stats calculation
  const totalCount = records.length;
  const presentCount = records.filter((r) => r.status === 'Present').length;
  const lateCount = records.filter((r) => r.status === 'Late').length;
  const absentCount = records.filter((r) => r.status === 'Absent').length;
  const halfDayCount = records.filter((r) => r.status === 'Half Day').length;

  const currentFilteredEmployee = MOCK_EMPLOYEE_LIST.find((e) => String(e.id) === String(selectedEmployee));

  return (
    <div className="space-y-6 pb-8 text-[#17151F]">
      {/* Context Banner if filtering for specific employee */}
      {employeeId && currentFilteredEmployee && (
        <div className="glass-card p-4 border-[#DDD9E8] bg-[#F1ECFF] flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-[#6C3FF5]">
            <User size={16} />
            <span>
              Showing attendance history for <strong className="text-[#17151F]">{currentFilteredEmployee.name}</strong> ({currentFilteredEmployee.code})
            </span>
          </div>
          <Link
            to="/attendance"
            className="text-xs font-semibold text-[#6C3FF5] hover:text-[#5125C7] flex items-center gap-1 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>View All Employees</span>
          </Link>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col gap-4 border-b border-[#E7E5EF] pb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="page-title">
              Attendance
            </h1>
            <p className="text-sm text-[#625E6E] mt-0.5">
              List view of employee attendance records, daily punches, and worked hours
            </p>
          </div>

          {/* New Attendance Entry Action for HR Roles */}
          {canManageAttendance && (
            <button
              type="button"
              onClick={() => {
                setEditingRecord(null);
                setIsModalOpen(true);
              }}
              className="btn-primary text-xs px-3.5 py-2"
            >
              <Plus size={16} />
              <span>New Entry</span>
            </button>
          )}
        </div>

        {/* Quick Stat Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <span className="text-xs font-semibold text-[#625E6E] uppercase tracking-wider">Total Records</span>
            <div className="text-2xl font-bold text-[#17151F] mt-1">{totalCount}</div>
          </div>

          <div className="glass-card p-4 border-emerald-200 bg-emerald-50">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Present</span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">{presentCount}</div>
          </div>

          <div className="glass-card p-4 border-amber-200 bg-amber-50">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Late Arrival</span>
            <div className="text-2xl font-bold text-amber-700 mt-1">{lateCount}</div>
          </div>

          <div className="glass-card p-4 border-rose-200 bg-rose-50">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Absent</span>
            <div className="text-2xl font-bold text-rose-700 mt-1">{absentCount}</div>
          </div>
        </div>
      </div>

      {/* Main Content Card with Filters & Table */}
      <div className="glass-card overflow-hidden">
        {/* Filters Bar */}
        <div className="p-4 border-b border-[#E7E5EF] bg-white flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative min-w-[240px] flex-1">
            <Search
              size={15}
              className="absolute left-3 top-2.5 text-[#918C9F]"
            />
            <input
              type="text"
              placeholder="Search attendance…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-9 text-xs"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center flex-wrap gap-3">
            {/* Date Filter */}
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-[#625E6E]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="form-input text-xs py-1.5"
              />
            </div>

            {/* Employee Filter */}
            {!employeeId && (
              <div className="flex items-center gap-1.5">
                <User size={14} className="text-[#625E6E]" />
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="form-select text-xs py-1.5"
                >
                  <option value="" className="bg-white">All Employees</option>
                  {MOCK_EMPLOYEE_LIST.map((emp) => (
                    <option key={emp.id} value={emp.id} className="bg-white">
                      {emp.name} ({emp.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-[#625E6E]" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="form-select text-xs py-1.5"
              >
                <option value="All" className="bg-white">All Statuses</option>
                <option value="Present" className="bg-white">Present</option>
                <option value="Late" className="bg-white">Late</option>
                <option value="Half Day" className="bg-white">Half Day</option>
                <option value="Absent" className="bg-white">Absent</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn-secondary text-xs px-2.5 py-1.5"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Table View */}
        <AttendanceTable records={records} loading={loading} />

        {/* Footer Summary */}
        <div className="p-3 px-4 border-t border-[#E7E5EF] bg-white flex items-center justify-between text-xs text-[#625E6E]">
          <span>Showing <strong>{records.length}</strong> attendance entries</span>
          <span>Updated just now</span>
        </div>
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
