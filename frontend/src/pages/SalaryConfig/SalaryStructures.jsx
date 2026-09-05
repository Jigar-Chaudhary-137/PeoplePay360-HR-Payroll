import React, { useState, useEffect } from 'react';
import { Sliders, Plus, Edit, ArrowDown, CheckCircle2, Layers, Cpu } from 'lucide-react';
import { salaryAPI } from '../../services/api';
import { Badge, LoadingSpinner, EmptyState } from '../../components/common/CommonUI';
import { SalaryRuleModal } from './SalaryRuleModal';
import { useNotify } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export function SalaryStructures() {
  const [structures, setStructures] = useState([]);
  const [rules, setRules] = useState([]);
  const [activeTab, setActiveTab] = useState('structures'); // 'structures' or 'rules'
  const [loading, setLoading] = useState(true);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const { showToast } = useNotify();
  const { hasRole } = useAuth();

  const loadData = async () => {
    setLoading(true);
    try {
      const [structRes, ruleRes] = await Promise.all([
        salaryAPI.getStructures(),
        salaryAPI.getRules()
      ]);
      setStructures(structRes.data || []);
      setRules(ruleRes.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Salary Structure & Rule Engine
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              Dynamic Engine
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Ordered salary calculation sequences, statutory deduction rules, and dynamic formulas
          </p>
        </div>

        {hasRole('HR Payroll Admin', 'Admin') && (
          <button
            onClick={() => {
              setEditingRule(null);
              setRuleModalOpen(true);
            }}
            className="btn-primary text-sm self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>New Salary Rule</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-3 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('structures')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            activeTab === 'structures'
              ? 'bg-blue-600 text-white font-medium shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers size={16} />
          <span>Salary Structures ({structures.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            activeTab === 'rules'
              ? 'bg-blue-600 text-white font-medium shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Cpu size={16} />
          <span>Salary Rules Repository ({rules.length})</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading salary rule engines..." />
      ) : activeTab === 'structures' ? (
        /* Structures with Linked Rule Sequences */
        <div className="space-y-6">
          {structures.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No Salary Structures Found"
              description="Configure your first salary structure to begin linking automated compensation rules."
            />
          ) : (
            structures.map((s) => (
              <div key={s.id} className="card p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-900">{s.name}</h3>
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                        {s.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{s.description}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
                    <span className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                      {s.contract_count || 0} Active Contracts Linked
                    </span>
                  </div>
                </div>

                {/* Step Sequence Table */}
                <div className="custom-table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Seq</th>
                        <th>Rule Name</th>
                        <th>Code</th>
                        <th>Category</th>
                        <th>Calculation Type</th>
                        <th>Rate / Formula</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(s.rules || []).map((r) => (
                        <tr key={r.id}>
                          <td className="font-mono font-semibold text-slate-500 text-xs">{r.effective_sequence}</td>
                          <td className="font-semibold text-slate-900 text-sm">{r.name}</td>
                          <td>
                            <span className="font-mono font-bold text-blue-600 text-xs">{r.code}</span>
                          </td>
                          <td>
                            <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                              r.category === 'BASIC' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              r.category === 'ALLOWANCE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              r.category === 'DEDUCTION' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              r.category === 'GROSS' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                              'bg-purple-50 text-purple-700 border-purple-200'
                            }`}>
                              {r.category}
                            </span>
                          </td>
                          <td className="text-xs text-slate-600 font-medium">{r.calculation_type}</td>
                          <td className="font-mono text-xs text-slate-700 font-medium">
                            {r.calculation_type === 'PERCENT_BASIC' ? `${r.percentage}% of BASIC` :
                             r.calculation_type === 'PERCENT_COMPONENT' ? `${r.percentage}% of ${r.component_code}` :
                             r.calculation_type === 'FIXED' ? `₹${Number(r.fixed_amount).toLocaleString()}` :
                             r.calculation_type === 'FORMULA' ? r.formula_expression :
                             'Prorated worked days'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Rules Table */
        <div className="card overflow-hidden">
          <div className="custom-table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Seq</th>
                  <th>Rule Name</th>
                  <th>Code</th>
                  <th>Category</th>
                  <th>Calculation Type</th>
                  <th>Value / Formula</th>
                  {hasRole('HR Payroll Admin', 'Admin') && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {rules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      No calculation rules configured yet.
                    </td>
                  </tr>
                ) : (
                  rules.map((r) => (
                    <tr key={r.id}>
                      <td className="font-mono font-semibold text-slate-500 text-xs">{r.sequence}</td>
                      <td className="font-semibold text-slate-900 text-sm">{r.name}</td>
                      <td>
                        <span className="font-mono font-bold text-blue-600 text-xs">{r.code}</span>
                      </td>
                      <td>
                        <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                          r.category === 'BASIC' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          r.category === 'ALLOWANCE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          r.category === 'DEDUCTION' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          r.category === 'GROSS' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                          {r.category}
                        </span>
                      </td>
                      <td className="text-xs text-slate-600 font-medium">{r.calculation_type}</td>
                      <td className="font-mono text-xs text-slate-700 font-medium">
                        {r.calculation_type === 'PERCENT_BASIC' ? `${r.percentage}% of BASIC` :
                         r.calculation_type === 'PERCENT_COMPONENT' ? `${r.percentage}% of ${r.component_code}` :
                         r.calculation_type === 'FIXED' ? `₹${Number(r.fixed_amount).toLocaleString()}` :
                         r.calculation_type === 'FORMULA' ? r.formula_expression :
                         'Prorated worked days'}
                      </td>
                      {hasRole('HR Payroll Admin', 'Admin') && (
                        <td className="text-right">
                          <button
                            onClick={() => {
                              setEditingRule(r);
                              setRuleModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                            title="Edit Rule"
                          >
                            <Edit size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rule Modal */}
      <SalaryRuleModal
        isOpen={ruleModalOpen}
        onClose={() => setRuleModalOpen(false)}
        rule={editingRule}
        onSuccess={loadData}
      />
    </div>
  );
}
