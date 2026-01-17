import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          🤖 Chatbot Platform
        </Link>

        {user && (
          <div className="navbar-right">
            <div className="navbar-user">
              <div className="user-avatar">
                {(user.name || user.email)[0].toUpperCase()}
              </div>
              <span className="user-name">
                {user.name || user.email}
              </span>
            </div>

            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
