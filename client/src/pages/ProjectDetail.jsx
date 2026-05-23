import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus, ChevronLeft, UserPlus, Crown, UserRound, Trash2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import InviteMemberModal from '../components/InviteMemberModal';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const columns = [
  { key: 'todo', label: 'To Do', dot: 'bg-gray-400' },
  { key: 'in_progress', label: 'In Progress', dot: 'bg-blue-500' },
  { key: 'done', label: 'Done', dot: 'bg-emerald-500' },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('board');
  const [taskModal, setTaskModal] = useState({ open: false, task: null });
  const [showInvite, setShowInvite] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = project?.my_role === 'admin';

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/tasks/project/${id}`),
    ])
      .then(([projectRes, tasksRes]) => {
        setProject(projectRes.data);
        setTasks(tasksRes.data);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load project');
      })
      .finally(() => setLoading(false));
  }, [id]);

  function openCreate() {
    setTaskModal({ open: true, task: null });
  }

  function openEdit(task) {
    setTaskModal({ open: true, task });
  }

  function closeModal() {
    setTaskModal({ open: false, task: null });
  }

  function handleTaskSaved(saved, isEdit) {
    if (isEdit) {
      setTasks((prev) => prev.map((t) => (t.id === saved.id ? saved : t)));
    } else {
      setTasks((prev) => [saved, ...prev]);
    }
    closeModal();
  }

  function handleTaskDeleted(taskId) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    closeModal();
  }

  function handleInvited(member) {
    setProject((prev) => ({
      ...prev,
      members: [...(prev.members || []), member],
    }));
    setShowInvite(false);
  }

  async function handleRemoveMember(memberId) {
    if (!confirm('Remove this member from the project?')) return;
    try {
      await api.delete(`/projects/${id}/members/${memberId}`);
      setProject((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== memberId),
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="ml-56 flex-1 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-40 bg-gray-200 rounded" />
            <div className="h-8 w-64 bg-gray-200 rounded" />
            <div className="flex gap-4 mt-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-72 h-64 bg-gray-100 rounded-xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="ml-56 flex-1 p-8">
          <p className="text-rose-500 text-sm">{error}</p>
          <Link to="/projects" className="text-indigo-600 text-sm mt-2 inline-block">← Back to projects</Link>
        </main>
      </div>
    );
  }

  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    done: tasks.filter((t) => t.status === 'done'),
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-56 flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <div className="px-8 pt-7 pb-4 border-b border-gray-200 bg-white">
          <Link
            to="/projects"
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mb-3 transition-colors w-fit"
          >
            <ChevronLeft size={14} />
            Projects
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-gray-500 mt-1 max-w-lg">{project.description}</p>
              )}
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-indigo-600 text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shrink-0 ml-4"
            >
              <Plus size={15} />
              Add Task
            </button>
          </div>

          <div className="flex gap-1 mt-5">
            {['board', 'members'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                  tab === t ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'board' ? 'Board' : `Members (${project.members?.length || 0})`}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {tab === 'board' ? (
          <div className="flex-1 overflow-x-auto p-6">
            <div className="flex gap-4" style={{ minWidth: 'fit-content' }}>
              {columns.map((col) => {
                const colTasks = tasksByStatus[col.key];
                return (
                  <div key={col.key} className="w-72 shrink-0">
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        {col.label}
                      </h3>
                      <span className="ml-auto text-xs text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                        {colTasks.length}
                      </span>
                    </div>

                    <div className="space-y-2 min-h-[120px]">
                      {colTasks.map((task) => (
                        <TaskCard key={task.id} task={task} onClick={openEdit} />
                      ))}
                    </div>

                    {col.key === 'todo' && (
                      <button
                        onClick={openCreate}
                        className="mt-2 w-full text-left px-3 py-2 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Plus size={13} />
                        Add task
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 p-8">
            <div className="max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700">Team Members</h2>
                {isAdmin && (
                  <button
                    onClick={() => setShowInvite(true)}
                    className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                  >
                    <UserPlus size={15} />
                    Add member
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {project.members?.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3"
                  >
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-semibold shrink-0">
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800 truncate">{member.name}</p>
                        {member.role === 'admin' && (
                          <Crown size={12} className="text-amber-500 shrink-0" />
                        )}
                        {member.id === user.id && (
                          <span className="text-[10px] text-gray-400">(you)</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{member.email}</p>
                    </div>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded capitalize ${
                        member.role === 'admin'
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {member.role}
                    </span>
                    {isAdmin && member.id !== user.id && project.owner_id !== member.id && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-gray-300 hover:text-rose-500 transition-colors ml-1"
                        title="Remove member"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {taskModal.open && (
        <TaskModal
          task={taskModal.task}
          projectId={id}
          members={project.members || []}
          isAdmin={isAdmin}
          onClose={closeModal}
          onSave={handleTaskSaved}
          onDelete={handleTaskDeleted}
        />
      )}

      {showInvite && (
        <InviteMemberModal
          projectId={id}
          onClose={() => setShowInvite(false)}
          onInvited={handleInvited}
        />
      )}
    </div>
  );
}
