import { NavLink } from 'react-router-dom';
import { useTaskPolling } from '../../hooks/useTaskPolling';

export default function Sidebar() {
  const { tasks } = useTaskPolling();
  const pendingCount = tasks.length;

  return (
    <nav className="w-48 bg-slate-800 flex flex-col py-4 shrink-0">
      <div className="px-4 pb-4 border-b border-slate-700 mb-2">
        <div className="text-sm font-extrabold text-white">ContractAI</div>
        <div className="text-xs text-slate-500">Powered by UiPath Maestro</div>
      </div>

      <div className="text-xs font-bold uppercase tracking-widest text-slate-500 px-4 pt-3 pb-1">
        Workspace
      </div>
      <NavLink to="/workspaces" className={({ isActive }) =>
        `flex items-center justify-between px-4 py-2 text-xs border-l-2 ${isActive ? 'border-blue-500 text-white bg-blue-900/20' : 'border-transparent text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`
      }>
        <span>📁 My Workspaces</span>
      </NavLink>
      <NavLink to="/reviews" className={({ isActive }) =>
        `flex items-center justify-between px-4 py-2 text-xs border-l-2 ${isActive ? 'border-blue-500 text-white bg-blue-900/20' : 'border-transparent text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`
      }>
        <span>🕑 My Reviews</span>
        {pendingCount > 0 && (
          <span className="text-[10px] bg-amber-500 text-slate-900 rounded-full px-1.5 py-px font-bold">
            {pendingCount}
          </span>
        )}
      </NavLink>

      <div className="text-xs font-bold uppercase tracking-widest text-slate-500 px-4 pt-4 pb-1">
        Admin
      </div>
      <NavLink to="/admin/templates" className={({ isActive }) =>
        `px-4 py-2 text-xs border-l-2 ${isActive ? 'border-blue-500 text-white bg-blue-900/20' : 'border-transparent text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`
      }>
        🗂 Templates
      </NavLink>
      <NavLink to="/admin/guidelines" className={({ isActive }) =>
        `px-4 py-2 text-xs border-l-2 ${isActive ? 'border-blue-500 text-white bg-blue-900/20' : 'border-transparent text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`
      }>
        📚 Guidelines
      </NavLink>
    </nav>
  );
}
