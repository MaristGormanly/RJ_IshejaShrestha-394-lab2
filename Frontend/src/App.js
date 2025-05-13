import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import CoverLetterGenerator from './pages/CoverLetterGenerator';
import ResumeTailoring from './pages/ResumeTailoring';
import Jobs from './pages/Jobs';
import Profile from './pages/Profile';
import AIResumeGenerator from './pages/AIResumeGenerator';
import AICoverLetterGenerator from './pages/AICoverLetterGenerator';
import InterviewCoach from './pages/InterviewCoach';
import InterviewHistory from './pages/InterviewHistory';
import LandingPage from './pages/LandingPage';

// Components
import Navbar from './components/Navbar';
import AuthRoute from './components/AuthRoute';

// Styles
import './components/Layout.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  
  // Determine if current route is landing page
  const isLandingPage = !user && location.pathname === '/';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-offwhite">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-navy border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-navy font-serif">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-offwhite text-gray-800 ${isLandingPage ? 'landing-layout' : ''}`}>
      <Navbar user={user} />
      {isLandingPage ? (
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      ) : (
        <div className="container mx-auto px-4 page-container">
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
            <Route path="/" element={user ? <AuthRoute user={user}><Dashboard /></AuthRoute> : <Navigate to="/login" />} />
            <Route path="/cover-letter" element={<AuthRoute user={user}><CoverLetterGenerator /></AuthRoute>} />
            <Route path="/resume-tailoring" element={<AuthRoute user={user}><ResumeTailoring /></AuthRoute>} />
            <Route path="/jobs" element={<AuthRoute user={user}><Jobs /></AuthRoute>} />
            <Route path="/profile" element={<AuthRoute user={user}><Profile /></AuthRoute>} />
            <Route path="/ai-resume" element={<AuthRoute user={user}><AIResumeGenerator /></AuthRoute>} />
            <Route path="/ai-cover-letter" element={<AuthRoute user={user}><AICoverLetterGenerator /></AuthRoute>} />
            <Route path="/interview-coach" element={<AuthRoute user={user}><InterviewCoach /></AuthRoute>} />
            <Route path="/interview-history" element={<AuthRoute user={user}><InterviewHistory /></AuthRoute>} />
          </Routes>
        </div>
      )}
    </div>
  );
}

export default App; 