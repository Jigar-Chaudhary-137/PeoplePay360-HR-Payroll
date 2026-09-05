import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileSpreadsheet, Clock, CalendarOff,
  DollarSign, Sliders, ShieldCheck, UserCheck, LogOut, Sparkles,
  ChevronDown, Menu, X, Bell, Briefcase, ChevronRight, Layers,
  Search, CheckCircle2, User, Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';
import { AskPeoplePayAI } from '../components/AI/AskPeoplePayAI';

export function DashboardLayout() {
  const { user, logout, switchRole, hasRole, isEmployeeOnly } = useAuth();
  const { notifications, unreadCount, markAllRead } = useNotify();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  const personas = [
    { role: 'Admin', name: 'Arjun Mehta', email: 'admin@peoplepay360.com', badge: 'Full Admin' },
    { role: 'HR Payroll Admin', name: 'Vikram Malhotra', email: 'payroll.admin@peoplepay360.com', badge: 'Payroll Lead' },
    { role: 'HR Payroll User', name: 'Ananya Sen', email: 'payroll.user@peoplepay360.com', badge: 'Payroll Ops' },
    { role: 'HR Manager', name: 'Priya Patel', email: 'hr.manager@peoplepay360.com', badge: 'People Ops' },
    { role: 'Employee', name: 'Rahul Sharma', email: 'rahul.sharma@peoplepay360.com', badge: 'Self-Service' }
  ];

  const handlePersonaSwitch = async (roleName) => {
    try {
      await switchRole(roleName);
      setPersonaMenuOpen(false);
      if (roleName === 'Employee') {
        navigate('/self-service');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const navGroups = [
    {
      title: 'OVERVIEW',
      items: [
        { to: '/self-service', label: 'My Portal', icon: UserCheck, visible: true },
        { to: '/dashboard', label: 'Payroll Dashboard', icon: LayoutDashboard, visible: !isEmployeeOnly }
      ]
    },
    {
      title: 'PEOPLE',
      items: [
        { to: '/employees', label: 'Employees', icon: Users, visible: hasRole('HR Manager', 'HR Payroll Admin', 'HR Payroll User') },
        { to: '/contracts', label: 'Contracts', icon: FileSpreadsheet, visible: hasRole('HR Manager', 'HR Payroll Admin', 'HR Payroll User') }
      ]
    },
    {
      title: 'TIME',
      items: [
        { to: '/attendance', label: 'Attendance', icon: Clock, visible: true },
        { to: '/time-off', label: 'Time Off & Leaves', icon: CalendarOff, visible: true },
        { to: '/schedules', label: 'Working Schedules', icon: Layers, visible: hasRole('HR Manager', 'HR Payroll Admin') }
      ]
    },
    {
      title: 'PAYROLL',
      items: [
        { to: '/payruns', label: 'Payruns (Process)', icon: DollarSign, visible: hasRole('HR Payroll Admin', 'HR Payroll User') },
        { to: '/payslips', label: 'Payslips (Ledger)', icon: Briefcase, visible: true },
        { to: '/salary-config', label: 'Salary Structures & Rules', icon: Sliders, visible: hasRole('HR Payroll Admin', 'HR Payroll User') }
      ]
    },
    {
      title: 'ADMIN',
      items: [
        { to: '/admin/users', label: 'User Administration', icon: ShieldCheck, visible: hasRole('Admin') }
      ]
    }
  ];

  // Get current breadcrumb label
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentBreadcrumb = pathParts.length > 0
    ? pathParts[pathParts.length - 1].replace(/-/g, ' ')
    : 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64 sm:w-72' : 'w-20'
        } bg-slate-900/95 border-r border-white/10 flex flex-col transition-all duration-300 z-30 shrink-0 select-none backdrop-blur-xl`}
      >
        {/* Logo */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-sky-500/25 shrink-0">
              360
            </div>
            {sidebarOpen && (
              <div className="truncate">
                <span className="font-extrabold text-lg tracking-tight text-white block">
                  PEOPLEPAY<span className="text-sky-400">360</span>
                </span>
                <span className="text-[11px] text-slate-400 uppercase tracking-widest block font-bold">
                  HR & Payroll SaaS
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
            title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter((i) => i.visible);
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-2">
                {sidebarOpen && (
                  <p className="px-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                    {group.title}
                  </p>
                )}
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      location.pathname === item.to ||
                      (item.to !== '/dashboard' && item.to !== '/' && location.pathname.startsWith(item.to));

                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={`flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium text-sm transition-all min-h-[44px] ${
                          isActive
                            ? 'bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-lg shadow-sky-600/30 font-semibold'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                        }`}
                        title={!sidebarOpen ? item.label : undefined}
                      >
                        <Icon size={20} className="shrink-0" />
                        {sidebarOpen && <span className="truncate">{item.label}</span>}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* AI Quick Button */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => setAiDrawerOpen(true)}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600/30 via-sky-600/30 to-purple-600/30 hover:from-indigo-600/50 hover:to-sky-600/50 border border-sky-500/40 text-sky-300 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-sky-500/15"
          >
            <Sparkles size={18} className="text-sky-400 animate-pulse shrink-0" />
            {sidebarOpen && <span>Ask PeoplePay AI</span>}
          </button>
        </div>

        {/* User Account Card */}
        <div className="p-4 border-t border-white/10 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-sky-950 border border-sky-500/40 text-sky-400 flex items-center justify-center font-bold text-sm shrink-0 shadow-md">
                {user?.first_name?.[0] || 'U'}
              </div>
              {sidebarOpen && (
                <div className="truncate">
                  <p className="text-sm font-bold text-slate-100 truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-sky-400 font-semibold truncate">{user?.role}</p>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <button
                onClick={logout}
                className="text-slate-400 hover:text-rose-400 p-2 rounded-xl hover:bg-white/10 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-20 px-8 bg-slate-900/70 border-b border-white/10 backdrop-blur-md flex items-center justify-between z-20 shrink-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span className="font-bold text-slate-200">PeoplePay360</span>
            <ChevronRight size={16} className="text-slate-600" />
            <span className="text-sky-400 font-bold capitalize text-base">
              {currentBreadcrumb}
            </span>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-all"
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-sky-500 text-white text-[11px] font-black flex items-center justify-center shadow-lg shadow-sky-500/50">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifMenuOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-white/15 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <h4 className="font-bold text-sm text-slate-100">Notifications</h4>
                    <button
                      onClick={markAllRead}
                      className="text-xs text-sky-400 hover:text-sky-300 font-semibold"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="space-y-3 mt-3 max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No unread notifications.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 rounded-xl border text-xs transition-all ${
                            n.is_read
                              ? 'bg-slate-950/40 border-white/5 text-slate-400'
                              : 'bg-sky-500/10 border-sky-500/30 text-slate-200 font-medium'
                          }`}
                        >
                          <div className="font-bold text-slate-100 mb-1">{n.title}</div>
                          <div>{n.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Demo Persona Switcher */}
            <div className="relative">
              <button
                onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-slate-200 transition-all shadow-sm"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-slate-400">Demo Role:</span>
                <span className="text-sky-400 font-bold">{user?.role}</span>
                <ChevronDown size={16} className="text-slate-400 shrink-0" />
              </button>

              {personaMenuOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-slate-900 border border-white/15 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <p className="text-[11px] font-extrabold text-slate-400 px-3 py-1.5 uppercase tracking-wider">
                    Switch Demo Role
                  </p>
                  <div className="space-y-1.5 mt-2">
                    {personas.map((p) => (
                      <button
                        key={p.role}
                        onClick={() => handlePersonaSwitch(p.role)}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                          user?.role === p.role
                            ? 'bg-sky-600 text-white font-bold shadow-md shadow-sky-600/30'
                            : 'hover:bg-white/10 text-slate-300 font-medium'
                        }`}
                      >
                        <div>
                          <div className="font-bold">{p.name}</div>
                          <div className="text-[11px] opacity-75 font-medium">{p.email}</div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-black/40 text-white font-bold shrink-0">
                          {p.role}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ask AI Button */}
            <button
              onClick={() => setAiDrawerOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-sky-600/25 transition-all"
            >
              <Sparkles size={16} />
              <span>Ask AI</span>
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 relative">
          <Outlet />
        </main>
      </div>

      {/* AI Assistant Drawer */}
      <AskPeoplePayAI isOpen={aiDrawerOpen} onClose={() => setAiDrawerOpen(false)} />
    </div>
  );
}
