import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileSpreadsheet, Clock, CalendarOff,
  DollarSign, Sliders, ShieldCheck, UserCheck, LogOut, Sparkles,
  ChevronDown, Menu, X, Bell, Briefcase, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';
import { AskPeoplePayAI } from '../components/AI/AskPeoplePayAI';
import { ErrorBoundary } from '../components/common/CommonUI';

export function DashboardLayout() {
  const { user, logout, switchRole, hasRole, isEmployeeOnly } = useAuth();
  const { notifications, unreadCount } = useNotify();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);

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

  const navGroups = [
    {
      title: 'MAIN',
      items: [
        { to: '/self-service', label: 'My Portal', icon: UserCheck, visible: true },
        { to: '/dashboard', label: 'Payroll Dashboard', icon: LayoutDashboard, visible: !isEmployeeOnly }
      ]
    },
    {
      title: 'PEOPLE',
      items: [
        { to: '/employees', label: 'Employees', icon: Users, visible: hasRole('HR Manager', 'HR Payroll Admin', 'HR Payroll User') },
        { to: '/contracts', label: 'Contracts', icon: FileSpreadsheet, visible: hasRole('HR Manager', 'HR Payroll Admin', 'HR Payroll User') },
        { to: '/schedules', label: 'Working Schedules', icon: Clock, visible: hasRole('HR Manager', 'HR Payroll Admin') },
        { to: '/attendance', label: 'Attendance', icon: Clock, visible: true }
      ]
    },
    {
      title: 'PAYROLL',
      items: [
        { to: '/time-off', label: 'Time Off & Leaves', icon: CalendarOff, visible: true },
        { to: '/payruns', label: 'Payrolls (Process)', icon: DollarSign, visible: hasRole('HR Payroll Admin', 'HR Payroll User') },
        { to: '/payslips', label: 'Payslips (Ledger)', icon: Briefcase, visible: true },
        { to: '/salary-config', label: 'Salary Structures & Rules', icon: Sliders, visible: hasRole('HR Payroll Admin', 'HR Payroll User') }
      ]
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { to: '/admin/users', label: 'User Administration', icon: ShieldCheck, visible: hasRole('Admin') }
      ]
    }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F7FC] text-[#171717] font-sans">
      {/* Sidebar - Desktop 270px */}
      <aside
        className={`${
          sidebarOpen ? 'w-[270px]' : 'w-20'
        } bg-white border-r border-[#E5E7EB] flex flex-col transition-all duration-300 z-30 shrink-0 select-none shadow-sm`}
      >
        {/* Logo / Brand Area (Padding 20px 18px) */}
        <div className="h-20 px-[18px] flex items-center justify-between border-b border-[#E5E7EB] bg-white">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6D28D9] to-[#5B21B6] flex items-center justify-center text-white font-black text-xl shadow-md shadow-[#6D28D9]/20 shrink-0">
              360
            </div>
            {sidebarOpen && (
              <div className="truncate">
                <span className="font-extrabold text-[18px] tracking-tight text-[#171717] block font-heading leading-snug">
                  PeoplePay<span className="text-[#6D28D9]">360</span>
                </span>
                <span className="text-[11px] text-[#6B7280] uppercase tracking-[0.06em] block font-bold">
                  HR & Payroll Platform
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-[#6B7280] hover:text-[#171717] p-1.5 rounded-lg hover:bg-[#FAF7FF] transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Nav Links Grouped */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-4">
          {navGroups.map((group, idx) => {
            const visibleItems = group.items.filter(i => i.visible);
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title || idx} className="space-y-1">
                {sidebarOpen && (
                  <div className="px-3.5 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-[0.08em] mt-4 mb-2 font-heading">
                    {group.title}
                  </div>
                )}
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to || (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-3.5 px-3.5 py-[10px] min-h-[44px] mb-[5px] rounded-xl text-[15px] transition-all ${
                        isActive
                          ? 'bg-[#F3E8FF] text-[#6D28D9] font-semibold border-l-4 border-[#6D28D9] shadow-sm'
                          : 'text-[#6B7280] hover:text-[#171717] hover:bg-[#FAF7FF] font-medium'
                      }`}
                      title={!sidebarOpen ? item.label : undefined}
                    >
                      <Icon size={22} className={`shrink-0 ${isActive ? 'text-[#6D28D9]' : 'text-[#9CA3AF]'}`} />
                      {sidebarOpen && (
                        <span
                          className="truncate"
                          style={{
                            fontFamily: '"Times New Roman", Times, serif',
                            fontSize: '15px',
                            lineHeight: '1.5',
                            fontWeight: isActive ? 600 : 500
                          }}
                        >
                          {item.label}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* AI Quick Button in Sidebar */}
        <div className="p-3.5 border-t border-[#E5E7EB]">
          <button
            onClick={() => setAiDrawerOpen(true)}
            className="w-full h-[42px] flex items-center justify-center gap-2.5 px-3.5 rounded-xl bg-[#FAF7FF] hover:bg-[#F3E8FF] border border-[#E5E7EB] text-[#6D28D9] font-semibold text-[14px] transition-all shadow-sm"
          >
            <Sparkles size={18} className="text-[#6D28D9] animate-pulse" />
            {sidebarOpen && <span>Ask PeoplePay AI</span>}
          </button>
        </div>

        {/* User Card (Profile Section) */}
        <div className="p-[14px] border-t border-[#E5E7EB] bg-[#FAF7FF]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-[#F3E8FF] border border-[#E5E7EB] text-[#6D28D9] flex items-center justify-center text-sm font-bold shrink-0">
                {user?.first_name?.[0] || 'U'}
              </div>
              {sidebarOpen && (
                <div className="truncate">
                  <p className="text-[14px] font-semibold text-[#171717] truncate leading-tight">{user?.first_name} {user?.last_name}</p>
                  <p className="text-[12px] text-[#6D28D9] font-medium truncate mt-0.5">{user?.role}</p>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <button
                onClick={logout}
                className="text-[#9CA3AF] hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
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
        <header className="h-16 px-8 bg-white border-b border-[#E5E7EB] flex items-center justify-between z-20 shrink-0 shadow-sm">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2.5 text-sm">
            <span className="text-[13px] text-[#6B7280] font-medium">PeoplePay360</span>
            <ChevronRight size={14} className="text-[#9CA3AF]" />
            <span className="text-[15px] font-semibold text-[#6D28D9] capitalize">
              {location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
            </span>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Quick Demo Persona Switcher */}
            <div className="relative">
              <button
                onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#F8F7FC] hover:bg-[#F3E8FF] border border-[#E5E7EB] text-xs font-medium text-[#171717] transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[#6B7280]">Demo Role:</span>
                <span className="text-[#6D28D9] font-bold">{user?.role}</span>
                <ChevronDown size={14} className="text-[#6B7280]" />
              </button>

              {personaMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E5E7EB] rounded-xl shadow-xl p-2 z-50">
                  <p className="text-[11px] font-bold text-[#9CA3AF] px-2 py-1 uppercase tracking-wider font-heading">Switch Role / Persona</p>
                  <div className="space-y-1 mt-1">
                    {personas.map((p) => (
                      <button
                        key={p.role}
                        onClick={() => handlePersonaSwitch(p.role)}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          user?.role === p.role ? 'bg-[#6D28D9] text-white font-bold' : 'hover:bg-[#FAF7FF] text-[#171717]'
                        }`}
                      >
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-[10px] opacity-75">{p.email}</div>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${user?.role === p.role ? 'bg-white/20 text-white' : 'bg-[#F3E8FF] text-[#6D28D9]'}`}>
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Sparkles size={14} />
              <span>Ask AI</span>
            </button>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 overflow-y-auto p-8 relative bg-[#F8F7FC]">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* AI Assistant Drawer */}
      <AskPeoplePayAI isOpen={aiDrawerOpen} onClose={() => setAiDrawerOpen(false)} />
    </div>
  );
}
