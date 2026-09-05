import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ChevronRight, AlertCircle } from 'lucide-react';
import { Badge, LoadingSpinner } from '../common/CommonUI';

export const AttendanceTable = ({ records = [], loading = false, onRowClick }) => {
  const navigate = useNavigate();

  const handleRowClick = (record) => {
    if (onRowClick) {
      onRowClick(record);
    } else {
      navigate(`/attendance/${record.id}`);
    }
  };

  const formatClockTime = (timeStr) => {
    if (!timeStr) return '—';
    if (timeStr.includes(' ')) return timeStr.split(' ')[1].slice(0, 5);
    if (timeStr.includes('T')) return timeStr.split('T')[1].slice(0, 5);
    return timeStr.slice(0, 5);
  };

  if (loading) {
    return <LoadingSpinner text="Loading attendance logs..." />;
  }

  return (
    <div className="table-container">
      <table className="custom-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Check In</th>
            <th>Check Out</th>
            <th>Worked Hours</th>
            <th>Status</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan={6} className="py-12 text-center text-slate-400">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <AlertCircle size={32} className="text-slate-500" />
                  <p className="text-base font-semibold text-slate-200">No attendance records found.</p>
                  <p className="text-xs text-slate-400">Try adjusting your filters or date range.</p>
                </div>
              </td>
            </tr>
          ) : (
            records.map((row, idx) => (
              <tr
                key={row.id || idx}
                onClick={() => handleRowClick(row)}
                className="cursor-pointer group"
              >
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-950 border border-sky-500/30 text-sky-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {row.employee_name?.charAt(0) || row.first_name?.charAt(0) || 'E'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-100 group-hover:text-sky-400 transition-colors text-sm">
                        {row.employee_name || `${row.first_name || ''} ${row.last_name || ''}`}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {row.employee_code || row.emp_code} • {row.department_name || row.department || 'General'}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="text-sm font-medium text-slate-200">
                  <div className="flex items-center gap-2">
                    {row.check_in && <Clock size={14} className="text-sky-400" />}
                    <span>{formatClockTime(row.check_in)}</span>
                  </div>
                </td>

                <td className="text-sm font-medium text-slate-200">
                  <div className="flex items-center gap-2">
                    {row.check_out && <Clock size={14} className="text-slate-400" />}
                    <span>{formatClockTime(row.check_out)}</span>
                  </div>
                </td>

                <td>
                  <span className="font-bold text-slate-100 text-sm">
                    {row.worked_hours !== undefined && row.worked_hours !== null ? Number(row.worked_hours).toFixed(2) : '0.00'} hrs
                  </span>
                </td>

                <td>
                  <Badge status={row.status} />
                </td>

                <td className="text-right">
                  <ChevronRight size={18} className="text-slate-500 group-hover:text-sky-400 transition-colors" />
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
