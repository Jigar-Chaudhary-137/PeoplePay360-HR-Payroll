import React, { useState, useEffect } from 'react';
import { payrunAPI, salaryAPI } from '../../services/api';
import { Modal } from '../../components/common/CommonUI';
import { useNotify } from '../../context/NotificationContext';
import { Check, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export function PayrunWizardModal({ isOpen, onClose, onSuccess }) {
  const { showToast } = useNotify();

  const [step, setStep] = useState(1);
  const [structures, setStructures] = useState([]);
  const [name, setName] = useState('');
  const [periodMonth, setPeriodMonth] = useState('2026-08');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-08-31');
  const [structureId, setStructureId] = useState('');

  // Step 2 state
  const [eligibleEmployees, setEligibleEmployees] = useState([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      salaryAPI.getStructures().then((res) => {
        const list = res.data || [];
        setStructures(list);
        if (list.length > 0 && !structureId) {
          setStructureId(list[0].id);
        }
      });
      // Set default name with current period
      setName(`Regular Payroll - ${periodMonth}`);
    }
  }, [isOpen]);

  const handlePeriodChange = (val) => {
    setPeriodMonth(val);
    if (val && val.length === 7) {
      const [year, month] = val.split('-');
      const lastDay = new Date(Number(year), Number(month), 0).getDate();
      setStartDate(`${val}-01`);
      setEndDate(`${val}-${lastDay < 10 ? '0' + lastDay : lastDay}`);
      setName(`Regular Payroll - ${val}`);
    }
  };

  const handleProceedToStep2 = async () => {
    if (!name || !periodMonth || !startDate || !endDate || !structureId) {
      showToast('Please fill all required payroll parameters', 'error');
      return;
    }

    setLoadingEligible(true);
    try {
      const res = await payrunAPI.getEligibleEmployees({
        salary_structure_id: structureId,
        start_date: startDate,
        end_date: endDate
      });

      const list = (res.data || []).map((e) => ({
        ...e,
        employee_id: e.employee_id || e.id
      }));
      setEligibleEmployees(list);
      // Auto-select all eligible employees by default
      setSelectedEmpIds(list.map((e) => e.employee_id || e.id));
      setStep(2);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoadingEligible(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedEmpIds.length === eligibleEmployees.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(eligibleEmployees.map((e) => e.employee_id || e.id));
    }
  };

  const toggleSelectEmployee = (empId) => {
    if (selectedEmpIds.includes(empId)) {
      setSelectedEmpIds(selectedEmpIds.filter((id) => id !== empId));
    } else {
      setSelectedEmpIds([...selectedEmpIds, empId]);
    }
  };

  const handleCreatePayrun = async () => {
    if (selectedEmpIds.length === 0) {
      showToast('Select at least one employee for the payrun', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await payrunAPI.create({
        name,
        period_month: periodMonth,
        start_date: startDate,
        end_date: endDate,
        period_start: startDate,
        period_end: endDate,
        pay_date: endDate,
        salary_structure_id: structureId,
        employee_ids: selectedEmpIds
      });

      showToast('Payrun initialized successfully in DRAFT status', 'success');
      const createdId = res.payrun_id || res.data?.id || res.id;
      onSuccess(createdId);
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
                className="form-input font-bold text-blue-700"
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
            <p className="text-[11px] text-slate-500 mt-1">
              The engine will match active historical contracts for employees using this structure.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
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
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs text-blue-700 hover:text-blue-800 font-semibold"
              >
                {selectedEmpIds.length === eligibleEmployees.length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600 font-medium">
                Period: <strong className="text-slate-900">{periodMonth}</strong>
              </span>
            </div>
            <span className="font-bold text-blue-700">
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
                      ? 'bg-blue-50/70 border-blue-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check size={13} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {emp.first_name} {emp.last_name}
                        </span>
                        <span className="text-[11px] text-blue-600 font-mono font-semibold">({emp.emp_code})</span>
                        {hasBankIssue && (
                          <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            <AlertCircle size={10} />
                            No Bank
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {emp.job_title} • {emp.department_name}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-slate-900 text-sm">
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

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
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
