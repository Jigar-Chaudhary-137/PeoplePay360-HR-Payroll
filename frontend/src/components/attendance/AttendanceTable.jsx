import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, User, ChevronRight, AlertCircle } from 'lucide-react';

/**
 * Enterprise Attendance Table Component
 */
export const AttendanceTable = ({ records = [], loading = false, onRowClick }) => {
  const navigate = useNavigate();

  const handleRowClick = (record) => {
    if (onRowClick) {
      onRowClick(record);
    } else {
      navigate(`/attendance/${record.id}`);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'present':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.25rem 0.625rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: '#ECFDF5',
              color: '#047857',
              border: '1px solid #A7F3D0'
            }}
          >
            <span style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', backgroundColor: '#10B981' }} />
            Present
          </span>
        );
      case 'late':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.25rem 0.625rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: '#FFFBEB',
              color: '#B45309',
              border: '1px solid #FDE68A'
            }}
          >
            <span style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
            Late
          </span>
        );
      case 'half day':
      case 'half_day':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.25rem 0.625rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: '#F5F3FF',
              color: '#6D28D9',
              border: '1px solid #DDD6FE'
            }}
          >
            <span style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', backgroundColor: '#8B5CF6' }} />
            Half Day
          </span>
        );
      case 'absent':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.25rem 0.625rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: '#FEF2F2',
              color: '#B91C1C',
              border: '1px solid #FECACA'
            }}
          >
            <span style={{ width: '0.375rem', height: '0.375rem', borderRadius: '50%', backgroundColor: '#EF4444' }} />
            Absent
          </span>
        );
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.25rem 0.625rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 500,
              backgroundColor: '#F1F5F9',
              color: '#475569'
            }}
          >
            {status || '—'}
          </span>
        );
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const clean = dateStr.includes('T') ? dateStr.split('T')[0] : (dateStr.includes(' ') ? dateStr.split(' ')[0] : dateStr);
      const [y, m, d] = clean.split('-');
      if (y && m && d) {
        const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
        return dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      }
      return clean;
    } catch {
      return dateStr;
    }
  };

  const formatClockTime = (timeStr) => {
    if (!timeStr) return '—';
    // If it contains space or T, get the HH:mm
    if (timeStr.includes(' ')) {
      return timeStr.split(' ')[1].slice(0, 5);
    }
    if (timeStr.includes('T')) {
      return timeStr.split('T')[1].slice(0, 5);
    }
    return timeStr.slice(0, 5);
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
        <div style={{ display: 'inline-block', width: '2rem', height: '2rem', border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>Loading attendance records...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '760px' }}>
        <thead>
          <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Employee
            </th>
            <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Date
            </th>
            <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Check In
            </th>
            <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Check Out
            </th>
            <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Worked Hours
            </th>
            <th style={{ padding: '0.875rem 1.25rem', fontSize: '0.75rem', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Status
            </th>
            <th style={{ padding: '0.875rem 1.25rem', width: '40px' }} />
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#64748B' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={32} color="#94A3B8" />
                  <span style={{ fontSize: '0.9375rem', fontWeight: 500 }}>No attendance records found for the selected filters.</span>
                  <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>Try adjusting your date, status, or search query.</span>
                </div>
              </td>
            </tr>
          ) : (
            records.map((row, idx) => (
              <tr
                key={row.id || idx}
                onClick={() => handleRowClick(row)}
                style={{
                  borderBottom: '1px solid #F1F5F9',
                  backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F0F7FF')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA')}
              >
                {/* Employee Column */}
                <td style={{ padding: '0.875rem 1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '2.25rem',
                        height: '2.25rem',
                        borderRadius: '50%',
                        backgroundColor: '#E0E7FF',
                        color: '#3730A3',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        flexShrink: 0,
                        overflow: 'hidden'
                      }}
                    >
                      {row.avatar ? (
                        <img src={row.avatar} alt={row.employee_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        row.employee_name?.charAt(0) || 'E'
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>
                        {row.employee_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {row.employee_code} • {row.department || 'General'}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Date Column */}
                <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.875rem', color: '#334155', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {formatDate(row.date)}
                </td>

                {/* Check In Column */}
                <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.875rem', color: row.check_in ? '#1E293B' : '#94A3B8', fontWeight: row.check_in ? 500 : 400 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    {row.check_in && <Clock size={14} color="#64748B" />}
                    <span>{formatClockTime(row.check_in)}</span>
                  </div>
                </td>

                {/* Check Out Column */}
                <td style={{ padding: '0.875rem 1.25rem', fontSize: '0.875rem', color: row.check_out ? '#1E293B' : '#94A3B8', fontWeight: row.check_out ? 500 : 400 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    {row.check_out && <Clock size={14} color="#64748B" />}
                    <span>{formatClockTime(row.check_out)}</span>
                  </div>
                </td>

                {/* Worked Hours Column */}
                <td style={{ padding: '0.875rem 1.25rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: row.worked_hours > 0 ? '#0F172A' : '#94A3B8' }}>
                    {row.worked_hours !== undefined && row.worked_hours !== null ? Number(row.worked_hours).toFixed(2) : '0.00'} hrs
                  </span>
                  {row.overtime_hours > 0 && (
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#2563EB', fontWeight: 500 }}>
                      (+{Number(row.overtime_hours).toFixed(2)} OT)
                    </span>
                  )}
                </td>

                {/* Status Column */}
                <td style={{ padding: '0.875rem 1.25rem' }}>
                  {getStatusBadge(row.status)}
                </td>

                {/* Action arrow */}
                <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>
                  <ChevronRight size={16} color="#94A3B8" />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;
