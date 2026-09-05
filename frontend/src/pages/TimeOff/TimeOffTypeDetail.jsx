import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Edit3, Clock, ShieldCheck, Tag, DollarSign, 
  Palette, FileText, CheckCircle2, AlertCircle, Layers, 
  Check, X, Sparkles, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';
import { timeOffService } from '../../services/timeOffService';
import TimeOffNavigationTabs from '../../components/timeoff/TimeOffNavigationTabs';
import TimeOffTypeModal from '../../components/timeoff/TimeOffTypeModal';
import { LoadingSpinner, EmptyState } from '../../components/common/CommonUI';

/**
 * Time Off Type Detail Page
 * Route: /time-off/types/:typeId
 */
export function TimeOffTypeDetail() {
  const { typeId } = useParams();
  const navigate = useNavigate();
  const { hasRole, isEmployeeOnly } = useAuth();
  const { showToast } = useNotify();

  // HR/Admin role check for Edit action
  const isHRAdmin = hasRole('HR Manager', 'Admin', 'HR Payroll Admin', 'HR Payroll User');

  const [type, setType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const fetchType = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await timeOffService.getTimeOffTypeById(typeId);
      if (res.success && res.data) {
        setType(res.data);
      } else {
        setError(res.error || 'Time off type not found.');
      }
    } catch (err) {
      setError(err.message || 'Unable to load time off type details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeId) {
      fetchType();
    }
  }, [typeId]);

  const handleEditSuccess = (updatedItem) => {
    setType(updatedItem);
  };

  if (loading) {
    return <LoadingSpinner text="Loading time off type details..." />;
  }

  if (error || !type) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/time-off/types')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Time Off Type</h1>
            <p className="text-xs text-slate-400">Form view of one time off type</p>
          </div>
        </div>

        <EmptyState
          icon={AlertCircle}
          title={error || "Time off type not found"}
          description="The requested time off policy configuration could not be found or has been removed."
          actionText="Back to Time Off Types"
          onAction={() => navigate('/time-off/types')}
        />
      </div>
    );
  }

  const isActive = type.is_active || type.status === 'Active';
  const requiresAllocationDisplay = type.requires_allocation_display || (type.requires_allocation === 'Required' ? 'Yes' : 'No');
  const activeDisplay = type.active_display || (isActive ? 'True' : 'False');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Sub-Navigation Tabs */}
      <div className="flex items-center justify-between">
        <TimeOffNavigationTabs />
      </div>

      {/* Header & Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/time-off/types')}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            title="Back to Time Off Types"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            {/* Header: “Time Off Type / [Type Name]” */}
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Link to="/time-off/types" className="hover:text-sky-400 transition-colors font-medium">
                Time Off Type
              </Link>
              <span>/</span>
              <span className="font-extrabold text-slate-100">{type.name}</span>
            </div>
            {/* Supporting text: “Form view of one time off type” */}
            <p className="text-xs text-slate-400 mt-0.5">
              Form view of one time off type
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/time-off/types')}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            <span>Back to Types</span>
          </button>

          {/* HR/Admin-only Edit button */}
          {isHRAdmin && (
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="btn-primary text-xs flex items-center gap-1.5 shadow-md shadow-sky-600/30"
              title="Edit Time Off Type Configuration"
            >
              <Edit3 size={14} />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Two-Column Read-Only Details Card */}
      <div className="glass-card p-6 relative overflow-hidden">
        {/* Top Accent Color Bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: type.color_hex || '#3B82F6' }}
        />

        {/* Card Header with Name & Quick Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-5 border-b border-white/10 gap-3">
          <div className="flex items-center gap-3">
            <span
              className="w-5 h-5 rounded-lg shrink-0 shadow-md ring-2 ring-white/10"
              style={{ backgroundColor: type.color_hex || '#3B82F6' }}
            />
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>{type.name}</span>
                {type.code && (
                  <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10 font-mono">
                    {type.code}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Leave policy and configuration settings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isActive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Active</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                <span>Inactive</span>
              </span>
            )}
          </div>
        </div>

        {/* Two-Column Read-Only Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {/* LEFT COLUMN: Type Name, Unit, Requires Allocation, Active */}
          <div className="space-y-4">
            {/* Field 1: Type Name */}
            <div className="bg-slate-900/40 p-3.5 rounded-xl border border-white/5">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                Type Name
              </span>
              <p className="text-sm font-bold text-slate-100">{type.name}</p>
            </div>

            {/* Field 2: Unit */}
            <div className="bg-slate-900/40 p-3.5 rounded-xl border border-white/5">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1 flex items-center gap-1.5">
                <Clock size={12} className="text-sky-400" />
                <span>Unit</span>
              </span>
              <p className="text-sm font-bold text-slate-100">{type.unit}</p>
            </div>

            {/* Field 3: Requires Allocation */}
            <div className="bg-slate-900/40 p-3.5 rounded-xl border border-white/5">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1 flex items-center gap-1.5">
                <Tag size={12} className="text-emerald-400" />
                <span>Requires Allocation</span>
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-bold text-slate-100">{requiresAllocationDisplay}</span>
                <span className="text-xs text-slate-400 font-normal">
                  ({type.requires_allocation === 'Required' ? 'Quota allocation balance needed' : 'Unrestricted / Non-quota'})
                </span>
              </div>
            </div>

            {/* Field 4: Active */}
            <div className="bg-slate-900/40 p-3.5 rounded-xl border border-white/5">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                Active
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-bold text-slate-100">{activeDisplay}</span>
                {isActive ? (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    Available for requests
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-400 border border-slate-500/20 font-semibold">
                    Hidden from request forms
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Approval, Payroll / Work Entry, Display Color */}
          <div className="space-y-4">
            {/* Field 5: Approval */}
            <div className="bg-slate-900/40 p-3.5 rounded-xl border border-white/5">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1 flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-amber-400" />
                <span>Approval</span>
              </span>
              <p className="text-sm font-bold text-slate-100">{type.approval}</p>
            </div>

            {/* Field 6: Payroll / Work Entry */}
            <div className="bg-slate-900/40 p-3.5 rounded-xl border border-white/5">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1 flex items-center gap-1.5">
                <DollarSign size={12} className="text-purple-400" />
                <span>Payroll / Work Entry</span>
              </span>
              <p className="text-sm font-bold text-slate-100">{type.payroll_work_entry || 'Leave Work Entry'}</p>
            </div>

            {/* Field 7: Display Color */}
            <div className="bg-slate-900/40 p-3.5 rounded-xl border border-white/5">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1 flex items-center gap-1.5">
                <Palette size={12} className="text-pink-400" />
                <span>Display Color</span>
              </span>
              <div className="flex items-center gap-2.5 mt-0.5">
                <span
                  className="w-4 h-4 rounded-full shadow-sm"
                  style={{ backgroundColor: type.color_hex || '#3B82F6' }}
                />
                <span className="text-sm font-bold text-slate-100">{type.display_color || 'Blue'}</span>
                {type.color_hex && (
                  <span className="text-xs text-slate-400 font-mono">({type.color_hex})</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-width Configuration Notes Card */}
      <div className="glass-card p-6 border-l-4 border-l-sky-500">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-white/10">
          <FileText size={16} className="text-sky-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Configuration Notes
          </h3>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          {type.notes || 'Standard annual leave. Balance comes from approved allocations.'}
        </p>
      </div>

      {/* Edit Modal */}
      <TimeOffTypeModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        initialData={type}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}

export default TimeOffTypeDetail;
