import React, { useState, useEffect } from 'react';
import { Modal } from '../common/CommonUI';
import { 
  Tag, Clock, ShieldCheck, DollarSign, Palette, 
  FileText, CheckCircle2, AlertCircle, Sparkles 
} from 'lucide-react';
import { timeOffService } from '../../services/timeOffService';
import { useNotify } from '../../context/NotificationContext';

export default function TimeOffTypeModal({
  isOpen,
  onClose,
  initialData = null,
  onSuccess
}) {
  const { showToast } = useNotify();
  const isEdit = Boolean(initialData && initialData.id);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [unit, setUnit] = useState('Days');
  const [requiresAllocation, setRequiresAllocation] = useState('Required');
  const [approval, setApproval] = useState('Manager');
  const [payrollWorkEntry, setPayrollWorkEntry] = useState('Leave Work Entry');
  const [displayColor, setDisplayColor] = useState('Blue');
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');

  // Validation & Submit State
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const colorPresets = [
    { label: 'Blue', hex: '#3B82F6', border: 'border-blue-500', bg: 'bg-blue-500' },
    { label: 'Emerald', hex: '#10B981', border: 'border-emerald-500', bg: 'bg-emerald-500' },
    { label: 'Violet', hex: '#8B5CF6', border: 'border-purple-500', bg: 'bg-purple-500' },
    { label: 'Amber', hex: '#F59E0B', border: 'border-amber-500', bg: 'bg-amber-500' },
    { label: 'Rose', hex: '#F43F5E', border: 'border-rose-500', bg: 'bg-rose-500' },
    { label: 'Slate', hex: '#64748B', border: 'border-slate-500', bg: 'bg-slate-500' }
  ];

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setCode(initialData.code || '');
        setUnit(initialData.unit || 'Days');
        setRequiresAllocation(
          initialData.requires_allocation === 'Required' || initialData.requires_allocation_display === 'Yes'
            ? 'Required'
            : 'No'
        );
        setApproval(initialData.approval || 'Manager');
        setPayrollWorkEntry(initialData.payroll_work_entry || 'Leave Work Entry');
        setDisplayColor(initialData.display_color || 'Blue');
        setIsActive(initialData.is_active !== undefined ? initialData.is_active : initialData.status === 'Active');
        setNotes(initialData.notes || '');
      } else {
        setName('');
        setCode('');
        setUnit('Days');
        setRequiresAllocation('Required');
        setApproval('Manager');
        setPayrollWorkEntry('Leave Work Entry');
        setDisplayColor('Blue');
        setIsActive(true);
        setNotes('');
      }
      setErrors({});
      setSubmitting(false);
    }
  }, [isOpen, initialData]);

  const validate = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Type Name is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim() || name.trim().slice(0, 4).toUpperCase(),
        unit,
        requires_allocation: requiresAllocation,
        approval,
        payroll_work_entry: payrollWorkEntry,
        display_color: displayColor,
        is_active: isActive,
        status: isActive ? 'Active' : 'Inactive',
        notes: notes.trim()
      };

      let res;
      if (isEdit) {
        res = await timeOffService.updateTimeOffType(initialData.id, payload);
      } else {
        res = await timeOffService.createTimeOffType(payload);
      }

      if (res.success) {
        showToast(res.message || (isEdit ? 'Type updated successfully' : 'Type created successfully'), 'success');
        if (onSuccess) {
          onSuccess(res.data);
        }
        onClose();
      } else {
        showToast(res.error || 'Operation failed', 'error');
      }
    } catch (err) {
      showToast(err.message || 'An error occurred while saving', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Time Off Type: ${initialData?.name}` : 'New Time Off Type'}
      subtitle={isEdit ? 'Form view to configure leave type rules and workflows' : 'Create a new leave policy, allocation unit, and approval rule'}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Type Name & Code */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-slate-300 font-semibold mb-1">
              Type Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                }}
                placeholder="e.g. Paid Time Off, Sick Leave"
                className={`form-input w-full ${errors.name ? 'border-rose-500 ring-1 ring-rose-500' : ''}`}
                autoFocus
              />
            </div>
            {errors.name && (
              <p className="text-rose-400 text-[11px] mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Code (Short Name)
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. PTO"
              maxLength={6}
              className="form-input w-full font-mono uppercase"
            />
          </div>
        </div>

        {/* Unit & Requires Allocation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Clock size={13} className="text-sky-400" />
              <span>Unit of Measure</span>
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="form-input w-full bg-slate-900 cursor-pointer"
            >
              <option value="Days">Days (Daily increments)</option>
              <option value="Hours">Hours (Hourly increments)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Tag size={13} className="text-emerald-400" />
              <span>Requires Allocation</span>
            </label>
            <select
              value={requiresAllocation}
              onChange={(e) => setRequiresAllocation(e.target.value)}
              className="form-input w-full bg-slate-900 cursor-pointer"
            >
              <option value="Required">Required (Quota balance needed)</option>
              <option value="No">No (Unmetered / Non-quota)</option>
            </select>
          </div>
        </div>

        {/* Approval Workflow & Payroll Work Entry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-amber-400" />
              <span>Approval Workflow</span>
            </label>
            <select
              value={approval}
              onChange={(e) => setApproval(e.target.value)}
              className="form-input w-full bg-slate-900 cursor-pointer"
            >
              <option value="Manager">Manager</option>
              <option value="Officer">Officer</option>
              <option value="HR Lead">HR Lead</option>
              <option value="No Validation">No Validation (Auto-approved)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <DollarSign size={13} className="text-purple-400" />
              <span>Payroll / Work Entry</span>
            </label>
            <select
              value={payrollWorkEntry}
              onChange={(e) => setPayrollWorkEntry(e.target.value)}
              className="form-input w-full bg-slate-900 cursor-pointer"
            >
              <option value="Leave Work Entry">Leave Work Entry (Paid)</option>
              <option value="Sick Leave Work Entry">Sick Leave Work Entry</option>
              <option value="Comp Off Work Entry">Comp Off Work Entry</option>
              <option value="Casual Leave Work Entry">Casual Leave Work Entry</option>
              <option value="Unpaid Work Entry">Unpaid Work Entry (Deduction)</option>
              <option value="Attendance / Extra Hours">Attendance / Extra Hours</option>
            </select>
          </div>
        </div>

        {/* Display Color & Active Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <Palette size={13} className="text-pink-400" />
              <span>Display Color</span>
            </label>
            <div className="flex items-center gap-2">
              {colorPresets.map((c) => {
                const isSelected = displayColor === c.label;
                return (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => setDisplayColor(c.label)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110 shadow-lg' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>
                );
              })}
              <span className="text-[11px] font-semibold text-slate-300 ml-1">
                {displayColor}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Active Status
            </label>
            <div className="flex items-center gap-3 mt-1.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 bg-slate-900 border-white/20 focus:ring-sky-500 focus:ring-offset-slate-950"
                />
                <span className="text-xs text-slate-200 font-medium">
                  {isActive ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Active (Visible in requests)
                    </span>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-500" />
                      Inactive (Archived)
                    </span>
                  )}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Configuration Notes */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
            <FileText size={13} className="text-sky-400" />
            <span>Configuration Notes</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Standard annual leave policy description and balance rules..."
            className="form-input w-full resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex items-center gap-2 shadow-lg shadow-sky-600/30"
          >
            {submitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span>{isEdit ? 'Save Changes' : 'Create Type'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
