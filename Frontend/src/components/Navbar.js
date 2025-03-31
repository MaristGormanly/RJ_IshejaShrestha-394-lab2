import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import Button from './Button';

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-100 shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center">
              <h1 className="text-2xl font-serif font-bold text-navy">
                Cover<span className="text-gold">Craft</span>
              </h1>
            </Link>
            
            {/* Search bar */}
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search here"
                className="px-4 py-2 pl-10 bg-offwhite border border-gray-200 rounded-md text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-navy focus:border-navy w-64"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            
            {user && (
              <div className="hidden md:flex space-x-6">
                <Link to="/cover-letter" className="elegant-link">
                  Create
                </Link>
                <Link to="/templates" className="elegant-link">
                  Templates
                </Link>
                <Link to="/dashboard" className="elegant-link">
                  Dashboard
                </Link>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Button color="secondary" size="sm" onClick={() => {}}>
                  Save
                </Button>
                <Button color="primary" size="sm" onClick={() => {}}>
                  Upgrade
                </Button>
                <button
                  onClick={handleLogout}
                  className="elegant-link ml-2"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="elegant-link">
                  Log in
                </Link>
                <Link to="/register">
                  <Button color="primary" size="sm">
                    Sign up
                  </Button>
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