import React, { useState, useEffect } from 'react';
import { Modal } from '../common/CommonUI';
import { CheckCircle2, AlertTriangle, XCircle, User, Calendar } from 'lucide-react';
import { formatDisplayDate } from './TimeOffRequestTable';

/**
 * Confirmation Modal for Approve or Refuse Time Off Actions
 */
export default function ApprovalConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  request,
  actionType = 'approve', // 'approve' or 'refuse'
  loading = false
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !request) return null;

  const isApprove = actionType === 'approve';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isApprove && !reason.trim()) {
      setError('Please provide a reason for refusing this request.');
      return;
    }
    setError('');
    onConfirm(request.id, reason.trim());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : onClose}
      title={isApprove ? 'Approve Time Off Request' : 'Refuse Time Off Request'}
      subtitle={`Request #${request.id} for ${request.employee_name}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Top Summary Card */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Employee:</span>
            <span className="font-bold text-slate-100">{request.employee_name} ({request.employee_code})</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Leave Type:</span>
            <span className="font-semibold text-sky-400">{request.leave_type}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Period:</span>
            <span className="text-slate-200">
              {formatDisplayDate(request.start_date)} → {formatDisplayDate(request.end_date)} ({request.duration} {request.duration === 1 ? 'day' : 'days'})
            </span>
          </div>
          {request.reason && (
            <div className="pt-1.5 border-t border-white/5">
              <span className="text-slate-400 block mb-0.5">Reason:</span>
              <p className="text-slate-300 italic line-clamp-2">"{request.reason}"</p>
            </div>
          )}
        </div>

        {/* Action Prompt */}
        {isApprove ? (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-400 mt-0.5" />
            <div>
              <p className="font-semibold">Confirm Approval</p>
              <p className="text-emerald-400/80 mt-0.5">
                Approving this request will update the status to Approved and deduct {request.duration} {request.duration === 1 ? 'day' : 'days'} from their leave allocation.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              <AlertTriangle size={18} className="shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-semibold">Refusal Confirmation</p>
                <p className="text-rose-400/80 mt-0.5">
                  Refusing this request will notify the employee. A mandatory reason is required.
                </p>
              </div>
            </div>

            <div>
              <label className="form-label text-xs">
                Refusal Reason <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Explain why this request is being refused (e.g., Sprint deadline, staffing shortage)..."
                className={`form-textarea text-xs ${error ? 'border-rose-500' : ''}`}
                autoFocus
              />
              {error && <p className="text-[11px] text-rose-400 mt-1">{error}</p>}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-secondary text-xs"
          >
            Cancel
          </button>

          {isApprove ? (
            <button
              type="submit"
              disabled={loading}
              className="btn-success text-xs flex items-center gap-1.5"
            >
              {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 size={14} />
              )}
              <span>{loading ? 'Approving...' : 'Confirm Approval'}</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="btn-danger text-xs flex items-center gap-1.5"
            >
              {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <XCircle size={14} />
              )}
              <span>{loading ? 'Refusing...' : 'Refuse Request'}</span>
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
