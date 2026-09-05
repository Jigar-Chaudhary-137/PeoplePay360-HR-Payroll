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
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Context Banner if filtering for specific employee */}
      {employeeId && currentFilteredEmployee && (
        <div
          style={{
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '0.75rem',
            padding: '0.75rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#1E40AF' }}>
            <User size={16} />
            <span>
              Showing attendance history for <strong style={{ color: '#1E3A8A' }}>{currentFilteredEmployee.name}</strong> ({currentFilteredEmployee.code})
            </span>
          </div>
          <Link
            to="/attendance"
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#2563EB',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <ArrowLeft size={14} />
            <span>View All Employees</span>
          </Link>
        </div>
      )}

      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.025em',
                margin: 0
              }}
            >
              Attendance
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>
              List view of employee attendance records
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
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                padding: '0.625rem 1.25rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                boxShadow: '0 1px 3px 0 rgba(37, 99, 235, 0.3)',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1D4ED8')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563EB')}
            >
              <Plus size={18} />
              <span>New Entry</span>
            </button>
          )}
        </div>

        {/* Quick Stat Highlights */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}
        >
          <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>Total Records</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginTop: '0.25rem' }}>{totalCount}</div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669', textTransform: 'uppercase' }}>Present</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#059669', marginTop: '0.25rem' }}>{presentCount}</div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#D97706', textTransform: 'uppercase' }}>Late Arrival</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D97706', marginTop: '0.25rem' }}>{lateCount}</div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#DC2626', textTransform: 'uppercase' }}>Absent</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#DC2626', marginTop: '0.25rem' }}>{absentCount}</div>
          </div>
        </div>
      </div>

      {/* Main Content Card with Filters & Table */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.75rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}
      >
        {/* Filters Bar */}
        <div
          style={{
            padding: '1.25rem',
            borderBottom: '1px solid #E2E8F0',
            backgroundColor: '#FAFAFA',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 280px' }}>
            <Search
              size={16}
              color="#94A3B8"
              style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search attendance…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.875rem 0.5rem 2.5rem',
                borderRadius: '0.5rem',
                border: '1px solid #CBD5E1',
                fontSize: '0.875rem',
                backgroundColor: '#FFFFFF',
                color: '#0F172A',
                outline: 'none'
              }}
            />
          </div>

          {/* Filter Dropdowns */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            {/* Date Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Calendar size={15} color="#64748B" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  padding: '0.45rem 0.625rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.8125rem',
                  backgroundColor: '#FFFFFF',
                  color: '#1E293B',
                  outline: 'none'
                }}
              />
            </div>

            {/* Employee Filter */}
            {!employeeId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <User size={15} color="#64748B" />
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  style={{
                    padding: '0.45rem 0.625rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.8125rem',
                    backgroundColor: '#FFFFFF',
                    color: '#1E293B',
                    outline: 'none'
                  }}
                >
                  <option value="">All Employees</option>
                  {MOCK_EMPLOYEE_LIST.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <Filter size={15} color="#64748B" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{
                  padding: '0.45rem 0.625rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #CBD5E1',
                  fontSize: '0.8125rem',
                  backgroundColor: '#FFFFFF',
                  color: '#1E293B',
                  outline: 'none'
                }}
              >
                <option value="All">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Half Day">Half Day</option>
                <option value="Absent">Absent</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                  color: '#64748B',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
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
        <div
          style={{
            padding: '0.875rem 1.25rem',
            borderTop: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8125rem',
            color: '#64748B'
          }}
        >
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
