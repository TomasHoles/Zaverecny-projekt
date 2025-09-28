import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link to="/" className="flex items-center px-2 py-2 text-gray-700 hover:text-gray-900">
                Dashboard
              </Link>
              <Link to="/transactions" className="flex items-center px-2 py-2 text-gray-700 hover:text-gray-900">
                Transactions
              </Link>
              <Link to="/budgets" className="flex items-center px-2 py-2 text-gray-700 hover:text-gray-900">
                Budgets
              </Link>
            </div>
            <div className="flex items-center">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Logout
                </button>
              ) : (
                <Link to="/login" className="px-4 py-2 text-gray-700 hover:text-gray-900">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;