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
    <div className="space-y-6 pb-6 text-[#17151F]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E5EF]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="page-title">
              Employment Contracts
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F3E8FF] text-[#6D28D9] border border-[#E5E7EB] font-bold">
              {contracts.length} Contracts
            </span>
          </div>
          <p className="text-sm text-[#625E6E] mt-0.5">
            Employment contracts, salary structures, base wage terms, and historical revisions
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <select
            className="form-select text-xs py-2 bg-white text-[#17151F] border-[#DDD9E8]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="" className="bg-white">All Statuses</option>
            <option value="running" className="bg-white">Running (Active)</option>
            <option value="draft" className="bg-white">Draft</option>
            <option value="expired" className="bg-white">Expired (Historical)</option>
            <option value="cancelled" className="bg-white">Cancelled</option>
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
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
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
                      <span className="font-bold text-[#6C3FF5] text-sm font-mono">{c.contract_code}</span>
                      {c.notes && <p className="text-xs text-[#625E6E] truncate max-w-xs mt-0.5">{c.notes}</p>}
                    </td>
                    <td>
                      <Link
                        to={`/employees/${c.employee_id}`}
                        className="font-bold text-[#17151F] hover:text-[#6C3FF5] transition-colors text-sm block"
                      >
                        {c.first_name} {c.last_name}
                      </Link>
                      <span className="text-xs text-[#625E6E] block font-medium">
                        {c.emp_code} <span className="text-[#918C9F]">•</span> {c.department_name}
                      </span>
                    </td>
                    <td className="text-xs text-[#625E6E] font-medium font-mono">
                      {c.start_date ? c.start_date.split('T')[0] : '—'} → {c.end_date ? c.end_date.split('T')[0] : 'Indefinite'}
                    </td>
                    <td>
                      <span className="font-extrabold text-[#17151F] text-sm">
                        ₹{Number(c.wage).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] text-[#625E6E] block">per month</span>
                    </td>
                    <td>
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-[#F1ECFF] border border-[#DDD9E8] text-xs font-semibold text-[#6C3FF5]">
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
                          className="p-1.5 rounded-lg hover:bg-[#F8F5FF] text-[#625E6E] hover:text-[#6C3FF5] transition-colors"
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
