import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

const Navbar = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center text-primary font-bold text-xl">
              CoverCraft
            </Link>
            {user && (
              <div className="hidden md:flex space-x-4">
                <Link to="/cover-letter" className="text-gray-600 hover:text-primary">
                  Cover Letters
                </Link>
                <Link to="/resume-tailoring" className="text-gray-600 hover:text-primary">
                  Resume Tailoring
                </Link>
                <Link to="/templates" className="text-gray-600 hover:text-primary">
                  Templates
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <button 
                  onClick={() => {}} 
                  className="btn btn-secondary"
                >
                  Save
                </button>
                <button 
                  onClick={() => {}} 
                  className="btn btn-primary"
                >
                  Upgrade
                </button>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-primary"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-primary">
                  Log in
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 