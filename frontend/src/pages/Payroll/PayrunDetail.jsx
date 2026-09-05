import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  DollarSign, Calculator, CheckCircle2, Send, AlertTriangle,
  ArrowLeft, Download, Eye, ShieldAlert, Sparkles, Check, FileSpreadsheet
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { payrunAPI, payslipAPI } from '../../services/api';
import { Badge, LoadingSpinner } from '../../components/common/CommonUI';
import { useNotify } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export function PayrunDetail() {
  const { id } = useParams();
  const [payrun, setPayrun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [emailing, setEmailing] = useState(false);

  const { showToast } = useNotify();
  const { hasRole } = useAuth();

  const loadPayrun = async () => {
    setLoading(true);
    try {
      const res = await payrunAPI.getById(id);
      setPayrun(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayrun();
  }, [id]);

  // Workflow Actions
  const handleCompute = async () => {
    setActionLoading(true);
    try {
      const res = await payrunAPI.compute(id);
      showToast(res.message, 'success');
      loadPayrun();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidate = async () => {
    setActionLoading(true);
    try {
      const res = await payrunAPI.validate(id);
      showToast(res.message, 'success');
      loadPayrun();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    setActionLoading(true);
    try {
      const res = await payrunAPI.markPaid(id);
      showToast(res.message, 'success');
      // Celebration confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
      loadPayrun();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkEmail = async () => {
    setEmailing(true);
    try {
      const res = await payslipAPI.bulkSendEmail(id);
      showToast(res.message, 'success');
      loadPayrun();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setEmailing(false);
    }
  };

  if (loading || !payrun) {
    return <LoadingSpinner text="Loading payrun processing console..." />;
  }

  const payslips = payrun.payslips || [];
  const anomalies = payrun.anomalies || [];
  const status = payrun.status;

  return (
    <div className="space-y-6 pb-6">
      {/* Back button */}
      <Link to="/payruns" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
        <ArrowLeft size={14} />
        <span>Back to Payruns</span>
      </Link>

      {/* Payrun Command Header */}
      <div className="card p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 font-heading">{payrun.name}</h1>
              <Badge status={payrun.status} />
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap font-medium">
              <span className="font-mono text-blue-600 font-bold">{payrun.payrun_code || `PR-${payrun.id}`}</span>
              <span>•</span>
              <span>Period: <strong className="text-slate-700 font-mono">{payrun.period_month || payrun.period_start?.slice(0, 7)}</strong></span>
              <span>•</span>
              <span>Structure: <strong className="text-slate-700">{payrun.structure_name || 'Regular Structure'}</strong></span>
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {status === 'draft' && (
              <button
                onClick={handleCompute}
                disabled={actionLoading}
                className="btn-primary text-xs px-3.5 py-2"
              >
                <Calculator size={15} />
                <span>{actionLoading ? 'Computing...' : 'Compute Payrun'}</span>
              </button>
            )}

            {status === 'computed' && (
              <>
                <button
                  onClick={handleCompute}
                  disabled={actionLoading}
                  className="btn-secondary text-xs px-3 py-2"
                >
                  <Calculator size={14} />
                  <span>Re-Compute</span>
                </button>
                {hasRole('HR Payroll Admin', 'Admin') && (
                  <button
                    onClick={handleValidate}
                    disabled={actionLoading}
                    className="btn-primary text-xs px-3.5 py-2 bg-amber-600 hover:bg-amber-700"
                  >
                    <CheckCircle2 size={15} />
                    <span>Validate & Lock</span>
                  </button>
                )}
              </>
            )}

            {status === 'validated' && hasRole('HR Payroll Admin', 'Admin') && (
              <button
                onClick={handleMarkPaid}
                disabled={actionLoading}
                className="btn-success text-xs px-3.5 py-2"
              >
                <DollarSign size={15} />
                <span>Mark Paid & Disburse</span>
              </button>
            )}

            {(status === 'validated' || status === 'paid') && (
              <button
                onClick={handleBulkEmail}
                disabled={emailing}
                className="btn-secondary text-xs px-3 py-2"
              >
                <Send size={14} />
                <span>{emailing ? 'Sending...' : 'Email Payslips'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Workflow State Step Progress Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-4 border-t border-slate-100 text-xs">
          {[
            { key: 'draft', label: '1. Draft (Configured)' },
            { key: 'computed', label: '2. Computed (Calculated)' },
            { key: 'validated', label: '3. Validated (Finalized)' },
            { key: 'paid', label: '4. Paid (Disbursed)' }
          ].map((st, i) => {
            const stepOrder = ['draft', 'computed', 'validated', 'paid'];
            const currentIndex = stepOrder.indexOf(status);
            const isCompleted = currentIndex >= i;
            const isCurrent = status === st.key;

            return (
              <div
                key={st.key}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold shadow-2xs'
                    : isCompleted
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 font-medium'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                {st.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-heading">Total Gross Earnings</p>
          <h3 className="text-2xl font-bold text-slate-900 font-heading">₹{Number(payrun.total_gross || 0).toLocaleString('en-IN')}</h3>
        </div>
        <div className="card p-5 space-y-1">
          <p className="text-xs font-bold text-rose-600 uppercase tracking-wider font-heading">Total Deductions</p>
          <h3 className="text-2xl font-bold text-rose-700 font-heading">₹{Number(payrun.total_deductions || 0).toLocaleString('en-IN')}</h3>
        </div>
        <div className="card p-5 space-y-1 border-blue-200 bg-blue-50/30">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider font-heading">Total Net Disbursement</p>
          <h3 className="text-2xl xl:text-3xl font-extrabold text-blue-700 font-heading">₹{Number(payrun.total_net || 0).toLocaleString('en-IN')}</h3>
        </div>
        <div className="card p-5 space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-heading">Included Employees</p>
          <h3 className="text-2xl font-bold text-slate-900 font-heading">{payrun.employee_count || payslips.length || 1} <span className="text-sm font-medium text-slate-400">Staff</span></h3>
        </div>
      </div>

      {/* Anomalies and Warnings Box */}
      {anomalies.length > 0 && (
        <div className="card p-5 border-amber-200 bg-amber-50/40 space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm font-heading">
            <ShieldAlert size={18} className="text-amber-600" />
            <span>Surveillance Engine: {anomalies.length} Compliance Warnings & Anomalies Detected</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {anomalies.map((a, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border text-xs space-y-1.5 bg-white border-amber-200 text-slate-800 shadow-2xs"
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="text-sm text-slate-900 font-heading">{a.title}</span>
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                    {a.severity}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">{a.reason || a.message}</p>
                {a.first_name && (
                  <div className="text-xs text-slate-500 font-medium pt-1 border-t border-slate-100">
                    Employee: <strong className="text-slate-800">{a.first_name} {a.last_name} ({a.emp_code})</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payslips Ledger Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-slate-900 text-base font-heading">Payslips in this Payrun ({payslips.length})</h3>
          <span className="text-xs text-slate-400">Click inspect to examine salary rule calculations</span>
        </div>

        {payslips.length === 0 ? (
          <div className="card p-10 text-center text-slate-500 text-sm">
            No payslips computed yet. Click "Compute Payrun" to run salary rules for all included employees.
          </div>
        ) : (
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Payslip Code</th>
                  <th>Employee</th>
                  <th>Contract Wage</th>
                  <th>Worked / Total Days</th>
                  <th>Gross Salary</th>
                  <th>Deductions</th>
                  <th>Net Payable</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map((ps) => (
                  <tr key={ps.id}>
                    <td className="font-bold text-blue-600 text-sm">{ps.payslip_code || `PS-${ps.id}`}</td>
                    <td>
                      <Link
                        to={`/employees/${ps.employee_id}`}
                        className="font-bold text-slate-900 hover:text-blue-600 transition-colors block text-sm font-heading"
                      >
                        {ps.first_name} {ps.last_name}
                      </Link>
                      <span className="text-xs text-slate-400">{ps.emp_code} • {ps.department_name}</span>
                    </td>
                    <td className="text-sm text-slate-700 font-medium">
                      ₹{Number(ps.base_wage || ps.wage || ps.gross_salary || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="text-xs text-slate-600">
                      <span className="font-bold text-slate-900">{ps.worked_days}</span> / {ps.total_days || ps.scheduled_days || 22} days
                      {Number(ps.unpaid_leave_days) > 0 && (
                        <span className="text-rose-600 text-[11px] ml-1 font-semibold">({ps.unpaid_leave_days}d LOP)</span>
                      )}
                    </td>
                    <td className="text-slate-800 font-semibold text-sm">₹{Number(ps.gross_salary).toLocaleString('en-IN')}</td>
                    <td className="text-rose-600 font-semibold text-sm">₹{Number(ps.total_deductions).toLocaleString('en-IN')}</td>
                    <td>
                      <span className="font-extrabold text-emerald-600 text-sm">
                        ₹{Number(ps.net_salary).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td><Badge status={ps.status} /></td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/payslips/${ps.id}`}
                          className="btn-secondary text-xs py-1 px-2.5"
                          title="Inspect Dynamic Rule Breakdown"
                        >
                          <Eye size={13} />
                          <span>Inspect</span>
                        </Link>
                        <a
                          href={payslipAPI.getPDFUrl(ps.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-primary text-xs py-1 px-2.5"
                          title="Download PDF"
                        >
                          <Download size={13} />
                          <span>PDF</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
