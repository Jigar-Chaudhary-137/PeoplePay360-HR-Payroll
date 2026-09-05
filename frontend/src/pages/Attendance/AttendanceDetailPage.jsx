import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Clock, Calendar, Building, 
  User, CheckCircle2, AlertCircle, FileText, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';
import { attendanceService } from '../../services/attendanceService';
import ManualCorrectionModal from '../../components/attendance/ManualCorrectionModal';

/**
 * Page 2: Attendance Detail Page (/attendance/:attendanceId)
 */
export function AttendanceDetailPage() {
  const { attendanceId } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { showToast } = useNotify();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchRecord = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await attendanceService.getAttendanceById(attendanceId);
      if (res.success && res.data) {
        setRecord(res.data);
      } else {
        setError(res.error || 'Attendance record not found');
      }
    } catch (err) {
      setError(err.message || 'Unable to load attendance record');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (attendanceId) {
      fetchRecord();
    }
  }, [attendanceId]);

  const canEdit = hasRole('Admin', 'HR Manager', 'HR Payroll Admin');

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'present':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 600, backgroundColor: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0' }}>
            <span style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', backgroundColor: '#10B981' }} />
            Present
          </span>
        );
      case 'late':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 600, backgroundColor: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' }}>
            <span style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
            Late
          </span>
        );
      case 'half day':
      case 'half_day':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 600, backgroundColor: '#F5F3FF', color: '#6D28D9', border: '1px solid #DDD6FE' }}>
            <span style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', backgroundColor: '#8B5CF6' }} />
            Half Day
          </span>
        );
      case 'absent':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 600, backgroundColor: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' }}>
            <span style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', backgroundColor: '#EF4444' }} />
            Absent
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 500, backgroundColor: '#F1F5F9', color: '#475569' }}>
            {status || '—'}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '5rem 0', textAlign: 'center', color: '#64748B' }}>
        <div style={{ display: 'inline-block', width: '2.5rem', height: '2.5rem', border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', fontSize: '0.9375rem', fontWeight: 500 }}>Loading attendance record...</p>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div style={{ maxWidth: '36rem', margin: '4rem auto', textAlign: 'center', backgroundColor: '#FFFFFF', padding: '3rem', borderRadius: '0.75rem', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <AlertCircle size={48} color="#EF4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
          Record Not Found
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#64748B', marginBottom: '1.5rem' }}>
          {error || `The attendance record with ID #${attendanceId} could not be located.`}
        </p>
        <Link
          to="/attendance"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#2563EB',
            color: '#FFFFFF',
            padding: '0.625rem 1.25rem',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.875rem'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Attendance</span>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Back Link */}
      <div style={{ marginBottom: '1rem' }}>
        <Link
          to="/attendance"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#64748B',
            textDecoration: 'none',
            transition: 'color 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#2563EB')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
        >
          <ArrowLeft size={16} />
          <span>Back to Attendance List</span>
        </Link>
      </div>

      {/* Header Section */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <div>
          {/* Breadcrumb Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#64748B', marginBottom: '0.25rem' }}>
            <span>Attendance</span>
            <span>/</span>
            <span style={{ color: '#0F172A', fontWeight: 600 }}>{record.employee_name}</span>
            <span>/</span>
            <span>{record.date}</span>
          </div>

          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.025em',
              margin: 0
            }}
          >
            {record.employee_name} • {record.date}
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>
            Form view of one attendance record
          </p>
        </div>

        {/* Edit Action for Authorized HR */}
        {canEdit && (
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
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
            <Edit size={16} />
            <span>Edit Record</span>
          </button>
        )}
      </div>

      {/* Main Two-Column Detail Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.75rem',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          marginBottom: '1.5rem'
        }}
      >
        {/* Card Header Banner */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                backgroundColor: '#E0E7FF',
                color: '#3730A3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: 700,
                overflow: 'hidden'
              }}
            >
              {record.avatar ? (
                <img src={record.avatar} alt={record.employee_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                record.employee_name?.charAt(0) || 'E'
              )}
            </div>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                {record.employee_name}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.125rem 0 0 0' }}>
                {record.employee_code} • {record.department}
              </p>
            </div>
          </div>

          <div>{getStatusBadge(record.status)}</div>
        </div>

        {/* Two-Column Field Layout */}
        <div
          style={{
            padding: '1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem'
          }}
        >
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Employee */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Employee
              </label>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A' }}>
                {record.employee_name} ({record.employee_code})
              </div>
            </div>

            {/* Check In */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Check In
              </label>
              <div style={{ fontSize: '0.9375rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} color="#64748B" />
                <span>{record.check_in || '— No check in recorded'}</span>
              </div>
            </div>

            {/* Check Out */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Check Out
              </label>
              <div style={{ fontSize: '0.9375rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={16} color="#64748B" />
                <span>{record.check_out || '— No check out recorded'}</span>
              </div>
            </div>

            {/* Worked Hours Highlight */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Worked Hours
              </label>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A' }}>
                {Number(record.worked_hours || 0).toFixed(2)} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748B' }}>hours</span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Department */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Department
              </label>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Building size={16} color="#64748B" />
                <span>{record.department || 'General'}</span>
              </div>
            </div>

            {/* Manager */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Manager
              </label>
              <div style={{ fontSize: '0.9375rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={16} color="#64748B" />
                <span>{record.manager_name || 'Direct Supervisor'}</span>
              </div>
            </div>

            {/* Status */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Status
              </label>
              <div>{getStatusBadge(record.status)}</div>
            </div>

            {/* Overtime Highlight */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #E2E8F0' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Overtime
              </label>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: record.overtime_hours > 0 ? '#2563EB' : '#64748B' }}>
                {Number(record.overtime_hours || 0).toFixed(2)} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748B' }}>hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-width Notes & Audit Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '0.75rem',
          border: '1px solid #E2E8F0',
          padding: '1.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <FileText size={18} color="#2563EB" />
          <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
            Notes & System Audit
          </h4>
        </div>

        <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
          {record.notes || 'System-generated from check-in/out or manually corrected by an authorized user.'}
        </p>

        <div
          style={{
            marginTop: '1rem',
            paddingTop: '0.75rem',
            borderTop: '1px dashed #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.75rem',
            color: '#94A3B8'
          }}
        >
          <Shield size={14} />
          <span>Attendance logs are immutable and tracked for statutory payroll proration and overtime calculation.</span>
        </div>
      </div>

      {/* Manual Correction Modal */}
      <ManualCorrectionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        record={record}
        onSuccess={(updated) => {
          setRecord(updated);
        }}
      />
    </div>
  );
}

export default AttendanceDetailPage;
