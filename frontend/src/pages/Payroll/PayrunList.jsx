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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2.5">
            Payroll Payruns
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
              {payruns.length} Payruns
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            2-step payrun generation wizard, dynamic computation engine, validation, and disbursement
          </p>
        </div>

        {hasRole('HR Payroll Admin', 'HR Payroll User', 'Admin') && (
          <button onClick={() => setWizardOpen(true)} className="btn-primary text-xs">
            <Plus size={15} />
            <span>Create Payrun (Wizard)</span>
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
          description="Click Create Payrun to launch the 2-step wizard and execute salary calculations."
          actionText="Launch Payrun Wizard"
          onAction={() => setWizardOpen(true)}
        />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
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
                      <span className="font-mono font-bold text-sky-400">{pr.payrun_code}</span>
                    </td>
                    <td>
                      <Link
                        to={`/payruns/${pr.id}`}
                        className="font-bold text-slate-100 hover:text-sky-400 transition-colors block text-sm"
                      >
                        {pr.name}
                      </Link>
                      <span className="text-[11px] text-slate-400">{pr.structure_name}</span>
                    </td>
                    <td className="text-xs text-slate-300 font-semibold">{pr.period_month}</td>
                    <td>
                      <span className="font-bold text-slate-100">{pr.employee_count}</span> Staff
                    </td>
                    <td className="text-slate-300 text-xs">₹{Number(pr.total_gross || 0).toLocaleString()}</td>
                    <td>
                      <span className="font-extrabold text-sky-400 text-sm">
                        ₹{Number(pr.total_net || 0).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      {Number(pr.anomaly_count) > 0 ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                          <ShieldAlert size={12} />
                          {pr.anomaly_count} Warnings
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">0 alerts</span>
                      )}
                    </td>
                    <td><Badge status={pr.status} /></td>
                    <td className="text-right">
                      <Link to={`/payruns/${pr.id}`} className="btn-primary text-xs py-1 px-3">
                        <span>Open Console</span>
                        <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2-Step Payrun Creation Wizard Modal */}
      <PayrunWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={(newId) => {
          loadPayruns();
        }}
      />
    </div>
  );
}
