import React, { useState, useEffect } from 'react';
import { contractAPI, employeeAPI, salaryAPI, scheduleAPI } from '../../services/api';
import { Modal } from '../../components/common/CommonUI';
import { useNotify } from '../../context/NotificationContext';

export function ContractFormModal({ isOpen, onClose, contract, onSuccess }) {
  const { showToast } = useNotify();
  const isEditing = !!contract;

  const [formData, setFormData] = useState({
    employee_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    wage: '',
    salary_structure_id: '',
    working_schedule_id: '',
    status: 'running',
    notes: ''
  });

  const [employees, setEmployees] = useState([]);
  const [structures, setStructures] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    employeeAPI.getAll().then((res) => setEmployees(res.data || []));
    salaryAPI.getStructures().then((res) => setStructures(res.data || []));
    scheduleAPI.getAll().then((res) => setSchedules(res.data || []));

    if (contract) {
      setFormData({
        employee_id: contract.employee_id,
        start_date: contract.start_date.split('T')[0],
        end_date: contract.end_date ? contract.end_date.split('T')[0] : '',
        wage: contract.wage,
        salary_structure_id: contract.salary_structure_id,
        working_schedule_id: contract.working_schedule_id || '',
        status: contract.status || 'running',
        notes: contract.notes || ''
      });
    }
  }, [contract]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        await contractAPI.update(contract.id, formData);
        showToast('Contract updated successfully', 'success');
      } else {
        await contractAPI.create(formData);
        showToast('Contract created successfully', 'success');
      }
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Contract (${contract.contract_code})` : 'New Employment Contract'}
      subtitle="Define compensation wage, effective period, and salary rule structure"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="form-label">Employee *</label>
          <select
            className="form-select"
            required
            disabled={isEditing}
            value={formData.employee_id}
            onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
          >
            <option value="">Select Employee</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.first_name} {e.last_name} ({e.emp_code})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Start Date *</label>
            <input
              type="date"
              required
              className="form-input"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">End Date (Leave blank if indefinite)</label>
            <input
              type="date"
              className="form-input"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Monthly Contract Wage (₹) *</label>
            <input
              type="number"
              required
              min="1000"
              step="100"
              placeholder="e.g. 55000"
              className="form-input text-base font-bold text-sky-400"
              value={formData.wage}
              onChange={(e) => setFormData({ ...formData, wage: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Contract Status</label>
            <select
              className="form-select"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="running">Running (Active)</option>
              <option value="draft">Draft</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Salary Structure *</label>
            <select
              className="form-select"
              required
              value={formData.salary_structure_id}
              onChange={(e) => setFormData({ ...formData, salary_structure_id: e.target.value })}
            >
              <option value="">Select Salary Structure</option>
              {structures.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Working Schedule</label>
            <select
              className="form-select"
              value={formData.working_schedule_id}
              onChange={(e) => setFormData({ ...formData, working_schedule_id: e.target.value })}
            >
              <option value="">Select Schedule</option>
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.hours_per_week}h/wk)</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="form-label">Contract Notes & Remarks</label>
          <textarea
            rows={2}
            className="form-textarea"
            placeholder="Terms, probation confirmation notes..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : isEditing ? 'Update Contract' : 'Create Contract'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
