import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
    setMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1">
            <span className="text-xl font-bold text-blue-600">Job</span>
            <span className="text-xl font-bold text-gray-800">Board</span>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-5">
            <Link to="/jobs"
              className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors">
              Browse Jobs
            </Link>

            {!user ? (
              <>
                <Link to="/login"
                  className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors">
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">
                  Sign Up
                </Link>
              </>
            ) : (
              <div className="relative" ref={menuRef}>
                {/* Avatar button */}
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2.5 hover:bg-gray-50 rounded-xl px-3 py-2 transition-colors"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name}
                      className="w-7 h-7 rounded-full object-cover border border-gray-200" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                      {user.name[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {user.name.split(' ')[0]}
                  </span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>

                {/* Dropdown */}
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-lg border border-gray-100 py-1.5 overflow-hidden">
                    {/* User info */}
                    <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 capitalize mt-0.5">{user.role} account</p>
                    </div>

                    {user.role === 'employer' ? (
                      <>
                        <DropdownLink to="/employer/dashboard" onClick={() => setMenuOpen(false)}>
                          📋 Dashboard
                        </DropdownLink>
                      </>
                    ) : (
                      <>
                        <DropdownLink to="/seeker/applications" onClick={() => setMenuOpen(false)}>
                          📄 My Applications
                        </DropdownLink>
                        <DropdownLink to="/seeker/profile" onClick={() => setMenuOpen(false)}>
                          👤 My Profile
                        </DropdownLink>
                      </>
                    )}

                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        → Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const DropdownLink = ({ to, onClick, children }) => (
  <Link to={to} onClick={onClick}
    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
    {children}
  </Link>
);

export default Navbar;
