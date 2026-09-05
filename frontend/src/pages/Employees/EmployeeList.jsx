import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Search, Filter, LayoutGrid, List,
  Briefcase, Mail, Phone, ChevronRight, Eye, Edit, Trash2
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
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2.5">
            Employees Directory
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
              {employees.length} Staff
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Master records, employment contracts, schedules, and payroll parameters
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="bg-slate-900 border border-white/10 p-1 rounded-xl flex items-center">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'list' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'kanban' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Kanban View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          {hasRole('HR Manager', 'Admin') && (
            <button
              onClick={() => {
                setEditingEmployee(null);
                setModalOpen(true);
              }}
              className="btn-primary text-xs"
            >
              <UserPlus size={15} />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by name, code, or email..."
            className="form-input pl-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            className="form-select text-xs"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            className="form-select text-xs"
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
      </div>

      {/* Viewport content */}
      {loading ? (
        <LoadingSpinner text="Loading employee records..." />
      ) : employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees found"
          description="Try adjusting your search criteria or register a new employee record."
          actionText={hasRole('HR Manager', 'Admin') ? "Register Employee" : null}
          onAction={() => {
            setEditingEmployee(null);
            setModalOpen(true);
          }}
        />
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department & Role</th>
                  <th>Active Contract</th>
                  <th>Schedule</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id} className="group">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-950 border border-sky-500/30 text-sky-400 font-bold text-xs flex items-center justify-center shrink-0">
                          {emp.first_name[0]}{emp.last_name[0]}
                        </div>
                        <div>
                          <Link
                            to={`/employees/${emp.id}`}
                            className="font-bold text-slate-100 hover:text-sky-400 transition-colors block text-sm"
                          >
                            {emp.first_name} {emp.last_name}
                          </Link>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {emp.emp_code} • {emp.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-slate-200">{emp.job_title || 'Unassigned'}</div>
                      <div className="text-[11px] text-slate-400">{emp.department_name || 'General'}</div>
                    </td>
                    <td>
                      {emp.active_wage ? (
                        <div>
                          <div className="font-bold text-sky-400">₹{Number(emp.active_wage).toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400">{emp.active_contract_code}</div>
                        </div>
                      ) : (
                        <span className="text-amber-400 text-xs font-semibold">⚠ No Active Contract</span>
                      )}
                    </td>
                    <td className="text-xs text-slate-300">
                      {emp.schedule_name || 'Standard 40h'}
                    </td>
                    <td>
                      <Badge status={emp.employment_status} />
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/employees/${emp.id}`}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                          title="View Profile & Ledger"
                        >
                          <Eye size={16} />
                        </Link>
                        {hasRole('HR Manager', 'Admin') && (
                          <button
                            onClick={() => {
                              setEditingEmployee(emp);
                              setModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-sky-400 transition-colors"
                            title="Edit Employee"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {hasRole('Admin') && (
                          <button
                            onClick={() => handleDelete(emp.id, `${emp.first_name} ${emp.last_name}`)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
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
      ) : (
        /* Kanban View (Grouped by Department) */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
          {departments.map((dept) => {
            const deptEmps = employees.filter((e) => e.department_id === dept.id);
            return (
              <div key={dept.id} className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-300">{dept.name}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 font-bold">
                    {deptEmps.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {deptEmps.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2 text-center">No employees in department</p>
                  ) : (
                    deptEmps.map((emp) => (
                      <div
                        key={emp.id}
                        onClick={() => navigate(`/employees/${emp.id}`)}
                        className="p-3 rounded-xl bg-slate-900/90 border border-white/5 hover:border-sky-500/40 cursor-pointer transition-all space-y-2 group shadow-sm hover:shadow-sky-500/10"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-sky-400">{emp.emp_code}</span>
                          <Badge status={emp.employment_status} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-100 text-sm group-hover:text-sky-400 transition-colors">
                            {emp.first_name} {emp.last_name}
                          </p>
                          <p className="text-xs text-slate-400 truncate">{emp.job_title || 'Staff'}</p>
                        </div>
                        <div className="text-xs text-slate-300 font-semibold pt-1 border-t border-white/5 flex justify-between">
                          <span className="text-slate-500 text-[10px]">Wage:</span>
                          <span className="text-sky-300">{emp.active_wage ? `₹${Number(emp.active_wage).toLocaleString()}` : 'N/A'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <EmployeeFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        employee={editingEmployee}
        onSuccess={loadData}
      />
    </div>
  );
}
