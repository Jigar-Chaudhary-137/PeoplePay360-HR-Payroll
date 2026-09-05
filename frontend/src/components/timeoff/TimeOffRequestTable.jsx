import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Calendar, Clock, ArrowRight, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/CommonUI';

/**
 * Format ISO date or YYYY-MM-DD to readable format like '12-Sep-2026'
 */
export function formatDisplayDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(d.getDate()).padStart(2, '0');
    const mon = months[d.getMonth()];
    const yr = d.getFullYear();
    return `${day}-${mon}-${yr}`;
  } catch (e) {
    return dateStr;
  }
}

export function StatusBadge({ status }) {
  return <Badge status={status} />;
}

/**
 * Get Leave Type Badge color styling
 */
export function LeaveTypeBadge({ typeName }) {
  const typeColors = {
    'Paid Time Off': 'bg-blue-50 text-blue-700 border-blue-200',
    'Sick Leave': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Comp Off': 'bg-purple-50 text-purple-700 border-purple-200',
    'Casual Leave': 'bg-amber-50 text-amber-700 border-amber-200',
    'Unpaid Leave': 'bg-slate-100 text-slate-700 border-slate-200'
  };

  const styleClass = typeColors[typeName] || 'bg-blue-50 text-blue-700 border-blue-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styleClass}`}>
      {typeName}
    </span>
  );
}

export default function TimeOffRequestTable({
  requests = [],
  onApproveClick,
  onRefuseClick,
  actionLoadingId = null
}) {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isHRManager = hasRole('HR Manager', 'Admin', 'HR Payroll Admin');

  const handleRowClick = (requestId) => {
    navigate(`/time-off/requests/${requestId}`);
  };

  return (
    <div className="custom-table-container">
      <table className="custom-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Leave Type</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Duration</th>
            <th>Status</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => {
            const isPending =
              req.status === 'To Approve' ||
              req.status === 'pending' ||
              req.status === 'Pending';

            return (
              <tr
                key={req.id}
                onClick={() => handleRowClick(req.id)}
                className="cursor-pointer group hover:bg-slate-50"
              >
                {/* Employee Column */}
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {req.employee_name?.[0] || 'E'}
                    </div>
                    <div className="truncate">
                      <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors block text-sm font-heading">
                        {req.employee_name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {req.employee_code} <span className="text-slate-300">•</span> {req.department || 'General Operations'}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Type Column */}
                <td>
                  <LeaveTypeBadge typeName={req.leave_type} />
                </td>

                {/* Start Date */}
                <td className="text-slate-600 text-xs font-medium whitespace-nowrap">
                  {formatDisplayDate(req.start_date)}
                </td>

                {/* End Date */}
                <td className="text-slate-600 text-xs font-medium whitespace-nowrap">
                  {formatDisplayDate(req.end_date)}
                </td>

                {/* Duration */}
                <td>
                  <span className="font-bold text-slate-900 text-sm font-heading">
                    {req.duration}
                  </span>
                  <span className="text-slate-500 text-xs ml-1 font-medium">
                    {req.duration === 1 ? 'Day' : 'Days'}
                  </span>
                </td>

                {/* Status */}
                <td>
                  <Badge status={req.status} />
                </td>

                {/* Actions */}
                <td className="text-right whitespace-nowrap">
                  <div
                    className="flex items-center justify-end gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* HR Quick Approval Buttons for Pending Requests */}
                    {isHRManager && isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => onApproveClick && onApproveClick(req)}
                          disabled={actionLoadingId === req.id}
                          className="btn-success text-xs py-1 px-2.5 flex items-center gap-1 shadow-2xs"
                          title="Approve Request"
                        >
                          <Check size={13} />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onRefuseClick && onRefuseClick(req)}
                          disabled={actionLoadingId === req.id}
                          className="btn-danger text-xs py-1 px-2.5 flex items-center gap-1 shadow-2xs"
                          title="Refuse Request"
                        >
                          <X size={13} />
                          <span>Refuse</span>
                        </button>
                      </>
                    )}

                    {/* Detail View Arrow */}
                    <button
                      type="button"
                      onClick={() => handleRowClick(req.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                      title="View Details"
                    >
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
