import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Search, LayoutGrid, List, Eye, Edit, Trash2
} from 'lucide-react';
import { employeeAPI, userAPI } from '../../services/api';
import { Badge, LoadingSpinner, EmptyState } from '../../components/common/CommonUI';
import { EmployeeFormModal } from './EmployeeFormModal';
import { useNotify } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [viewMode, setViewMode] = useState('kanban'); // Default view: Kanban per reference spec
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const { showToast } = useNotify();
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes] = await Promise.all([
        employeeAPI.getAll({ search, department_id: selectedDept, status: selectedStatus }),
        userAPI.getDepartments()
      ]);
      setEmployees(empRes.data || []);
      setDepartments(deptRes.data || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedDept, selectedStatus]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await employeeAPI.delete(id);
      showToast('Employee deleted successfully', 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2.5">
            Employees
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
              {employees.length} Total
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {viewMode === 'kanban'
              ? 'Default view: Kanban'
              : 'List view for sort, filter and bulk scanning'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* New Employee Button */}
          {hasRole('HR Manager', 'Admin') && (
            <button
              onClick={() => {
                setEditingEmployee(null);
                setModalOpen(true);
              }}
              className="btn-primary text-xs"
            >
              <UserPlus size={15} />
              <span>New</span>
            </button>
          )}

          {/* Search Input */}
          <div className="relative w-56">
            <input
              type="text"
              placeholder="Search employees..."
              className="form-input pl-9 text-xs py-1.5"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          </div>

          {/* Kanban / List Toggle */}
          <div className="bg-slate-900 border border-white/10 p-1 rounded-xl flex items-center shrink-0">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid size={14} />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List size={14} />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="glass-card p-3 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-400 font-medium">Filter Department:</span>
          <select
            className="form-select text-xs py-1 px-3 w-48"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <span className="text-slate-400 font-medium ml-2">Status:</span>
          <select
            className="form-select text-xs py-1 px-3 w-36"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="probation">Probation</option>
            <option value="on_notice">On Notice</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>

        {(selectedDept || selectedStatus || search) && (
          <button
            onClick={() => {
              setSelectedDept('');
              setSelectedStatus('');
              setSearch('');
            }}
            className="btn-secondary text-xs py-1 px-2.5"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Viewport Content */}
      {loading ? (
        <LoadingSpinner text="Loading employees..." />
      ) : employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees found"
          description="No employee records match your active search or filter criteria."
          actionText={hasRole('HR Manager', 'Admin') ? "New Employee" : null}
          onAction={() => {
            setEditingEmployee(null);
            setModalOpen(true);
          }}
        />
      ) : viewMode === 'kanban' ? (
        /* KANBAN VIEW (2-column desktop grid matching reference spec) */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {employees.map((emp) => (
              <div
                key={emp.id}
                onClick={() => navigate(`/employees/${emp.id}`)}
                className="glass-card glass-card-interactive p-4 border border-white/10 hover:border-sky-500/50 cursor-pointer flex items-center justify-between gap-4 transition-all group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Initials Box */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-600 to-indigo-700 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                    {emp.first_name?.[0]}{emp.last_name?.[0]}
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-extrabold text-slate-100 text-base group-hover:text-sky-400 transition-colors truncate">
                      {emp.first_name} {emp.last_name}
                    </h3>
                    <p className="text-xs text-slate-300 font-medium truncate">
                      {emp.job_title || 'Payroll Specialist'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {emp.department_name || 'Finance'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge status={emp.employment_status || 'active'} text={emp.employment_status || 'Active'} />
                  <span className="text-[10px] text-slate-500 font-mono">{emp.emp_code}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom helper text matching reference specification */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-center text-xs text-slate-400 italic">
            "Useful note: Kanban is good for browsing; clicking a card should open the same Employee Form used everywhere else."
          </div>
        </div>
      ) : (
        /* LIST VIEW (Table matching reference specification) */
        <div className="space-y-4">
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Work Email</th>
                    <th>Job Position</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr
                      key={emp.id}
                      onClick={() => navigate(`/employees/${emp.id}`)}
                      className="cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-sky-950 border border-sky-500/30 text-sky-400 font-bold text-xs flex items-center justify-center shrink-0">
                            {emp.first_name?.[0]}{emp.last_name?.[0]}
                          </div>
                          <span className="font-bold text-slate-100 text-sm hover:text-sky-400 transition-colors">
                            {emp.first_name} {emp.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="text-slate-300 text-xs font-mono">{emp.email}</td>
                      <td className="text-slate-200 font-medium text-xs">{emp.job_title || 'Staff'}</td>
                      <td className="text-slate-400 text-xs">{emp.department_name || 'General'}</td>
                      <td>
                        <Badge status={emp.employment_status || 'active'} text={emp.employment_status || 'Active'} />
                      </td>
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/employees/${emp.id}`)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            title="View Employee Detail"
                          >
                            <Eye size={15} />
                          </button>
                          {hasRole('HR Manager', 'Admin') && (
                            <button
                              onClick={() => {
                                setEditingEmployee(emp);
                                setModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-sky-400 transition-colors"
                              title="Edit Employee"
                            >
                              <Edit size={15} />
                            </button>
                          )}
                          {hasRole('Admin') && (
                            <button
                              onClick={() => handleDelete(emp.id, `${emp.first_name} ${emp.last_name}`)}
                              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom helper text matching reference specification */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-center text-xs text-slate-400 italic">
            "Useful note: the list view is the main entry point for opening a specific employee record quickly."
          </div>
        </div>
      )}

      {/* Modal */}
      <EmployeeFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        employee={editingEmployee}
        onSuccess={loadData}
      />
    </div>
  );
}
