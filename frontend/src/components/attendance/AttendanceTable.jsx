import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, User, ChevronRight, AlertCircle, MapPin, CheckCircle2 } from 'lucide-react';
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
    if (timeStr.includes(' ')) {
      return timeStr.split(' ')[1].slice(0, 5);
    }
    if (timeStr.includes('T')) {
      return timeStr.split('T')[1].slice(0, 5);
    }
    return timeStr.slice(0, 5);
  };

  if (loading) {
    return <LoadingSpinner text="Loading attendance ledger..." />;
  }

  if (records.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400 space-y-2">
        <AlertCircle size={36} className="mx-auto text-slate-400" />
        <p className="text-base font-bold text-slate-800 font-heading">No attendance records found</p>
        <p className="text-xs text-slate-500">Try adjusting your date, status, or search query filter.</p>
      </div>
    );
  }

  return (
    <div className="custom-table-container">
      <table className="custom-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Check In</th>
            <th>Check Out</th>
            <th>Worked Hours</th>
            <th>Verification</th>
            <th>Status</th>
            <th className="w-10 text-right" />
          </tr>
        </thead>
        <tbody>
          {records.map((row, idx) => {
            const isVerified = row.location_verified === true || row.location_verified === 1;
            return (
              <tr
                key={row.id || idx}
                onClick={() => handleRowClick(row)}
                className="group cursor-pointer hover:bg-slate-50"
              >
                {/* Employee Column */}
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {row.avatar ? (
                        <img src={row.avatar} alt={row.employee_name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        row.employee_name ? row.employee_name.slice(0, 2).toUpperCase() : 'EM'
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors font-heading">
                        {row.employee_name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {row.employee_code} • {row.department || 'General Operations'}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Check In Column */}
                <td>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                    {row.check_in ? (
                      <>
                        <Clock size={14} className="text-emerald-600" />
                        <span>{formatClockTime(row.check_in)}</span>
                      </>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                </td>

                {/* Check Out Column */}
                <td>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                    {row.check_out ? (
                      <>
                        <Clock size={14} className="text-blue-600" />
                        <span>{formatClockTime(row.check_out)}</span>
                      </>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                </td>

                {/* Worked Hours Column */}
                <td>
                  <div className="text-sm font-bold text-slate-900 font-heading">
                    {row.worked_hours !== undefined && row.worked_hours !== null ? Number(row.worked_hours).toFixed(2) : '0.00'} hrs
                    {Number(row.overtime_hours) > 0 && (
                      <span className="ml-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        +{Number(row.overtime_hours).toFixed(1)} OT
                      </span>
                    )}
                  </div>
                </td>

                {/* Location Verification Column */}
                <td>
                  {isVerified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={12} />
                      <span>GPS Verified</span>
                    </span>
                  ) : row.check_in ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      <MapPin size={12} />
                      <span>Office Biometric</span>
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>

                {/* Status Column */}
                <td>
                  <Badge status={row.status || 'Present'} />
                </td>

                {/* Action chevron */}
                <td className="text-right">
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors inline" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;
