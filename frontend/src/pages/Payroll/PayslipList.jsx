import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Download, Eye, Search, Filter } from 'lucide-react';
import { payslipAPI } from '../../services/api';
import { Badge, LoadingSpinner, EmptyState } from '../../components/common/CommonUI';
import { useNotify } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export function PayslipList() {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { showToast } = useNotify();
  const { user } = useAuth();

  const loadPayslips = async () => {
    setLoading(true);
    try {
      const res = await payslipAPI.getAll({
        period_month: periodFilter,
        status: statusFilter
      });
      setPayslips(res.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayslips();
  }, [periodFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2.5">
            Payslips Ledger
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
              {payslips.length} Payslips
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Historical salary calculation ledger, PDF generator, and electronic delivery
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            className="form-input text-xs w-40"
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
          />

          <select
            className="form-select text-xs w-36"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="computed">Computed</option>
            <option value="validated">Validated</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSpinner text="Loading payslip ledger..." />
      ) : payslips.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No payslips found"
          description="Processed payslips from payruns will appear here."
        />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Payslip Code</th>
                  <th>Employee</th>
                  <th>Period</th>
                  <th>Worked Days</th>
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
                        className="font-bold text-slate-100 hover:text-sky-400 transition-colors block text-sm"
                      >
                        {ps.first_name} {ps.last_name}
                      </Link>
                      <span className="text-[11px] text-slate-400">{ps.emp_code} • {ps.department_name}</span>
                    </td>
                    <td className="text-slate-200 font-semibold text-xs">{ps.period_month}</td>
                    <td className="text-xs text-slate-300">
                      {ps.worked_days} / {ps.total_days}d
                    </td>
                    <td className="text-slate-300 text-xs">₹{Number(ps.gross_salary).toLocaleString()}</td>
                    <td className="text-rose-400 text-xs">₹{Number(ps.total_deductions).toLocaleString()}</td>
                    <td>
                      <span className="font-black text-emerald-400 text-base">
                        ₹{Number(ps.net_salary).toLocaleString()}
                      </span>
                    </td>
                    <td><Badge status={ps.status} /></td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/payslips/${ps.id}`} className="btn-secondary text-xs py-1 px-2.5">
                          <Eye size={13} />
                          <span>Inspect</span>
                        </Link>
                        <a
                          href={payslipAPI.getPDFUrl(ps.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-primary text-xs py-1 px-2.5"
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
        </div>
      )}
    </div>
  );
}
