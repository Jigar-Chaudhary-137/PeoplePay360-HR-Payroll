import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign, FileText, TrendingUp, Calendar, CheckCircle2,
  AlertTriangle, Users, Building, ArrowUpRight, ShieldAlert,
  Sparkles, Clock, UserCheck, RefreshCw, AlertCircle,
  Info, Zap, ArrowRight
} from 'lucide-react';
import { dashboardAPI } from '../../services/api';
import { StatCard, LoadingSpinner, ErrorState } from '../../components/common/CommonUI';

export function PayrollDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardAPI.getMetrics({
        period_month: selectedPeriod || undefined,
        department_id: selectedDept || undefined,
      });
      const payload = res?.data || res;
      setData(payload);
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [selectedPeriod, selectedDept]);

  // Skeleton loader
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="h-8 skeleton w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card p-5 h-28 skeleton" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="glass-card p-5 h-64 lg:col-span-2 skeleton" />
          <div className="glass-card p-5 h-64 skeleton" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorState
        title="Unable to load payroll analytics"
        message={error}
        onRetry={loadDashboard}
      />
    );
  }

  const kpis = (data && typeof data.kpis === 'object') ? data.kpis : {};
  const deptCosts = Array.isArray(data?.departmentSalaries) ? data.departmentSalaries : [];
  const monthlyTrend = Array.isArray(data?.monthlyTrends) ? data.monthlyTrends : [];
  const anomalies = Array.isArray(data?.alerts) ? data.alerts : [];
  const availablePeriods = Array.isArray(data?.availablePeriods) ? data.availablePeriods : ['2026-09', '2026-08', '2026-07'];
  const totalDeptCostSum = deptCosts.reduce((acc, curr) => acc + Number(curr.total_cost || curr.total_net || 0), 0) || 1;

  const currentPeriodName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 pb-6 text-[#17151F]">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E5EF]">
        <div>
          <h1 className="page-title">
            Payroll Operations
          </h1>
          <p className="text-sm text-[#625E6E] mt-0.5">
            Real-time payroll, attendance and workforce insights
          </p>
        </div>

        {/* Right side controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period selector */}
          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-[#DDD9E8] text-xs font-medium text-[#17151F] shadow-sm">
            <Calendar size={14} className="text-[#6C3FF5] shrink-0" />
            <span className="text-[#625E6E]">Period:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-[#17151F] font-bold outline-none cursor-pointer"
            >
              <option value="" className="bg-white text-[#17151F]">All Periods ({currentPeriodName})</option>
              {availablePeriods.map((p) => {
                const monthVal = typeof p === 'string' ? p : (p.period_month || p.month || '');
                const monthLabel = typeof p === 'string' ? p : (p.period_label || p.period_month || p.month || monthVal);
                return (
                  <option key={monthVal} value={monthVal} className="bg-white text-[#17151F]">
                    {monthLabel}
                  </option>
                );
              })}
            </select>
          </div>

          <button
            onClick={loadDashboard}
            className="btn-secondary text-xs px-3.5 py-2"
            title="Refresh Ledger"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link to="/payruns" className="btn-primary text-xs px-4 py-2">
            <DollarSign size={15} />
            <span>Process Payrun</span>
          </Link>
        </div>
      </div>

      {/* 5 KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Net Payroll"
          value={`₹${Number(kpis.totalNetPaid || 0).toLocaleString('en-IN')}`}
          subtitle={`Gross: ₹${Number(kpis.totalGrossPaid || 0).toLocaleString('en-IN')}`}
          icon={DollarSign}
          color="purple"
        />
        <StatCard
          title="Payslips Issued"
          value={kpis.payslipsGenerated || 0}
          subtitle={`Active Staff: ${kpis.activeEmployees || 0}`}
          icon={FileText}
          color="emerald"
        />
        <StatCard
          title="Average Net Salary"
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

      {/* Alerts / Anomalies Section */}
      {anomalies.length > 0 && (
        <div className="glass-card p-5 border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
              <ShieldAlert size={18} className="text-amber-600" />
              <span>Payroll Warnings & Anomalies ({anomalies.length} Flagged)</span>
            </div>
            <Link to="/payruns" className="text-xs text-[#6C3FF5] hover:text-[#5125C7] font-semibold flex items-center gap-1 transition-colors">
              <span>Inspect in Payrun Console</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {anomalies.map((a, idx) => {
              const isWarning = a.severity === 'WARNING' || a.severity === 'critical' || a.severity === 'high';
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                    isWarning
                      ? 'bg-white border-amber-200 text-[#17151F]'
                      : 'bg-white border-blue-200 text-[#17151F]'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span className="truncate text-[#17151F] text-sm">{a.title}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      isWarning
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}>
                      {a.severity}
                    </span>
                  </div>
                  <p className="text-[#625E6E] text-xs leading-relaxed">{a.message || a.reason}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Content Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Large: Salary Cost by Department */}
        <div className="glass-card p-5 lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E7E5EF] pb-3">
            <div>
              <h3 className="font-bold text-[#17151F] text-base flex items-center gap-2">
                <Building size={17} className="text-[#6C3FF5]" />
                Salary Cost by Department
              </h3>
              <p className="text-xs text-[#625E6E] mt-0.5">Aggregated payroll expenditure and average employee compensation</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#F8F5FF] text-[#6C3FF5] border border-[#DDD9E8] self-start sm:self-auto">
              Period: {selectedPeriod || currentPeriodName}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th className="text-center">Employees</th>
                  <th>Total Gross</th>
                  <th>Total Net Salary</th>
                  <th>Avg Net</th>
                  <th className="w-24 text-right">Share</th>
                </tr>
              </thead>
              <tbody>
                {deptCosts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-[#918C9F] text-sm">
                      No departmental payroll data available.
                    </td>
                  </tr>
                ) : (
                  deptCosts.map((d) => {
                    const netCost = Number(d.total_cost || d.total_net || 0);
                    const grossCost = Number(d.total_gross || 0);
                    const sharePct = Math.round((netCost / totalDeptCostSum) * 100) || 0;
                    const avgNet = d.employee_count > 0 ? Math.round(netCost / d.employee_count) : 0;
                    return (
                      <tr key={d.id || d.code || d.department_name || d.name}>
                        <td>
                          <div className="font-bold text-[#17151F] text-sm">
                            {d.department_name || d.name}
                          </div>
                          {d.code && <span className="text-[11px] text-[#6C3FF5] font-semibold">Code: {d.code}</span>}
                        </td>
                        <td className="text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#F1ECFF] text-[#6C3FF5] font-bold text-xs border border-[#DDD9E8]">
                            {d.employee_count}
                          </span>
                        </td>
                        <td className="text-[#625E6E] text-sm font-medium">{grossCost > 0 ? `₹${grossCost.toLocaleString('en-IN')}` : '—'}</td>
                        <td className="text-[#17151F] font-bold text-sm">₹{netCost.toLocaleString('en-IN')}</td>
                        <td className="text-[#625E6E] text-sm font-medium">₹{avgNet.toLocaleString('en-IN')}</td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs font-bold text-[#17151F]">{sharePct}%</span>
                            <div className="w-12 bg-[#E7E5EF] h-2 rounded-full overflow-hidden shrink-0">
                              <div
                                className="bg-[#6C3FF5] h-full rounded-full"
                                style={{ width: `${sharePct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Monthly Payroll Trend */}
        <div className="glass-card p-5 space-y-4">
          <div className="border-b border-[#E7E5EF] pb-3">
            <h3 className="font-bold text-[#17151F] text-base flex items-center gap-2">
              <TrendingUp size={17} className="text-[#6C3FF5]" />
              Monthly Payroll Trend
            </h3>
            <p className="text-xs text-[#625E6E] mt-0.5">Historical payrun disbursement comparison</p>
          </div>

          <div className="space-y-3">
            {monthlyTrend.length === 0 ? (
              <div className="text-center py-10 px-4 bg-[#F8F8FC] rounded-xl border border-dashed border-[#DDD9E8]">
                <div className="w-10 h-10 rounded-full bg-[#F1ECFF] border border-[#DDD9E8] flex items-center justify-center mx-auto mb-2 text-[#6C3FF5]">
                  <TrendingUp size={18} />
                </div>
                <p className="text-sm font-bold text-[#17151F]">No payroll history yet</p>
                <p className="text-xs text-[#625E6E] mt-1 max-w-xs mx-auto">
                  Process your first payrun to see monthly trends.
                </p>
                <Link to="/payruns" className="btn-primary text-xs mt-3 px-3 py-1.5 inline-flex">
                  Process Payrun
                </Link>
              </div>
            ) : (
              monthlyTrend.map((m) => {
                const net = Number(m.total_net || 0);
                const gross = Number(m.total_gross || 0);
                const label = m.name || m.period_start?.slice(0, 7) || `Run #${m.id}`;
                return (
                  <div key={m.id || label} className="p-3.5 rounded-xl bg-white border border-[#E7E5EF] hover:border-[#6C3FF5]/40 transition-all space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#17151F] text-xs tracking-tight">{label}</span>
                      <span className="text-[#6C3FF5] font-extrabold text-sm">₹{net.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="w-full bg-[#E7E5EF] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#6C3FF5] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (net / (kpis.totalNetPaid || net || 1)) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-[#625E6E] font-medium pt-0.5">
                      <span>Gross: ₹{gross.toLocaleString('en-IN')}</span>
                      <span className="text-[#17151F] font-semibold capitalize">{m.status}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Navigation links */}
          <div className="pt-3 border-t border-[#E7E5EF]">
            <p className="text-[11px] font-bold text-[#918C9F] uppercase tracking-wider mb-2">Quick Actions</p>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/employees" className="p-2.5 rounded-lg bg-[#F8F8FC] hover:bg-[#F1ECFF] text-[#17151F] text-xs font-semibold flex items-center justify-between transition-colors border border-[#DDD9E8]">
                <span>Staff Directory</span>
                <ArrowRight size={12} className="text-[#918C9F]" />
              </Link>
              <Link to="/attendance" className="p-2.5 rounded-lg bg-[#F8F8FC] hover:bg-[#F1ECFF] text-[#17151F] text-xs font-semibold flex items-center justify-between transition-colors border border-[#DDD9E8]">
                <span>Attendance</span>
                <ArrowRight size={12} className="text-[#918C9F]" />
              </Link>
              <Link to="/time-off" className="p-2.5 rounded-lg bg-[#F8F8FC] hover:bg-[#F1ECFF] text-[#17151F] text-xs font-semibold flex items-center justify-between transition-colors border border-[#DDD9E8]">
                <span>Time Off</span>
                <ArrowRight size={12} className="text-[#918C9F]" />
              </Link>
              <Link to="/payslips" className="p-2.5 rounded-lg bg-[#F8F8FC] hover:bg-[#F1ECFF] text-[#17151F] text-xs font-semibold flex items-center justify-between transition-colors border border-[#DDD9E8]">
                <span>Payslips Ledger</span>
                <ArrowRight size={12} className="text-[#918C9F]" />
              </Link>
            </div>
          </div>
        </div>

        {/* Attendance Breakdown */}
        <div className="glass-card p-5 space-y-4">
          <div className="border-b border-[#E7E5EF] pb-3">
            <h3 className="font-bold text-[#17151F] text-base flex items-center gap-2">
              <CheckCircle2 size={17} className="text-emerald-600" />
              Attendance Health
            </h3>
            <p className="text-xs text-[#625E6E] mt-0.5">Overall punch and punctuality rate</p>
          </div>
          <div className="flex items-center justify-center py-4">
            <div className="relative w-32 h-32">
              <div
                className="w-32 h-32 rounded-full"
                style={{
                  background: `conic-gradient(#16a34a 0% ${kpis.attendanceHealthPercent ?? 96}%, #F1ECFF ${kpis.attendanceHealthPercent ?? 96}% 100%)`
                }}
              />
              <div className="absolute inset-3 rounded-full bg-white flex items-center justify-center flex-col border border-[#E7E5EF] shadow-sm">
                <span className="text-2xl font-black text-emerald-600">{kpis.attendanceHealthPercent ?? 96}%</span>
                <span className="text-[10px] text-[#625E6E] font-medium">Health</span>
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
                <span className={`w-2.5 h-2.5 rounded-full ${row.color} shrink-0`} />
                <span className="text-[#625E6E] flex-1">{row.label}</span>
                <span className="text-[#17151F] font-bold">{row.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payroll Intelligence Quick Launcher */}
        <div className="glass-card p-5 space-y-4 lg:col-span-2">
          <div className="border-b border-[#E7E5EF] pb-3">
            <h3 className="font-bold text-[#17151F] text-base flex items-center gap-2">
              <Sparkles size={17} className="text-[#6C3FF5]" />
              Payroll Intelligence
            </h3>
            <p className="text-xs text-[#625E6E] mt-0.5">Active data sources and enterprise modules</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Employees', icon: Users, to: '/employees' },
              { label: 'Contracts', icon: FileText, to: '/contracts' },
              { label: 'Attendance', icon: Clock, to: '/attendance' },
              { label: 'Time Off', icon: Calendar, to: '/time-off' },
              { label: 'Payruns', icon: DollarSign, to: '/payruns' },
              { label: 'Payslips', icon: UserCheck, to: '/payslips' },
              { label: 'Salary Config', icon: Sparkles, to: '/salary-config' },
              { label: 'Anomaly Engine', icon: ShieldAlert, to: '/payruns' },
              { label: 'AI Assistant', icon: Zap, to: null },
            ].map((item) => (
              item.to ? (
                <Link
                  key={item.label}
                  to={item.to}
                  className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border border-[#E7E5EF] bg-white hover:border-[#6C3FF5] hover:bg-[#F8F5FF] transition-all group text-center shadow-sm"
                >
                  <div className="p-2.5 rounded-xl border border-[#DDD9E8] bg-[#F1ECFF] text-[#6C3FF5] group-hover:scale-105 transition-transform">
                    <item.icon size={18} />
                  </div>
                  <span className="text-xs text-[#17151F] group-hover:text-[#6C3FF5] transition-colors font-semibold">{item.label}</span>
                </Link>
              ) : (
                <div
                  key={item.label}
                  className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-xl border border-[#E7E5EF] bg-white transition-all text-center cursor-default shadow-sm"
                >
                  <div className="p-2.5 rounded-xl border border-[#DDD9E8] bg-[#F1ECFF] text-[#6C3FF5]">
                    <item.icon size={18} />
                  </div>
                  <span className="text-xs text-[#17151F] font-semibold">{item.label}</span>
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
