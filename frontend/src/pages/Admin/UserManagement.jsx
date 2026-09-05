import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserPlus, Edit, CheckCircle, XCircle } from 'lucide-react';
import { userAPI, employeeAPI } from '../../services/api';
import { Badge, LoadingSpinner, Modal, EmptyState } from '../../components/common/CommonUI';
import { useNotify } from '../../context/NotificationContext';

export function UserManagement() {
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    work_email: '',
    password: '',
    role: 'Employee',
    employee_id: '',
    account_status: 'Active'
  });
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useNotify();

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, empRes] = await Promise.all([
        userAPI.getAll(),
        employeeAPI.getAll()
      ]);
      setUsers(uRes.data || []);
      setEmployees(empRes.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      work_email: '',
      password: '',
      role: 'Employee',
      employee_id: '',
      account_status: 'Active'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      work_email: user.work_email,
      password: '',
      role: user.role,
      employee_id: user.employee_id || '',
      account_status: user.account_status
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingUser) {
        await userAPI.update(editingUser.id, formData);
        showToast('User account updated successfully', 'success');
      } else {
        await userAPI.create(formData);
        showToast('User account created successfully', 'success');
      }
      loadData();
      setModalOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2.5">
            User Accounts & RBAC
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
              {users.length} Accounts
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Role assignments, employee record linkage, and authentication status
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn-primary text-xs">
          <UserPlus size={15} />
          <span>New User Account</span>
        </button>
      </div>

      {/* Users Table */}
      {loading ? (
        <LoadingSpinner text="Loading user directory..." />
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Work Email</th>
                  <th>Linked Employee</th>
                  <th>Department & Title</th>
                  <th>Assigned Role</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <span className="font-bold text-slate-100">{u.work_email}</span>
                      <span className="text-[10px] text-slate-500 block">UID: #{u.id}</span>
                    </td>
                    <td>
                      {u.first_name ? (
                        <div>
                          <span className="font-semibold text-slate-200">{u.first_name} {u.last_name}</span>
                          <span className="text-[10px] text-sky-400 block font-mono">{u.emp_code}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">No Employee Linked</span>
                      )}
                    </td>
                    <td className="text-xs text-slate-300">
                      {u.department_name ? `${u.department_name} • ${u.job_title || ''}` : '-'}
                    </td>
                    <td>
                      <span className="font-bold text-xs px-2.5 py-1 rounded-lg bg-sky-950 text-sky-300 border border-sky-500/30">
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        u.account_status === 'Active' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                      }`}>
                        {u.account_status}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-sky-400 transition-colors"
                        title="Edit User Role / Status"
                      >
                        <Edit size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? `Edit User (${editingUser.work_email})` : 'Create User Account'}
        subtitle="Configure role permissions and link to employee master"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="form-label">Work Email *</label>
            <input
              type="email"
              required
              disabled={!!editingUser}
              className="form-input"
              value={formData.work_email}
              onChange={(e) => setFormData({ ...formData, work_email: e.target.value })}
            />
          </div>

          <div>
            <label className="form-label">{editingUser ? 'New Password (Leave blank to keep current)' : 'Password *'}</label>
            <input
              type="password"
              required={!editingUser}
              placeholder="••••••••"
              className="form-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Assigned Role *</label>
              <select
                className="form-select font-semibold"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="Employee">Employee (Self-Service)</option>
                <option value="HR Manager">HR Manager</option>
                <option value="HR Payroll User">HR Payroll User</option>
                <option value="HR Payroll Admin">HR Payroll Admin</option>
                <option value="Admin">Admin (Full System)</option>
              </select>
            </div>
            <div>
              <label className="form-label">Account Status</label>
              <select
                className="form-select"
                value={formData.account_status}
                onChange={(e) => setFormData({ ...formData, account_status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive (Blocked)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Link to Employee Record</label>
            <select
              className="form-select"
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
            >
              <option value="">No Linked Employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.first_name} {e.last_name} ({e.emp_code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : editingUser ? 'Update Account' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
