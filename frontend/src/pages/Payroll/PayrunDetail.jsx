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
      // Trigger celebration confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
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
    <div className="space-y-6">
      {/* Back button */}
      <Link to="/payruns" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={14} />
        <span>Back to Payruns</span>
      </Link>

      {/* Payrun Command Header */}
      <div className="glass-card p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-100">{payrun.name}</h1>
              <Badge status={payrun.status} />
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-4 flex-wrap">
              <span className="font-mono text-sky-400 font-bold">{payrun.payrun_code}</span>
              <span>•</span>
              <span>Period: <strong className="text-slate-200">{payrun.period_month}</strong> ({payrun.start_date.split('T')[0]} → {payrun.end_date.split('T')[0]})</span>
              <span>•</span>
              <span>Structure: <strong className="text-slate-200">{payrun.structure_name}</strong></span>
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {status === 'draft' && (
              <button
                onClick={handleCompute}
                disabled={actionLoading}
                className="btn-primary text-xs"
              >
                <Calculator size={15} />
                <span>{actionLoading ? 'Executing Engine...' : 'Compute Payrun'}</span>
              </button>
            )}

            {status === 'computed' && (
              <>
                <button
                  onClick={handleCompute}
                  disabled={actionLoading}
                  className="btn-secondary text-xs"
                >
                  <Calculator size={15} />
                  <span>Re-Compute</span>
                </button>
                {hasRole('HR Payroll Admin', 'Admin') && (
                  <button
                    onClick={handleValidate}
                    disabled={actionLoading}
                    className="btn-primary text-xs bg-gradient-to-r from-amber-600 to-amber-500"
                  >
                    <CheckCircle2 size={15} />
                    <span>Validate & Finalize</span>
                  </button>
                )}
              </>
            )}

            {status === 'validated' && hasRole('HR Payroll Admin', 'Admin') && (
              <button
                onClick={handleMarkPaid}
                disabled={actionLoading}
                className="btn-success text-xs"
              >
                <DollarSign size={15} />
                <span>Mark Paid & Record Disbursement</span>
              </button>
            )}

            {(status === 'validated' || status === 'paid') && (
              <button
                onClick={handleBulkEmail}
                disabled={emailing}
                className="btn-secondary text-xs"
              >
                <Send size={15} />
                <span>{emailing ? 'Dispatching...' : 'Bulk Email Payslips'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Workflow State Step Progress Bar */}
        <div className="grid grid-cols-4 gap-2 pt-4 border-t border-white/10 text-xs">
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
                    ? 'bg-sky-950/60 border-sky-500 text-sky-300 font-bold shadow-sm'
                    : isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300 font-medium'
                    : 'bg-white/5 border-white/5 text-slate-500'
                }`}
              >
                {st.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Gross Earnings</p>
          <h3 className="text-xl font-extrabold text-slate-100">₹{Number(payrun.total_gross || 0).toLocaleString()}</h3>
        </div>
        <div className="glass-card p-4 space-y-1">
          <p className="text-xs font-bold text-rose-400 uppercase tracking-wider">Total Deductions</p>
          <h3 className="text-xl font-extrabold text-rose-300">₹{Number(payrun.total_deductions || 0).toLocaleString()}</h3>
        </div>
        <div className="glass-card p-4 space-y-1 border-sky-500/30 bg-sky-950/20">
          <p className="text-xs font-bold text-sky-400 uppercase tracking-wider">Total Net Disbursement</p>
          <h3 className="text-2xl font-black text-sky-300">₹{Number(payrun.total_net || 0).toLocaleString()}</h3>
        </div>
        <div className="glass-card p-4 space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Included Employees</p>
          <h3 className="text-xl font-extrabold text-slate-100">{payrun.employee_count} Staff</h3>
        </div>
      </div>

      {/* Anomalies and Warnings Box */}
      {anomalies.length > 0 && (
        <div className="glass-card p-5 border-amber-500/30 bg-amber-950/10 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <ShieldAlert size={18} />
            <span>Surveillance Engine: {anomalies.length} Compliance Warnings & Anomalies Detected</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {anomalies.map((a) => (
              <div
                key={a.id}
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  a.severity === 'critical'
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span>{a.title}</span>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-black/40">
                    {a.severity}
                  </span>
                </div>
                <p className="text-slate-300">{a.reason}</p>
                <div className="text-[11px] text-slate-400 font-medium">
                  Employee: <strong className="text-slate-100">{a.first_name} {a.last_name} ({a.emp_code})</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payslips Ledger Grid */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="font-bold text-slate-100 text-sm">Payslips in this Payrun ({payslips.length})</h3>
          <span className="text-xs text-slate-400">Click inspect to see dynamic rule math calculations</span>
        </div>

        {payslips.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No payslips computed yet. Click "Compute Payrun" to run salary rules for all {payrun.employee_count} included employees.
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                    <td className="font-mono font-bold text-sky-400">{ps.payslip_code}</td>
                    <td>
                      <Link
                        to={`/employees/${ps.employee_id}`}
                        className="font-bold text-slate-100 hover:text-sky-400 transition-colors block"
                      >
                        {ps.first_name} {ps.last_name}
                      </Link>
                      <span className="text-[11px] text-slate-400">{ps.emp_code} • {ps.department_name}</span>
                    </td>
                    <td className="text-xs text-slate-300">
                      ₹{Number(ps.base_wage).toLocaleString()}
                    </td>
                    <td className="text-xs text-slate-300">
                      <span className="font-bold text-slate-100">{ps.worked_days}</span> / {ps.total_days}d
                      {Number(ps.unpaid_leave_days) > 0 && (
                        <span className="text-rose-400 text-[10px] ml-1">({ps.unpaid_leave_days}d LOP)</span>
                      )}
                    </td>
                    <td className="text-slate-200 font-semibold">₹{Number(ps.gross_salary).toLocaleString()}</td>
                    <td className="text-rose-400 font-semibold">₹{Number(ps.total_deductions).toLocaleString()}</td>
                    <td className="font-black text-emerald-400 text-base">
                      ₹{Number(ps.net_salary).toLocaleString()}
                    </td>
                    <td><Badge status={ps.status} /></td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
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
