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
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          <Route path="/" element={<AuthRoute user={user}><Dashboard /></AuthRoute>} />
          <Route path="/cover-letter" element={<AuthRoute user={user}><CoverLetterGenerator /></AuthRoute>} />
          <Route path="/resume-tailoring" element={<AuthRoute user={user}><ResumeTailoring /></AuthRoute>} />
        </Routes>
      </div>
    </div>
  );
}

export default App; 