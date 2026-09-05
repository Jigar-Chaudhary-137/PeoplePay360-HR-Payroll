import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Calendar, Clock, ArrowRight, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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

/**
 * Get Status Badge styling
 */
export function StatusBadge({ status }) {
  const norm = (status || '').toLowerCase();
  
  if (norm === 'approved') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Approved
      </span>
    );
  }

  if (norm === 'to approve' || norm === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        To Approve
      </span>
    );
  }

  if (norm === 'refused' || norm === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
        Refused
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      {status || 'Draft'}
    </span>
  );
}

/**
 * Get Leave Type Badge color styling
 */
export function LeaveTypeBadge({ typeName }) {
  const typeColors = {
    'Paid Time Off': 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    'Sick Leave': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    'Comp Off': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    'Casual Leave': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    'Unpaid Leave': 'bg-slate-500/15 text-slate-300 border-slate-500/30'
  };

  const styleClass = typeColors[typeName] || 'bg-sky-500/15 text-sky-400 border-sky-500/30';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${styleClass}`}>
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
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="custom-table w-full">
          <thead>
            <tr>
              <th className="w-1/4">Employee</th>
              <th>Type</th>
              <th>Start</th>
              <th>End</th>
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
                  className="cursor-pointer hover:bg-white/[0.04] transition-colors group"
                >
                  {/* Employee Column */}
                  <td>
                    <div className="flex items-center gap-3">
                      {req.avatar ? (
                        <img
                          src={req.avatar}
                          alt={req.employee_name}
                          className="w-9 h-9 rounded-full object-cover border border-white/10 shrink-0"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-sky-950 border border-sky-500/30 text-sky-400 flex items-center justify-center text-xs font-bold shrink-0">
                          {req.employee_name?.[0] || 'E'}
                        </div>
                      )}
                      <div className="truncate">
                        <span className="font-bold text-slate-100 group-hover:text-sky-400 transition-colors block text-sm">
                          {req.employee_name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {req.employee_code} • {req.department || 'General'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Type Column */}
                  <td>
                    <LeaveTypeBadge typeName={req.leave_type} />
                  </td>

                  {/* Start Date */}
                  <td className="text-slate-300 text-xs font-medium whitespace-nowrap">
                    {formatDisplayDate(req.start_date)}
                  </td>

                  {/* End Date */}
                  <td className="text-slate-300 text-xs font-medium whitespace-nowrap">
                    {formatDisplayDate(req.end_date)}
                  </td>

                  {/* Duration */}
                  <td>
                    <span className="font-bold text-slate-100 text-sm">
                      {req.duration}
                    </span>
                    <span className="text-slate-400 text-xs ml-1">
                      {req.duration === 1 ? 'Day' : 'Days'}
                    </span>
                  </td>

                  {/* Status */}
                  <td>
                    <StatusBadge status={req.status} />
                  </td>

                  {/* Actions */}
                  <td className="text-right whitespace-nowrap">
                    <div
                      className="flex items-center justify-end gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* HR Quick Approval Buttons for Pending Requests */}
                      {isHRManager && isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => onApproveClick && onApproveClick(req)}
                            disabled={actionLoadingId === req.id}
                            className="btn-success text-xs py-1 px-2.5 rounded-lg flex items-center gap-1 shadow-sm transition-transform hover:scale-105"
                            title="Approve Request"
                          >
                            <Check size={13} />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onRefuseClick && onRefuseClick(req)}
                            disabled={actionLoadingId === req.id}
                            className="btn-danger text-xs py-1 px-2.5 rounded-lg flex items-center gap-1 shadow-sm transition-transform hover:scale-105"
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
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
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
    </div>
  );
}
