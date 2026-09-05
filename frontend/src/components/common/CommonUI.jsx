import React from 'react';
import { X, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

export function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-2xl' }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content ${maxWidth} p-6 sm:p-7 relative`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-4 mb-5 border-b border-slate-200">
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight font-heading">{title}</h3>
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            title="Close"
          >
            <X size={19} />
          </button>
        </div>
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}

export function Badge({ status, text, size = 'md' }) {
  const norm = (status || text || '').toLowerCase().replace(/\s+/g, '-');
  return (
    <span className={`badge badge-${norm}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0" />
      <span>{text || status}</span>
    </span>
  );
}

export function LoadingSpinner({ text = 'Loading data...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 sm:p-16 text-slate-500 space-y-3">
      <div className="relative">
        <div className="w-9 h-9 border-3 border-blue-100 rounded-full" />
        <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin absolute inset-0" />
      </div>
      <p className="text-sm font-medium text-slate-600 tracking-normal">{text}</p>
    </div>
  );
}

export function ErrorState({ title = 'Failed to load data', message, onRetry }) {
  return (
    <div className="card p-8 text-center flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
        <AlertCircle size={24} />
      </div>
      <div>
        <h4 className="text-lg font-bold text-slate-900 font-heading">{title}</h4>
        {message && <p className="text-sm text-slate-500 max-w-md mt-1">{message}</p>}
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-xs">
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, actionText, onAction }) {
  return (
    <div className="card p-10 sm:p-12 text-center flex flex-col items-center justify-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-100 shadow-xs">
          <Icon size={26} />
        </div>
      )}
      <h4 className="text-lg font-bold text-slate-900 tracking-tight font-heading">{title}</h4>
      {description && <p className="text-sm text-slate-500 max-w-md mt-1 mb-5 leading-relaxed">{description}</p>}
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
    sky: {
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      accent: 'bg-blue-600'
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      accent: 'bg-emerald-600'
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      accent: 'bg-amber-600'
    },
    purple: {
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      accent: 'bg-indigo-600'
    },
    rose: {
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
      accent: 'bg-rose-600'
    }
  };

  const scheme = colorMap[color] || colorMap.sky;

  return (
    <div className="card card-interactive p-5 relative overflow-hidden flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-500 truncate">{title}</p>
            <h3 className="text-2xl xl:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight truncate font-heading">{value}</h3>
          </div>
          {Icon && (
            <div className={`w-11 h-11 rounded-xl ${scheme.iconBg} border flex items-center justify-center shrink-0 transition-transform duration-200`}>
              <Icon size={20} />
            </div>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1.5 font-medium truncate">{subtitle}</p>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center text-xs">
          <span className={`font-semibold flex items-center gap-0.5 ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            {trend.value}
          </span>
          <span className="ml-1.5 text-slate-500">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
