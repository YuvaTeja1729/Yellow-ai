import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import './ProjectDetail.css';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptName, setPromptName] = useState('');
  const [promptContent, setPromptContent] = useState('');
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchProjectData();
    fetchChatHistory();
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchProjectData = async () => {
    try {
      const [projectRes, promptsRes, filesRes] = await Promise.all([
        axios.get(`/api/projects/${projectId}`),
        axios.get(`/api/prompts/project/${projectId}`),
        axios.get(`/api/files/${projectId}`)
      ]);

      setProject(projectRes.data.project);
      setPrompts(promptsRes.data.prompts);
      setFiles(filesRes.data.files || []);
    } catch (error) {
      console.error('Failed to fetch project data:', error);
      setError('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const response = await axios.get(`/api/chat/${projectId}/history`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const userMessage = newMessage.trim();
    setNewMessage('');
    setSending(true);
    setError('');

    // Add user message to UI immediately
    const tempUserMessage = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await axios.post(`/api/chat/${projectId}`, {
        message: userMessage
      });

      // Replace temp message and add assistant response
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempUserMessage.id),
        {
          id: Date.now() + 1,
          role: 'user',
          content: userMessage,
          created_at: new Date().toISOString()
        },
        {
          id: Date.now() + 2,
          role: 'assistant',
          content: response.data.message,
          created_at: new Date().toISOString()
        }
      ]);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send message');
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
    } finally {
      setSending(false);
    }
  };

  const handleCreatePrompt = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('/api/prompts', {
        project_id: projectId,
        name: promptName,
        content: promptContent
      });

      setPrompts([response.data.prompt, ...prompts]);
      setShowPromptModal(false);
      setPromptName('');
      setPromptContent('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create prompt');
    }
  };

  const handleUpdatePrompt = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.put(`/api/prompts/${editingPrompt.id}`, {
        name: promptName,
        content: promptContent
      });

      setPrompts(prompts.map(p => p.id === editingPrompt.id ? response.data.prompt : p));
      setShowPromptModal(false);
      setEditingPrompt(null);
      setPromptName('');
      setPromptContent('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update prompt');
    }
  };

  const handleDeletePrompt = async (promptId) => {
    if (!window.confirm('Are you sure you want to delete this prompt?')) {
      return;
    }

    try {
      await axios.delete(`/api/prompts/${promptId}`);
      setPrompts(prompts.filter(p => p.id !== promptId));
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      alert('Failed to delete prompt');
    }
  };

  const handleEditPrompt = (prompt) => {
    setEditingPrompt(prompt);
    setPromptName(prompt.name);
    setPromptContent(prompt.content);
    setShowPromptModal(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`/api/files/${projectId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setFiles([response.data.file, ...files]);
      alert('File uploaded successfully!');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await axios.delete(`/api/files/${projectId}/${fileId}`);
      setFiles(files.filter(f => f.id !== fileId));
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Failed to delete file');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="spinner" style={{ marginTop: '50px' }}></div>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <Navbar />
        <div className="project-detail-container">
          <div className="error-message">Project not found</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="project-detail-container">
        <div className="project-header">
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            ← Back to Dashboard
          </button>
          <h1>{project.name}</h1>
          {project.description && <p className="project-description">{project.description}</p>}
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="project-layout">
          {/* Sidebar */}
          <div className="project-sidebar">
            {/* Prompts Section */}
            <div className="sidebar-section">
              <div className="sidebar-header">
                <h3>Prompts</h3>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setEditingPrompt(null);
                    setPromptName('');
                    setPromptContent('');
                    setShowPromptModal(true);
                  }}
                >
                  + Add
                </button>
              </div>
              {prompts.length === 0 ? (
                <p className="empty-text">No prompts yet</p>
              ) : (
                <div className="prompts-list">
                  {prompts.map((prompt) => (
                    <div key={prompt.id} className="prompt-item">
                      <h4>{prompt.name}</h4>
                      <p className="prompt-preview">{prompt.content.substring(0, 100)}...</p>
                      <div className="prompt-actions">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEditPrompt(prompt)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeletePrompt(prompt.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Files Section */}
            <div className="sidebar-section">
              <div className="sidebar-header">
                <h3>Files</h3>
                <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                    style={{ display: 'none' }}
                  />
                  {uploadingFile ? 'Uploading...' : '+ Upload'}
                </label>
              </div>
              {files.length === 0 ? (
                <p className="empty-text">No files uploaded</p>
              ) : (
                <div className="files-list">
                  {files.map((file) => (
                    <div key={file.id} className="file-item">
                      <span className="file-name">{file.file_name}</span>
                      <span className="file-size">{(file.file_size / 1024).toFixed(2)} KB</span>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteFile(file.id)}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Section */}
          <div className="project-chat">
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="empty-chat">
                  <p>Start a conversation with your agent</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message ${message.role}`}
                  >
                    <div className="message-content">{message.content}</div>
                    <div className="message-time">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={sending}
                className="chat-input"
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={sending || !newMessage.trim()}
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        </div>

        {/* Prompt Modal */}
        {showPromptModal && (
          <div className="modal-overlay" onClick={() => {
            setShowPromptModal(false);
            setEditingPrompt(null);
            setPromptName('');
            setPromptContent('');
          }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>{editingPrompt ? 'Edit Prompt' : 'Create Prompt'}</h2>
              <form onSubmit={editingPrompt ? handleUpdatePrompt : handleCreatePrompt}>
                <div className="form-group">
                  <label>Prompt Name *</label>
                  <input
                    type="text"
                    value={promptName}
                    onChange={(e) => setPromptName(e.target.value)}
                    required
                    placeholder="Enter prompt name"
                  />
                </div>
                <div className="form-group">
                  <label>Prompt Content *</label>
                  <textarea
                    value={promptContent}
                    onChange={(e) => setPromptContent(e.target.value)}
                    required
                    placeholder="Enter prompt content (system message for the AI)"
                    rows="8"
                  />
                </div>
                {error && <div className="error-message">{error}</div>}
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowPromptModal(false);
                      setEditingPrompt(null);
                      setPromptName('');
                      setPromptContent('');
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingPrompt ? 'Update' : 'Create'}
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

export default ProjectDetail;
