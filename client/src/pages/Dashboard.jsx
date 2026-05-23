import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, AlertTriangle, ListTodo, ArrowRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const statusColors = {
  todo: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-blue-50 text-blue-600',
  done: 'bg-emerald-50 text-emerald-600',
};

const statusLabels = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

const priorityDot = {
  high: 'bg-rose-500',
  medium: 'bg-amber-400',
  low: 'bg-emerald-400',
};

function isOverdue(task) {
  return task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date(new Date().toDateString());
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const firstName = user?.name?.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    api.get('/tasks/mine')
      .then(({ data }) => setTasks(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === 'done').length,
    inProgress: tasks.filter((t) => t.status === 'in_progress').length,
    overdue: tasks.filter(isOverdue).length,
  };

  const pending = tasks.filter((t) => t.status !== 'done');

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-56 flex-1 p-8">
        <div className="max-w-3xl">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              {greeting}, {firstName}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {stats.overdue > 0
                ? `You have ${stats.overdue} overdue task${stats.overdue > 1 ? 's' : ''} that need attention.`
                : "Here's what's on your plate today."}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <StatCard
              label="Total Assigned"
              value={stats.total}
              icon={<ListTodo size={18} className="text-indigo-500" />}
              bg="bg-indigo-50"
            />
            <StatCard
              label="In Progress"
              value={stats.inProgress}
              icon={<Clock size={18} className="text-blue-500" />}
              bg="bg-blue-50"
            />
            <StatCard
              label="Completed"
              value={stats.done}
              icon={<CheckCircle2 size={18} className="text-emerald-500" />}
              bg="bg-emerald-50"
            />
            <StatCard
              label="Overdue"
              value={stats.overdue}
              icon={<AlertTriangle size={18} className="text-rose-500" />}
              bg="bg-rose-50"
              highlight={stats.overdue > 0}
            />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Pending Tasks
            </h2>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : pending.length === 0 ? (
              <div className="text-center py-14 text-gray-400">
                <CheckCircle2 size={36} className="mx-auto mb-3 text-emerald-400" />
                <p className="text-sm font-medium text-gray-500">All caught up!</p>
                <p className="text-xs text-gray-400 mt-1">No pending tasks assigned to you.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pending.map((task) => (
                  <Link
                    to={`/projects/${task.project_id}`}
                    key={task.id}
                    className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:shadow-sm hover:border-gray-300 transition-all group"
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${priorityDot[task.priority]}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isOverdue(task) ? 'text-rose-600' : 'text-gray-800'}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{task.project_name}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {task.due_date && (
                        <span className={`text-xs ${isOverdue(task) ? 'text-rose-500 font-medium' : 'text-gray-400'}`}>
                          {isOverdue(task) ? 'Overdue · ' : ''}{formatDate(task.due_date)}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[task.status]}`}>
                        {statusLabels[task.status]}
                      </span>
                      <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon, bg, highlight }) {
  return (
    <div className={`bg-white border rounded-xl p-4 ${highlight ? 'border-rose-200' : 'border-gray-200'}`}>
      <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
