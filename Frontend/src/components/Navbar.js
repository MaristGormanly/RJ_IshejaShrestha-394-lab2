import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import Button from './Button';

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLandingPage = !user && location.pathname === '/';

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
    <nav className={`${isLandingPage ? 'bg-transparent absolute w-full z-10' : 'bg-white border-b border-gray-100 shadow-md'} py-6 mb-8`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-12">
            <Link to="/" className="flex items-center">
              <h1 className={`text-3xl font-serif font-bold ${isLandingPage ? 'text-white' : 'text-navy'} relative`}>
                Landed
                <div className={`absolute bottom-0 left-0 w-full h-0.5 ${isLandingPage ? 'bg-white bg-opacity-20' : 'bg-navy bg-opacity-10'}`}></div>
              </h1>
            </Link>
            
            {user && (
              <div className="hidden md:flex space-x-8 items-center">
                <Link to="/jobs" className="elegant-link text-lg border-b-2 border-transparent hover:border-navy py-2">
                  Jobs
                </Link>
                <Link to="/interview-coach" className="elegant-link text-lg border-b-2 border-transparent hover:border-navy py-2">
                  Interview Coach
                </Link>
                <Link to="/profile" className="elegant-link text-lg border-b-2 border-transparent hover:border-navy py-2">
                  Profile
                </Link>
              </div>
            )}

            {isLandingPage && (
              <div className="hidden md:flex space-x-8 items-center">
                <a href="#features" className="text-white hover:text-gray-200 transition duration-150 text-lg border-b-2 border-transparent hover:border-white py-2">
                  Features
                </a>
                <a href="#testimonials" className="text-white hover:text-gray-200 transition duration-150 text-lg border-b-2 border-transparent hover:border-white py-2">
                  Testimonials
                </a>
                <a href="#jobs" className="text-white hover:text-gray-200 transition duration-150 text-lg border-b-2 border-transparent hover:border-white py-2">
                  Jobs
                </a>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-6">
            {/* Desktop menu */}
            <div className="hidden md:block">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="elegant-link text-lg border-b-2 border-transparent hover:border-navy"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link to="/login" className={`mr-6 ${isLandingPage ? 'text-white hover:text-gray-200 border-b-2 border-transparent hover:border-white' : 'elegant-link border-b-2 border-transparent hover:border-navy'} transition duration-150 text-lg`}>
                    Log in
                  </Link>
                  <Link to="/register">
                    <Button color={isLandingPage ? "secondary" : "primary"} size="lg">
                      Sign up
                    </Button>
                  </Link>
                </>
              )}
            </div>
            
            {/* Mobile menu button */}
            <button
              className={`md:hidden flex items-center ${isLandingPage ? 'text-white' : 'text-navy'}`}
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
          <div className={`md:hidden py-4 ${isLandingPage ? 'bg-navy bg-opacity-90' : 'border-t border-gray-100'}`}>
            {user ? (
              <>
                <Link 
                  to="/jobs" 
                  className="block py-2 px-4 text-navy hover:bg-offwhite"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Jobs
                </Link>
                <Link 
                  to="/interview-coach" 
                  className="block py-2 px-4 text-navy hover:bg-offwhite"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Interview Coach
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
                {isLandingPage && (
                  <>
                    <a 
                      href="#features" 
                      className="block py-2 px-4 text-white hover:bg-navy"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Features
                    </a>
                    <a 
                      href="#testimonials" 
                      className="block py-2 px-4 text-white hover:bg-navy"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Testimonials
                    </a>
                    <a 
                      href="#jobs" 
                      className="block py-2 px-4 text-white hover:bg-navy"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Jobs
                    </a>
                  </>
                )}
                <Link 
                  to="/login" 
                  className={`block py-2 px-4 ${isLandingPage ? 'text-white hover:bg-navy' : 'text-navy hover:bg-offwhite'}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log in
                </Link>
                <Link 
                  to="/register" 
                  className={`block py-2 px-4 ${isLandingPage ? 'text-white hover:bg-navy' : 'text-navy hover:bg-offwhite'}`}
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