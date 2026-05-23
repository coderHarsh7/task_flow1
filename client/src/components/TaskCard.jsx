import { CalendarDays, AlertCircle } from 'lucide-react';

const priorityConfig = {
  high: { label: 'High', cls: 'bg-rose-50 text-rose-600 border-rose-200' },
  medium: { label: 'Med', cls: 'bg-amber-50 text-amber-600 border-amber-200' },
  low: { label: 'Low', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
};

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function isOverdue(dueDate, status) {
  if (!dueDate || status === 'done') return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TaskCard({ task, onClick }) {
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const overdue = isOverdue(task.due_date, task.status);

  return (
    <div
      onClick={() => onClick(task)}
      className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">{task.title}</h4>
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${priority.cls}`}>
          {priority.label}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-gray-500 line-clamp-1 mb-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5">
          {task.due_date && (
            <span
              className={`flex items-center gap-1 text-[11px] ${
                overdue ? 'text-rose-500 font-medium' : 'text-gray-400'
              }`}
            >
              {overdue ? <AlertCircle size={11} /> : <CalendarDays size={11} />}
              {formatDate(task.due_date)}
            </span>
          )}
        </div>

        {task.assignee_name && (
          <div
            title={task.assignee_name}
            className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-semibold flex items-center justify-center shrink-0"
          >
            {initials(task.assignee_name)}
          </div>
        )}
      </div>
    </div>
  );
}
