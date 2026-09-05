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
    <div className="space-y-6 pb-6 text-[#17151F]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E5EF]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="page-title">
              Payslips Ledger
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F3E8FF] text-[#6D28D9] border border-[#E5E7EB] font-bold">
              {payslips.length} Payslips
            </span>
          </div>
          <p className="text-sm text-[#625E6E] mt-0.5">
            Historical salary calculation ledger, PDF generator, and electronic delivery
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <input
            type="month"
            className="form-input text-xs py-2 px-2.5 w-36"
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
          />

          <select
            className="form-select text-xs py-2 w-36 bg-white text-[#17151F] border-[#DDD9E8]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="" className="bg-white">All Statuses</option>
            <option value="computed" className="bg-white">Computed</option>
            <option value="validated" className="bg-white">Validated</option>
            <option value="paid" className="bg-white">Paid</option>
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
                    <td>
                      <span className="font-bold text-[#6C3FF5] text-sm font-mono">{ps.payslip_code || `PS-${ps.id}`}</span>
                    </td>
                    <td>
                      <Link
                        to={`/employees/${ps.employee_id}`}
                        className="font-bold text-[#17151F] hover:text-[#6C3FF5] transition-colors block text-sm"
                      >
                        {ps.first_name} {ps.last_name}
                      </Link>
                      <span className="text-xs text-[#625E6E]">
                        {ps.emp_code} <span className="text-[#918C9F]">•</span> {ps.department_name}
                      </span>
                    </td>
                    <td className="text-[#625E6E] font-semibold text-sm font-mono">{ps.period_month || ps.period_start?.slice(0, 7)}</td>
                    <td className="text-xs text-[#625E6E]">
                      <span className="font-semibold text-[#17151F]">{ps.worked_days}</span> / {ps.total_days || ps.scheduled_days || 22} days
                    </td>
                    <td className="text-[#625E6E] text-sm font-medium">₹{Number(ps.gross_salary).toLocaleString('en-IN')}</td>
                    <td className="text-rose-600 text-sm font-medium">₹{Number(ps.total_deductions).toLocaleString('en-IN')}</td>
                    <td>
                      <span className="font-extrabold text-emerald-600 text-sm">
                        ₹{Number(ps.net_salary).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td><Badge status={ps.status} /></td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/payslips/${ps.id}`} className="btn-secondary text-xs py-1.5 px-3">
                          <Eye size={13} />
                          <span>Inspect</span>
                        </Link>
                        <a
                          href={payslipAPI.getPDFUrl(ps.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-primary text-xs py-1.5 px-3"
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
