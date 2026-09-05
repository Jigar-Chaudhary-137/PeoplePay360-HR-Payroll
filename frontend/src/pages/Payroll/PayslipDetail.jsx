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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link to="/payslips" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={14} />
          <span>Back to Payslips</span>
        </Link>

        <div className="flex items-center gap-2.5">
          {hasRole('HR Payroll Admin', 'HR Payroll User', 'Admin') && (
            <button
              onClick={handleSendEmail}
              disabled={emailing}
              className="btn-secondary text-xs"
            >
              <Send size={14} />
              <span>{emailing ? 'Dispatching...' : payslip.email_sent ? 'Re-send Email' : 'Email Payslip'}</span>
            </button>
          )}

          <a
            href={payslipAPI.getPDFUrl(id)}
            target="_blank"
            rel="noreferrer"
            className="btn-primary text-xs"
          >
            <Download size={14} />
            <span>Download Official PDF</span>
          </a>
        </div>
      </div>

      {/* Main Document / Payslip View Card */}
      <div className="glass-card p-8 space-y-6 bg-slate-900/90 border border-white/15 shadow-2xl relative">
        {/* Company Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-sky-500/20">
              360
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100 tracking-tight">PEOPLEPAY360 GLOBAL</h2>
              <p className="text-xs text-slate-400">Intelligent HR & Payroll Operations Platform</p>
            </div>
          </div>

          <div className="text-right">
            <h3 className="text-lg font-black text-sky-400 tracking-wide">PAYSLIP</h3>
            <p className="text-xs font-semibold text-slate-300">Period: {payslip.period_month}</p>
            <p className="text-[11px] font-mono text-slate-400">Slip No: {payslip.payslip_code}</p>
          </div>
        </div>

        {/* Employee Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-white/5 border border-white/5 text-xs">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Employee Name:</span>
              <span className="font-bold text-slate-100">{payslip.first_name} {payslip.last_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Employee Code:</span>
              <span className="font-mono text-slate-200">{payslip.emp_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Department:</span>
              <span className="text-slate-200 font-semibold">{payslip.department_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Job Designation:</span>
              <span className="text-slate-200 font-semibold">{payslip.job_title}</span>
            </div>
          </div>

          <div className="space-y-2 border-t md:border-t-0 md:border-l border-white/5 pt-2 md:pt-0 md:pl-6">
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Bank Name:</span>
              <span className="text-slate-200">{payslip.bank_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">Bank Account No:</span>
              <span className="font-mono text-slate-200">{payslip.bank_account_no || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">IFSC Code:</span>
              <span className="font-mono text-slate-200">{payslip.bank_ifsc || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-medium">PAN / Tax ID:</span>
              <span className="font-mono text-slate-200">{payslip.pan_number || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Attendance Days Strip */}
        <div className="flex items-center justify-around p-3 rounded-xl bg-slate-950 border border-white/10 text-xs font-semibold">
          <div>
            <span className="text-slate-400">Total Calendar Days: </span>
            <span className="text-slate-100 font-bold">{payslip.total_days}d</span>
          </div>
          <div>
            <span className="text-slate-400">Worked Days: </span>
            <span className="text-sky-400 font-bold">{payslip.worked_days}d</span>
          </div>
          <div>
            <span className="text-slate-400">Paid Leaves: </span>
            <span className="text-emerald-400 font-bold">{payslip.paid_leave_days}d</span>
          </div>
          <div>
            <span className="text-slate-400">Unpaid Absences (LOP): </span>
            <span className="text-rose-400 font-bold">{payslip.unpaid_leave_days}d</span>
          </div>
        </div>

        {/* 2-Column Itemized Earnings and Deductions Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Earnings Column */}
          <div className="space-y-3">
            <div className="p-2.5 rounded-lg bg-sky-950/60 border border-sky-500/30 flex items-center justify-between text-xs font-bold text-sky-300 uppercase tracking-wider">
              <span>Earnings Component</span>
              <span>Amount (₹)</span>
            </div>

            <div className="space-y-2">
              {earnings.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-xs py-1 px-2 border-b border-white/5">
                  <div>
                    <span className="font-semibold text-slate-200">{e.rule_name}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">{e.rule_code}</span>
                  </div>
                  <span className="font-bold text-slate-100 text-sm">
                    ₹{Number(e.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-white/5 flex items-center justify-between text-xs font-bold pt-3 border-t border-white/10">
              <span className="text-slate-300">Total Gross Earnings</span>
              <span className="text-base text-slate-100 font-black">
                ₹{Number(payslip.gross_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Deductions Column */}
          <div className="space-y-3">
            <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-500/30 flex items-center justify-between text-xs font-bold text-rose-300 uppercase tracking-wider">
              <span>Deductions Component</span>
              <span>Amount (₹)</span>
            </div>

            <div className="space-y-2">
              {deductions.map((d) => (
                <div key={d.id} className="flex items-center justify-between text-xs py-1 px-2 border-b border-white/5">
                  <div>
                    <span className="font-semibold text-slate-200">{d.rule_name}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">{d.rule_code}</span>
                  </div>
                  <span className="font-bold text-rose-400 text-sm">
                    ₹{Number(d.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-white/5 flex items-center justify-between text-xs font-bold pt-3 border-t border-white/10">
              <span className="text-rose-400">Total Deductions</span>
              <span className="text-base text-rose-400 font-black">
                ₹{Number(payslip.total_deductions).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Net Payable Highlight Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border border-sky-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-sky-400">Net Payable Salary</span>
            <p className="text-xs text-slate-400 mt-0.5">Calculated as Gross Salary minus Statutory and Rule Deductions</p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-black text-white text-gradient">
              ₹ {Number(payslip.net_salary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h2>
            <span className="text-[10px] text-emerald-400 font-semibold block">
              {payslip.status === 'paid' ? 'Disbursed to Bank Account' : 'Ready for Disbursement'}
            </span>
          </div>
        </div>

        {/* Email Dispatched Status Badge */}
        {payslip.email_sent && (
          <div className="text-center text-xs text-emerald-400 flex items-center justify-center gap-1.5 pt-2">
            <CheckCircle2 size={14} />
            <span>Official payslip PDF was delivered to <strong>{payslip.email}</strong> on {payslip.email_sent_at?.split('T')[0]}</span>
          </div>
        )}
      </div>
    </div>
  );
}
