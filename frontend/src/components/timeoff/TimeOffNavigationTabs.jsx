import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { CalendarOff, Layers, Sparkles } from 'lucide-react';

export default function TimeOffNavigationTabs() {
  const location = useLocation();

  const isRequests =
    location.pathname === '/time-off' ||
    location.pathname.startsWith('/time-off/requests');

  const isTypes = location.pathname.startsWith('/time-off/types');

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-900/70 border border-white/10 rounded-xl backdrop-blur-md w-fit">
      <NavLink
        to="/time-off/requests"
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          isRequests
            ? 'bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-md shadow-sky-600/25'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
        }`}
      >
        <CalendarOff size={14} />
        <span>Time Off Requests</span>
      </NavLink>

      <NavLink
        to="/time-off/types"
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          isTypes
            ? 'bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-md shadow-sky-600/25'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
        }`}
      >
        <Layers size={14} />
        <span>Time Off Types</span>
      </NavLink>
    </div>
  );
}
