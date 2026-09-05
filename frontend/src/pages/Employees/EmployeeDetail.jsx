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
    <div className="space-y-6 pb-6">
      {/* Back button */}
      <Link to="/employees" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-semibold transition-colors">
        <ArrowLeft size={14} />
        <span>Back to Employees</span>
      </Link>

      {/* Profile Header Card */}
      <div className="card p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-extrabold text-xl flex items-center justify-center shadow-xs shrink-0 font-heading">
              {employee.first_name?.[0]}{employee.last_name?.[0]}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 font-heading">
                  {employee.first_name} {employee.last_name}
                </h1>
                <Badge status={employee.employment_status} />
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap font-medium">
                <span className="text-blue-600 font-bold">{employee.emp_code}</span>
                <span>•</span>
                <span>{employee.job_title || 'Designation Pending'}</span>
                <span>•</span>
                <span>{employee.department_name || 'General Operations'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
            <div>
              <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider font-heading">System Role</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{employee.user_role || 'Employee'}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider font-heading">Joining Date</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {employee.joining_date ? employee.joining_date.split('T')[0] : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1.5 border-t border-slate-100 mt-6 pt-4 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'contracts', label: `Contracts (${contracts.length})`, icon: DollarSign },
            { id: 'attendance', label: `Attendance (${attendance.length})`, icon: Clock },
            { id: 'leaves', label: `Time Off (${leaves.length})`, icon: CalendarOff },
            { id: 'payslips', label: `Payslips (${payslips.length})`, icon: FileText },
            { id: 'profile', label: 'Master & Banking', icon: CreditCard }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap text-xs ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Contracts */}
      {activeTab === 'contracts' && (
        <div className="card p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm font-heading">Employment Contracts</h3>
            <p className="text-xs text-slate-500 mt-0.5">All historical, running, and draft compensation contracts</p>
          </div>

          <div className="custom-table-container">
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
                    <td className="font-bold text-blue-600">{c.contract_code}</td>
                    <td className="text-slate-600 text-xs font-medium">
                      {c.start_date ? c.start_date.split('T')[0] : ''} → {c.end_date ? c.end_date.split('T')[0] : 'Present'}
                    </td>
                    <td className="text-slate-800 font-medium">{c.structure_name}</td>
                    <td className="font-extrabold text-slate-900 text-sm">
                      ₹{Number(c.wage).toLocaleString('en-IN')}
                    </td>
                    <td className="text-xs text-slate-500">{c.schedule_name || 'Standard 40h'}</td>
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
        <div className="card p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm font-heading">Attendance Logs</h3>
            <p className="text-xs text-slate-500 mt-0.5">Recent check-in, check-out, and worked hours</p>
          </div>

          <div className="custom-table-container">
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
                    <td className="font-semibold text-slate-800">{a.date ? a.date.split('T')[0] : ''}</td>
                    <td className="text-slate-600">{a.check_in ? a.check_in.split('T')[1]?.slice(0, 5) : '-'}</td>
                    <td className="text-slate-600">{a.check_out ? a.check_out.split('T')[1]?.slice(0, 5) : '-'}</td>
                    <td className="font-bold text-blue-600">{a.worked_hours} hrs</td>
                    <td className="text-slate-500 text-xs">{a.break_hours} hr</td>
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
        <div className="space-y-5">
          {/* Leave Balances Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {allocations.map((al) => (
              <div key={al.id} className="card p-4 space-y-2 border-l-4 border-blue-500">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-heading">{al.type_name}</p>
                <div className="flex items-baseline justify-between">
                  <h3 className="text-2xl font-extrabold text-slate-900 font-heading">{al.remaining_days} <span className="text-xs font-normal text-slate-500">days left</span></h3>
                  <span className="text-xs text-slate-400">Total: {al.allocated_days}d</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{
                      width: `${Math.min(100, (al.remaining_days / (al.allocated_days || 1)) * 100)}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Time off requests */}
          <div className="card p-5 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm font-heading">Time Off History</h3>
            </div>
            <div className="custom-table-container">
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
                      <td className="font-bold text-slate-800">{l.type_name}</td>
                      <td className="text-slate-600">{l.start_date ? l.start_date.split('T')[0] : ''}</td>
                      <td className="text-slate-600">{l.end_date ? l.end_date.split('T')[0] : ''}</td>
                      <td className="font-bold text-slate-900">{l.requested_amount || l.days_requested} {l.unit || 'Days'}</td>
                      <td className="text-slate-500 text-xs max-w-xs truncate">{l.reason}</td>
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
        <div className="card p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm font-heading">Historical Payslips</h3>
            <p className="text-xs text-slate-500 mt-0.5">Computed and finalized payslip ledger</p>
          </div>

          <div className="custom-table-container">
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
                    <td className="font-bold text-blue-600">{ps.payslip_code || `PS-${ps.id}`}</td>
                    <td className="text-slate-700 font-semibold">{ps.period_month || ps.period_start?.slice(0, 7)}</td>
                    <td className="text-slate-600">₹{Number(ps.gross_salary).toLocaleString('en-IN')}</td>
                    <td className="text-rose-600">₹{Number(ps.total_deductions).toLocaleString('en-IN')}</td>
                    <td className="font-extrabold text-emerald-600 text-sm">
                      ₹{Number(ps.net_salary).toLocaleString('en-IN')}
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
        <div className="card p-6 space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 font-heading">Master Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Work Email:</span>
                <span className="text-slate-800 font-semibold">{employee.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Phone:</span>
                <span className="text-slate-800 font-semibold">{employee.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Gender:</span>
                <span className="text-slate-800 font-semibold">{employee.gender || 'Not specified'}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 font-heading">Banking & Statutory</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Bank Name:</span>
                <span className="text-slate-800 font-semibold">{employee.bank_name || 'Not Configured (Warning)'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Account Number:</span>
                <span className="text-slate-800 font-semibold">{employee.bank_account_no || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">IFSC Code:</span>
                <span className="text-slate-800 font-semibold">{employee.bank_ifsc || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">PAN Number:</span>
                <span className="text-slate-800 font-semibold">{employee.pan_no || employee.pan_number || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
