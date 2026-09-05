import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, X, Layers, Clock, ShieldCheck, Tag,
  ChevronRight, AlertCircle, RefreshCw, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';
import { timeOffService } from '../../services/timeOffService';
import TimeOffNavigationTabs from '../../components/timeoff/TimeOffNavigationTabs';
import TimeOffTypeModal from '../../components/timeoff/TimeOffTypeModal';
import { LoadingSpinner, EmptyState } from '../../components/common/CommonUI';

/**
 * Time Off Types List Page
 * Route: /time-off/types
 */
export function TimeOffTypes() {
  const navigate = useNavigate();
  const { hasRole, isEmployeeOnly } = useAuth();
  const { showToast } = useNotify();

  // HR/Admin role check for the "New" button and edit permissions
  const isHRAdmin = hasRole('HR Manager', 'Admin', 'HR Payroll Admin', 'HR Payroll User');

  // Filter states
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Data & Modal states
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Fetch Types from Service
  const fetchTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await timeOffService.getTimeOffTypes({
        search,
        status: selectedStatus
      });

      if (res.success) {
        setTypes(res.data);
      } else {
        setError(res.error || 'Failed to load time off types.');
        showToast(res.error || 'Unable to load time off types.', 'error');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
      showToast(err.message || 'Error loading time off types.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, [search, selectedStatus]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = types.length;
    const active = types.filter((t) => t.is_active || t.status === 'Active').length;
    const daysUnit = types.filter((t) => t.unit === 'Days').length;
    const hoursUnit = types.filter((t) => t.unit === 'Hours').length;
    return { total, active, daysUnit, hoursUnit };
  }, [types]);

  const handleRowClick = (typeId) => {
    navigate(`/time-off/types/${typeId}`);
  };

  const handleCreateSuccess = (newType) => {
    fetchTypes();
  };

  return (
    <div className="space-y-6">
      {/* Top Sub-Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <TimeOffNavigationTabs />
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2.5">
              Time Off Types
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                {types.length} Types
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            List opened from Time Off → Time Off Types
          </p>
        </div>

        {/* Action Buttons: Blue "New" Button (HR/Admin only) */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTypes}
            className="btn-secondary text-xs p-2 text-slate-400 hover:text-white"
            title="Refresh List"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          {isHRAdmin && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="btn-primary text-xs flex items-center gap-2 shadow-lg shadow-sky-600/25"
            >
              <Plus size={15} />
              <span>New</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card p-3.5 border-l-4 border-l-sky-500">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Types</span>
          <p className="text-xl font-black text-slate-100 mt-0.5">{stats.total}</p>
        </div>
        <div className="glass-card p-3.5 border-l-4 border-l-emerald-500">
          <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Active Types</span>
          <p className="text-xl font-black text-emerald-300 mt-0.5">{stats.active}</p>
        </div>
        <div className="glass-card p-3.5 border-l-4 border-l-indigo-500">
          <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Days Unit</span>
          <p className="text-xl font-black text-indigo-300 mt-0.5">{stats.daysUnit}</p>
        </div>
        <div className="glass-card p-3.5 border-l-4 border-l-purple-500">
          <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Hours Unit</span>
          <p className="text-xl font-black text-purple-300 mt-0.5">{stats.hoursUnit}</p>
        </div>
      </div>

      {/* Toolbar: Search input & Status Filter */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search time off types…"
              className="form-input text-xs pl-9 pr-8 py-2 w-full"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status Quick Filter */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900/60 rounded-xl border border-white/5 text-xs">
            {['All', 'Active', 'Inactive'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedStatus === status
                    ? 'bg-sky-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="glass-card p-4 border border-rose-500/30 bg-rose-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3 text-rose-300 text-xs">
            <AlertCircle size={18} className="text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchTypes}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-lg text-xs text-rose-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table & Content Area */}
      {loading ? (
        <LoadingSpinner text="Loading time off types..." />
      ) : types.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No time off types found"
          description={
            search || selectedStatus !== 'All'
              ? 'No time off types match your current search and filter criteria.'
              : 'No leave types configured in the system yet.'
          }
          actionText={search || selectedStatus !== 'All' ? 'Clear Filters' : isHRAdmin ? 'Create Time Off Type' : undefined}
          onAction={
            search || selectedStatus !== 'All'
              ? () => {
                  setSearch('');
                  setSelectedStatus('All');
                }
              : isHRAdmin
              ? () => setCreateModalOpen(true)
              : undefined
          }
        />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="custom-table w-full text-left">
              <thead>
                <tr>
                  <th className="w-[30%]">Type</th>
                  <th className="w-[15%]">Unit</th>
                  <th className="w-[18%]">Allocation</th>
                  <th className="w-[18%]">Approval</th>
                  <th className="w-[14%]">Status</th>
                  <th className="w-[5%] text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {types.map((type) => {
                  const isActive = type.is_active || type.status === 'Active';

                  return (
                    <tr
                      key={type.id}
                      onClick={() => handleRowClick(type.id)}
                      className="cursor-pointer hover:bg-white/[0.04] transition-colors group"
                    >
                      {/* Column 1: Type Name, Code & Color Indicator */}
                      <td>
                        <div className="flex items-center gap-3">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: type.color_hex || '#3B82F6' }}
                            title={`Display color: ${type.display_color || 'Blue'}`}
                          />
                          <div>
                            <div className="font-bold text-slate-100 group-hover:text-sky-400 transition-colors flex items-center gap-2">
                              <span>{type.name}</span>
                              {type.code && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 font-mono font-normal">
                                  {type.code}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                              {type.payroll_work_entry || 'Leave Work Entry'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Unit */}
                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                          <Clock size={13} className="text-slate-500" />
                          <span>{type.unit}</span>
                        </div>
                      </td>

                      {/* Column 3: Allocation */}
                      <td>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                            type.requires_allocation === 'Required' || type.requires_allocation_display === 'Yes'
                              ? 'bg-sky-500/10 text-sky-300 border-sky-500/20'
                              : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          }`}
                        >
                          {type.requires_allocation === 'Required' ? 'Required' : 'No'}
                        </span>
                      </td>

                      {/* Column 4: Approval */}
                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-slate-300">
                          <ShieldCheck size={14} className="text-amber-400/80" />
                          <span className="font-medium">{type.approval}</span>
                        </div>
                      </td>

                      {/* Column 5: Status (Green for Active, Neutral Gray for Inactive) */}
                      <td>
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>

                      {/* Column 6: Chevron */}
                      <td className="text-right">
                        <ChevronRight
                          size={16}
                          className="text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all inline-block"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Time Off Type Modal */}
      <TimeOffTypeModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}

export default TimeOffTypes;
