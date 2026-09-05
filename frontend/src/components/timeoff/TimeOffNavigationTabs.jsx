import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { CalendarOff, Layers } from 'lucide-react';

export default function TimeOffNavigationTabs() {
  const location = useLocation();

  const isRequests =
    location.pathname === '/time-off' ||
    location.pathname.startsWith('/time-off/requests');

  const isTypes = location.pathname.startsWith('/time-off/types');

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl w-fit">
      <NavLink
        to="/time-off/requests"
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          isRequests
            ? 'bg-white text-blue-700 shadow-sm border border-slate-200/70'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
        }`}
      >
        <CalendarOff size={14} />
        <span>Time Off Requests</span>
      </NavLink>

      <NavLink
        to="/time-off/types"
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          isTypes
            ? 'bg-white text-blue-700 shadow-sm border border-slate-200/70'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
        }`}
      >
        <Layers size={14} />
        <span>Time Off Types</span>
      </NavLink>
    </div>
  );
}
