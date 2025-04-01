import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import Button from './Button';

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="bg-white border-b border-gray-100 shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center">
              <h1 className="text-2xl font-serif font-bold text-navy">
                Landed
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
                <Link to="/templates" className="elegant-link">
                  Templates
                </Link>
                <Link to="/jobs" className="elegant-link">
                  Jobs
                </Link>
                <Link to="/profile" className="elegant-link">
                  Profile
                </Link>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Desktop menu */}
            <div className="hidden md:block">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="elegant-link"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link to="/login" className="elegant-link mr-4">
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
            
            {/* Mobile menu button */}
            <button
              className="md:hidden flex items-center text-navy"
              onClick={toggleMobileMenu}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile menu, show/hide based on menu state */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            {user ? (
              <>
                <Link 
                  to="/templates" 
                  className="block py-2 px-4 text-navy hover:bg-offwhite"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Templates
                </Link>
                <Link 
                  to="/jobs" 
                  className="block py-2 px-4 text-navy hover:bg-offwhite"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Jobs
                </Link>
                <Link 
                  to="/profile" 
                  className="block py-2 px-4 text-navy hover:bg-offwhite"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left py-2 px-4 text-navy hover:bg-offwhite"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block py-2 px-4 text-navy hover:bg-offwhite"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link 
                  to="/register" 
                  className="block py-2 px-4 text-navy hover:bg-offwhite"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 