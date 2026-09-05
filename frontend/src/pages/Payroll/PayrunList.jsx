import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Plus, Eye, ShieldAlert, ArrowRight } from 'lucide-react';
import { payrunAPI } from '../../services/api';
import { Badge, LoadingSpinner, EmptyState } from '../../components/common/CommonUI';
import { PayrunWizardModal } from './PayrunWizardModal';
import { useNotify } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export function PayrunList() {
  const [payruns, setPayruns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const { showToast } = useNotify();
  const { hasRole } = useAuth();

  const loadPayruns = async () => {
    setLoading(true);
    try {
      const res = await payrunAPI.getAll();
      setPayruns(res.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayruns();
  }, []);

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">
              Payroll Runs
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
              {payruns.length} Payruns
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Execute salary computations, validate payroll batches, and disburse payments
          </p>
        </div>

        {hasRole('HR Payroll Admin', 'HR Payroll User', 'Admin') && (
          <button onClick={() => setWizardOpen(true)} className="btn-primary text-xs px-3.5 py-2 self-start sm:self-auto">
            <Plus size={15} />
            <span>Create Payrun</span>
          </button>
        )}
      </div>

      {/* Payruns List Table */}
      {loading ? (
        <LoadingSpinner text="Loading payruns ledger..." />
      ) : payruns.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No payruns created yet"
          description="Click Create Payrun to launch the wizard and execute salary calculations."
          actionText="Launch Payrun Wizard"
          onAction={() => setWizardOpen(true)}
        />
      ) : (
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Payrun Code</th>
                <th>Name & Structure</th>
                <th>Period</th>
                <th>Staff Count</th>
                <th>Total Gross</th>
                <th>Total Net Pay</th>
                <th>Anomalies</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payruns.map((pr) => (
                <tr key={pr.id}>
                  <td>
                    <span className="font-bold text-blue-600 text-sm">{pr.payrun_code || `PR-${pr.id}`}</span>
                  </td>
                  <td>
                    <Link
                      to={`/payruns/${pr.id}`}
                      className="font-bold text-slate-900 hover:text-blue-600 transition-colors block text-sm font-heading"
                    >
                      {pr.name}
                    </Link>
                    <span className="text-xs text-slate-500">{pr.structure_name || 'Regular Structure'}</span>
                  </td>
                  <td className="text-sm text-slate-700 font-semibold">{pr.period_month || pr.period_start?.slice(0, 7)}</td>
                  <td>
                    <span className="font-bold text-slate-900 text-sm font-heading">{pr.employee_count || 1}</span>{' '}
                    <span className="text-xs text-slate-500">Staff</span>
                  </td>
                  <td className="text-slate-600 text-sm font-medium">₹{Number(pr.total_gross || 0).toLocaleString('en-IN')}</td>
                  <td>
                    <span className="font-extrabold text-slate-900 text-sm">
                      ₹{Number(pr.total_net || 0).toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td>
                    {Number(pr.anomaly_count) > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        <ShieldAlert size={12} />
                        {pr.anomaly_count} Warnings
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">0 alerts</span>
                    )}
                  </td>
                  <td><Badge status={pr.status} /></td>
                  <td className="text-right">
                    <Link to={`/payruns/${pr.id}`} className="btn-secondary text-xs py-1.5 px-3">
                      <span>Console</span>
                      <ArrowRight size={13} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 2-Step Payrun Creation Wizard Modal */}
      <PayrunWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={() => {
          loadPayruns();
        }}
      />
    </div>
  );
}
