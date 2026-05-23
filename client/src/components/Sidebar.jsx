import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, LogOut, CheckSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-indigo-600 text-white'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`
      }
    >
      <Icon size={18} strokeWidth={1.75} />
      {label}
    </NavLink>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="w-56 bg-slate-900 flex flex-col h-screen fixed left-0 top-0">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <CheckSquare size={16} className="text-white" strokeWidth={2} />
          </div>
          <span className="text-white font-semibold text-[15px]">TaskFlow</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5">
        <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
        <NavItem to="/projects" icon={FolderKanban} label="Projects" />
      </nav>

      <div className="px-3 pb-4 border-t border-slate-800 pt-3">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {initials}
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-sm font-medium truncate leading-tight">{user?.name}</p>
            <p className="text-slate-500 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-sm transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
