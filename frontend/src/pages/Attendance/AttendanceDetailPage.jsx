import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Clock, Calendar, Building, 
  User, CheckCircle2, AlertCircle, FileText, Shield, MapPin, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';
import { attendanceService } from '../../services/attendanceService';
import ManualCorrectionModal from '../../components/attendance/ManualCorrectionModal';
import { Badge, LoadingSpinner } from '../../components/common/CommonUI';

/**
 * Enterprise Attendance Detail Page (/attendance/:attendanceId)
 */
export function AttendanceDetailPage() {
  const { attendanceId } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const { showToast } = useNotify();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchRecord = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await attendanceService.getAttendanceById(attendanceId);
      if (res.success && res.data) {
        setRecord(res.data);
      } else {
        setError(res.error || 'Attendance record not found');
      }
    } catch (err) {
      setError(err.message || 'Unable to load attendance record');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (attendanceId) {
      fetchRecord();
    }
  }, [attendanceId]);

  const canEdit = hasRole('Admin', 'HR Manager', 'HR Payroll Admin');

  if (loading) {
    return <LoadingSpinner text="Fetching attendance punch log and location verification..." />;
  }

  if (error || !record) {
    return (
      <div className="max-w-md mx-auto my-16 text-center card p-8 space-y-4">
        <AlertCircle size={44} className="mx-auto text-rose-500" />
        <h2 className="text-xl font-bold text-slate-900 font-heading">Record Not Found</h2>
        <p className="text-sm text-slate-500">
          {error || `The attendance record with ID #${attendanceId} could not be located.`}
        </p>
        <Link to="/attendance" className="btn-primary text-xs px-3.5 py-2 inline-flex items-center gap-2">
          <ArrowLeft size={14} />
          <span>Back to Attendance</span>
        </Link>
      </div>
    );
  }

  const isVerified = record.location_verified === true || record.location_verified === 1;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-6">
      {/* Back Link */}
      <Link
        to="/attendance"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Back to Attendance List</span>
      </Link>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-0.5">
            <span>Attendance</span>
            <span>/</span>
            <span className="text-slate-700 font-medium">{record.employee_name}</span>
            <span>/</span>
            <span className="text-blue-600 font-mono font-medium">{record.date}</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 font-heading">
            {record.employee_name} • {record.date}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail and punch verification log
          </p>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="btn-primary text-xs px-3.5 py-2 self-start sm:self-auto"
          >
            <Edit size={14} />
            <span>Edit Record</span>
          </button>
        )}
      </div>

      {/* Main Two-Column Detail Card */}
      <div className="card overflow-hidden">
        {/* Card Header Banner */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 font-bold text-base flex items-center justify-center overflow-hidden">
              {record.avatar ? (
                <img src={record.avatar} alt={record.employee_name} className="w-full h-full object-cover" />
              ) : (
                record.employee_name?.charAt(0) || 'E'
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading">
                {record.employee_name}
              </h3>
              <p className="text-xs text-slate-500">
                {record.employee_code} • {record.department || 'General Operations'}
              </p>
            </div>
          </div>

          <Badge status={record.status} />
        </div>

        {/* Two-Column Field Layout */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-heading">
                Employee Code
              </label>
              <div className="text-sm font-semibold text-slate-900 font-mono">
                {record.employee_code}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-heading">
                Check In Timestamp
              </label>
              <div className="text-sm text-slate-800 flex items-center gap-2 font-mono">
                <Clock size={16} className="text-emerald-600" />
                <span>{record.check_in || '— No check-in recorded'}</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-heading">
                Check Out Timestamp
              </label>
              <div className="text-sm text-slate-800 flex items-center gap-2 font-mono">
                <Clock size={16} className="text-blue-600" />
                <span>{record.check_out || '— No check-out recorded'}</span>
              </div>
            </div>

            {/* Worked Hours Highlight */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-heading">
                Worked Hours
              </label>
              <div className="text-2xl font-extrabold text-slate-900 font-heading">
                {Number(record.worked_hours || 0).toFixed(2)} <span className="text-xs font-semibold text-slate-500">hours</span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-heading">
                Department
              </label>
              <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Building size={16} className="text-blue-600" />
                <span>{record.department || 'General Operations'}</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-heading">
                Reporting Manager
              </label>
              <div className="text-sm text-slate-800 flex items-center gap-2">
                <User size={16} className="text-slate-400" />
                <span>{record.manager_name || 'Direct Supervisor'}</span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-heading">
                Location Verification
              </label>
              <div className="flex items-center gap-2">
                {isVerified ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck size={14} />
                    <span>GPS Radius Verified</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    <MapPin size={14} />
                    <span>Office Biometric / Manual</span>
                  </span>
                )}
              </div>
            </div>

            {/* Overtime Highlight */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-heading">
                Overtime Recorded
              </label>
              <div className={`text-2xl font-extrabold font-heading ${record.overtime_hours > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                {Number(record.overtime_hours || 0).toFixed(2)} <span className="text-xs font-semibold text-slate-500">hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notes & Audit Card */}
      <div className="card p-5 space-y-2.5">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-sm font-heading">
          <FileText size={17} />
          <h4>Notes & Verification Audit</h4>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          {record.notes || 'System-generated from punch telemetry or entered by an authorized HR administrator.'}
        </p>

        <div className="pt-2.5 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
          <Shield size={13} className="text-slate-400" />
          <span>Attendance logs are immutable and tracked for statutory payroll proration and overtime calculation.</span>
        </div>
      </div>

      {/* Manual Correction Modal */}
      <ManualCorrectionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        record={record}
        onSuccess={(updated) => {
          setRecord(updated);
        }}
      />
    </div>
  );
}

export default AttendanceDetailPage;
