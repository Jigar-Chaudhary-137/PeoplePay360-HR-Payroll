import React, { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileSpreadsheet, Clock, CalendarOff,
  DollarSign, Sliders, ShieldCheck, UserCheck, LogOut, Sparkles,
  ChevronDown, Menu, X, Bell, Briefcase, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';
import { AskPeoplePayAI } from '../components/AI/AskPeoplePayAI';

export function DashboardLayout() {
  const { user, logout, switchRole, hasRole, isEmployeeOnly } = useAuth();
  const { notifications, unreadCount } = useNotify();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [timeOffDropdownOpen, setTimeOffDropdownOpen] = useState(true);

  const personas = [
    { role: 'Admin', name: 'Vikram Verma', email: 'admin@peoplepay360.com', badge: 'Full Admin' },
    { role: 'HR Payroll Admin', name: 'Amit Singh', email: 'amit.singh@peoplepay360.com', badge: 'Payroll Lead' },
    { role: 'HR Payroll User', name: 'Neha Gupta', email: 'neha.gupta@peoplepay360.com', badge: 'Payroll Ops' },
    { role: 'HR Manager', name: 'Priya Patel', email: 'priya.patel@peoplepay360.com', badge: 'People Ops' },
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

  const navItems = [
    // Self-Service for Employee
    {
      to: '/self-service',
      label: 'My Portal',
      icon: UserCheck,
      visible: true
    },
    // Main Dashboard
    {
      to: '/dashboard',
      label: 'Payroll Dashboard',
      icon: LayoutDashboard,
      visible: !isEmployeeOnly
    },
    // HR Core
    {
      to: '/employees',
      label: 'Employees',
      icon: Users,
      visible: hasRole('HR Manager', 'HR Payroll Admin', 'HR Payroll User')
    },
    {
      to: '/contracts',
      label: 'Contracts',
      icon: FileSpreadsheet,
      visible: hasRole('HR Manager', 'HR Payroll Admin', 'HR Payroll User')
    },
    {
      to: '/schedules',
      label: 'Working Schedules',
      icon: Clock,
      visible: hasRole('HR Manager', 'HR Payroll Admin')
    },
    {
      to: '/attendance',
      label: 'Attendance',
      icon: Clock,
      visible: true
    },
    {
      to: '/time-off',
      label: 'Time Off & Leaves',
      icon: CalendarOff,
      visible: true,
      subItems: [
        { to: '/time-off/requests', label: 'Time Off Requests' },
        { to: '/time-off/types', label: 'Time Off Types' }
      ]
    },
    // Payroll Ops
    {
      to: '/payruns',
      label: 'Payruns (Process)',
      icon: DollarSign,
      visible: hasRole('HR Payroll Admin', 'HR Payroll User')
    },
    {
      to: '/payslips',
      label: 'Payslips (Ledger)',
      icon: Briefcase,
      visible: true
    },
    // Salary Config
    {
      to: '/salary-config',
      label: 'Salary Structures & Rules',
      icon: Sliders,
      visible: hasRole('HR Payroll Admin', 'HR Payroll User')
    },
    // Admin
    {
      to: '/admin/users',
      label: 'User Administration',
      icon: ShieldCheck,
      visible: hasRole('Admin')
    }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-slate-900/90 border-r border-white/10 flex flex-col transition-all duration-300 z-30 shrink-0 select-none backdrop-blur-xl`}
      >
        {/* Logo */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-sky-500/20 shrink-0">
              360
            </div>
            {sidebarOpen && (
              <div className="truncate">
                <span className="font-extrabold text-base tracking-tight text-white block">PEOPLEPAY<span className="text-sky-400">360</span></span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">HR & Payroll Platform</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems
            .filter((item) => item.visible)
            .map((item) => {
              const Icon = item.icon;
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isPathActive = location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to));

              if (hasSubItems) {
                return (
                  <div key={item.to} className="space-y-1">
                    <div
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isPathActive
                          ? 'bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-md shadow-sky-600/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      <NavLink
                        to={item.to}
                        className="flex items-center gap-3 flex-1 min-w-0"
                        title={!sidebarOpen ? item.label : undefined}
                      >
                        <Icon size={19} className="shrink-0" />
                        {sidebarOpen && <span className="truncate">{item.label}</span>}
                      </NavLink>
                      {sidebarOpen && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setTimeOffDropdownOpen(!timeOffDropdownOpen);
                          }}
                          className="p-1 rounded-lg hover:bg-black/20 text-white/80 hover:text-white transition-colors ml-1"
                          title="Toggle Time Off menu"
                        >
                          <ChevronDown
                            size={14}
                            className={`transition-transform duration-200 ${
                              timeOffDropdownOpen ? 'rotate-0' : '-rotate-90'
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Submenu Dropdown */}
                    {sidebarOpen && timeOffDropdownOpen && (
                      <div className="ml-5 pl-3 border-l border-white/10 space-y-1 py-1">
                        {item.subItems.map((sub) => {
                          const isSubActive =
                            sub.to === '/time-off/requests'
                              ? location.pathname === '/time-off' || location.pathname.startsWith('/time-off/requests')
                              : location.pathname.startsWith(sub.to);
                          return (
                            <NavLink
                              key={sub.to}
                              to={sub.to}
                              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                isSubActive
                                  ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isSubActive ? 'bg-sky-400' : 'bg-slate-500'
                                }`}
                              />
                              <span className="truncate">{sub.label}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isPathActive
                      ? 'bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-md shadow-sky-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <Icon size={19} className="shrink-0" />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
        </nav>

        {/* AI Quick Button in Sidebar */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => setAiDrawerOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600/30 to-sky-600/30 hover:from-indigo-600/40 hover:to-sky-600/40 border border-sky-500/30 text-sky-300 font-semibold text-xs transition-all shadow-lg shadow-sky-500/10"
          >
            <Sparkles size={16} className="text-sky-400 animate-pulse" />
            {sidebarOpen && <span>Ask PeoplePay AI</span>}
          </button>
        </div>

        {/* User Card */}
        <div className="p-3 border-t border-white/10 bg-slate-950/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-sky-950 border border-sky-500/30 text-sky-400 flex items-center justify-center text-xs font-bold shrink-0">
                {user?.first_name?.[0] || 'U'}
              </div>
              {sidebarOpen && (
                <div className="truncate">
                  <p className="text-xs font-bold text-slate-200 truncate">{user?.first_name} {user?.last_name}</p>
                  <p className="text-[10px] text-sky-400 font-medium truncate">{user?.role}</p>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <button
                onClick={logout}
                className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 px-6 bg-slate-900/60 border-b border-white/10 backdrop-blur-md flex items-center justify-between z-20 shrink-0">
          {/* Breadcrumbs or Title */}
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="font-semibold text-slate-200">PeoplePay360</span>
            <ChevronRight size={14} className="text-slate-600" />
            {location.pathname.startsWith('/time-off/types') ? (
              <>
                <Link to="/time-off/requests" className="hover:text-slate-200 transition-colors">
                  Time Off
                </Link>
                <ChevronRight size={14} className="text-slate-600" />
                <span className="text-sky-400 font-medium">Time Off Types</span>
              </>
            ) : location.pathname.startsWith('/time-off') ? (
              <>
                <Link to="/time-off/requests" className="hover:text-slate-200 transition-colors">
                  Time Off
                </Link>
                <ChevronRight size={14} className="text-slate-600" />
                <span className="text-sky-400 font-medium">Requests</span>
              </>
            ) : (
              <span className="text-sky-400 font-medium capitalize">
                {location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
              </span>
            )}
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Quick Demo Persona Switcher */}
            <div className="relative">
              <button
                onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-200 transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-400">Demo Role:</span>
                <span className="text-sky-400 font-bold">{user?.role}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {personaMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-white/15 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <p className="text-[11px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">Switch Persona (Hackathon)</p>
                  <div className="space-y-1 mt-1">
                    {personas.map((p) => (
                      <button
                        key={p.role}
                        onClick={() => handlePersonaSwitch(p.role)}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          user?.role === p.role ? 'bg-sky-600 text-white font-bold' : 'hover:bg-white/5 text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-[10px] opacity-75">{p.email}</div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-white font-semibold">
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-sky-600/20 transition-all"
            >
              <Sparkles size={14} />
              <span>Ask AI</span>
            </button>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          <Outlet />
        </main>
      </div>

      {/* AI Assistant Drawer */}
      <AskPeoplePayAI isOpen={aiDrawerOpen} onClose={() => setAiDrawerOpen(false)} />
    </div>
  );
}
