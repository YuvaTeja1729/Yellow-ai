import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import './Dashboard.css';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data.projects);
    } catch (error) {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('/api/projects', {
        name: projectName,
        description: projectDescription
      });

      setProjects([response.data.project, ...projects]);
      setShowModal(false);
      setProjectName('');
      setProjectDescription('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create project');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      await axios.delete(`/api/projects/${projectId}`);
      setProjects(projects.filter(p => p.id !== projectId));
    } catch {
      alert('Failed to delete project');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="dashboard-loader">
          <div className="spinner"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1>My Projects</h1>
            <p>Manage your chatbot projects</p>
          </div>
          <button className="create-btn" onClick={() => setShowModal(true)}>
            + New Project
          </button>
        </div>

        {error && <div className="alert-error">{error}</div>}

        {projects.length === 0 ? (
          <div className="empty-state">
            <h3>No projects yet</h3>
            <p>Create your first project to start chatting with AI.</p>
            <button className="create-btn" onClick={() => setShowModal(true)}>
              Create Project
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map(project => (
              <div key={project.id} className="project-card">
                <div className="project-card-header">
                  <h3>{project.name}</h3>
                </div>

                {project.description && (
                  <p className="project-description">{project.description}</p>
                )}

                <div className="project-footer">
                  <span className="project-date">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>

                  <div className="project-actions">
                    <button
                      className="btn-open"
                      onClick={() => navigate(`/project/${project.id}`)}
                    >
                      Open
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Create Project</h2>

              <form onSubmit={handleCreateProject}>
                <div className="form-group">
                  <label>Project Name *</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={e => setProjectName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={projectDescription}
                    onChange={e => setProjectDescription(e.target.value)}
                  />
                </div>

                {error && <div className="alert-error">{error}</div>}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-create">
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
