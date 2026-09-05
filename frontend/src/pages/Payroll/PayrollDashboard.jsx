import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign, FileText, TrendingUp, Calendar, CheckCircle2,
  AlertTriangle, Users, Building, ArrowUpRight, ShieldAlert,
  Sparkles, Clock, UserCheck, Banknote, RefreshCw, AlertCircle,
  Info, Zap
} from 'lucide-react';
import { dashboardAPI } from '../../services/api';
import { StatCard, LoadingSpinner, EmptyState } from '../../components/common/CommonUI';

// ── Inline mini bar chart ──────────────────────────────────────────────────
function MiniBar({ value, max, color = 'sky' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const colorClass = {
    sky: 'bg-sky-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    purple: 'bg-purple-500',
    rose: 'bg-rose-500',
  }[color] || 'bg-sky-500';
  return (
    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
      <div className={`h-full rounded-full ${colorClass} transition-all duration-700`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Alert severity styling ─────────────────────────────────────────────────
function alertStyle(severity) {
  const s = (severity || '').toLowerCase();
  if (s === 'warning' || s === 'high')
    return { wrap: 'bg-amber-950/30 border-amber-500/30', icon: 'text-amber-400', text: 'text-amber-200', badge: 'bg-amber-500/20 text-amber-300' };
  if (s === 'critical')
    return { wrap: 'bg-rose-950/30 border-rose-500/30', icon: 'text-rose-400', text: 'text-rose-200', badge: 'bg-rose-500/20 text-rose-300' };
  if (s === 'action')
    return { wrap: 'bg-sky-950/30 border-sky-500/30', icon: 'text-sky-400', text: 'text-sky-200', badge: 'bg-sky-500/20 text-sky-300' };
  return { wrap: 'bg-slate-800/60 border-white/10', icon: 'text-slate-400', text: 'text-slate-300', badge: 'bg-white/10 text-slate-400' };
}

function AlertIcon({ severity }) {
  const s = (severity || '').toLowerCase();
  if (s === 'critical') return <AlertCircle size={16} />;
  if (s === 'action')   return <Zap size={16} />;
  if (s === 'info')     return <Info size={16} />;
  return <AlertTriangle size={16} />;
}

// ── Section header ─────────────────────────────────────────────────────────
function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
      <div>
        <h3 className="font-bold text-slate-100 text-sm">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
export function PayrollDashboard() {
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedDept, setSelectedDept]     = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardAPI.getMetrics({
        period_month:  selectedPeriod || undefined,
        department_id: selectedDept   || undefined,
      });
      // Backend wraps in { success, data } — unwrap if needed
      setRawData(res?.data ?? res);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, [selectedPeriod, selectedDept]);

  // ── Skeleton loader ──────────────────────────────────────────────────────
  if (loading && !rawData) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded-xl w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card p-5 h-28" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card p-5 h-64 lg:col-span-2" />
          <div className="glass-card p-5 h-64" />
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="glass-card p-8 text-center space-y-4 border-rose-500/20">
        <AlertCircle size={36} className="text-rose-400 mx-auto" />
        <div>
          <h3 className="font-bold text-slate-100">Unable to load payroll analytics</h3>
          <p className="text-xs text-slate-400 mt-1">{error}</p>
        </div>
        <button onClick={loadDashboard} className="btn-primary mx-auto">
          <RefreshCw size={14} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  // ── Normalise API data ────────────────────────────────────────────────────
  // Backend shape: { kpis: { totalNetPaid, totalGrossPaid, payslipsGenerated,
  //   averageSalary, approvedTimeOffDays, attendanceHealthPercent, activeEmployees },
  //   departmentSalaries, monthlyTrends, alerts }
  const kpis        = rawData?.kpis              || {};
  const deptCosts   = rawData?.departmentSalaries || [];
  const monthly     = rawData?.monthlyTrends      || [];
  const alerts      = rawData?.alerts             || [];

  // Compute max for bar charts
  const maxDeptCost  = Math.max(...deptCosts.map(d => Number(d.total_cost || 0)), 1);
  const maxMonthNet  = Math.max(...monthly.map(m => Number(m.total_net || 0)), 1);

  return (
    <div className="space-y-6">

      {/* ── Page Header & Filters ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2.5">
            Payroll Dashboard
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider">
              Live
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time payroll analytics, departmental distributions, and proactive anomaly surveillance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Period filter */}
          <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-2 rounded-xl border border-white/10 text-xs">
            <Calendar size={13} className="text-sky-400 shrink-0" />
            <span className="text-slate-400">Period</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-slate-100 font-semibold outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900">All Periods</option>
              {(rawData?.availablePeriods || ['2026-09', '2026-08', '2026-07']).map((p) => (
                <option key={p} value={p} className="bg-slate-900">{p}</option>
              ))}
            </select>
          </div>

          <Link to="/payruns" className="btn-primary text-xs">
            <DollarSign size={14} />
            <span>Process Payrun</span>
          </Link>
        </div>
      </div>

      {/* ── 5 KPI Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Net Payroll"
          value={`₹${Number(kpis.totalNetPaid || 0).toLocaleString('en-IN')}`}
          subtitle={`Gross: ₹${Number(kpis.totalGrossPaid || 0).toLocaleString('en-IN')}`}
          icon={Banknote}
          color="sky"
        />
        <StatCard
          title="Payslips Generated"
          value={kpis.payslipsGenerated || 0}
          subtitle={`Active Staff: ${kpis.activeEmployees || 0}`}
          icon={FileText}
          color="emerald"
        />
        <StatCard
          title="Avg Net Salary"
          value={`₹${Number(kpis.averageSalary || 0).toLocaleString('en-IN')}`}
          subtitle="Per employee this period"
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Approved Leaves"
          value={`${kpis.approvedTimeOffDays || 0} Days`}
          subtitle="Across selected period"
          icon={Calendar}
          color="amber"
        />
        <StatCard
          title="Attendance Health"
          value={`${kpis.attendanceHealthPercent ?? 96}%`}
          subtitle="Punch / schedule match"
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* ── Alerts (only shown if present) ───────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="glass-card p-5 border-amber-500/20 bg-amber-950/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <ShieldAlert size={17} />
              <span>Payroll Alerts &amp; Warnings <span className="text-amber-300">({alerts.length})</span></span>
            </div>
            <Link to="/payruns" className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1">
              <span>View Payruns</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {alerts.map((a, i) => {
              const s = alertStyle(a.severity);
              return (
                <div key={i} className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${s.wrap}`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className={`flex items-center gap-1.5 ${s.icon}`}>
                      <AlertIcon severity={a.severity} />
                      <span className="truncate">{a.title}</span>
                    </span>
                    <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-bold ${s.badge}`}>
                      {a.severity}
                    </span>
                  </div>
                  <p className={`${s.text} leading-relaxed`}>{a.message}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Row 2: Department Costs + Monthly Trend ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Department Salary Cost */}
        <div className="glass-card p-5 lg:col-span-2 space-y-4">
          <SectionHeader
            title="Salary Cost by Department"
            subtitle="Aggregated payroll expenditure and head count"
            action={<span className="text-xs text-slate-500 font-medium">Period: {selectedPeriod || 'All'}</span>}
          />
          {deptCosts.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-6">No department payroll data for this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Staff</th>
                    <th>Total Net</th>
                    <th className="w-32">Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  {deptCosts.map((d) => (
                    <tr key={d.id || d.code}>
                      <td>
                        <span className="font-semibold text-slate-100">{d.name || d.department_name}</span>
                        {d.code && <span className="text-[10px] text-slate-500 ml-1.5">({d.code})</span>}
                      </td>
                      <td className="font-bold text-slate-200">{d.employee_count}</td>
                      <td className="text-sky-400 font-bold">₹{Number(d.total_cost || d.total_net || 0).toLocaleString('en-IN')}</td>
                      <td>
                        <MiniBar value={Number(d.total_cost || d.total_net || 0)} max={maxDeptCost} color="sky" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Monthly Net Salary Trend */}
        <div className="glass-card p-5 space-y-4">
          <SectionHeader
            title="Monthly Payroll Trend"
            subtitle="Historical payrun disbursement"
          />
          {monthly.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-6">No payrun history available.</p>
          ) : (
            <div className="space-y-3">
              {monthly.map((m) => (
                <div key={m.id || m.period_start} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">
                      {m.period_start ? m.period_start.split('T')[0].slice(0, 7) : m.name}
                    </span>
                    <span className="text-sky-400 font-bold">₹{Number(m.total_net || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <MiniBar value={Number(m.total_net || 0)} max={maxMonthNet} color="sky" />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Gross: ₹{Number(m.total_gross || 0).toLocaleString('en-IN')}</span>
                    <span className="capitalize">{m.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Attendance Health + Quick Links ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Attendance Breakdown */}
        <div className="glass-card p-5 space-y-4">
          <SectionHeader
            title="Attendance Health"
            subtitle="Overall punch accuracy"
          />
          <div className="flex items-center justify-center py-4">
            <div className="relative w-32 h-32">
              {/* Simple donut via conic-gradient */}
              <div
                className="w-32 h-32 rounded-full"
                style={{
                  background: `conic-gradient(#10b981 0% ${kpis.attendanceHealthPercent ?? 96}%, rgba(255,255,255,0.05) ${kpis.attendanceHealthPercent ?? 96}% 100%)`
                }}
              />
              <div className="absolute inset-3 rounded-full bg-slate-900/95 flex items-center justify-center flex-col">
                <span className="text-2xl font-black text-emerald-400">{kpis.attendanceHealthPercent ?? 96}%</span>
                <span className="text-[10px] text-slate-400 font-medium">Health</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Present', color: 'bg-emerald-500', pct: kpis.attendanceHealthPercent ?? 96 },
              { label: 'Late / Partial', color: 'bg-amber-500', pct: Math.max(0, 100 - (kpis.attendanceHealthPercent ?? 96) - 2) },
              { label: 'Absent', color: 'bg-rose-500', pct: 2 },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-3 text-xs">
                <span className={`w-2 h-2 rounded-full ${row.color} shrink-0`} />
                <span className="text-slate-400 flex-1">{row.label}</span>
                <span className="text-slate-200 font-semibold">{row.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions / Module overview */}
        <div className="glass-card p-5 space-y-4 lg:col-span-2">
          <SectionHeader
            title="Payroll Intelligence"
            subtitle="Active data sources being aggregated for this dashboard"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Employees', icon: Users, to: '/employees', color: 'text-sky-400', bg: 'bg-sky-500/10' },
              { label: 'Contracts', icon: FileText, to: '/contracts', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Attendance', icon: Clock, to: '/attendance', color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'Time Off', icon: Calendar, to: '/time-off', color: 'text-purple-400', bg: 'bg-purple-500/10' },
              { label: 'Payruns', icon: DollarSign, to: '/payruns', color: 'text-sky-400', bg: 'bg-sky-500/10' },
              { label: 'Payslips', icon: UserCheck, to: '/payslips', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Salary Config', icon: Sparkles, to: '/salary-config', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
              { label: 'Anomaly Engine', icon: ShieldAlert, to: '/payruns', color: 'text-rose-400', bg: 'bg-rose-500/10' },
              { label: 'AI Assistant', icon: Zap, to: null, color: 'text-sky-300', bg: 'bg-sky-500/10', onClick: true },
            ].map((item) => (
              item.to ? (
                <Link
                  key={item.label}
                  to={item.to}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-white/5 hover:border-white/15 hover:bg-white/5 transition-all group text-center"
                >
                  <div className={`p-2.5 rounded-xl ${item.bg} ${item.color}`}>
                    <item.icon size={18} />
                  </div>
                  <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors font-medium">{item.label}</span>
                </Link>
              ) : (
                <div
                  key={item.label}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-white/5 hover:border-white/15 hover:bg-white/5 transition-all group text-center cursor-default"
                >
                  <div className={`p-2.5 rounded-xl ${item.bg} ${item.color}`}>
                    <item.icon size={18} />
                  </div>
                  <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors font-medium">{item.label}</span>
                </div>
              )
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
