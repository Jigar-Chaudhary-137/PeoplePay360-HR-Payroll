import React from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-2xl' }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content ${maxWidth} p-6 relative`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-4 mb-4 border-b border-white/10">
          <div>
            <h3 className="text-xl font-bold text-slate-100">{title}</h3>
            {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}

export function Badge({ status, text, size = 'sm' }) {
  const norm = (status || text || '').toLowerCase().replace(/\s+/g, '-');
  return (
    <span className={`badge badge-${norm}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {text || status}
    </span>
  );
}

export function LoadingSpinner({ text = 'Loading data...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
      <div className="w-8 h-8 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, actionText, onAction }) {
  return (
    <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4 border border-sky-500/20">
          <Icon size={28} />
        </div>
      )}
      <h4 className="text-lg font-bold text-slate-200">{title}</h4>
      {description && <p className="text-sm text-slate-400 max-w-sm mt-1 mb-5">{description}</p>}
      {actionText && onAction && (
        <button onClick={onAction} className="btn-primary">
          {actionText}
        </button>
      )}
    </div>
  );
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'sky' }) {
  const colorMap = {
    sky: 'from-sky-500/10 to-transparent text-sky-400 border-sky-500/20',
    emerald: 'from-emerald-500/10 to-transparent text-emerald-400 border-emerald-500/20',
    amber: 'from-amber-500/10 to-transparent text-amber-400 border-amber-500/20',
    purple: 'from-purple-500/10 to-transparent text-purple-400 border-purple-500/20',
    rose: 'from-rose-500/10 to-transparent text-rose-400 border-rose-500/20'
  };

  return (
    <div className="glass-card glass-card-interactive p-5 relative overflow-hidden group">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colorMap[color]}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <h3 className="text-2xl font-extrabold text-slate-100 mt-1">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colorMap[color]} border transition-transform group-hover:scale-110`}>
            <Icon size={22} />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center text-xs text-slate-400">
          <span className={trend.isPositive ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
            {trend.value}
          </span>
          <span className="ml-1.5">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
