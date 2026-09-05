import React, { useState, useEffect } from 'react';
import { salaryAPI } from '../../services/api';
import { Modal } from '../../components/common/CommonUI';
import { useNotify } from '../../context/NotificationContext';

export function SalaryRuleModal({ isOpen, onClose, rule, onSuccess }) {
  const { showToast } = useNotify();
  const isEditing = !!rule;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'ALLOWANCE',
    sequence: 35,
    calculation_type: 'PERCENT_BASIC',
    percentage: 10,
    component_code: 'BASIC',
    fixed_amount: 0,
    formula_expression: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name || '',
        code: rule.code || '',
        category: rule.category || 'ALLOWANCE',
        sequence: rule.sequence || 35,
        calculation_type: rule.calculation_type || 'PERCENT_BASIC',
        percentage: rule.percentage || 0,
        component_code: rule.component_code || 'BASIC',
        fixed_amount: rule.fixed_amount || 0,
        formula_expression: rule.formula_expression || ''
      });
    }
  }, [rule]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        await salaryAPI.updateRule(rule.id, formData);
        showToast('Salary rule updated successfully', 'success');
      } else {
        await salaryAPI.createRule(formData);
        showToast('Salary rule created successfully', 'success');
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
      title={isEditing ? `Edit Salary Rule (${rule.code})` : 'New Dynamic Salary Rule'}
      subtitle="Configure calculation method, dependencies, sequence, and category"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Rule Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Medical Allowance"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">Rule Code (Unique) *</label>
            <input
              type="text"
              required
              disabled={isEditing}
              placeholder="e.g. MED_ALW"
              className="form-input uppercase font-mono font-bold"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="form-label">Category *</label>
            <select
              className="form-select"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="BASIC">Basic</option>
              <option value="ALLOWANCE">Allowance (Earning)</option>
              <option value="GROSS">Gross Aggregate</option>
              <option value="DEDUCTION">Deduction</option>
              <option value="NET">Net Salary</option>
            </select>
          </div>
          <div>
            <label className="form-label">Execution Sequence *</label>
            <input
              type="number"
              required
              min="1"
              max="200"
              className="form-input font-bold"
              value={formData.sequence}
              onChange={(e) => setFormData({ ...formData, sequence: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="form-label">Calculation Type *</label>
            <select
              className="form-select"
              value={formData.calculation_type}
              onChange={(e) => setFormData({ ...formData, calculation_type: e.target.value })}
            >
              <option value="PERCENT_BASIC">% of Basic</option>
              <option value="PERCENT_COMPONENT">% of Component</option>
              <option value="FIXED">Fixed Amount (₹)</option>
              <option value="FORMULA">Math Formula</option>
              <option value="PRORATED_DAYS">Worked Days Prorated</option>
            </select>
          </div>
        </div>

        {/* Dynamic calculation input fields */}
        {formData.calculation_type === 'PERCENT_BASIC' && (
          <div>
            <label className="form-label">Percentage of Basic (%)</label>
            <input
              type="number"
              step="0.1"
              className="form-input"
              value={formData.percentage}
              onChange={(e) => setFormData({ ...formData, percentage: Number(e.target.value) })}
            />
          </div>
        )}

        {formData.calculation_type === 'PERCENT_COMPONENT' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Target Component Code</label>
              <input
                type="text"
                placeholder="e.g. BASIC or GROSS"
                className="form-input uppercase font-mono"
                value={formData.component_code}
                onChange={(e) => setFormData({ ...formData, component_code: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label className="form-label">Percentage (%)</label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={formData.percentage}
                onChange={(e) => setFormData({ ...formData, percentage: Number(e.target.value) })}
              />
            </div>
          </div>
        )}

        {formData.calculation_type === 'FIXED' && (
          <div>
            <label className="form-label">Fixed Monthly Amount (₹)</label>
            <input
              type="number"
              step="10"
              className="form-input"
              value={formData.fixed_amount}
              onChange={(e) => setFormData({ ...formData, fixed_amount: Number(e.target.value) })}
            />
          </div>
        )}

        {formData.calculation_type === 'FORMULA' && (
          <div>
            <label className="form-label">Formula Expression</label>
            <input
              type="text"
              placeholder="e.g. BASIC + HRA + CONV - PF"
              className="form-input font-mono text-sky-400 font-bold"
              value={formData.formula_expression}
              onChange={(e) => setFormData({ ...formData, formula_expression: e.target.value })}
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Supports previous sequence rule codes (BASIC, HRA, GROSS, etc.) and arithmetic operators (+, -, *, /).
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving...' : isEditing ? 'Update Rule' : 'Create Salary Rule'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
