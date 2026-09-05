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
      const rawUsers = uRes.data || uRes || [];
      setUsers(rawUsers.map(u => ({
        ...u,
        work_email: u.work_email || u.email,
        role: u.role || u.role_name,
        account_status: u.account_status || u.status || 'Active',
        emp_code: u.emp_code || u.employee_code
      })));
      setEmployees(empRes.data || empRes || []);
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
      work_email: user.work_email || user.email,
      password: '',
      role: user.role || user.role_name,
      employee_id: user.employee_id || '',
      account_status: user.account_status || user.status || 'Active'
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
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            User Accounts & RBAC
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
              {users.length} Accounts
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Role assignments, employee record linkage, and authentication status
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn-primary text-sm self-start sm:self-auto">
          <UserPlus size={16} />
          <span>New User Account</span>
        </button>
      </div>

      {/* Users Table */}
      {loading ? (
        <LoadingSpinner text="Loading user directory..." />
      ) : (
        <div className="card overflow-hidden">
          <div className="custom-table-container">
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
                      <span className="font-semibold text-slate-900">{u.work_email}</span>
                      <span className="text-[11px] text-slate-400 block font-mono">UID: #{u.id}</span>
                    </td>
                    <td>
                      {u.first_name ? (
                        <div>
                          <span className="font-medium text-slate-800">{u.first_name} {u.last_name}</span>
                          <span className="text-[11px] text-blue-600 block font-mono">{u.emp_code}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No Employee Linked</span>
                      )}
                    </td>
                    <td className="text-xs text-slate-600 font-medium">
                      {u.department_name ? `${u.department_name} • ${u.job_title || ''}` : '-'}
                    </td>
                    <td>
                      <span className="font-semibold text-xs px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                        u.account_status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {u.account_status}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
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
                className="form-select font-medium"
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

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
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
