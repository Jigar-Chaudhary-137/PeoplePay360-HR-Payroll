import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Shield, Zap, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showToast } = useNotify();
  const navigate = useNavigate();

  const handleLogin = async (e, customEmail = null, customPass = null) => {
    if (e) e.preventDefault();
    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    if (!loginEmail || !loginPass) {
      showToast('Please enter both work email and password', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await login(loginEmail, loginPass);
      showToast(`Welcome back, ${res.user.first_name}!`, 'success');
      if (res.user.role === 'Employee') {
        navigate('/self-service');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const quickDemoAccounts = [
    { role: 'Admin', name: 'Arjun Mehta', email: 'admin@peoplepay360.com', desc: 'Full system & user access' },
    { role: 'HR Payroll Admin', name: 'Vikram Malhotra', email: 'payroll.admin@peoplepay360.com', desc: 'Payruns, rules, validate, mark paid' },
    { role: 'HR Payroll User', name: 'Ananya Sen', email: 'payroll.user@peoplepay360.com', desc: 'Process payruns & payslips' },
    { role: 'HR Manager', name: 'Priya Patel', email: 'hr.manager@peoplepay360.com', desc: 'Employees, leaves & attendance' },
    { role: 'Employee', name: 'Rahul Sharma', email: 'rahul.sharma@peoplepay360.com', desc: 'Self-service portal & my payslip' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Background glow accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center z-10">
        {/* Left Side: Brand Overview */}
        <div className="space-y-6 hidden md:block">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-sky-500/20">
              360
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">PEOPLEPAY<span className="text-sky-400">360</span></h1>
              <p className="text-xs text-sky-400 font-semibold tracking-widest uppercase">Operations Platform</p>
            </div>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-100 leading-tight">
            Intelligent End-to-End <br />
            <span className="text-gradient">HR & Payroll Lifecycle</span>
          </h2>

          <p className="text-sm text-slate-400 leading-relaxed">
            Manage employees, historical contracts, dynamic salary rule computations, anomaly detection, branded PDF generation, and automated payroll workflows in one unified system.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">✓</div>
              <span>Real database-driven rule sequence calculation engine</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">✓</div>
              <span>Period-aware historical contract matching & prorated leaves</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">✓</div>
              <span>Ask PeoplePay AI with live verified database analytics</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login & Persona Quick Selector */}
        <div className="glass-card p-8 shadow-2xl border-white/10">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-100">Sign in to PeoplePay360</h3>
            <p className="text-xs text-slate-400 mt-1">Enter your work credentials or choose a demo persona below</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="form-label">Work Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@peoplepay360.com"
                  className="form-input pl-10"
                  required
                />
                <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input pl-10"
                  required
                />
                <Lock size={16} className="absolute left-3 top-3 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Quick Demo Persona Selector for Hackathon */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap size={14} /> 1-Click Persona Login
              </span>
              <span className="text-[10px] text-slate-400">Default pwd: Password@123</span>
            </div>

            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {quickDemoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword('Password@123');
                    handleLogin(null, acc.email, 'Password@123');
                  }}
                  className="text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-sky-500/10 hover:border-sky-500/30 border border-white/5 flex items-center justify-between transition-all group"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-sky-300">
                      {acc.name} <span className="text-[10px] text-slate-400 font-normal">({acc.email})</span>
                    </div>
                    <div className="text-[10px] text-slate-400">{acc.desc}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/30 font-bold shrink-0">
                    {acc.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
