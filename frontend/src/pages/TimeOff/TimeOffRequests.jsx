import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, CalendarOff, Users, RotateCcw, 
  CheckCircle2, Clock, XCircle, ChevronRight, Check, X,
  Calendar, Layers, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';
import { timeOffService } from '../../services/timeOffService';
import TimeOffRequestTable from '../../components/timeoff/TimeOffRequestTable';
import RequestTimeOffModal from '../../components/timeoff/RequestTimeOffModal';
import ApprovalConfirmationModal from '../../components/timeoff/ApprovalConfirmationModal';
import TimeOffNavigationTabs from '../../components/timeoff/TimeOffNavigationTabs';
import { LoadingSpinner, EmptyState, StatCard } from '../../components/common/CommonUI';

/**
 * Page 1: Time Off Requests List Page
 * Route: /time-off/requests & /time-off
 */
export function TimeOffRequests() {
  const navigate = useNavigate();
  const { user, hasRole, isEmployeeOnly } = useAuth();
  const { showToast } = useNotify();

  const isHRManager = hasRole('HR Manager', 'Admin', 'HR Payroll Admin');

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [myTeamOnly, setMyTeamOnly] = useState(false);

  // Data & Modal State
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  
  // Approval / Refusal Action Modal State
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [actionType, setActionType] = useState('approve'); // 'approve' or 'refuse'
  const [actionLoading, setActionLoading] = useState(false);

  // Load Requests from Service
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await timeOffService.getRequests({
        search,
        status: selectedStatus,
        leave_type: selectedType,
        startDate,
        endDate,
        myTeamOnly
      });

      if (res.success) {
        setRequests(res.data);
      } else {
        showToast(res.error || 'Unable to load time off requests.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Unable to load time off requests.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [search, selectedStatus, selectedType, startDate, endDate, myTeamOnly]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearch('');
    setSelectedStatus('All');
    setSelectedType('All');
    setStartDate('');
    setEndDate('');
    setMyTeamOnly(false);
  };

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedStatus !== 'All' ||
    selectedType !== 'All' ||
    startDate !== '' ||
    endDate !== '' ||
    myTeamOnly;

  // Open Approval Confirmation
  const handleApprovePrompt = (req) => {
    setActiveRequest(req);
    setActionType('approve');
    setConfirmModalOpen(true);
  };

  // Open Refusal Confirmation
  const handleRefusePrompt = (req) => {
    setActiveRequest(req);
    setActionType('refuse');
    setConfirmModalOpen(true);
  };

  // Execute Approve or Refuse
  const handleConfirmAction = async (requestId, refusalReason) => {
    setActionLoading(true);
    try {
      if (actionType === 'approve') {
        const res = await timeOffService.approveRequest(requestId);
        if (res.success) {
          showToast(res.message, 'success');
          setConfirmModalOpen(false);
          fetchRequests();
        } else {
          showToast(res.error || 'Failed to approve request', 'error');
        }
      } else {
        const res = await timeOffService.refuseRequest(requestId, refusalReason);
        if (res.success) {
          showToast(res.message, 'warning');
          setConfirmModalOpen(false);
          fetchRequests();
        } else {
          showToast(res.error || 'Failed to refuse request', 'error');
        }
      }
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Summary Metrics
  const stats = useMemo(() => {
    const total = requests.length;
    const toApprove = requests.filter(r => r.status === 'To Approve' || r.status === 'pending' || r.status === 'Pending').length;
    const approved = requests.filter(r => r.status === 'Approved').length;
    const refused = requests.filter(r => r.status === 'Refused' || r.status === 'rejected').length;
    return { total, toApprove, approved, refused };
  }, [requests]);

  const leaveTypesList = [
    'Paid Time Off',
    'Sick Leave',
    'Comp Off',
    'Casual Leave',
    'Unpaid Leave'
  ];

  return (
    <div className="space-y-6 pb-6 text-[#17151F]">
      {/* Top Sub-Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <TimeOffNavigationTabs />
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E5EF]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#17151F]">
              Time Off & Leave Requests
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F1ECFF] text-[#6C3FF5] border border-[#DDD9E8] font-bold">
              {requests.length} Requests
            </span>
          </div>
          <p className="text-sm text-[#625E6E] mt-0.5">
            Review, approve, and track employee leave requests and balances
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn-primary text-xs px-3.5 py-2"
          >
            <Plus size={15} />
            <span>Apply Leave</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 border-l-4 border-l-[#6C3FF5]">
          <span className="text-xs uppercase font-bold text-[#625E6E] tracking-wider">Total Requests</span>
          <p className="text-2xl font-bold text-[#17151F] mt-1">{stats.total}</p>
        </div>
        <div className="glass-card p-4 border-l-4 border-l-amber-500 border-amber-200 bg-amber-50">
          <span className="text-xs uppercase font-bold text-amber-700 tracking-wider">To Approve</span>
          <p className="text-2xl font-bold text-amber-700 mt-1">{stats.toApprove}</p>
        </div>
        <div className="glass-card p-4 border-l-4 border-l-emerald-500 border-emerald-200 bg-emerald-50">
          <span className="text-xs uppercase font-bold text-emerald-700 tracking-wider">Approved</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.approved}</p>
        </div>
        <div className="glass-card p-4 border-l-4 border-l-rose-500 border-rose-200 bg-rose-50">
          <span className="text-xs uppercase font-bold text-rose-700 tracking-wider">Refused</span>
          <p className="text-2xl font-bold text-rose-700 mt-1">{stats.refused}</p>
        </div>
      </div>

      {/* Toolbar: Search, My Team Filter, Status, Leave Type, Dates */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left Toolbar: Search & My Team Button */}
          <div className="flex flex-1 flex-wrap sm:flex-nowrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#918C9F] pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search requests..."
                className="form-input text-xs pl-9 pr-3 py-2 w-full"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#918C9F] hover:text-[#17151F]"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* My Team Toggle Button (for HR Managers) */}
            {isHRManager && (
              <button
                type="button"
                onClick={() => setMyTeamOnly(!myTeamOnly)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border shrink-0 ${
                  myTeamOnly
                    ? 'bg-[#6C3FF5] text-white border-[#6C3FF5] shadow-sm'
                    : 'bg-[#F8F8FC] text-[#17151F] hover:bg-[#F1ECFF] border-[#DDD9E8]'
                }`}
                title="Filter only direct team members"
              >
                <Users size={14} />
                <span>My Team</span>
              </button>
            )}
          </div>

          {/* Right Toolbar: Compact Filters & Clear Action */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#625E6E] font-medium">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="form-select text-xs py-1.5 px-2.5 w-auto bg-white text-[#17151F] border-[#DDD9E8]"
              >
                <option value="All" className="bg-white">All Statuses</option>
                <option value="To Approve" className="bg-white">To Approve</option>
                <option value="Approved" className="bg-white">Approved</option>
                <option value="Refused" className="bg-white">Refused</option>
              </select>
            </div>

            {/* Leave Type Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#625E6E] font-medium">Type:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="form-select text-xs py-1.5 px-2.5 w-auto bg-white text-[#17151F] border-[#DDD9E8]"
              >
                <option value="All" className="bg-white">All Types</option>
                {leaveTypesList.map((t) => (
                  <option key={t} value={t} className="bg-white">{t}</option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input text-xs py-1.5 px-2 w-32"
                title="From Date"
              />
              <span className="text-[#918C9F] text-xs">→</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-input text-xs py-1.5 px-2 w-32"
                title="To Date"
              />
            </div>

            {/* Clear Filters Action */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="p-1.5 rounded-lg text-[#625E6E] hover:text-[#17151F] hover:bg-[#F8F5FF] transition-colors"
                title="Clear all filters"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#E7E5EF] text-[11px]">
            <span className="text-[#625E6E] font-medium">Active Filters:</span>
            {search && (
              <span className="px-2 py-0.5 rounded-md bg-[#F1ECFF] text-[#6C3FF5] border border-[#DDD9E8] flex items-center gap-1">
                Search: "{search}"
                <button onClick={() => setSearch('')}><X size={10} /></button>
              </span>
            )}
            {myTeamOnly && (
              <span className="px-2 py-0.5 rounded-md bg-[#F1ECFF] text-[#6C3FF5] border border-[#DDD9E8] flex items-center gap-1">
                My Team Only
                <button onClick={() => setMyTeamOnly(false)}><X size={10} /></button>
              </span>
            )}
            {selectedStatus !== 'All' && (
              <span className="px-2 py-0.5 rounded-md bg-[#F1ECFF] text-[#6C3FF5] border border-[#DDD9E8] flex items-center gap-1">
                Status: {selectedStatus}
                <button onClick={() => setSelectedStatus('All')}><X size={10} /></button>
              </span>
            )}
            {selectedType !== 'All' && (
              <span className="px-2 py-0.5 rounded-md bg-[#F1ECFF] text-[#6C3FF5] border border-[#DDD9E8] flex items-center gap-1">
                Type: {selectedType}
                <button onClick={() => setSelectedType('All')}><X size={10} /></button>
              </span>
            )}
            <button
              onClick={handleClearFilters}
              className="text-[#6C3FF5] hover:text-[#5125C7] underline ml-1 cursor-pointer font-medium"
            >
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* Main Table or Loading / Empty States */}
      {loading ? (
        <LoadingSpinner text="Loading time off requests..." />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={CalendarOff}
          title="No time off requests found"
          description={
            hasActiveFilters
              ? 'No requests match your current search or filter criteria. Try resetting filters.'
              : 'There are currently no time off requests recorded in the system.'
          }
          actionText={hasActiveFilters ? 'Clear Filters' : 'New Request'}
          onAction={hasActiveFilters ? handleClearFilters : () => setCreateModalOpen(true)}
        />
      ) : (
        <TimeOffRequestTable
          requests={requests}
          onApproveClick={handleApprovePrompt}
          onRefuseClick={handleRefusePrompt}
          actionLoadingId={actionLoading ? activeRequest?.id : null}
        />
      )}

      {/* Request Time Off Modal */}
      <RequestTimeOffModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={fetchRequests}
      />

      {/* Approve / Refuse Confirmation Modal */}
      <ApprovalConfirmationModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmAction}
        request={activeRequest}
        actionType={actionType}
        loading={actionLoading}
      />
    </div>
  );
}

export default TimeOffRequests;
