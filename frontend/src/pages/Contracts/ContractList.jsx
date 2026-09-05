import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Filter, Search, Edit } from 'lucide-react';
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
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">
              Employment Contracts
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
              {contracts.length} Contracts
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Employment contracts, salary structures, base wage terms, and historical revisions
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <select
            className="form-select text-xs py-2"
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
              className="btn-primary text-xs px-3.5 py-2"
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
          icon={FileText}
          title="No contracts found"
          description="Create an employment contract to define employee salary structure and base wages."
          actionText={hasRole('HR Manager', 'Admin') ? "New Contract" : null}
          onAction={() => {
            setEditingContract(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Contract Code</th>
                <th>Employee</th>
                <th>Period</th>
                <th>Contract Wage</th>
                <th>Salary Structure</th>
                <th>Status</th>
                {hasRole('HR Manager', 'Admin') && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="font-bold text-blue-600 text-sm">{c.contract_code}</span>
                    {c.notes && <p className="text-xs text-slate-500 truncate max-w-xs mt-0.5">{c.notes}</p>}
                  </td>
                  <td>
                    <Link
                      to={`/employees/${c.employee_id}`}
                      className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-sm font-heading"
                    >
                      {c.first_name} {c.last_name}
                    </Link>
                    <span className="text-xs text-slate-400 block font-medium">
                      {c.emp_code} <span className="text-slate-300">•</span> {c.department_name}
                    </span>
                  </td>
                  <td className="text-xs text-slate-600 font-medium">
                    {c.start_date ? c.start_date.split('T')[0] : '—'} → {c.end_date ? c.end_date.split('T')[0] : 'Indefinite'}
                  </td>
                  <td>
                    <span className="font-extrabold text-slate-900 text-sm">
                      ₹{Number(c.wage).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-slate-400 block">per month</span>
                  </td>
                  <td>
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                      {c.structure_name}
                    </span>
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
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
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
