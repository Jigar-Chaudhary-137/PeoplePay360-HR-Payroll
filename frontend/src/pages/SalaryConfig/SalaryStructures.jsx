import React, { useState, useEffect } from 'react';
import { Sliders, Plus, Edit, ArrowDown, CheckCircle2 } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2.5">
            Salary Structure & Rule Engine
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
              Dynamic Config
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ordered salary calculation sequences, statutory deduction rules, and dynamic formulas
          </p>
        </div>

        {hasRole('HR Payroll Admin', 'Admin') && (
          <button
            onClick={() => {
              setEditingRule(null);
              setRuleModalOpen(true);
            }}
            className="btn-primary text-xs"
          >
            <Plus size={15} />
            <span>New Salary Rule</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-3 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('structures')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'structures' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders size={15} />
          <span>Salary Structures ({structures.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeTab === 'rules' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders size={15} />
          <span>Salary Rules Repository ({rules.length})</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading salary rule engines..." />
      ) : activeTab === 'structures' ? (
        /* Structures with Linked Rule Sequences */
        <div className="space-y-6">
          {structures.map((s) => (
            <div key={s.id} className="glass-card p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-100">{s.name}</h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-500/30">
                      {s.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{s.description}</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-slate-300">
                  <span className="px-3 py-1 rounded-lg bg-white/5">
                    {s.contract_count} Active Contracts Linked
                  </span>
                </div>
              </div>

              {/* Step Sequence Table */}
              <div className="overflow-x-auto">
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
                        <td className="font-mono font-bold text-slate-400">{r.effective_sequence}</td>
                        <td className="font-bold text-slate-200">{r.name}</td>
                        <td>
                          <span className="font-mono font-bold text-sky-400">{r.code}</span>
                        </td>
                        <td>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            r.category === 'BASIC' ? 'bg-sky-950 text-sky-300' :
                            r.category === 'ALLOWANCE' ? 'bg-emerald-950 text-emerald-300' :
                            r.category === 'DEDUCTION' ? 'bg-rose-950 text-rose-300' :
                            r.category === 'GROSS' ? 'bg-indigo-950 text-indigo-300' :
                            'bg-purple-950 text-purple-300'
                          }`}>
                            {r.category}
                          </span>
                        </td>
                        <td className="text-xs text-slate-300 font-medium">{r.calculation_type}</td>
                        <td className="font-mono text-xs text-slate-300">
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
          ))}
        </div>
      ) : (
        /* Rules Table */
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
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
                {rules.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono font-bold text-slate-400">{r.sequence}</td>
                    <td className="font-bold text-slate-200">{r.name}</td>
                    <td>
                      <span className="font-mono font-bold text-sky-400">{r.code}</span>
                    </td>
                    <td>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        r.category === 'BASIC' ? 'bg-sky-950 text-sky-300' :
                        r.category === 'ALLOWANCE' ? 'bg-emerald-950 text-emerald-300' :
                        r.category === 'DEDUCTION' ? 'bg-rose-950 text-rose-300' :
                        r.category === 'GROSS' ? 'bg-indigo-950 text-indigo-300' :
                        'bg-purple-950 text-purple-300'
                      }`}>
                        {r.category}
                      </span>
                    </td>
                    <td className="text-xs text-slate-300">{r.calculation_type}</td>
                    <td className="font-mono text-xs text-slate-300">
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
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-sky-400 transition-colors"
                          title="Edit Rule"
                        >
                          <Edit size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
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
