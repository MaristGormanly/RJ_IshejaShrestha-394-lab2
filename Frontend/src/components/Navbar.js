import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import Button from './Button';

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isLandingPage = !user && location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

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
    <nav className={`fixed w-full z-50 transition-all duration-300 ${
      isLandingPage 
        ? scrolled 
          ? 'bg-white shadow-md py-4' 
          : 'bg-transparent py-6'
        : 'bg-white shadow-md py-4'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-12">
            <Link to="/" className="flex items-center">
              <h1 className={`text-3xl font-serif font-bold transition-colors duration-300 ${
                isLandingPage && !scrolled ? 'text-white' : 'text-navy'
              }`}>
                Landed
              </h1>
            </Link>
            
            {user && (
              <div className="hidden md:flex space-x-8 items-center">
                <Link to="/jobs" className={`nav-link ${isLandingPage && !scrolled ? 'text-white' : 'text-navy'}`}>
                  Jobs
                </Link>
                <Link to="/interview-coach" className={`nav-link ${isLandingPage && !scrolled ? 'text-white' : 'text-navy'}`}>
                  Interview Coach
                </Link>
                <Link to="/profile" className={`nav-link ${isLandingPage && !scrolled ? 'text-white' : 'text-navy'}`}>
                  Profile
                </Link>
              </div>
            )}

            {isLandingPage && (
              <div className="hidden md:flex space-x-8 items-center">
                <a href="#features" className={`nav-link ${isLandingPage && !scrolled ? 'text-white' : 'text-navy'}`}>
                  Features
                </a>
                <a href="#testimonials" className={`nav-link ${isLandingPage && !scrolled ? 'text-white' : 'text-navy'}`}>
                  Testimonials
                </a>
                <a href="#jobs" className={`nav-link ${isLandingPage && !scrolled ? 'text-white' : 'text-navy'}`}>
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
                  className={`nav-link ${isLandingPage && !scrolled ? 'text-white' : 'text-navy'}`}
                >
                  Logout
                </button>
              ) : (
                <div className="flex items-center space-x-6">
                  <Link to="/login" className={`nav-link ${isLandingPage && !scrolled ? 'text-white' : 'text-navy'}`}>
                    Log in
                  </Link>
                  <Link to="/register">
                    <Button color={isLandingPage && !scrolled ? "secondary" : "primary"} size="lg">
                      Sign up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
            
            {/* Mobile menu button */}
            <button
              className={`md:hidden flex items-center ${isLandingPage && !scrolled ? 'text-white' : 'text-navy'}`}
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
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className={`md:hidden mt-4 py-4 rounded-lg ${
            isLandingPage && !scrolled 
              ? 'bg-white bg-opacity-95' 
              : 'bg-white shadow-lg'
          }`}>
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
                      className="block py-2 px-4 text-navy hover:bg-offwhite"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Features
                    </a>
                    <a 
                      href="#testimonials" 
                      className="block py-2 px-4 text-navy hover:bg-offwhite"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Testimonials
                    </a>
                    <a 
                      href="#jobs" 
                      className="block py-2 px-4 text-navy hover:bg-offwhite"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Jobs
                    </a>
                  </>
                )}
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