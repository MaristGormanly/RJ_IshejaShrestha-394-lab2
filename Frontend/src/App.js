import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import CoverLetterGenerator from './pages/CoverLetterGenerator';
import ResumeTailoring from './pages/ResumeTailoring';
import Templates from './pages/Templates';
import Jobs from './pages/Jobs';
import Profile from './pages/Profile';

// Components
import Navbar from './components/Navbar';
import AuthRoute from './components/AuthRoute';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen bg-offwhite text-gray-800">
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          <Route path="/" element={<AuthRoute user={user}><Dashboard /></AuthRoute>} />
          <Route path="/cover-letter" element={<AuthRoute user={user}><CoverLetterGenerator /></AuthRoute>} />
          <Route path="/resume-tailoring" element={<AuthRoute user={user}><ResumeTailoring /></AuthRoute>} />
          <Route path="/templates" element={<AuthRoute user={user}><Templates /></AuthRoute>} />
          <Route path="/jobs" element={<AuthRoute user={user}><Jobs /></AuthRoute>} />
          <Route path="/profile" element={<AuthRoute user={user}><Profile /></AuthRoute>} />
        </Routes>
      </div>
    </div>
  );
}

export default App; 