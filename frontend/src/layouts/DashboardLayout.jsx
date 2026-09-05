import React, { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Clock, CalendarOff,
  DollarSign, Sliders, ShieldCheck, UserCheck, LogOut, Sparkles,
  ChevronDown, Menu, X, Bell, Briefcase, ChevronRight, CheckCheck,
  TrendingUp, CalendarDays, Receipt
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';
import { AskPeoplePayAI } from '../components/AI/AskPeoplePayAI';

export function DashboardLayout() {
  const { user, logout, switchRole, hasRole, isEmployeeOnly } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotify();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  const personaMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (personaMenuRef.current && !personaMenuRef.current.contains(e.target)) {
        setPersonaMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setNotifMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const personas = [
    { role: 'Admin', name: 'Vikram Verma', email: 'admin@peoplepay360.com', badge: 'Superadmin' },
    { role: 'HR Manager', name: 'Priya Patel', email: 'priya.patel@peoplepay360.com', badge: 'People Ops' },
    { role: 'HR Payroll Admin', name: 'Amit Singh', email: 'amit.singh@peoplepay360.com', badge: 'Payroll Lead' },
    { role: 'HR Payroll User', name: 'Neha Gupta', email: 'neha.gupta@peoplepay360.com', badge: 'Payroll Ops' },
    { role: 'Employee', name: 'Rahul Sharma', email: 'rahul.sharma@peoplepay360.com', badge: 'Self-Service' }
  ];

  const handlePersonaSwitch = async (roleName) => {
    try {
      await switchRole(roleName);
      setPersonaMenuOpen(false);
      setMobileMenuOpen(false);
      if (roleName === 'Employee') {
        navigate('/self-service');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Failed to switch persona:', err);
    }
  };

  const navGroups = [
    {
      title: 'Overview',
      items: [
        {
          to: '/dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          visible: !isEmployeeOnly
        },
        {
          to: '/self-service',
          label: 'My Portal',
          icon: UserCheck,
          visible: true
        }
      ]
    },
    {
      title: 'People',
      items: [
        {
          to: '/employees',
          label: 'Employees',
          icon: Users,
          visible: hasRole('HR Manager', 'HR Payroll Admin', 'HR Payroll User')
        },
        {
          to: '/contracts',
          label: 'Contracts',
          icon: FileText,
          visible: hasRole('HR Manager', 'HR Payroll Admin', 'HR Payroll User')
        },
        {
          to: '/schedules',
          label: 'Schedules',
          icon: CalendarDays,
          visible: hasRole('HR Manager', 'HR Payroll Admin')
        }
      ]
    },
    {
      title: 'Time & Attendance',
      items: [
        {
          to: '/attendance',
          label: 'Attendance',
          icon: Clock,
          visible: true
        },
        {
          to: '/time-off/requests',
          label: 'Time Off Requests',
          icon: CalendarOff,
          visible: true
        },
        {
          to: '/time-off/types',
          label: 'Leave Policies',
          icon: Sliders,
          visible: hasRole('HR Manager', 'HR Payroll Admin')
        }
      ]
    },
    {
      title: 'Payroll',
      items: [
        {
          to: '/payruns',
          label: 'Payruns',
          icon: DollarSign,
          visible: hasRole('HR Payroll Admin', 'HR Payroll User')
        },
        {
          to: '/payslips',
          label: 'Payslips',
          icon: Receipt,
          visible: true
        },
        {
          to: '/salary-config',
          label: 'Salary Structures',
          icon: Sliders,
          visible: hasRole('HR Payroll Admin')
        }
      ]
    },
    {
      title: 'Administration',
      items: [
        {
          to: '/admin/users',
          label: 'User Accounts',
          icon: ShieldCheck,
          visible: hasRole('Admin')
        }
      ]
    }
  ];

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/self-service')) return 'Employee Self-Service Portal';
    if (path.includes('/dashboard')) return 'HR & Payroll Dashboard';
    if (path.includes('/employees')) return 'Employee Directory';
    if (path.includes('/contracts')) return 'Contracts Management';
    if (path.includes('/schedules')) return 'Working Schedules';
    if (path.includes('/attendance')) return 'Time & Attendance Tracking';
    if (path.includes('/time-off/types')) return 'Time Off Policy Configuration';
    if (path.includes('/time-off')) return 'Time Off Requests';
    if (path.includes('/payruns')) return 'Payrun Batches & Payroll Execution';
    if (path.includes('/payslips')) return 'Payslips Ledger';
    if (path.includes('/salary-config')) return 'Salary Structure & Rule Engine';
    if (path.includes('/admin/users')) return 'User Accounts & Access Control';
    return 'PeoplePay360 Operations';
  };

  const renderNavLinks = (onItemClick) => (
    <div className="space-y-6">
      {navGroups.map((group, gIdx) => {
        const visibleItems = group.items.filter((item) => item.visible);
        if (visibleItems.length === 0) return null;

        return (
          <div key={gIdx} className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2 font-heading">
              {group.title}
            </p>
            {visibleItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onItemClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }
                >
                  <Icon size={17} className="shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Desktop Fixed Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col shrink-0 z-30 shadow-2xs">
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-xs">
              360
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 font-heading">
                PEOPLEPAY<span className="text-blue-600">360</span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                Enterprise Suite
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
          {renderNavLinks()}
        </nav>

        {/* Bottom User Card & Logout */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs flex items-center justify-center shrink-0">
                {user?.first_name?.charAt(0) || user?.role?.charAt(0) || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.work_email || 'Logged User'}
                </p>
                <span className="text-[10px] text-blue-700 font-semibold block truncate">
                  {user?.role || 'Staff'}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-72 max-w-[85vw] h-full bg-white border-r border-slate-200 flex flex-col shadow-2xl p-4 z-50 animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-xs">
                  360
                </div>
                <span className="font-bold text-slate-900 font-heading">PEOPLEPAY360</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto pr-1">
              {renderNavLinks(() => setMobileMenuOpen(false))}
            </nav>

            <div className="pt-4 border-t border-slate-200 mt-4">
              <button
                onClick={logout}
                className="w-full btn-secondary text-xs flex items-center justify-center gap-2 text-rose-600 hover:bg-rose-50 hover:border-rose-200"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 px-4 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              title="Open Navigation"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb Path */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 truncate">
              <span className="font-semibold text-slate-800 hidden sm:inline font-heading">PeoplePay360</span>
              <ChevronRight size={14} className="text-slate-400 shrink-0 hidden sm:inline" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate font-heading">{getPageTitle()}</h2>
            </div>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Ask AI Trigger Button */}
            <button
              onClick={() => setAiDrawerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition-colors shadow-2xs"
            >
              <Sparkles size={14} className="text-blue-600" />
              <span>Ask PeoplePay AI</span>
            </button>

            {/* Notifications Menu */}
            <div className="relative" ref={notifMenuRef}>
              <button
                onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors border border-slate-200"
                title="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white border border-slate-200 rounded-xl shadow-lg p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 font-heading">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-100">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-semibold transition-colors"
                      >
                        <CheckCheck size={13} />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs font-medium">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => !n.is_read && markRead(n.id)}
                          className={`p-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                            n.is_read
                              ? 'bg-white border-slate-100 text-slate-500'
                              : 'bg-blue-50/50 border-blue-100 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold mb-0.5">
                            <span className="truncate text-slate-900">{n.title}</span>
                            {!n.is_read && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.created_at).toLocaleDateString()} • {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Demo Persona Switcher */}
            <div className="relative" ref={personaMenuRef}>
              <button
                onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-400 hidden sm:inline">Role:</span>
                <span className="text-blue-700 font-bold">{user?.role || 'Guest'}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {personaMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-heading">
                      Switch Demo Persona
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Test role-based access & permissions</p>
                  </div>
                  <div className="space-y-0.5">
                    {personas.map((p) => {
                      const isCurrent = user?.role === p.role;
                      return (
                        <button
                          key={p.role}
                          onClick={() => handlePersonaSwitch(p.role)}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            isCurrent
                              ? 'bg-blue-50 text-blue-700 font-bold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="font-semibold text-slate-900">{p.name}</div>
                            <div className="text-[11px] text-slate-400">{p.email}</div>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                              isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {p.role}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-7 lg:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* AI Assistant Drawer */}
      <AskPeoplePayAI
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
      />
    </div>
  );
}
