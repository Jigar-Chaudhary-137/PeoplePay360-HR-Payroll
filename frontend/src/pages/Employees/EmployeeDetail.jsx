import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User, Mail, Phone, Calendar, Building, Briefcase,
  DollarSign, Clock, CalendarOff, FileText, ArrowLeft,
  CreditCard, ShieldCheck, Download
} from 'lucide-react';
import { employeeAPI, payslipAPI } from '../../services/api';
import { Badge, LoadingSpinner } from '../../components/common/CommonUI';
import { useNotify } from '../../context/NotificationContext';

export function EmployeeDetail() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('contracts'); // 'contracts', 'attendance', 'leaves', 'payslips', 'profile'
  const { showToast } = useNotify();

  useEffect(() => {
    loadEmployee();
  }, [id]);

  const loadEmployee = async () => {
    setLoading(true);
    try {
      const res = await employeeAPI.getById(id);
      setEmployee(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !employee) {
    return <LoadingSpinner text="Fetching employee master records and ledgers..." />;
  }

  const contracts = employee.contracts || [];
  const attendance = employee.attendance || [];
  const leaves = employee.timeOffRequests || [];
  const allocations = employee.leaveAllocations || [];
  const payslips = employee.payslips || [];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link to="/employees" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={14} />
        <span>Back to Employees</span>
      </Link>

      {/* Profile Header Card */}
      <div className="glass-card p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-xl shadow-sky-500/20 shrink-0">
              {employee.first_name[0]}{employee.last_name[0]}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-100">
                  {employee.first_name} {employee.last_name}
                </h1>
                <Badge status={employee.employment_status} />
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-4 flex-wrap">
                <span className="text-sky-400 font-bold">{employee.emp_code}</span>
                <span>•</span>
                <span>{employee.job_title || 'Designation Pending'}</span>
                <span>•</span>
                <span>{employee.department_name || 'General Operations'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">System Role</p>
              <p className="text-sm font-bold text-slate-200 mt-0.5">{employee.user_role || 'Employee'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Joining Date</p>
              <p className="text-sm font-bold text-slate-200 mt-0.5">
                {employee.joining_date ? employee.joining_date.split('T')[0] : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-t border-white/10 mt-6 pt-4 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'contracts', label: `Contracts (${contracts.length})`, icon: DollarSign },
            { id: 'attendance', label: `Attendance (${attendance.length})`, icon: Clock },
            { id: 'leaves', label: `Time Off & Balances (${leaves.length})`, icon: CalendarOff },
            { id: 'payslips', label: `Payslips Ledger (${payslips.length})`, icon: FileText },
            { id: 'profile', label: 'Master & Banking', icon: CreditCard }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Contracts (Demonstrating Historical & Current Contracts) */}
      {activeTab === 'contracts' && (
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Employment Contracts</h3>
              <p className="text-xs text-slate-400">All historical, running, and draft compensation contracts</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Contract Code</th>
                  <th>Period</th>
                  <th>Salary Structure</th>
                  <th>Contract Wage</th>
                  <th>Schedule</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id}>
                    <td className="font-bold text-sky-400">{c.contract_code}</td>
                    <td className="text-slate-300 text-xs">
                      {c.start_date.split('T')[0]} → {c.end_date ? c.end_date.split('T')[0] : 'Present'}
                    </td>
                    <td className="text-slate-200 font-medium">{c.structure_name}</td>
                    <td className="font-extrabold text-slate-100 text-base">
                      ₹{Number(c.wage).toLocaleString()}
                    </td>
                    <td className="text-xs text-slate-400">{c.schedule_name || 'Standard 40h'}</td>
                    <td>
                      <Badge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Attendance */}
      {activeTab === 'attendance' && (
        <div className="glass-card p-5 space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h3 className="font-bold text-slate-100 text-sm">Attendance Logs</h3>
            <p className="text-xs text-slate-400">Recent check-in, check-out, and worked hours</p>
          </div>

          <div className="overflow-x-auto">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Worked Hours</th>
                  <th>Break</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((a) => (
                  <tr key={a.id}>
                    <td className="font-semibold text-slate-200">{a.date.split('T')[0]}</td>
                    <td className="text-slate-300">{a.check_in ? a.check_in.split('T')[1]?.slice(0, 5) : '-'}</td>
                    <td className="text-slate-300">{a.check_out ? a.check_out.split('T')[1]?.slice(0, 5) : '-'}</td>
                    <td className="font-bold text-sky-400">{a.worked_hours} hrs</td>
                    <td className="text-slate-400 text-xs">{a.break_hours} hr</td>
                    <td><Badge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Time Off & Allocations */}
      {activeTab === 'leaves' && (
        <div className="space-y-6">
          {/* Leave Balances Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {allocations.map((al) => (
              <div key={al.id} className="glass-card p-4 space-y-2 border-l-4" style={{ borderColor: al.type_color }}>
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">{al.type_name}</p>
                <div className="flex items-baseline justify-between">
                  <h3 className="text-2xl font-black text-slate-100">{al.remaining_days} <span className="text-xs font-normal text-slate-400">days left</span></h3>
                  <span className="text-xs text-slate-400">Total: {al.allocated_days}d</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(al.remaining_days / al.allocated_days) * 100}%`,
                      backgroundColor: al.type_color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Time off requests */}
          <div className="glass-card p-5 space-y-4">
            <div className="border-b border-white/5 pb-3">
              <h3 className="font-bold text-slate-100 text-sm">Time Off History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((l) => (
                    <tr key={l.id}>
                      <td className="font-bold" style={{ color: l.type_color }}>{l.type_name}</td>
                      <td>{l.start_date.split('T')[0]}</td>
                      <td>{l.end_date.split('T')[0]}</td>
                      <td className="font-bold text-slate-100">{l.requested_amount} {l.unit}</td>
                      <td className="text-slate-300 text-xs max-w-xs truncate">{l.reason}</td>
                      <td><Badge status={l.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Payslips */}
      {activeTab === 'payslips' && (
        <div className="glass-card p-5 space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h3 className="font-bold text-slate-100 text-sm">Historical Payslips</h3>
            <p className="text-xs text-slate-400">Computed and finalized payslip ledger</p>
          </div>

          <div className="overflow-x-auto">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Payslip Code</th>
                  <th>Period</th>
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
                    <td className="font-bold text-sky-400">{ps.payslip_code}</td>
                    <td className="text-slate-200 font-semibold">{ps.period_month}</td>
                    <td className="text-slate-300">₹{Number(ps.gross_salary).toLocaleString()}</td>
                    <td className="text-rose-400">₹{Number(ps.total_deductions).toLocaleString()}</td>
                    <td className="font-black text-emerald-400 text-base">
                      ₹{Number(ps.net_salary).toLocaleString()}
                    </td>
                    <td><Badge status={ps.status} /></td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/payslips/${ps.id}`} className="btn-secondary text-xs py-1 px-2.5">
                          Inspect
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

      {/* Tab 5: Master & Banking Profile */}
      {activeTab === 'profile' && (
        <div className="glass-card p-6 space-y-6">
          <div>
            <h3 className="font-bold text-slate-100 text-sm border-b border-white/5 pb-2">Master Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Work Email:</span>
                <span className="text-slate-100 font-semibold">{employee.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Phone:</span>
                <span className="text-slate-100 font-semibold">{employee.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Gender:</span>
                <span className="text-slate-100 font-semibold">{employee.gender}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-slate-100 text-sm border-b border-white/5 pb-2">Banking & Statutory</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Bank Name:</span>
                <span className="text-slate-100 font-semibold">{employee.bank_name || 'Not Configured (Warning)'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Account Number:</span>
                <span className="text-slate-100 font-semibold">{employee.bank_account_no || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">IFSC Code:</span>
                <span className="text-slate-100 font-semibold">{employee.bank_ifsc || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">PAN Number:</span>
                <span className="text-slate-100 font-semibold">{employee.pan_number || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
