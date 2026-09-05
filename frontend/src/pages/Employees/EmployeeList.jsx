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
    <div className="space-y-6 pb-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">
              Employees
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
              {employees.length} Staff
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your workforce, employment details, and contracts
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* View Mode Toggle */}
          <div className="bg-slate-100 border border-slate-200 p-1 rounded-xl flex items-center shadow-2xs">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'list' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-500 hover:text-slate-800'
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
              className="btn-primary text-xs px-3.5 py-2"
            >
              <UserPlus size={15} />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-3.5 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by name, code, or email..."
            className="form-input pl-9 text-xs py-2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <select
            className="form-select text-xs py-2"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            className="form-select text-xs py-2"
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
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department & Position</th>
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
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0">
                        {emp.first_name?.[0]}{emp.last_name?.[0]}
                      </div>
                      <div>
                        <Link
                          to={`/employees/${emp.id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 transition-colors block text-sm font-heading"
                        >
                          {emp.first_name} {emp.last_name}
                        </Link>
                        <span className="text-xs text-slate-400 font-medium">
                          {emp.emp_code} <span className="text-slate-300">•</span> {emp.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="font-semibold text-slate-900 text-sm font-heading">{emp.job_title || 'Staff'}</div>
                    <div className="text-xs text-slate-500">{emp.department_name || 'General Operations'}</div>
                  </td>
                  <td>
                    {emp.active_wage ? (
                      <div>
                        <div className="font-bold text-slate-900 text-sm">₹{Number(emp.active_wage).toLocaleString('en-IN')}</div>
                        <div className="text-[11px] text-blue-600 font-semibold">{emp.active_contract_code}</div>
                      </div>
                    ) : (
                      <span className="text-amber-600 text-xs font-semibold">⚠ No Active Contract</span>
                    )}
                  </td>
                  <td className="text-sm text-slate-600">
                    {emp.schedule_name || 'Standard 40h'}
                  </td>
                  <td>
                    <Badge status={emp.employment_status} />
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/employees/${emp.id}`}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                        title="View Profile"
                      >
                        <Eye size={16} />
                      </Link>
                      {hasRole('HR Manager', 'Admin') && (
                        <button
                          onClick={() => {
                            setEditingEmployee(emp);
                            setModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Edit Employee"
                        >
                          <Edit size={16} />
                        </button>
                      )}
                      {hasRole('Admin') && (
                        <button
                          onClick={() => handleDelete(emp.id, `${emp.first_name} ${emp.last_name}`)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
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
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-start">
          {departments.map((dept) => {
            const deptEmps = employees.filter((e) => e.department_id === dept.id);
            return (
              <div key={dept.id} className="card p-4 space-y-3 bg-slate-50/50">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700 font-heading">{dept.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                    {deptEmps.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {deptEmps.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-4 text-center">No employees in department</p>
                  ) : (
                    deptEmps.map((emp) => (
                      <div
                        key={emp.id}
                        onClick={() => navigate(`/employees/${emp.id}`)}
                        className="p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-400 cursor-pointer transition-all space-y-2 shadow-2xs hover:shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-blue-600">{emp.emp_code}</span>
                          <Badge status={emp.employment_status} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors font-heading">
                            {emp.first_name} {emp.last_name}
                          </p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{emp.job_title || 'Staff'}</p>
                        </div>
                        <div className="text-xs text-slate-600 font-semibold pt-1.5 border-t border-slate-100 flex justify-between items-center">
                          <span className="text-slate-400 text-[11px]">Wage:</span>
                          <span className="text-slate-900 font-bold">{emp.active_wage ? `₹${Number(emp.active_wage).toLocaleString('en-IN')}` : 'N/A'}</span>
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
