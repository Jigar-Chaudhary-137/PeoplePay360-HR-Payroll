import React, { useState, useEffect } from 'react';
import { salaryAPI, payrunAPI } from '../../services/api';
import { Modal } from '../../components/common/CommonUI';
import { useNotify } from '../../context/NotificationContext';
import { ArrowRight, ArrowLeft, Users, Check, AlertCircle } from 'lucide-react';

export function PayrunWizardModal({ isOpen, onClose, onSuccess }) {
  const { showToast } = useNotify();

  const [step, setStep] = useState(1);
  const [structures, setStructures] = useState([]);

  // Step 1 Form Data
  const [name, setName] = useState('Regular Payrun - August 2026');
  const [periodMonth, setPeriodMonth] = useState('2026-08');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-08-31');
  const [structureId, setStructureId] = useState('');

  // Step 2 Data
  const [eligibleEmployees, setEligibleEmployees] = useState([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    salaryAPI.getStructures().then((res) => {
      setStructures(res.data || []);
      if (res.data?.[0]) setStructureId(res.data[0].id);
    });
  }, []);

  const handlePeriodChange = (monthStr) => {
    setPeriodMonth(monthStr);
    setName(`Regular Payrun - ${monthStr}`);
    const [y, m] = monthStr.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    setStartDate(`${monthStr}-01`);
    setEndDate(`${monthStr}-${String(lastDay).padStart(2, '0')}`);
  };

  const handleProceedToStep2 = async () => {
    if (!periodMonth || !startDate || !endDate || !structureId) {
      showToast('Please complete all period parameters in Step 1', 'error');
      return;
    }

    setLoadingEligible(true);
    try {
      const res = await payrunAPI.getEligibleEmployees({
        salary_structure_id: structureId,
        start_date: startDate,
        end_date: endDate
      });
      const emps = res.data || [];
      setEligibleEmployees(emps);
      // Pre-select all eligible employees by default
      setSelectedEmpIds(emps.map((e) => e.employee_id));
      setStep(2);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingEligible(false);
    }
  };

  const toggleSelectEmployee = (empId) => {
    if (selectedEmpIds.includes(empId)) {
      setSelectedEmpIds(selectedEmpIds.filter((id) => id !== empId));
    } else {
      setSelectedEmpIds([...selectedEmpIds, empId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedEmpIds.length === eligibleEmployees.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(eligibleEmployees.map((e) => e.employee_id));
    }
  };

  const handleCreatePayrun = async () => {
    if (selectedEmpIds.length === 0) {
      showToast('Please select at least one employee to include in payrun', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await payrunAPI.create({
        name,
        period_month: periodMonth,
        start_date: startDate,
        end_date: endDate,
        salary_structure_id: structureId,
        selected_employee_ids: selectedEmpIds
      });
      showToast(res.message, 'success');
      onSuccess(res.payrun_id);
      onClose();
      // Reset wizard
      setStep(1);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Payrun Wizard"
      subtitle={
        step === 1
          ? 'Step 1 of 2: Select Salary Structure, Period Month & Date Range'
          : `Step 2 of 2: Select Eligible Employees (${selectedEmpIds.length} of ${eligibleEmployees.length} Selected)`
      }
      maxWidth="max-w-3xl"
    >
      {step === 1 ? (
        /* STEP 1 */
        <div className="space-y-4 text-xs">
          <div>
            <label className="form-label">Payrun Name *</label>
            <input
              type="text"
              required
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="form-label">Payroll Period Month *</label>
              <input
                type="month"
                required
                className="form-input font-bold text-sky-400"
                value={periodMonth}
                onChange={(e) => handlePeriodChange(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                required
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">End Date *</label>
              <input
                type="date"
                required
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Salary Structure *</label>
            <select
              className="form-select font-medium"
              value={structureId}
              onChange={(e) => setStructureId(e.target.value)}
            >
              {structures.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              The engine will match active historical contracts for employees using this structure.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              disabled={loadingEligible}
              onClick={handleProceedToStep2}
              className="btn-primary"
            >
              {loadingEligible ? 'Scanning Contracts...' : 'Continue to Employee Selection'}
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      ) : (
        /* STEP 2 */
        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-white/10">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs text-sky-400 hover:text-sky-300 font-bold"
              >
                {selectedEmpIds.length === eligibleEmployees.length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-medium">
                Period: <strong className="text-white">{periodMonth}</strong>
              </span>
            </div>
            <span className="font-bold text-sky-400">
              {selectedEmpIds.length} Employees Included
            </span>
          </div>

          {/* Eligible Employees Selection Grid */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {eligibleEmployees.map((emp) => {
              const isSelected = selectedEmpIds.includes(emp.employee_id);
              const hasBankIssue = !emp.bank_account_no;

              return (
                <div
                  key={emp.employee_id}
                  onClick={() => toggleSelectEmployee(emp.employee_id)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-sky-950/40 border-sky-500/50 shadow-sm'
                      : 'bg-white/5 border-white/5 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'bg-sky-600 border-sky-500 text-white'
                          : 'border-slate-600 bg-slate-900'
                      }`}
                    >
                      {isSelected && <Check size={13} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-sm">
                          {emp.first_name} {emp.last_name}
                        </span>
                        <span className="text-[10px] text-sky-400 font-mono">({emp.emp_code})</span>
                        {hasBankIssue && (
                          <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                            <AlertCircle size={10} />
                            No Bank
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {emp.job_title} • {emp.department_name}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-slate-100 text-sm">
                      ₹{Number(emp.wage).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {emp.contract_code}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-secondary"
            >
              <ArrowLeft size={15} />
              <span>Back to Parameters</span>
            </button>

            <button
              type="button"
              disabled={submitting || selectedEmpIds.length === 0}
              onClick={handleCreatePayrun}
              className="btn-primary"
            >
              {submitting ? 'Creating Payrun...' : `Create Payrun (${selectedEmpIds.length} Staff)`}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
