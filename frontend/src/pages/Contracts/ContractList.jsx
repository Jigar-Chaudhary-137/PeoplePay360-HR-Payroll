import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileSpreadsheet, Plus, Filter, Search, Edit } from 'lucide-react';
import { contractAPI } from '../../services/api';
import { Badge, LoadingSpinner, EmptyState } from '../../components/common/CommonUI';
import { ContractFormModal } from './ContractFormModal';
import { useNotify } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export function ContractList() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);

  const { showToast } = useNotify();
  const { hasRole } = useAuth();

  const loadContracts = async () => {
    setLoading(true);
    try {
      const res = await contractAPI.getAll({ status: statusFilter });
      setContracts(res.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2.5">
            Contracts Management
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
              {contracts.length} Contracts
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Historical contracts, wage terms, and salary structure associations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            className="form-select text-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="running">Running (Active)</option>
            <option value="draft">Draft</option>
            <option value="expired">Expired (Historical)</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {hasRole('HR Manager', 'Admin') && (
            <button
              onClick={() => {
                setEditingContract(null);
                setModalOpen(true);
              }}
              className="btn-primary text-xs"
            >
              <Plus size={15} />
              <span>Create Contract</span>
            </button>
          )}
        </div>
      </div>

      {/* Contracts Table */}
      {loading ? (
        <LoadingSpinner text="Loading contracts ledger..." />
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No contracts found"
          description="Create an employment contract to define employee salary structure and base wages."
          actionText={hasRole('HR Manager', 'Admin') ? "New Contract" : null}
          onAction={() => {
            setEditingContract(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Contract Code</th>
                  <th>Employee</th>
                  <th>Period</th>
                  <th>Contract Wage</th>
                  <th>Structure</th>
                  <th>Status</th>
                  {hasRole('HR Manager', 'Admin') && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {contracts.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="font-mono font-bold text-sky-400">{c.contract_code}</span>
                      {c.notes && <p className="text-[10px] text-slate-500 truncate max-w-xs">{c.notes}</p>}
                    </td>
                    <td>
                      <Link
                        to={`/employees/${c.employee_id}`}
                        className="font-bold text-slate-100 hover:text-sky-400 transition-colors"
                      >
                        {c.first_name} {c.last_name}
                      </Link>
                      <span className="text-[11px] text-slate-400 block">{c.emp_code} • {c.department_name}</span>
                    </td>
                    <td className="text-xs text-slate-300">
                      {c.start_date.split('T')[0]} → {c.end_date ? c.end_date.split('T')[0] : 'Indefinite'}
                    </td>
                    <td>
                      <span className="font-extrabold text-slate-100 text-base">
                        ₹{Number(c.wage).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 block">/ month</span>
                    </td>
                    <td className="text-xs text-slate-200 font-medium">
                      {c.structure_name}
                    </td>
                    <td>
                      <Badge status={c.status} />
                    </td>
                    {hasRole('HR Manager', 'Admin') && (
                      <td className="text-right">
                        <button
                          onClick={() => {
                            setEditingContract(c);
                            setModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-sky-400 transition-colors"
                          title="Edit Contract"
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

      {/* Contract Modal */}
      <ContractFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        contract={editingContract}
        onSuccess={loadContracts}
      />
    </div>
  );
}
