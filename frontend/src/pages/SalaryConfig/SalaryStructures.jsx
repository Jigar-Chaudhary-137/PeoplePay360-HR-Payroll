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
    <div className="space-y-6 pb-8 text-[#17151F]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E5EF]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="page-title">
              Salary Structure & Rule Engine
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F3E8FF] text-[#6D28D9] border border-[#E5E7EB] font-bold">
              Dynamic Engine
            </span>
          </div>
          <p className="text-sm text-[#625E6E] mt-1">
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
      <div className="flex gap-2 border-b border-[#E7E5EF] pb-3 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('structures')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            activeTab === 'structures'
              ? 'bg-[#6C3FF5] text-white font-medium shadow-sm'
              : 'text-[#625E6E] hover:text-[#17151F] hover:bg-[#F8F5FF]'
          }`}
        >
          <Layers size={16} />
          <span>Salary Structures ({structures.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            activeTab === 'rules'
              ? 'bg-[#6C3FF5] text-white font-medium shadow-sm'
              : 'text-[#625E6E] hover:text-[#17151F] hover:bg-[#F8F5FF]'
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
              <div key={s.id} className="glass-card p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E7E5EF] pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-[#17151F]">{s.name}</h3>
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-[#F1ECFF] text-[#6C3FF5] border border-[#DDD9E8] font-bold">
                        {s.code}
                      </span>
                    </div>
                    <p className="text-xs text-[#625E6E] mt-1">{s.description}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold text-[#17151F]">
                    <span className="px-3 py-1.5 rounded-lg bg-[#F8F8FC] border border-[#DDD9E8] text-[#625E6E]">
                      {s.contract_count || 0} Active Contracts Linked
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
                          <td className="font-mono font-semibold text-[#625E6E] text-xs">{r.effective_sequence}</td>
                          <td className="font-semibold text-[#17151F] text-sm">{r.name}</td>
                          <td>
                            <span className="font-mono font-bold text-[#6C3FF5] text-xs">{r.code}</span>
                          </td>
                          <td>
                            <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                              r.category === 'BASIC' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              r.category === 'ALLOWANCE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              r.category === 'DEDUCTION' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                              r.category === 'GROSS' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                              'bg-purple-50 text-[#6C3FF5] border-purple-200'
                            }`}>
                              {r.category}
                            </span>
                          </td>
                          <td>
                            <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-[#F8F8FC] border border-[#DDD9E8] text-[#625E6E] font-mono">
                              {r.calculation_type}
                            </span>
                          </td>
                          <td>
                            <span className="font-mono text-xs text-[#6C3FF5] bg-[#F1ECFF] border border-[#DDD9E8] px-2 py-1 rounded inline-block">
                              {r.calculation_type === 'PERCENT_BASIC' ? `${r.percentage}% of BASIC` :
                               r.calculation_type === 'PERCENT_COMPONENT' ? `${r.percentage}% of ${r.component_code}` :
                               r.calculation_type === 'FIXED' ? `₹${Number(r.fixed_amount).toLocaleString('en-IN')}` :
                               r.calculation_type === 'FORMULA' ? r.formula_expression :
                               'Prorated worked days'}
                            </span>
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
                {rules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[#918C9F]">
                      No calculation rules configured yet.
                    </td>
                  </tr>
                ) : (
                  rules.map((r) => (
                    <tr key={r.id}>
                      <td className="font-mono font-semibold text-[#625E6E] text-xs">{r.sequence}</td>
                      <td className="font-semibold text-[#17151F] text-sm">{r.name}</td>
                      <td>
                        <span className="font-mono font-bold text-[#6C3FF5] text-xs">{r.code}</span>
                      </td>
                      <td>
                        <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                          r.category === 'BASIC' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          r.category === 'ALLOWANCE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          r.category === 'DEDUCTION' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          r.category === 'GROSS' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          'bg-purple-50 text-[#6C3FF5] border-purple-200'
                        }`}>
                          {r.category}
                        </span>
                      </td>
                      <td>
                        <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-[#F8F8FC] border border-[#DDD9E8] text-[#625E6E] font-mono">
                          {r.calculation_type}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-[#6C3FF5] bg-[#F1ECFF] border border-[#DDD9E8] px-2 py-1 rounded inline-block">
                          {r.calculation_type === 'PERCENT_BASIC' ? `${r.percentage}% of BASIC` :
                           r.calculation_type === 'PERCENT_COMPONENT' ? `${r.percentage}% of ${r.component_code}` :
                           r.calculation_type === 'FIXED' ? `₹${Number(r.fixed_amount).toLocaleString('en-IN')}` :
                           r.calculation_type === 'FORMULA' ? r.formula_expression :
                           'Prorated worked days'}
                        </span>
                      </td>
                      {hasRole('HR Payroll Admin', 'Admin') && (
                        <td className="text-right">
                          <button
                            onClick={() => {
                              setEditingRule(r);
                              setRuleModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-[#625E6E] hover:text-[#6C3FF5] hover:bg-[#F8F5FF] transition-colors"
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
