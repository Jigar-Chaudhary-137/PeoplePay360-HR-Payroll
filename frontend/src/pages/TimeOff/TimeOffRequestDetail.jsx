import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Check, X, Calendar, Clock, User, ShieldCheck, 
  Layers, AlertCircle, FileText, CheckCircle2, XCircle, Info, Sparkles 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';
import { timeOffService } from '../../services/timeOffService';
import { StatusBadge, LeaveTypeBadge, formatDisplayDate } from '../../components/timeoff/TimeOffRequestTable';
import ApprovalConfirmationModal from '../../components/timeoff/ApprovalConfirmationModal';
import { LoadingSpinner, EmptyState } from '../../components/common/CommonUI';

/**
 * Page 2: Time Off Request Detail Page
 * Route: /time-off/requests/:requestId
 */
export function TimeOffRequestDetail() {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user, hasRole, isEmployeeOnly } = useAuth();
  const { showToast } = useNotify();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Approval / Refusal Action Modal State
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [actionType, setActionType] = useState('approve'); // 'approve' or 'refuse'
  const [actionLoading, setActionLoading] = useState(false);

  const isHRManager = hasRole('HR Manager', 'Admin', 'HR Payroll Admin');

  const fetchRequest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await timeOffService.getRequestById(requestId);
      if (res.success && res.data) {
        setRequest(res.data);
      } else {
        setError(res.error || 'Time off request not found.');
      }
    } catch (err) {
      setError(err.message || 'Unable to load request.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (requestId) {
      fetchRequest();
    }
  }, [requestId]);

  // Open Approval Confirmation Modal
  const handleApprovePrompt = () => {
    setActionType('approve');
    setConfirmModalOpen(true);
  };

  // Open Refusal Confirmation Modal
  const handleRefusePrompt = () => {
    setActionType('refuse');
    setConfirmModalOpen(true);
  };

  // Execute Approve / Refuse Action
  const handleConfirmAction = async (id, refusalReason) => {
    setActionLoading(true);
    try {
      if (actionType === 'approve') {
        const res = await timeOffService.approveRequest(id);
        if (res.success) {
          showToast(res.message, 'success');
          setConfirmModalOpen(false);
          fetchRequest();
        } else {
          showToast(res.error || 'Failed to approve request', 'error');
        }
      } else {
        const res = await timeOffService.refuseRequest(id, refusalReason);
        if (res.success) {
          showToast(res.message, 'warning');
          setConfirmModalOpen(false);
          fetchRequest();
        } else {
          showToast(res.error || 'Failed to refuse request', 'error');
        }
      }
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading time off request details..." />;
  }

  if (error || !request) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/time-off/requests')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Time Off Request</h1>
            <p className="text-xs text-slate-400">Form view of one request</p>
          </div>
        </div>

        <EmptyState
          icon={AlertCircle}
          title={error || "Request not found"}
          description="The requested time off record could not be found or you do not have permission to view it."
          actionText="Back to Requests"
          onAction={() => navigate('/time-off/requests')}
        />
      </div>
    );
  }

  const isPending =
    request.status === 'To Approve' ||
    request.status === 'pending' ||
    request.status === 'Pending';

  // Check if current user is viewing their own request
  const isOwnRequest = user?.email && request.employee_name === `${user?.first_name} ${user?.last_name}`;
  
  // Can approve if user is HR/Admin, request is pending, and NOT their own request
  const canApproveOrRefuse = isHRManager && isPending && !isOwnRequest;

  // Retrieve allocation balance details
  const allocation = timeOffService.getAllocationBalance(request.employee_id, request.leave_type);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/time-off/requests')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="Back to Requests"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Link to="/time-off/requests" className="hover:text-sky-400 transition-colors">
                Time Off Requests
              </Link>
              <span>/</span>
              <span className="font-bold text-slate-100">{request.employee_name}</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Form view of one request</p>
          </div>
        </div>

        {/* Action Buttons in Header for HR Managers on Pending Requests */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/time-off/requests')}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            <span>Back to Requests</span>
          </button>

          {canApproveOrRefuse && (
            <>
              <button
                type="button"
                onClick={handleApprovePrompt}
                disabled={actionLoading}
                className="btn-primary text-xs flex items-center gap-1.5 shadow-md shadow-sky-600/30"
                title="Approve Time Off Request"
              >
                <Check size={14} />
                <span>Approve</span>
              </button>
              <button
                type="button"
                onClick={handleRefusePrompt}
                disabled={actionLoading}
                className="btn-secondary text-xs text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 flex items-center gap-1.5"
                title="Refuse Time Off Request"
              >
                <X size={14} />
                <span>Refuse</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Request Form View Card */}
      <div className="glass-card p-6 space-y-6">
        {/* Status Alert Banner if Refused or Approved */}
        {request.status === 'Approved' && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
            <div>
              <p className="font-bold">Request Approved</p>
              <p className="text-emerald-400/80 mt-0.5">
                This time off request was approved by {request.approver_name || 'HR Manager'}.
              </p>
            </div>
          </div>
        )}

        {request.status === 'Refused' && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            <XCircle size={18} className="shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-bold">Request Refused</p>
              <p className="text-rose-400/80 mt-0.5">
                This request was refused by {request.approver_name || 'HR Manager'}.
              </p>
            </div>
          </div>
        )}

        {/* Two-Column Read-Only Form Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Employee */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-xs text-slate-400 font-medium block mb-1.5">Employee</span>
              <div className="flex items-center gap-3">
                {request.avatar ? (
                  <img
                    src={request.avatar}
                    alt={request.employee_name}
                    className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-sky-950 border border-sky-500/30 text-sky-400 flex items-center justify-center text-sm font-bold shrink-0">
                    {request.employee_name?.[0] || 'E'}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">{request.employee_name}</h3>
                  <p className="text-xs text-slate-400">{request.employee_code} • {request.department}</p>
                </div>
              </div>
            </div>

            {/* Time Off Type */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-xs text-slate-400 font-medium block mb-1.5">Time Off Type</span>
              <div className="flex items-center gap-2">
                <LeaveTypeBadge typeName={request.leave_type} />
                <span className="text-xs text-slate-400">
                  {request.leave_type === 'Unpaid Leave' ? '(Unpaid / LOP)' : '(Paid Allocation)'}
                </span>
              </div>
            </div>

            {/* Start Date */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-xs text-slate-400 font-medium block mb-1">Start Date</span>
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
                <Calendar size={15} className="text-sky-400" />
                <span>{formatDisplayDate(request.start_date)}</span>
              </div>
            </div>

            {/* End Date */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-xs text-slate-400 font-medium block mb-1">End Date</span>
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
                <Calendar size={15} className="text-sky-400" />
                <span>{formatDisplayDate(request.end_date)}</span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Duration */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-xs text-slate-400 font-medium block mb-1">Duration</span>
              <div className="flex items-center gap-2 text-slate-100 font-extrabold text-base">
                <Clock size={16} className="text-sky-400" />
                <span>{request.duration} {request.duration === 1 ? 'Day' : 'Days'}</span>
              </div>
            </div>

            {/* Status */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-xs text-slate-400 font-medium block mb-1.5">Status</span>
              <div>
                <StatusBadge status={request.status} />
              </div>
            </div>

            {/* Approver */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-xs text-slate-400 font-medium block mb-1">Approver</span>
              <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
                <ShieldCheck size={15} className="text-indigo-400" />
                <span>{request.approver_name || request.manager_name || 'Sara Khan'}</span>
              </div>
            </div>

            {/* Allocation Used */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-xs text-slate-400 font-medium block mb-1">Allocation Used</span>
              <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
                <Layers size={15} className="text-sky-400" />
                <span>{request.allocation_used || `${request.leave_type} 2026`}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width Reason Card */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <FileText size={15} className="text-sky-400" />
            <span>Reason for Request</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed pl-6">
            {request.reason || 'No specific reason provided.'}
          </p>
        </div>

        {/* Full-Width Refusal Reason Card (if Refused) */}
        {request.status === 'Refused' && request.refusal_reason && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-300">
              <XCircle size={15} className="text-rose-400" />
              <span>Refusal Notes</span>
            </div>
            <p className="text-sm text-rose-200 leading-relaxed pl-6">
              {request.refusal_reason}
            </p>
          </div>
        )}

        {/* Full-Width Allocation Summary Card */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Info size={15} className="text-sky-400" />
              Allocation Balance Summary: {allocation?.allocation_name || request.leave_type}
            </span>
            {allocation?.is_paid ? (
              <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Tracked Paid Balance
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 font-bold bg-slate-500/10 px-2 py-0.5 rounded border border-slate-500/20">
                No Paid Balance Consumed
              </span>
            )}
          </div>

          {allocation?.is_paid ? (
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Allocated</span>
                <span className="font-bold text-slate-100 text-base">{allocation.allocated} Days</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Used</span>
                <span className="font-bold text-amber-400 text-base">{allocation.used} Days</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Remaining</span>
                <span className="font-extrabold text-emerald-400 text-base">{allocation.remaining} Days</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Unpaid leave requests do not deduct days from standard annual leave or paid time off allocations.
            </p>
          )}
        </div>
      </div>

      {/* Approve / Refuse Confirmation Modal */}
      <ApprovalConfirmationModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmAction}
        request={request}
        actionType={actionType}
        loading={actionLoading}
      />
    </div>
  );
}

export default TimeOffRequestDetail;
