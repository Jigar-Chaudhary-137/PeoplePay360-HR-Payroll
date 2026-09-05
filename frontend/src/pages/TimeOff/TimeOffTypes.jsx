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
  const { hasRole } = useAuth();
  const { showToast } = useNotify();

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

  const handleCreateSuccess = () => {
    fetchTypes();
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Top Sub-Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <TimeOffNavigationTabs />
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">
              Leave Types
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
              {types.length} Types
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure leave categories, allocation rules, and approval policies
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTypes}
            className="btn-secondary text-xs p-2 text-slate-500 hover:text-slate-800"
            title="Refresh List"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          {isHRAdmin && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="btn-primary text-xs px-3.5 py-2"
            >
              <Plus size={15} />
              <span>Create Type</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-3.5 border-l-4 border-l-blue-500">
          <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider font-heading">Total Types</span>
          <p className="text-xl font-extrabold text-slate-900 mt-0.5 font-heading">{stats.total}</p>
        </div>
        <div className="card p-3.5 border-l-4 border-l-emerald-500">
          <span className="text-[11px] uppercase font-bold text-emerald-600 tracking-wider font-heading">Active Types</span>
          <p className="text-xl font-extrabold text-emerald-700 mt-0.5 font-heading">{stats.active}</p>
        </div>
        <div className="card p-3.5 border-l-4 border-l-indigo-500">
          <span className="text-[11px] uppercase font-bold text-indigo-600 tracking-wider font-heading">Days Unit</span>
          <p className="text-xl font-extrabold text-indigo-700 mt-0.5 font-heading">{stats.daysUnit}</p>
        </div>
        <div className="card p-3.5 border-l-4 border-l-purple-500">
          <span className="text-[11px] uppercase font-bold text-purple-600 tracking-wider font-heading">Hours Unit</span>
          <p className="text-xl font-extrabold text-purple-700 mt-0.5 font-heading">{stats.hoursUnit}</p>
        </div>
      </div>

      {/* Toolbar: Search input & Status Filter */}
      <div className="card p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leave types..."
            className="form-input text-xs pl-9 pr-8 py-2 w-full"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status Quick Filter */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs shadow-2xs">
          {['All', 'Active', 'Inactive'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedStatus === status
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="card p-4 border-rose-200 bg-rose-50 flex items-center justify-between">
          <div className="flex items-center gap-3 text-rose-800 text-xs font-medium">
            <AlertCircle size={18} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchTypes}
            className="btn-secondary text-xs py-1 px-3"
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
          title="No leave types found"
          description={
            search || selectedStatus !== 'All'
              ? 'No time off types match your current search and filter criteria.'
              : 'No leave types configured in the system yet.'
          }
          actionText={search || selectedStatus !== 'All' ? 'Clear Filters' : isHRAdmin ? 'Create Leave Type' : undefined}
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
        <div className="custom-table-container">
          <table className="custom-table">
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
            <tbody>
              {types.map((type) => {
                const isActive = type.is_active || type.status === 'Active';

                return (
                  <tr
                    key={type.id}
                    onClick={() => handleRowClick(type.id)}
                    className="cursor-pointer hover:bg-slate-50 transition-colors group"
                  >
                    {/* Column 1: Type Name, Code & Color Indicator */}
                    <td>
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: type.color_hex || '#2563eb' }}
                          title={`Display color: ${type.display_color || 'Blue'}`}
                        />
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-2 font-heading">
                            <span>{type.name}</span>
                            {type.code && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono font-normal">
                                {type.code}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5 font-medium">
                            {type.payroll_work_entry || 'Leave Work Entry'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Unit */}
                    <td>
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                        <Clock size={13} className="text-slate-400" />
                        <span>{type.unit}</span>
                      </div>
                    </td>

                    {/* Column 3: Allocation */}
                    <td>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                          type.requires_allocation === 'Required' || type.requires_allocation_display === 'Yes'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {type.requires_allocation === 'Required' ? 'Required' : 'No'}
                      </span>
                    </td>

                    {/* Column 4: Approval */}
                    <td>
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <ShieldCheck size={14} className="text-amber-600" />
                        <span className="font-medium">{type.approval}</span>
                      </div>
                    </td>

                    {/* Column 5: Status */}
                    <td>
                      {isActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>

                    {/* Column 6: Chevron */}
                    <td className="text-right">
                      <ChevronRight
                        size={16}
                        className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all inline-block"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
