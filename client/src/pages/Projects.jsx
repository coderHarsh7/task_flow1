import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderOpen, Users, CheckSquare, Trash2 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import CreateProjectModal from '../components/CreateProjectModal';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr);
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    api.get('/projects')
      .then(({ data }) => setProjects(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function handleCreated(project) {
    setProjects((prev) => [project, ...prev]);
    setShowCreate(false);
  }

  async function handleDelete(e, projectId) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Delete this project and all its tasks?')) return;

    try {
      await api.delete(`/projects/${projectId}`);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-56 flex-1 p-8">
        <div className="max-w-4xl">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {projects.length} project{projects.length !== 1 ? 's' : ''} you're part of
              </p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus size={16} />
              New Project
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <FolderOpen size={44} className="mx-auto mb-4 text-gray-300" strokeWidth={1.5} />
              <p className="text-base font-medium text-gray-500">No projects yet</p>
              <p className="text-sm text-gray-400 mt-1 mb-5">Create your first project to get started.</p>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                <Plus size={15} />
                Create a project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {projects.map((project) => (
                <Link
                  to={`/projects/${project.id}`}
                  key={project.id}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all group relative"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                        <FolderOpen size={15} className="text-indigo-600" strokeWidth={1.75} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {project.name}
                        </h3>
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${
                            project.my_role === 'admin'
                              ? 'bg-indigo-50 text-indigo-600'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {project.my_role}
                        </span>
                      </div>
                    </div>

                    {project.owner_id === user.id && (
                      <button
                        onClick={(e) => handleDelete(e, project.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500 transition-all p-1"
                        title="Delete project"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {project.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                      {project.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-400 mt-auto pt-2 border-t border-gray-50">
                    <span className="flex items-center gap-1">
                      <CheckSquare size={12} />
                      {project.task_count} task{project.task_count != 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {project.member_count} member{project.member_count != 1 ? 's' : ''}
                    </span>
                    <span className="ml-auto">{timeAgo(project.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      {showCreate && (
        <CreateProjectModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
