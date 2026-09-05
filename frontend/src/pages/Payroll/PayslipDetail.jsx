import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText, Download, Send, ArrowLeft, CheckCircle2,
  Building, CreditCard, Calendar, User, ShieldCheck, Sparkles
} from 'lucide-react';
import { payslipAPI } from '../../services/api';
import { Badge, LoadingSpinner } from '../../components/common/CommonUI';
import { useNotify } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export function PayslipDetail() {
  const { id } = useParams();
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailing, setEmailing] = useState(false);

  const { showToast } = useNotify();
  const { hasRole } = useAuth();

  const loadPayslip = async () => {
    setLoading(true);
    try {
      const res = await payslipAPI.getById(id);
      setPayslip(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayslip();
  }, [id]);

  const handleSendEmail = async () => {
    setEmailing(true);
    try {
      const res = await payslipAPI.sendEmail(id);
      showToast(res.message, 'success');
      loadPayslip();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setEmailing(false);
    }
  };

  if (loading || !payslip) {
    return <LoadingSpinner text="Generating payslip itemized calculation breakdown..." />;
  }

  const earnings = payslip.earnings || [];
  const deductions = payslip.deductions || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link to="/payslips" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft size={14} />
          <span>Back to Payslips</span>
        </Link>

        <div className="flex items-center gap-2.5">
          {hasRole('HR Payroll Admin', 'HR Payroll User', 'Admin') && (
            <button
              onClick={handleSendEmail}
              disabled={emailing}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              <Send size={13} />
              <span>{emailing ? 'Dispatching...' : payslip.email_sent ? 'Re-send Email' : 'Email Payslip'}</span>
            </button>
          )}

          <a
            href={payslipAPI.getPDFUrl(id)}
            target="_blank"
            rel="noreferrer"
            className="btn-primary text-xs px-3.5 py-1.5"
          >
            <Download size={13} />
            <span>Download PDF</span>
          </a>
        </div>
      </div>

      {/* Main Document / Payslip View Card */}
      <div className="card p-8 space-y-6 bg-white border border-slate-200 shadow-sm relative">
        {/* Company Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center shadow-xs font-heading">
              360
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight font-heading">PEOPLEPAY360 GLOBAL</h2>
              <p className="text-xs text-slate-500 font-medium">Intelligent HR & Payroll Operations Platform</p>
            </div>
          </div>

          <div className="text-right">
            <h3 className="text-lg font-extrabold text-blue-600 tracking-wide font-heading">PAYSLIP</h3>
            <p className="text-xs font-semibold text-slate-700">Period: {payslip.period_month}</p>
            <p className="text-[11px] font-mono text-slate-400">Slip No: {payslip.payslip_code}</p>
          </div>
        </div>

        {/* Employee Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Employee Name:</span>
              <span className="font-bold text-slate-900 font-heading">{payslip.first_name} {payslip.last_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Employee Code:</span>
              <span className="font-mono text-slate-800 font-medium">{payslip.emp_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Department:</span>
              <span className="text-slate-800 font-semibold">{payslip.department_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Job Designation:</span>
              <span className="text-slate-800 font-semibold">{payslip.job_title}</span>
            </div>
          </div>

          <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-6">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Bank Name:</span>
              <span className="text-slate-800 font-medium">{payslip.bank_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Bank Account No:</span>
              <span className="font-mono text-slate-800">{payslip.bank_account_no || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">IFSC Code:</span>
              <span className="font-mono text-slate-800">{payslip.bank_ifsc || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">PAN / Tax ID:</span>
              <span className="font-mono text-slate-800">{payslip.pan_number || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Attendance Days Strip */}
        <div className="flex items-center justify-around p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold">
          <div>
            <span className="text-slate-500 font-normal">Total Calendar: </span>
            <span className="text-slate-900 font-bold">{payslip.total_days}d</span>
          </div>
          <div>
            <span className="text-slate-500 font-normal">Worked Days: </span>
            <span className="text-blue-600 font-bold">{payslip.worked_days}d</span>
          </div>
          <div>
            <span className="text-slate-500 font-normal">Paid Leaves: </span>
            <span className="text-emerald-700 font-bold">{payslip.paid_leave_days}d</span>
          </div>
          <div>
            <span className="text-slate-500 font-normal">Unpaid (LOP): </span>
            <span className="text-rose-700 font-bold">{payslip.unpaid_leave_days}d</span>
          </div>
        </div>

        {/* 2-Column Itemized Earnings and Deductions Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Earnings Column */}
          <div className="space-y-3">
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between text-xs font-bold text-blue-800 uppercase tracking-wider font-heading">
              <span>Earnings Component</span>
              <span>Amount (₹)</span>
            </div>

            <div className="space-y-1.5">
              {earnings.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-xs py-1 px-2 border-b border-slate-100">
                  <div>
                    <span className="font-medium text-slate-800">{e.rule_name}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">{e.rule_code}</span>
                  </div>
                  <span className="font-bold text-slate-900 text-sm">
                    ₹{Number(e.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 flex items-center justify-between text-xs font-bold pt-3 border-t border-slate-200">
              <span className="text-slate-700 font-heading">Total Gross Earnings</span>
              <span className="text-base text-slate-900 font-extrabold font-heading">
                ₹{Number(payslip.gross_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Deductions Column */}
          <div className="space-y-3">
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-between text-xs font-bold text-rose-800 uppercase tracking-wider font-heading">
              <span>Deductions Component</span>
              <span>Amount (₹)</span>
            </div>

            <div className="space-y-1.5">
              {deductions.map((d) => (
                <div key={d.id} className="flex items-center justify-between text-xs py-1 px-2 border-b border-slate-100">
                  <div>
                    <span className="font-medium text-slate-800">{d.rule_name}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">{d.rule_code}</span>
                  </div>
                  <span className="font-bold text-rose-700 text-sm">
                    ₹{Number(d.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 flex items-center justify-between text-xs font-bold pt-3 border-t border-slate-200">
              <span className="text-rose-700 font-heading">Total Deductions</span>
              <span className="text-base text-rose-700 font-extrabold font-heading">
                ₹{Number(payslip.total_deductions).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Net Payable Highlight Card */}
        <div className="p-6 rounded-2xl bg-blue-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-blue-100 font-heading">Net Payable Salary</span>
            <p className="text-xs text-blue-100/80 mt-0.5">Calculated as Gross Salary minus Statutory and Rule Deductions</p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-extrabold text-white font-heading">
              ₹ {Number(payslip.net_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h2>
            <span className="text-xs text-emerald-300 font-semibold block mt-0.5">
              {payslip.status === 'paid' ? '✓ Disbursed to Bank Account' : 'Ready for Disbursement'}
            </span>
          </div>
        </div>

        {/* Email Dispatched Status Badge */}
        {payslip.email_sent && (
          <div className="text-center text-xs text-emerald-700 flex items-center justify-center gap-1.5 pt-2 font-medium">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>Official payslip PDF was delivered to <strong>{payslip.email}</strong> on {payslip.email_sent_at?.split('T')[0]}</span>
          </div>
        )}
      </div>
    </div>
  );
}
