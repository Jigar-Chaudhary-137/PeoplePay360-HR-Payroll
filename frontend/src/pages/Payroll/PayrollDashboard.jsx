import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign, FileText, TrendingUp, Calendar, CheckCircle2,
  AlertTriangle, Users, Building, ArrowUpRight, Filter, ShieldAlert, Sparkles
} from 'lucide-react';
import { dashboardAPI } from '../../services/api';
import { StatCard, LoadingSpinner, Badge } from '../../components/common/CommonUI';

export function PayrollDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await dashboardAPI.getMetrics({
        period_month: selectedPeriod || undefined,
        department_id: selectedDept || undefined
      });
      setData(res);
      if (!selectedPeriod && res.activePeriod) {
        setSelectedPeriod(res.activePeriod);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [selectedPeriod, selectedDept]);

  if (loading && !data) {
    return <LoadingSpinner text="Computing real-time payroll ledger metrics..." />;
  }

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const anomalies = data?.anomalies || [];

  return (
    <div className="space-y-6">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2.5">
            Payroll Operations Center
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider">
              Live Verified
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time ledger analytics, departmental distributions, and proactive anomaly surveillance
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
            <Calendar size={14} className="text-sky-400" />
            <span className="text-slate-400">Period:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-slate-100 font-semibold outline-none cursor-pointer"
            >
              {(data?.availablePeriods || ['2026-08', '2026-07']).map((p) => (
                <option key={p} value={p} className="bg-slate-900 text-slate-100">
                  {p}
                </option>
              ))}
            </select>
          </div>

          <Link to="/payruns" className="btn-primary text-xs">
            <DollarSign size={14} />
            <span>Process Payrun</span>
          </Link>
        </div>
      </div>

      {/* 5 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Net Payroll"
          value={`₹${(kpis.total_net_paid || 0).toLocaleString()}`}
          subtitle={`Gross: ₹${(kpis.total_gross || 0).toLocaleString()}`}
          icon={DollarSign}
          color="sky"
        />
        <StatCard
          title="Payslips Issued"
          value={kpis.total_payslips || 0}
          subtitle={`Active Staff: ${kpis.active_employees || 0}`}
          icon={FileText}
          color="emerald"
        />
        <StatCard
          title="Avg Net Salary"
          value={`₹${(kpis.avg_net_salary || 0).toLocaleString()}`}
          subtitle="Per employee"
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Approved Leaves"
          value={`${kpis.approved_leave_days || 0} Days`}
          subtitle="During active period"
          icon={Calendar}
          color="amber"
        />
        <StatCard
          title="Attendance Health"
          value={`${kpis.attendance_health || 100}%`}
          subtitle="Punch punctuality rate"
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* Anomaly Warnings Feed if Any */}
      {anomalies.length > 0 && (
        <div className="glass-card p-5 border-amber-500/30 bg-amber-950/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <ShieldAlert size={18} />
              <span>Active Payroll Anomalies & Warnings ({anomalies.length} Flagged)</span>
            </div>
            <Link to="/payruns" className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1">
              <span>View in Payruns</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {anomalies.map((a) => (
              <div
                key={a.id}
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  a.severity === 'critical'
                    ? 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                    : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="truncate">{a.title}</span>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-black/40">
                    {a.severity}
                  </span>
                </div>
                <p className="text-slate-300 line-clamp-2">{a.reason}</p>
                <div className="text-[11px] text-slate-400 font-medium pt-1">
                  Employee: <span className="text-slate-200">{a.first_name} {a.last_name} ({a.emp_code})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Salary Cost Table/Chart */}
        <div className="glass-card p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Salary Cost by Department</h3>
              <p className="text-xs text-slate-400">Aggregated payroll expenditure and average compensation</p>
            </div>
            <span className="text-xs text-slate-400 font-medium">Period: {selectedPeriod}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Employees</th>
                  <th>Total Gross</th>
                  <th>Total Net Salary</th>
                  <th>Avg Net</th>
                </tr>
              </thead>
              <tbody>
                {(charts.deptCosts || []).map((d) => (
                  <tr key={d.department_code}>
                    <td className="font-semibold text-slate-100">
                      {d.department_name}
                      <span className="text-[10px] text-slate-400 ml-1.5">({d.department_code})</span>
                    </td>
                    <td>{d.employee_count}</td>
                    <td className="text-slate-300">₹{Number(d.total_gross || 0).toLocaleString()}</td>
                    <td className="text-sky-400 font-bold">₹{Number(d.total_net || 0).toLocaleString()}</td>
                    <td className="text-slate-300">₹{Math.round(Number(d.avg_net || 0)).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Net Salary Trend (Ledger History) */}
        <div className="glass-card p-5 space-y-4">
          <div className="border-b border-white/5 pb-3">
            <h3 className="font-bold text-slate-100 text-sm">Monthly Payroll Trend</h3>
            <p className="text-xs text-slate-400">Historical payrun disbursement comparison</p>
          </div>

          <div className="space-y-3">
            {(charts.monthlyTrend || []).map((m) => (
              <div key={m.period_month} className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">{m.period_month}</span>
                  <span className="text-sky-400 font-bold">₹{Number(m.total_net || 0).toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-sky-500 to-indigo-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, (Number(m.total_net) / (kpis.total_net_paid || 1)) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Gross: ₹{Number(m.total_gross || 0).toLocaleString()}</span>
                  <span>{m.payslip_count} Payslips</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
