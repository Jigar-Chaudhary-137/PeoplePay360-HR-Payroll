import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarOff, Plus, Check, X, Layers, UserCheck } from 'lucide-react';
import { timeOffAPI } from '../../services/api';
import { Badge, LoadingSpinner, EmptyState } from '../../components/common/CommonUI';
import { TimeOffRequestModal } from './TimeOffRequestModal';
import { useNotify } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export function TimeOffRequests() {
  const [activeTab, setActiveTab] = useState('requests'); // 'requests', 'allocations', 'types'
  const [requests, setRequests] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const { showToast } = useNotify();
  const { hasRole, user } = useAuth();

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqRes, allocRes, typeRes] = await Promise.all([
        timeOffAPI.getRequests(),
        timeOffAPI.getAllocations(),
        timeOffAPI.getTypes()
      ]);
      setRequests(reqRes.data || []);
      setAllocations(allocRes.data || []);
      setTypes(typeRes.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      const res = await timeOffAPI.approveRequest(id, { notes: 'Approved by HR' });
      showToast(res.message, 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try {
      const res = await timeOffAPI.rejectRequest(id, { notes: 'Declined by HR' });
      showToast(res.message, 'warning');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2.5">
            Time Off & Leaves
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
              {requests.length} Requests
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Leave allocation balances, employee time off requests, and approval workflow
          </p>
        </div>

        <button onClick={() => setModalOpen(true)} className="btn-primary text-xs">
          <Plus size={15} />
          <span>Request Time Off</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-3 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'requests' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <CalendarOff size={15} />
          <span>Requests Ledger ({requests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('allocations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'allocations' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <UserCheck size={15} />
          <span>Leave Allocations ({allocations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('types')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'types' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers size={15} />
          <span>Time Off Types ({types.length})</span>
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Loading time off records..." />
      ) : activeTab === 'requests' ? (
        /* Requests Table */
        requests.length === 0 ? (
          <EmptyState
            icon={CalendarOff}
            title="No time off requests found"
            actionText="Submit Time Off Request"
            onAction={() => setModalOpen(true)}
          />
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Leave Type</th>
                    <th>Period</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    {hasRole('HR Manager', 'Admin') && <th className="text-right">Approval Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link
                          to={`/employees/${r.employee_id}`}
                          className="font-bold text-slate-100 hover:text-sky-400 transition-colors block text-sm"
                        >
                          {r.first_name} {r.last_name}
                        </Link>
                        <span className="text-[11px] text-slate-400">{r.emp_code} • {r.department_name}</span>
                      </td>
                      <td>
                        <span className="font-bold" style={{ color: r.type_color }}>
                          {r.type_name}
                        </span>
                      </td>
                      <td className="text-xs text-slate-300">
                        {r.start_date.split('T')[0]} → {r.end_date.split('T')[0]}
                      </td>
                      <td>
                        <span className="font-extrabold text-slate-100 text-sm">{r.requested_amount}</span>
                        <span className="text-slate-400 text-xs ml-1">{r.unit}</span>
                      </td>
                      <td className="text-slate-300 text-xs max-w-xs truncate">{r.reason}</td>
                      <td><Badge status={r.status} /></td>
                      {hasRole('HR Manager', 'Admin') && (
                        <td className="text-right">
                          {r.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApprove(r.id)}
                                disabled={actionLoading === r.id}
                                className="btn-success text-xs py-1 px-2.5"
                                title="Approve Request & Deduct Balance"
                              >
                                <Check size={13} />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleReject(r.id)}
                                disabled={actionLoading === r.id}
                                className="btn-danger text-xs py-1 px-2.5"
                                title="Reject Request"
                              >
                                <X size={13} />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">
                              {r.approver_first_name ? `Reviewed by ${r.approver_first_name}` : 'Processed'}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : activeTab === 'allocations' ? (
        /* Allocations Table */
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Allocated Days</th>
                  <th>Used Days</th>
                  <th>Remaining Balance</th>
                  <th>Utilization</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <span className="font-bold text-slate-100">{a.first_name} {a.last_name}</span>
                      <span className="text-[11px] text-slate-400 block">{a.emp_code}</span>
                    </td>
                    <td>
                      <span className="font-semibold" style={{ color: a.type_color }}>{a.type_name}</span>
                    </td>
                    <td className="text-slate-200 font-bold">{a.allocated_days} days</td>
                    <td className="text-amber-400 font-bold">{a.used_days} days</td>
                    <td className="font-black text-emerald-400 text-base">{a.remaining_days} days</td>
                    <td>
                      <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(a.used_days / (a.allocated_days || 1)) * 100}%`,
                            backgroundColor: a.type_color
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Types Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {types.map((t) => (
            <div key={t.id} className="glass-card p-5 space-y-3 border-t-4" style={{ borderColor: t.color }}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-100 text-base">{t.name}</h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/40 text-slate-300">
                  {t.code}
                </span>
              </div>
              <div className="text-xs text-slate-400 space-y-1">
                <p>Unit: <span className="text-slate-200 font-semibold">{t.unit}</span></p>
                <p>Requires Allocation: <span className="text-slate-200 font-semibold">{t.requires_allocation ? 'Yes' : 'No (e.g. LOP)'}</span></p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <TimeOffRequestModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
